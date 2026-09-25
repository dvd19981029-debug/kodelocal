import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';
import { c807Client } from '@/lib/c807';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    servicio: 'C807 Express Webhook Receiver para KODE',
    metodo_requerido: 'POST',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
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
      console.warn(`[C807 Webhook] No se encontró pedido con la guía "${numGuia}"`);
      return NextResponse.json({
        success: true,
        advertencia: `No se encontró pedido asociado a la guía ${numGuia} en KODE`,
        guia: numGuia,
        estatus: estatusFinal,
      });
    }

    const pedido = res.rows[0];
    const estatusLower = estatusFinal.toLowerCase();

    // Determinar cambios de estado general según eventos oficiales de C807 Express
    // Código 15 = Entrega ("Llegó a su destino")
    const esEntregado =
      codigo === '15' ||
      estatusLower.includes('llegó a su destino') ||
      estatusLower.includes('llego a su destino') ||
      estatusLower.includes('entregad');

    // Código 13 = Recogido en origen / En ruta
    const esEnRuta =
      codigo === '13' ||
      estatusLower.includes('recogido') ||
      estatusLower.includes('en ruta') ||
      estatusLower.includes('tránsito') ||
      estatusLower.includes('transito');

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
