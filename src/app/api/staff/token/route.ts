import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffInternalToken, verifyStaffRequest } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Rate Limiting para generación de token de staff (REQ-SEC-01: máx 120 req/min por IP)
    const rl = await checkRateLimit(request, {
      keyPrefix: 'staff_token',
      maxRequests: 120,
      windowMs: 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Demasiados intentos de acceso de personal. Por favor espera ${rl.resetSeconds} segundos.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.resetSeconds) },
        }
      );
    }

    // 1. Verificar por token firmado (header o cookie HttpOnly kodelocal_staff_token)
    const { authorized, payload } = verifyStaffRequest(request);

    let matchedRole = payload?.role || '';
    let matchedEmail = payload?.email || '';
    let matchedName = payload?.name || '';
    let matchedId = payload?.id || '';
    let isVerified = authorized && !!payload;

    // 2. Respaldo de recuperación de sesión: si la cookie kode_session_ui sigue activa en el navegador,
    // verificar contra la base de datos que el usuario exista y esté activo para restaurar su token sin sacarlo.
    if (!isVerified) {
      const cookieHeader = request.headers.get('cookie') || '';
      const uiMatch = cookieHeader.match(/(?:^|;\s*)kode_session_ui=([^;]+)/);
      if (uiMatch) {
        try {
          const uiSession = JSON.parse(decodeURIComponent(uiMatch[1].trim()));
          if (uiSession?.email) {
            const dbStaff = await prisma.staffUser.findFirst({
              where: {
                email: String(uiSession.email).toLowerCase().trim(),
                isActive: true,
              },
            });
            if (dbStaff) {
              matchedRole = dbStaff.role;
              matchedEmail = dbStaff.email;
              matchedName = dbStaff.name;
              matchedId = dbStaff.id;
              isVerified = true;
            }
          }
        } catch (_) {}
      }
    }

    if (!isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Debes iniciar sesión como personal operativo.',
        },
        { status: 401 }
      );
    }

    if (matchedEmail && matchedEmail !== 'admin@kodelocal.com') {
      const staff = await prisma.staffUser.findFirst({
        where: {
          email: matchedEmail.toLowerCase().trim(),
          isActive: true,
        },
      });
      if (!staff) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cuenta de personal inactiva o no autorizada.',
          },
          { status: 401 }
        );
      }
      matchedRole = staff.role;
      matchedName = staff.name;
      matchedId = staff.id;
    }

    const token = createStaffInternalToken(matchedRole, matchedEmail, matchedName, matchedId);
    const response = NextResponse.json({
      success: true,
      token,
      role: matchedRole,
      user: {
        id: matchedId,
        name: matchedName,
        email: matchedEmail,
        role: matchedRole,
      },
    });

    const thirtyDaysSec = 60 * 60 * 24 * 30;

    // Renovar cookie HttpOnly firmada (Sliding Session de 30 días)
    response.cookies.set('kodelocal_staff_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: thirtyDaysSec,
    });

    // Sincronizar cookie de UI con la misma expiración de 30 días
    response.cookies.set(
      'kode_session_ui',
      JSON.stringify({
        id: matchedId,
        name: matchedName,
        email: matchedEmail,
        role: matchedRole,
      }),
      {
        path: '/',
        sameSite: 'lax',
        maxAge: thirtyDaysSec,
      }
    );

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

