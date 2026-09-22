import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Resumen de Estados de Pedidos
    const estadosRes = await queryKode(`
      SELECT 
        COUNT(*) AS total_pedidos,
        COUNT(*) FILTER (WHERE estado IN ('Registrado', 'PENDIENTE_COMPRA')) AS registrados,
        COUNT(*) FILTER (WHERE estado IN ('Insumos comprados', 'PENDIENTE_PREPARAR')) AS insumos_comprados,
        COUNT(*) FILTER (WHERE estado = 'Preparado') AS preparados,
        COUNT(*) FILTER (WHERE estado IN ('Enviado', 'GUIA_CREADA')) AS enviados,
        COUNT(*) FILTER (WHERE estado IN ('Entregado', 'ENTREGADO')) AS entregados,
        COUNT(*) FILTER (WHERE estado IN ('Cancelado', 'CANCELADO')) AS cancelados,
        COALESCE(SUM(total), 0) AS ventas_totales,
        COALESCE(SUM(costo_envio), 0) AS total_envios,
        COUNT(*) FILTER (WHERE dte_estado = 'PROCESADO' OR dte_codigo_generacion IS NOT NULL) AS facturas_emitidas
      FROM public.pedidos;
    `);

    // 2. Top Fragancias Vendidas (Normal vs Plus)
    const topPerfumesRes = await queryKode(`
      SELECT 
        cat.id,
        cat.codigo,
        cat.contratipo,
        cat.marca_inspirada,
        COUNT(pi.id) AS total_ventas,
        SUM(pi.cantidad) AS unidades_totales,
        SUM(CASE WHEN pi.version = 'Plus' OR pi.version = 'EXTRA_SHOT' THEN pi.cantidad ELSE 0 END) AS unidades_plus,
        SUM(CASE WHEN pi.version = 'Normal' OR pi.version = 'NORMAL' OR pi.version IS NULL THEN pi.cantidad ELSE 0 END) AS unidades_normal,
        COALESCE(SUM(pi.subtotal), 0) AS total_facturado
      FROM public.pedido_items pi
      JOIN public.catalogo cat ON pi.catalogo_id = cat.id
      JOIN public.pedidos p ON pi.pedido_id = p.id
      GROUP BY cat.id, cat.codigo, cat.contratipo, cat.marca_inspirada
      ORDER BY unidades_totales DESC
      LIMIT 10;
    `);

    // 3. Resumen por Asesoras / Vendedoras
    const vendedorasRes = await queryKode(`
      SELECT 
        COALESCE(u.nombre, 'Sin Asesor / Web') AS vendedora,
        u.email,
        COUNT(p.id) AS pedidos_totales,
        COUNT(p.id) FILTER (WHERE p.estado IN ('Entregado', 'ENTREGADO')) AS pedidos_entregados,
        COALESCE(SUM(p.total), 0) AS ventas_totales,
        COALESCE(
          SUM(
            CASE 
              WHEN pi.version = 'Plus' OR pi.version = 'EXTRA_SHOT' THEN pi.cantidad * COALESCE(u.comision_plus, 1.50)
              ELSE pi.cantidad * COALESCE(u.comision_normal, 1.00)
            END
          ), 0
        ) AS comisiones_acumuladas
      FROM public.pedidos p
      LEFT JOIN public.usuarios u ON p.vendedora_id = u.id
      LEFT JOIN public.pedido_items pi ON p.id = pi.pedido_id
      GROUP BY u.id, u.nombre, u.email
      ORDER BY ventas_totales DESC;
    `);

    return NextResponse.json({
      success: true,
      resumen: estadosRes.rows[0] || {},
      topPerfumes: topPerfumesRes.rows || [],
      vendedoras: vendedorasRes.rows || [],
    });
  } catch (error: any) {
    console.error('Error generating KODE reports:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
