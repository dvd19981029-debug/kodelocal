import { NextResponse } from 'next/server';
import { verifyStaffRequest } from '@/lib/customerAuthToken';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { authorized, payload } = verifyStaffRequest(request);

    if (!authorized || !payload) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    let kodeUserId = payload.id;
    let kodeUserNombre = payload.name;
    try {
      const cleanEmail = String(payload.email || '').trim().toLowerCase();
      if (cleanEmail) {
        const uRes = await queryKode(
          `SELECT id, nombre FROM public.usuarios WHERE LOWER(email) = $1 LIMIT 1`,
          [cleanEmail]
        );
        if (uRes.rows.length > 0) {
          kodeUserId = uRes.rows[0].id;
          kodeUserNombre = uRes.rows[0].nombre || payload.name;
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: kodeUserId,
        nombre: kodeUserNombre,
        email: payload.email,
        rol: payload.role === 'KODE_ONLY' ? 'VENDEDORA' : payload.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
}

