import { NextResponse } from 'next/server';
import { emitirDteKode, buildKodeDteItemsFromPedido } from '@/lib/facturalamaKode';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

// Candado en memoria para llamadas simultáneas al mismo pedido_id
const inFlightKodeDte = new Map<string, Promise<{ status: number; body: any }>>();

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

    const pedidoKey = String(pedido_id).trim();
    const existingFlight = inFlightKodeDte.get(pedidoKey);
    if (existingFlight) {
      const shared = await existingFlight;
      return NextResponse.json(shared.body, { status: shared.status });
    }

    const executeKodeDte = async (): Promise<{ status: number; body: any }> => {
      // 1. Obtener datos del pedido y cliente en la base de datos de Kode
      const res = await queryKode(
        `SELECT 
          p.id,
          p.numero_pedido,
          p.subtotal,
          p.descuento,
          p.costo_envio,
          p.total,
          p.notas,
          p.dte_estado,
          p.dte_codigo_generacion,
          p.dte_numero_control,
          p.dte_sello_recepcion,
          p.dte_pdf_url,
          p.dte_json_url,
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
        [pedidoKey]
      );

      if (res.rowCount === 0) {
        return {
          status: 404,
          body: { success: false, error: 'Pedido no encontrado' },
        };
      }

      const pedido = res.rows[0];

      if (pedido.dte_codigo_generacion || pedido.dte_numero_control) {
        return {
          status: 200,
          body: {
            success: true,
            alreadyEmitted: true,
            estado: pedido.dte_estado || 'PROCESADO',
            codigo_generacion: pedido.dte_codigo_generacion,
            numero_control: pedido.dte_numero_control,
            sello_recepcion: pedido.dte_sello_recepcion,
            pdf_url: pedido.dte_pdf_url,
            json_url: pedido.dte_json_url,
          },
        };
      }

      // 1.5 Reclamo atómico en base de datos para evitar doble emisión entre instancias serverless
      const claimRes = await queryKode(
        `UPDATE public.pedidos
         SET dte_estado = 'EMITIENDO', updated_at = NOW()
         WHERE id = $1
           AND dte_codigo_generacion IS NULL
           AND dte_numero_control IS NULL
           AND (
             dte_estado IS NULL
             OR dte_estado <> 'EMITIENDO'
             OR updated_at < NOW() - INTERVAL '45 seconds'
           )
         RETURNING id`,
        [pedidoKey]
      );

      if (claimRes.rowCount === 0) {
        return {
          status: 409,
          body: {
            success: false,
            error: 'Ya se está emitiendo el DTE de este pedido en este momento. Espera unos segundos.',
          },
        };
      }

      // 2. Calcular precio sin IVA respetando el total del pedido
      const itemsFormatted = buildKodeDteItemsFromPedido(
        pedido.items || [],
        pedido.total,
        pedido.descuento
      );

      // 3. Emitir a Factura Llama
      let dteResult: any;
      try {
        dteResult = await emitirDteKode({
          id_pedido: pedido.numero_pedido,
          cliente_nombre: pedido.cliente_nombre,
          cliente_direccion: pedido.cliente_direccion,
          cliente_departamento: pedido.cliente_departamento,
          cliente_municipio: pedido.cliente_municipio,
          items: itemsFormatted,
          comentarios: `Pedido ID: ${pedido.numero_pedido} | Kode Local`,
        });
      } catch (emitErr: any) {
        await queryKode(
          `UPDATE public.pedidos SET dte_estado = 'ERROR', updated_at = NOW() WHERE id = $1 AND dte_codigo_generacion IS NULL`,
          [pedidoKey]
        ).catch(() => {});
        throw emitErr;
      }

      // 4. Si la emisión fue exitosa, persistir en public.pedidos; si falló, liberar dte_estado
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
              pedidoKey,
            ]
          );
        } catch (dbErr) {
          console.warn('Advertencia actualizando campos DTE en pedidos:', dbErr);
        }
      } else {
        await queryKode(
          `UPDATE public.pedidos SET dte_estado = 'RECHAZADO', updated_at = NOW() WHERE id = $1 AND dte_codigo_generacion IS NULL`,
          [pedidoKey]
        ).catch(() => {});
      }

      return { status: 200, body: dteResult };
    };

    const flightPromise = executeKodeDte();
    inFlightKodeDte.set(pedidoKey, flightPromise);
    try {
      const outcome = await flightPromise;
      return NextResponse.json(outcome.body, { status: outcome.status });
    } finally {
      inFlightKodeDte.delete(pedidoKey);
    }
  } catch (error: any) {
    console.error('Error al emitir DTE para Kode:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
