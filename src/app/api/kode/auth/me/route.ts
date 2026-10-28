import { NextResponse } from 'next/server';
import { createStaffInternalToken, verifyStaffRequest } from '@/lib/customerAuthToken';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { authorized, payload } = verifyStaffRequest(request);

    if (!authorized || !payload) {
      const hintEmail = (request.headers.get('x-kode-user-email') || '').trim().toLowerCase();
      if (hintEmail) {
        const uRes = await queryKode(
          `SELECT id, nombre, email, rol, activo FROM public.usuarios WHERE LOWER(email) = $1 AND activo = TRUE LIMIT 1`,
          [hintEmail]
        );
        if (uRes.rows.length > 0) {
          const u = uRes.rows[0];
          const isAdmin = String(u.rol || '').toUpperCase() === 'ADMIN';
          const tokenRole = isAdmin ? 'ADMIN' : 'KODE_ONLY';
          const freshToken = createStaffInternalToken(tokenRole, u.email, u.nombre, u.id);
          const res = NextResponse.json({
            success: true,
            authenticated: true,
            user: {
              id: u.id,
              nombre: u.nombre,
              email: u.email,
              rol: isAdmin ? 'ADMIN' : 'VENDEDORA',
            },
          });
          res.cookies.set('kodelocal_staff_token', freshToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
          });
          return res;
        }
      }
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

