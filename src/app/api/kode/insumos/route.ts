import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Consulta de insumos individuales pendientes de compra
    const sql = `
      SELECT 
        pi.id AS item_id,
        pi.pedido_id,
        p.numero_pedido,
        p.estado AS pedido_estado,
        c.nombre_completo AS cliente_nombre,
        p.created_at AS fecha_registro,
        cat.id AS catalogo_id,
        cat.codigo,
        cat.contratipo,
        cat.marca_inspirada,
        cat.genero,
        pi.version,
        pi.cantidad
      FROM public.pedido_items pi
      JOIN public.catalogo cat ON pi.catalogo_id = cat.id
      JOIN public.pedidos p ON pi.pedido_id = p.id
      JOIN public.clientes c ON p.cliente_id = c.id
      WHERE pi.insumo_comprado = FALSE 
        AND p.estado IN ('Registrado', 'PENDIENTE_COMPRA')
      ORDER BY p.created_at ASC, cat.contratipo ASC;
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

      // Auto-avanzar pedidos cuyos insumos estén 100% comprados a 'Insumos comprados'
      await queryKode(
        `UPDATE public.pedidos p
         SET estado = 'Insumos comprados', updated_at = NOW()
         WHERE p.estado IN ('Registrado', 'PENDIENTE_COMPRA')
           AND NOT EXISTS (
             SELECT 1 FROM public.pedido_items pi
             WHERE pi.pedido_id = p.id AND pi.insumo_comprado = FALSE
           )`
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
          AND p.estado IN ('Registrado', 'PENDIENTE_COMPRA')
          AND pi.catalogo_id = $2
          AND pi.insumo_comprado = FALSE
      `;
      const params: any[] = [comprado_por, catalogo_id];

      if (version) {
        params.push(version);
        sql += ` AND pi.version = $${params.length}`;
      }

      const res = await queryKode(sql, params);

      // Auto-avanzar pedidos que quedaron completos
      await queryKode(
        `UPDATE public.pedidos p
         SET estado = 'Insumos comprados', updated_at = NOW()
         WHERE p.estado IN ('Registrado', 'PENDIENTE_COMPRA')
           AND NOT EXISTS (
             SELECT 1 FROM public.pedido_items pi
             WHERE pi.pedido_id = p.id AND pi.insumo_comprado = FALSE
           )`
      );

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
