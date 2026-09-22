import { NextResponse } from 'next/server';
import { emitirDteKode } from '@/lib/facturalamaKode';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pedido_id } = body;

    if (!pedido_id) {
      return NextResponse.json(
        { success: false, error: 'pedido_id es obligatorio' },
        { status: 400 }
      );
    }

    // 1. Obtener datos del pedido y cliente en la base de datos de Kode
    const res = await queryKode(
      `SELECT 
        p.id,
        p.numero_pedido,
        p.subtotal,
        p.total,
        p.notas,
        c.nombre_completo AS cliente_nombre,
        c.telefono_whatsapp AS cliente_telefono,
        c.direccion_entrega AS cliente_direccion,
        c.departamento AS cliente_departamento,
        c.municipio AS cliente_municipio,
        COALESCE(
          json_agg(
            json_build_object(
              'kodigo', cat.codigo,
              'nombre_mh', COALESCE(cat.contratipo, 'Fragancia'),
              'cantidad', pi.cantidad,
              'precio_unitario', pi.precio_unitario,
              'subtotal', pi.subtotal
            )
          ) FILTER (WHERE pi.id IS NOT NULL), '[]'::json
        ) AS items
       FROM public.pedidos p
       JOIN public.clientes c ON p.cliente_id = c.id
       LEFT JOIN public.pedido_items pi ON p.id = pi.pedido_id
       LEFT JOIN public.catalogo cat ON pi.catalogo_id = cat.id
       WHERE p.id = $1
       GROUP BY p.id, c.id LIMIT 1`,
      [pedido_id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    const pedido = res.rows[0];

    // 2. Calcular precio sin IVA (precios en El Salvador incluyen 13% de IVA)
    const itemsFormatted = (pedido.items || []).map((it: any) => {
      const precioConIva = Number(it.precio_unitario || 0);
      const precioSinIva = Number((precioConIva / 1.13).toFixed(4));
      return {
        kodigo: it.kodigo || 'KODE-01',
        nombre_mh: it.nombre_mh,
        cantidad: it.cantidad || 1,
        precio_sin_iva: precioSinIva > 0 ? precioSinIva : 0.01,
      };
    });

    // 3. Emitir a Factura Llama
    const dteResult = await emitirDteKode({
      id_pedido: pedido.numero_pedido,
      cliente_nombre: pedido.cliente_nombre,
      cliente_direccion: pedido.cliente_direccion,
      cliente_departamento: pedido.cliente_departamento,
      cliente_municipio: pedido.cliente_municipio,
      items: itemsFormatted,
      comentarios: `Pedido ID: ${pedido.numero_pedido} | Kode Local`,
    });

    // 4. Si la emisión fue exitosa, persistir en public.pedidos
    if (dteResult.success) {
      try {
        await queryKode(
          `UPDATE public.pedidos SET
            dte_estado = $1,
            dte_codigo_generacion = $2,
            dte_numero_control = $3,
            dte_sello_recepcion = $4,
            dte_pdf_url = $5,
            dte_json_url = $6,
            dte_fecha_emision = NOW(),
            updated_at = NOW()
          WHERE id = $7`,
          [
            dteResult.estado || 'PROCESADO',
            dteResult.codigo_generacion,
            dteResult.numero_control || null,
            dteResult.sello_recepcion || null,
            dteResult.pdf_url || null,
            dteResult.json_url || null,
            pedido_id,
          ]
        );
      } catch (dbErr) {
        console.warn('Advertencia actualizando campos DTE en pedidos:', dbErr);
      }
    }

    return NextResponse.json(dteResult);
  } catch (error: any) {
    console.error('Error al emitir DTE para Kode:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
