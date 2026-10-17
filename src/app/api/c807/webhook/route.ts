import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { queryKode } from '@/lib/kodeDb';
import { c807Client } from '@/lib/c807';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    servicio: 'C807 Express Webhook Receiver (Aromaniak & KODE)',
    metodo_requerido: 'POST',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const rl = await checkRateLimit(request, {
    keyPrefix: 'c807_webhook',
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Demasiadas peticiones al webhook.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
    );
  }

  const expectedSecret = process.env.C807_WEBHOOK_SECRET;
  if (expectedSecret) {
    const providedSecret =
      request.headers.get('x-c807-secret') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
      new URL(request.url).searchParams.get('secret');
    const isStaff = Boolean(verifyStaffRequest(request).authorized);
    if (!isStaff && providedSecret !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Webhook no autorizado' }, { status: 401 });
    }
  }

  try {
    let body: any = null;
    try {
      const rawText = await request.text();
      if (rawText && rawText.trim()) {
        try {
          body = JSON.parse(rawText);
        } catch {
          const params = new URLSearchParams(rawText);
          body = Object.fromEntries(params.entries());
        }
      }
    } catch (readErr: any) {
      console.error('[C807 Webhook Body Read Error]:', readErr);
    }

    console.log('[C807 Webhook Recibido]:', JSON.stringify(body));

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Cuerpo de solicitud inválido o vacío' },
        { status: 400 }
      );
    }

    const numGuia = String(body.guia || body.num_guia || body.numero_guia || body.tracking_number || '').trim();
    const codigo = String(body.codigo || '').trim();
    const nuevoEstatus = String(body.estatus || body.status || body.estado || '').trim();
    const fecha = body.fecha ? new Date(body.fecha) : null;
    const fechaValida = fecha && !isNaN(fecha.getTime()) ? fecha.toISOString() : null;
    const observaciones = body.observaciones || '';
    const razon = (body.razon && body.razon.descripcion) ? body.razon.descripcion : (body.razon || '');

    if (!numGuia) {
      return NextResponse.json(
        { success: false, error: 'El campo "guia" es requerido' },
        { status: 400 }
      );
    }

    const estatusFinal = nuevoEstatus || (codigo === '15' ? 'Llegó a su destino' : codigo === '13' ? 'Recogido en origen' : 'Actualización de ruta');
    const estatusLower = estatusFinal.toLowerCase();

    const esEntregado =
      codigo === '15' ||
      estatusLower.includes('llegó a su destino') ||
      estatusLower.includes('llego a su destino') ||
      estatusLower.includes('entregad');

    const esEnRuta =
      codigo === '13' ||
      estatusLower.includes('recogido') ||
      estatusLower.includes('en ruta') ||
      estatusLower.includes('tránsito') ||
      estatusLower.includes('transito');

    // 0. Actualizar pedido de Aromaniak (EcommerceOrder) si coincide trackingNumber
    const aromaOrder = await prisma.ecommerceOrder.findFirst({
      where: {
        trackingNumber: { equals: numGuia, mode: 'insensitive' },
      },
    });

    if (aromaOrder) {
      const nextOrderStatus = esEntregado
        ? 'ENTREGADO'
        : esEnRuta && aromaOrder.orderStatus !== 'ENTREGADO'
        ? 'EN_RUTA'
        : aromaOrder.orderStatus;

      const statusNote = `[C807 ${estatusFinal}${razon ? ` - ${razon}` : ''}]`;
      const updatedNotes = aromaOrder.notes?.includes(statusNote)
        ? aromaOrder.notes
        : [aromaOrder.notes, statusNote].filter(Boolean).join(' ');

      await prisma.ecommerceOrder.update({
        where: { id: aromaOrder.id },
        data: {
          orderStatus: nextOrderStatus as any,
          notes: updatedNotes,
        },
      });
    }

    // 0b. Actualizar envío POS Domicilio (Shipment / Sale) si coincide trackingNumber
    const posShipment = await prisma.shipment.findFirst({
      where: {
        trackingNumber: { equals: numGuia, mode: 'insensitive' },
      },
      include: { sale: true },
    });

    if (posShipment) {
      await prisma.shipment.update({
        where: { id: posShipment.id },
        data: {
          status: esEntregado ? 'DELIVERED' : esEnRuta ? 'IN_TRANSIT' : posShipment.status,
          ...(esEntregado ? { deliveredAt: new Date() } : {}),
        },
      });

      if (posShipment.sale?.notes && posShipment.sale.notes.trim().startsWith('{')) {
        try {
          const lastBrace = posShipment.sale.notes.lastIndexOf('}');
          const jsonPart = lastBrace !== -1 ? posShipment.sale.notes.slice(0, lastBrace + 1) : posShipment.sale.notes;
          const parsed = JSON.parse(jsonPart);
          parsed.domicilio = {
            ...(parsed.domicilio || {}),
            domicilioStatus: esEntregado ? 'ENTREGADO' : esEnRuta ? 'EN_RUTA' : (parsed.domicilio?.domicilioStatus || 'EN_RUTA'),
            lastWebhookStatus: estatusFinal,
          };
          await prisma.sale.update({
            where: { id: posShipment.sale.id },
            data: { notes: JSON.stringify(parsed) },
          });
        } catch (_) {}
      }
    }

    // 1. Buscar el pedido en la base de datos de Kode (insensible a mayúsculas/minúsculas)
    const res = await queryKode(
      `SELECT p.id, p.numero_pedido, p.estado, p.tipo_pago, p.total, p.c807_guia_numero,
              c.nombre_completo AS cliente_nombre, c.telefono_whatsapp
       FROM public.pedidos p
       LEFT JOIN public.clientes c ON p.cliente_id = c.id
       WHERE LOWER(TRIM(p.c807_guia_numero)) = LOWER(TRIM($1))
       LIMIT 1`,
      [numGuia]
    );

    if (res.rowCount === 0) {
      if (aromaOrder || posShipment) {
        return NextResponse.json({
          success: true,
          message: 'Estatus C807 actualizado en pedido Aromaniak',
          pedido: aromaOrder?.orderNumber || posShipment?.sale?.saleNumber || numGuia,
          guia: numGuia,
          estatus: estatusFinal,
          codigo: codigo || null,
          estado_general: esEntregado ? 'ENTREGADO' : esEnRuta ? 'EN_RUTA' : (aromaOrder?.orderStatus || 'EN_RUTA'),
        });
      }
      console.warn(`[C807 Webhook] No se encontró pedido con la guía "${numGuia}"`);
      return NextResponse.json({
        success: true,
        advertencia: `No se encontró pedido asociado a la guía ${numGuia}`,
        guia: numGuia,
        estatus: estatusFinal,
      });
    }

    const pedido = res.rows[0];

    let nuevoEstadoGeneral = pedido.estado;
    if (esEntregado) {
      nuevoEstadoGeneral = 'Entregado';
    } else if (esEnRuta && pedido.estado !== 'Entregado') {
      nuevoEstadoGeneral = 'Enviado';
    }

    // Link oficial de rastreo C807
    const linkOficial = `https://c807xpress.com/tracking/?guia=${encodeURIComponent(numGuia)}`;

    await queryKode(
      `UPDATE public.pedidos
       SET 
         c807_estado = $1,
         c807_link_rastreo = COALESCE(NULLIF(c807_link_rastreo, ''), $2),
         c807_fecha_guia = COALESCE($3::timestamptz, c807_fecha_guia, NOW()),
         estado = $4,
         updated_at = NOW()
       WHERE id = $5`,
      [estatusFinal, linkOficial, fechaValida, nuevoEstadoGeneral, pedido.id]
    );

    // 2. Alertas a Telegram
    // Código 16 = Problemas en la gestión (No entrega)
    const esProblema =
      codigo === '16' ||
      estatusLower.includes('problema') ||
      estatusLower.includes('fallido') ||
      estatusLower.includes('rechazad') ||
      estatusLower.includes('no responde');

    if (esProblema) {
      const mensajeTelegram =
        `⚠️ *ALERTA C807: Problema de Entrega*\n\n` +
        `• *Pedido:* \`${pedido.numero_pedido}\`\n` +
        `• *Cliente:* ${pedido.cliente_nombre || 'Sin nombre'} (${pedido.telefono_whatsapp || 'Sin teléfono'})\n` +
        `• *Guía:* \`${numGuia}\`\n` +
        `• *Estatus C807:* *${estatusFinal}* ${codigo ? `(Código: ${codigo})` : ''}\n` +
        `• *Motivo:* ${razon ? `_${razon}_` : '_No especificado por C807_'}\n` +
        `• *Observaciones:* ${observaciones ? `_${observaciones}_` : '_Sin observaciones_'}`;

      await c807Client.enviarNotificacionTelegram(mensajeTelegram);
    } else if (esEntregado) {
      const mensajeEntrega =
        `✅ *C807: Pedido Entregado Exitosamente*\n\n` +
        `• *Pedido:* \`${pedido.numero_pedido}\`\n` +
        `• *Cliente:* ${pedido.cliente_nombre || 'Cliente'}\n` +
        `• *Guía:* \`${numGuia}\`\n` +
        `• *Monto:* $${Number(pedido.total || 0).toFixed(2)} (${pedido.tipo_pago || 'Normal'})\n` +
        `• *Estatus:* Llegó a su destino`;

      await c807Client.enviarNotificacionTelegram(mensajeEntrega);
    }

    return NextResponse.json({
      success: true,
      message: 'Estatus C807 actualizado en base de datos',
      pedido: pedido.numero_pedido,
      guia: numGuia,
      estatus: estatusFinal,
      codigo: codigo || null,
      estado_general: nuevoEstadoGeneral,
    });
  } catch (error: any) {
    console.error('Error procesando webhook de C807:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
