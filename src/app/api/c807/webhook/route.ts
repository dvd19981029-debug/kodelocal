import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';
import { c807Client } from '@/lib/c807';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[C807 Webhook Recibido]:', JSON.stringify(body));

    const numGuia = body.guia || body.num_guia || body.tracking_number;
    const nuevoEstatus = body.estatus || body.status || body.estado;
    const observaciones = body.observaciones || '';
    const razon = (body.razon && body.razon.descripcion) ? body.razon.descripcion : (body.razon || '');

    if (!numGuia || !nuevoEstatus) {
      return NextResponse.json(
        { success: false, error: 'guia y estatus son requeridos' },
        { status: 400 }
      );
    }

    // 1. Buscar y actualizar el pedido en la base de datos de Kode
    const res = await queryKode(
      `SELECT p.id, p.numero_pedido, c.nombre_completo AS cliente_nombre, c.telefono_whatsapp
       FROM public.pedidos p
       JOIN public.clientes c ON p.cliente_id = c.id
       WHERE p.c807_guia_numero = $1 LIMIT 1`,
      [numGuia.trim()]
    );

    if (res.rowCount === 0) {
      console.warn(`[C807 Webhook] No se encontró pedido con la guía ${numGuia}`);
      return NextResponse.json(
        { success: false, error: `Pedido con guía ${numGuia} no encontrado` },
        { status: 404 }
      );
    }

    const pedido = res.rows[0];

    // Si el estatus indica entregado, actualizar estado general
    const esEntregado = nuevoEstatus.toLowerCase().includes('entregad');
    const sqlEstado = esEntregado ? "estado = 'ENTREGADO'," : "";

    await queryKode(
      `UPDATE public.pedidos
       SET 
         c807_estado = $1,
         ${sqlEstado}
         updated_at = NOW()
       WHERE id = $2`,
      [nuevoEstatus, pedido.id]
    );

    // 2. Alerta a Telegram si hay problemas de entrega
    const estatusLower = nuevoEstatus.toLowerCase();
    if (estatusLower.includes('problema') || estatusLower.includes('fallido') || estatusLower.includes('rechazad')) {
      const mensajeTelegram =
        `⚠️ *ALERTA C807: Problema de Entrega*\n\n` +
        `• *Pedido:* \`${pedido.numero_pedido}\`\n` +
        `• *Cliente:* ${pedido.cliente_nombre} (${pedido.telefono_whatsapp})\n` +
        `• *Guía:* \`${numGuia}\`\n` +
        `• *Estatus C807:* *${nuevoEstatus}*\n` +
        `• *Motivo:* ${razon ? `_${razon}_` : '_No especificado por C807_'}\n` +
        `• *Observaciones:* ${observaciones ? `_${observaciones}_` : '_Sin observaciones_'}`;

      await c807Client.enviarNotificacionTelegram(mensajeTelegram);
    }

    return NextResponse.json({
      success: true,
      message: 'Estatus C807 actualizado en base de datos',
      pedido: pedido.numero_pedido,
      estatus: nuevoEstatus,
    });
  } catch (error: any) {
    console.error('Error procesando webhook de C807:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
