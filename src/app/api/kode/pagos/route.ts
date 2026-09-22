import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

async function ensurePagosTable() {
  try {
    await queryKode(`
      CREATE TABLE IF NOT EXISTS public.pagos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
        cliente_id UUID REFERENCES public.clientes(id),
        forma_pago_id VARCHAR(50) REFERENCES public.formas_pago(id),
        monto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
        num_documento_auto VARCHAR(100),
        estado_pago VARCHAR(30) DEFAULT 'Confirmado',
        usuario VARCHAR(100),
        observaciones TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_pagos_pedido_id ON public.pagos(pedido_id);
      CREATE INDEX IF NOT EXISTS idx_pagos_forma_pago ON public.pagos(forma_pago_id);
      CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha_pago DESC);
    `);
  } catch (err) {
    console.error('Error asegurando tabla pagos:', err);
  }
}

export async function GET(request: Request) {
  try {
    await ensurePagosTable();
    const { searchParams } = new URL(request.url);
    const pedidoId = searchParams.get('pedido_id');

    let sql = `
      SELECT 
        pg.id,
        pg.pedido_id,
        pg.cliente_id,
        pg.forma_pago_id,
        fp.nombre AS forma_pago_nombre,
        fp.tipo AS forma_pago_tipo,
        pg.monto,
        pg.fecha_pago,
        COALESCE(pg.num_documento_auto, '') AS num_documento_auto,
        COALESCE(pg.estado_pago, 'Confirmado') AS estado_pago,
        COALESCE(pg.usuario, '') AS usuario,
        COALESCE(pg.observaciones, '') AS observaciones,
        pg.created_at
      FROM public.pagos pg
      LEFT JOIN public.formas_pago fp ON pg.forma_pago_id = fp.id
    `;

    const params: any[] = [];
    if (pedidoId) {
      params.push(pedidoId);
      sql += ` WHERE pg.pedido_id = $1`;
    }
    sql += ` ORDER BY pg.created_at ASC`;

    const res = await queryKode(sql, params);
    return NextResponse.json({ success: true, pagos: res.rows });
  } catch (error: any) {
    console.error('Error fetching pagos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensurePagosTable();
    const body = await request.json();
    const {
      pedido_id,
      cliente_id,
      forma_pago_id,
      monto,
      fecha_pago = new Date().toISOString().slice(0, 10),
      num_documento_auto = '',
      usuario = 'KÖDE',
      observaciones = '',
    } = body;

    if (!pedido_id) {
      return NextResponse.json({ success: false, error: 'pedido_id es requerido' }, { status: 400 });
    }

    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      return NextResponse.json({ success: false, error: 'El monto del pago debe ser mayor a $0.00' }, { status: 400 });
    }

    if (!forma_pago_id) {
      return NextResponse.json({ success: false, error: 'Debe seleccionar una forma de pago' }, { status: 400 });
    }

    // 1. Obtener datos del pedido
    const pedidoRes = await queryKode(
      `SELECT id, cliente_id, total, tipo_pago FROM public.pedidos WHERE id = $1 LIMIT 1`,
      [pedido_id]
    );

    if (pedidoRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    const pedido = pedidoRes.rows[0];
    const finalClienteId = cliente_id || pedido.cliente_id;

    // 2. Registrar el pago
    const insertRes = await queryKode(
      `INSERT INTO public.pagos (
        pedido_id, cliente_id, forma_pago_id, monto, fecha_pago, num_documento_auto, estado_pago, usuario, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Confirmado', $7, $8)
      RETURNING *`,
      [
        pedido_id,
        finalClienteId,
        forma_pago_id,
        numMonto,
        fecha_pago,
        num_documento_auto.trim(),
        usuario,
        observaciones.trim(),
      ]
    );

    const nuevoPago = insertRes.rows[0];

    // 3. Recalcular saldo del pedido y actualizar estado financiero
    const sumRes = await queryKode(
      `SELECT COALESCE(SUM(monto), 0)::float AS total_pagado FROM public.pagos WHERE pedido_id = $1`,
      [pedido_id]
    );

    const totalPagado = sumRes.rows[0]?.total_pagado || 0;
    const totalPedido = parseFloat(pedido.total) || 0;
    const nuevoBalance = Math.max(0, totalPedido - totalPagado);

    let nuevoEstadoPago = 'PENDIENTE';
    if (totalPagado >= totalPedido) {
      nuevoEstadoPago = 'PAGADO';
    } else if (totalPagado > 0) {
      nuevoEstadoPago = 'PARCIAL';
    }

    // Si es contraentrega, ajustar monto_cobrar_cce al nuevo saldo
    const nuevoCobroCce = pedido.tipo_pago === 'CONTRAENTREGA' ? nuevoBalance : 0;

    await queryKode(
      `UPDATE public.pedidos 
       SET estado_pago = $1,
           monto_cobrar_cce = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [nuevoEstadoPago, nuevoCobroCce, pedido_id]
    );

    return NextResponse.json({
      success: true,
      message: `Pago de $${numMonto.toFixed(2)} registrado con éxito`,
      pago: nuevoPago,
      resumen: {
        total_pedido: totalPedido,
        total_pagado: totalPagado,
        balance_pendiente: nuevoBalance,
        estado_pago: nuevoEstadoPago,
        monto_cobrar_cce: nuevoCobroCce,
      },
    });
  } catch (error: any) {
    console.error('Error registrando pago:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de pago es requerido' }, { status: 400 });
    }

    const pagoRes = await queryKode(`SELECT pedido_id, monto FROM public.pagos WHERE id = $1`, [id]);
    if (pagoRes.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    }

    const { pedido_id } = pagoRes.rows[0];

    // Eliminar el pago
    await queryKode(`DELETE FROM public.pagos WHERE id = $1`, [id]);

    // Recalcular
    const sumRes = await queryKode(
      `SELECT COALESCE(SUM(monto), 0)::float AS total_pagado FROM public.pagos WHERE pedido_id = $1`,
      [pedido_id]
    );

    const totalPagado = sumRes.rows[0]?.total_pagado || 0;
    const pedidoRes = await queryKode(`SELECT total, tipo_pago FROM public.pedidos WHERE id = $1`, [pedido_id]);
    const pedido = pedidoRes.rows[0];

    const totalPedido = parseFloat(pedido?.total || 0);
    const nuevoBalance = Math.max(0, totalPedido - totalPagado);
    const nuevoEstadoPago = totalPagado >= totalPedido ? 'PAGADO' : totalPagado > 0 ? 'PARCIAL' : 'PENDIENTE';
    const nuevoCobroCce = pedido?.tipo_pago === 'CONTRAENTREGA' ? nuevoBalance : 0;

    await queryKode(
      `UPDATE public.pedidos 
       SET estado_pago = $1, monto_cobrar_cce = $2, updated_at = NOW() 
       WHERE id = $3`,
      [nuevoEstadoPago, nuevoCobroCce, pedido_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Pago eliminado y balance recalculado',
      balance_pendiente: nuevoBalance,
      estado_pago: nuevoEstadoPago,
    });
  } catch (error: any) {
    console.error('Error eliminando pago:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
