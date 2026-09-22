import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Consulta agrupada de insumos pendientes de compra
    const sql = `
      SELECT 
        cat.id AS catalogo_id,
        cat.codigo,
        cat.contratipo,
        cat.marca_inspirada,
        pi.version,
        SUM(pi.cantidad) AS total_unidades,
        json_agg(
          json_build_object(
            'item_id', pi.id,
            'pedido_id', p.id,
            'numero_pedido', p.numero_pedido,
            'cliente_nombre', c.nombre_completo,
            'cantidad', pi.cantidad,
            'created_at', p.created_at
          ) ORDER BY p.created_at ASC
        ) AS pedidos
      FROM public.pedido_items pi
      JOIN public.catalogo cat ON pi.catalogo_id = cat.id
      JOIN public.pedidos p ON pi.pedido_id = p.id
      JOIN public.clientes c ON p.cliente_id = c.id
      WHERE pi.insumo_comprado = FALSE 
        AND p.estado = 'PENDIENTE_COMPRA'
      GROUP BY cat.id, cat.codigo, cat.contratipo, cat.marca_inspirada, pi.version
      ORDER BY total_unidades DESC, cat.contratipo ASC;
    `;

    const result = await queryKode(sql);
    return NextResponse.json({ success: true, insumos: result.rows });
  } catch (error: any) {
    console.error('Error fetching insumos a comprar:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { item_id, catalogo_id, version, comprado_por = 'Bodega' } = body;

    if (item_id) {
      // Marcar un item específico
      await queryKode(
        `UPDATE public.pedido_items 
         SET insumo_comprado = TRUE, fecha_compra_insumo = NOW(), comprado_por = $1
         WHERE id = $2`,
        [comprado_por, item_id]
      );
      return NextResponse.json({ success: true, message: 'Insumo marcado como comprado' });
    }

    if (catalogo_id) {
      // Marcar todos los pendientes de esa fragancia (y versión si se especifica)
      let sql = `
        UPDATE public.pedido_items pi
        SET insumo_comprado = TRUE, fecha_compra_insumo = NOW(), comprado_por = $1
        FROM public.pedidos p
        WHERE pi.pedido_id = p.id 
          AND p.estado = 'PENDIENTE_COMPRA'
          AND pi.catalogo_id = $2
          AND pi.insumo_comprado = FALSE
      `;
      const params: any[] = [comprado_por, catalogo_id];

      if (version) {
        params.push(version);
        sql += ` AND pi.version = $${params.length}`;
      }

      const res = await queryKode(sql, params);
      return NextResponse.json({
        success: true,
        message: `${res.rowCount || 0} unidades marcadas como compradas`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Debe especificar item_id o catalogo_id' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error marking insumo as bought:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
