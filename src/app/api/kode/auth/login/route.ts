import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffInternalToken, verifyPasswordSecure, hashPasswordSecure } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Rate Limiting contra ataques de fuerza bruta de PIN / contraseña (máx 8 intentos por minuto por IP)
    const rl = await checkRateLimit(request, {
      keyPrefix: 'staff_login',
      maxRequests: 8,
      windowMs: 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Demasiados intentos de inicio de sesión. Por favor espera ${rl.resetSeconds} segundos.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.resetSeconds) },
        }
      );
    }

    const body = await request.json();
    const { identifier, password, isPin } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Ingresa credenciales o PIN' },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPwd = String(password).trim();

    let staffUser = null;

    if (isPin) {
      staffUser = await prisma.staffUser.findFirst({
        where: { email: cleanId, pin: cleanPwd, isActive: true }
      });
    } else {
      const candidate = await prisma.staffUser.findFirst({
        where: {
          OR: [
            { email: cleanId },
            { id: String(identifier).trim() },
          ],
          isActive: true,
        },
      });
      if (candidate) {
        if (candidate.pin && candidate.pin === cleanPwd) {
          staffUser = candidate;
        } else if (candidate.passwordHash && candidate.passwordHash !== 'GOOGLE_OAUTH_ONLY') {
          const check = verifyPasswordSecure(cleanPwd, candidate.passwordHash);
          if (check.valid) {
            staffUser = candidate;
            if (check.needsRehash) {
              await prisma.staffUser.update({
                where: { id: candidate.id },
                data: { passwordHash: hashPasswordSecure(cleanPwd) },
              }).catch(() => {});
            }
          }
        }
      }
    }

    if (!staffUser) {
      return NextResponse.json(
        { success: false, error: 'Credenciales o PIN inválidos.' },
        { status: 401 }
      );
    }

    await prisma.staffUser.update({
      where: { id: staffUser.id },
      data: { lastLogin: new Date() }
    });

    const safeToken = createStaffInternalToken(staffUser.role, staffUser.email, staffUser.name, staffUser.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: staffUser.id,
        nombre: staffUser.name,
        email: staffUser.email,
        rol: staffUser.role
      }
    });

    response.cookies.set('kodelocal_staff_token', safeToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    response.cookies.set('kode_session_ui', JSON.stringify({
      id: staffUser.id,
      name: staffUser.name,
      email: staffUser.email,
      role: staffUser.role
    }), {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;

  } catch (error: any) {
    console.error('Login Auth Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al autenticar.' },
      { status: 500 }
    );
  }
}

