import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      pedido_id,
      c807_guia_numero,
      c807_link_rastreo,
      c807_estado = 'Generada',
    } = body;

    if (!pedido_id || !c807_guia_numero) {
      return NextResponse.json(
        { success: false, error: 'pedido_id y c807_guia_numero son obligatorios' },
        { status: 400 }
      );
    }

    const link =
      c807_link_rastreo?.trim() ||
      `https://app.c807.com/tracking?guide=${encodeURIComponent(c807_guia_numero.trim())}`;

    const res = await queryKode(
      `UPDATE public.pedidos
       SET 
         c807_guia_numero = $1,
         c807_link_rastreo = $2,
         c807_estado = $3,
         c807_fecha_guia = NOW(),
         estado = 'GUIA_CREADA',
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, numero_pedido, estado, c807_guia_numero, c807_link_rastreo`,
      [c807_guia_numero.trim(), link, c807_estado, pedido_id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Guía C807 asignada y pedido cambiado a estado GUIA_CREADA (Azul)',
      pedido: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error assigning C807 guide:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
