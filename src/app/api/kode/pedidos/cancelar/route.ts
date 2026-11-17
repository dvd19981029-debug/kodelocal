import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';
import { invalidarDteKode } from '@/lib/facturalamaKode';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const auth = verifyStaffRequest(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pedido_id, motivo, force_cancel_only } = body;

    if (!pedido_id) {
      return NextResponse.json(
        { success: false, error: 'El ID del pedido es obligatorio.' },
        { status: 400 }
      );
    }

    const res = await queryKode(
      `SELECT 
        id,
        numero_pedido,
        estado,
        dte_estado,
        dte_codigo_generacion,
        dte_numero_control
       FROM public.pedidos
       WHERE id = $1
       LIMIT 1`,
      [String(pedido_id).trim()]
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'El pedido no existe.' },
        { status: 404 }
      );
    }

    const pedido = res.rows[0];

    const dteId = String(pedido.dte_codigo_generacion || '').trim();
    const dteEst = String(pedido.dte_estado || '').trim().toUpperCase();
    const reasonText =
      String(motivo || '').trim() ||
      `Pedido ${pedido.numero_pedido} cancelado / no entregado`;

    let dteInvalidation: any = null;

    // Si el pedido tiene un DTE emitido y aún no está anulado, invalidarlo en Factura Llama (POST /dte/invalidate)
    if (dteId && dteEst !== 'ANULADO' && dteEst !== 'INVALIDADO' && !force_cancel_only) {
      dteInvalidation = await invalidarDteKode({
        dte_id: dteId,
        reason: reasonText,
      });

      const msgLower = String(dteInvalidation.mensaje || '').toLowerCase();
      const alreadyInvalidatedInMh =
        msgLower.includes('already invalidated') ||
        msgLower.includes('ya fue invalidado') ||
        msgLower.includes('ya se encuentra invalidado') ||
        msgLower.includes('anulado');

      if (!dteInvalidation.success && !alreadyInvalidatedInMh) {
        return NextResponse.json(
          {
            success: false,
            dteError: true,
            error: `Factura Llama rechazó la anulación del DTE (${pedido.dte_numero_control || dteId.slice(0, 8)}): ${dteInvalidation.mensaje}`,
            dteResult: dteInvalidation,
          },
          { status: 422 }
        );
      }
    }

    const nextDteEstado = dteId ? 'ANULADO' : pedido.dte_estado;

    await queryKode(
      `UPDATE public.pedidos
       SET estado = 'Cancelado',
           dte_estado = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [nextDteEstado, pedido.id]
    );

    return NextResponse.json({
      success: true,
      message: dteId
        ? `Pedido ${pedido.numero_pedido} pasado a Cancelado y DTE anulado en Factura Llama.`
        : `Pedido ${pedido.numero_pedido} pasado a Cancelado.`,
      pedido: {
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        estado: 'Cancelado',
        dte_estado: nextDteEstado,
      },
      dteInvalidation,
    });
  } catch (error: any) {
    console.error('Error cancelando pedido KÖDE / anulando DTE:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al cancelar el pedido' },
      { status: 500 }
    );
  }
}
