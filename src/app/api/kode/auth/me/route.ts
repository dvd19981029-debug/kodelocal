import { NextResponse } from 'next/server';
import { createStaffInternalToken, verifyStaffRequest } from '@/lib/customerAuthToken';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { authorized, payload } = verifyStaffRequest(request);

    if (!authorized || !payload) {
      return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 401 });
    }

    let kodeUserId = payload.id;
    let kodeUserNombre = payload.name;
    let kodeUserRol = payload.role === 'KODE_ONLY' ? 'VENDEDORA' : payload.role;
    try {
      const cleanEmail = String(payload.email || '').trim().toLowerCase();
      if (cleanEmail) {
        const uRes = await queryKode(
          `SELECT id, nombre, rol, activo FROM public.usuarios WHERE LOWER(email) = $1 LIMIT 1`,
          [cleanEmail]
        );
        if (uRes.rows.length > 0) {
          if (uRes.rows[0].activo === false) {
            return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 401 });
          }
          kodeUserId = uRes.rows[0].id;
          kodeUserNombre = uRes.rows[0].nombre || payload.name;
          kodeUserRol = String(uRes.rows[0].rol || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'VENDEDORA';
        }
      }
    } catch {}

    const tokenRole = kodeUserRol === 'ADMIN' ? 'ADMIN' : 'KODE_ONLY';
    const refreshedToken = createStaffInternalToken(tokenRole, payload.email, kodeUserNombre, kodeUserId);

    const res = NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: kodeUserId,
        nombre: kodeUserNombre,
        email: payload.email,
        rol: kodeUserRol,
      },
    });
    res.cookies.set('kodelocal_staff_token', refreshedToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
}

