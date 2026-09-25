import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';
import { c807Client } from '@/lib/c807';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pedido_id,
      modo = 'automatico', // 'automatico' | 'manual'
      c807_guia_numero,
      c807_link_rastreo,
      c807_estado = 'Generada',
    } = body;

    if (!pedido_id) {
      return NextResponse.json(
        { success: false, error: 'pedido_id es obligatorio' },
        { status: 400 }
      );
    }

    // 1. Obtener datos completos del pedido y cliente
    const pedidoRes = await queryKode(
      `SELECT 
        p.id,
        p.numero_pedido,
        p.estado,
        p.tipo_pago,
        p.total,
        p.c807_guia_numero,
        p.c807_link_rastreo,
        p.notas,
        c.nombre_completo AS cliente_nombre,
        c.telefono_whatsapp AS cliente_telefono,
        c.direccion_entrega AS cliente_direccion,
        c.departamento AS cliente_departamento,
        c.municipio AS cliente_municipio,
        c.punto_referencia AS cliente_referencia
       FROM public.pedidos p
       JOIN public.clientes c ON p.cliente_id = c.id
       WHERE p.id = $1 LIMIT 1`,
      [pedido_id]
    );

    if (pedidoRes.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado en la base de datos' },
        { status: 404 }
      );
    }

    const pedido = pedidoRes.rows[0];

    let finalGuia = c807_guia_numero?.trim();
    let finalLink = c807_link_rastreo?.trim();
    let rawC807Response = null;

    // 2. MODO AUTOMÁTICO: Conexión directa con la API de C807 Express
    if (modo === 'automatico' || !finalGuia) {
      // Validar si ya tiene una guía asignada para no duplicar en C807
      if (pedido.c807_guia_numero && pedido.c807_guia_numero !== 'PENDIENTE') {
        return NextResponse.json({
          success: false,
          error: `Este pedido ya tiene una guía generada: ${pedido.c807_guia_numero}`,
          guia_existente: pedido.c807_guia_numero,
          link_rastreo: pedido.c807_link_rastreo,
        }, { status: 409 });
      }

      const c807Result = await c807Client.generarGuia({
        numero_pedido: pedido.numero_pedido,
        cliente_nombre: pedido.cliente_nombre,
        cliente_direccion: pedido.cliente_direccion,
        cliente_telefono: pedido.cliente_telefono,
        cliente_departamento: pedido.cliente_departamento,
        cliente_municipio: pedido.cliente_municipio,
        cliente_referencia: pedido.cliente_referencia,
        tipo_pago: pedido.tipo_pago,
        total: Number(pedido.total || 0),
        observaciones: pedido.notas || 'Fragancias y esencias Kode',
      });

      if (!c807Result.success) {
        return NextResponse.json({
          success: false,
          error: c807Result.error || 'Error al generar la guía en C807 Express',
          rawResponse: c807Result.rawResponse,
        }, { status: 502 });
      }

      finalGuia = c807Result.numero_guia;
      finalLink = c807Result.link_rastreo;
      rawC807Response = c807Result.rawResponse;
    }

    // Asegurar link de rastreo oficial
    if (!finalLink || finalLink.includes('app.c807.com')) {
      finalLink = `https://c807xpress.com/tracking/?guia=${encodeURIComponent(finalGuia)}`;
    }

    // 3. Persistir en la base de datos de Kode
    const updateRes = await queryKode(
      `UPDATE public.pedidos
       SET 
         c807_guia_numero = $1,
         c807_link_rastreo = $2,
         c807_estado = $3,
         c807_fecha_guia = NOW(),
         estado = 'Enviado',
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, numero_pedido, estado, c807_guia_numero, c807_link_rastreo, c807_estado`,
      [finalGuia, finalLink, c807_estado, pedido_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Guía C807 generada y asignada exitosamente (Estado Azul)',
      pedido: updateRes.rows[0],
      numero_guia: finalGuia,
      link_rastreo: finalLink,
      rawResponse: rawC807Response,
    });
  } catch (error: any) {
    console.error('Error procesando guía C807:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
