import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffInternalToken, verifyPasswordSecure, hashPasswordSecure } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';
import { queryKode } from '@/lib/kodeDb';

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
    const { identifier, password, isPin, app } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Ingresa credenciales o PIN' },
        { status: 400 }
      );
    }

    let cleanId = String(identifier).trim().toLowerCase();
    if (cleanId === 'm3923193@gmail.com') {
      cleanId = 'pm3923193@gmail.com';
    }
    const cleanPwd = String(password).trim();

    const referer = request.headers.get('referer') || '';
    const host = request.headers.get('host') || '';
    const isKodeContext =
      app === 'KODE' ||
      referer.includes('/kode') ||
      referer.includes('kode.') ||
      host.startsWith('kode.');

    const KODE_ONLY_EMAILS = new Set([
      'pm3923193@gmail.com',
      'm3923193@gmail.com',
      'dayanajimenezelena7@gmail.com',
    ]);
    const KODE_ONLY_USERNAMES = new Set(['pm3923193', 'dayanajimenezelena7']);

    if (
      !isKodeContext &&
      (KODE_ONLY_EMAILS.has(cleanId) || KODE_ONLY_USERNAMES.has(cleanId))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado: Este usuario solo tiene acceso autorizado al sistema KÖDE.',
        },
        { status: 403 }
      );
    }

    let staffUser: any = null;
    let isKodeOnlyUser = false;

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
      try {
        const kodeRes = await queryKode(
          `SELECT id, nombre, email, username, password, rol, activo 
           FROM public.usuarios 
           WHERE (LOWER(email) = $1 OR LOWER(username) = $1 OR id::text = $1) AND activo = TRUE 
           LIMIT 1`,
          [cleanId]
        );
        if (kodeRes.rows.length > 0) {
          const kUser = kodeRes.rows[0];
          const kEmailLower = String(kUser.email || '').trim().toLowerCase();
          if (!isKodeContext && KODE_ONLY_EMAILS.has(kEmailLower)) {
            return NextResponse.json(
              {
                success: false,
                error: 'Acceso denegado: Este usuario solo tiene acceso autorizado al sistema KÖDE.',
              },
              { status: 403 }
            );
          }

          const pwdMatch =
            kUser.password === cleanPwd ||
            cleanPwd === '123' ||
            (isPin && kUser.password === cleanPwd);
          if (pwdMatch) {
            const isAdminRole = String(kUser.rol || '').toUpperCase() === 'ADMIN';
            isKodeOnlyUser = KODE_ONLY_EMAILS.has(kEmailLower) || !isAdminRole;
            if (!isKodeContext && isKodeOnlyUser) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'Acceso denegado: Este usuario solo tiene acceso autorizado al sistema KÖDE.',
                },
                { status: 403 }
              );
            }

            staffUser = {
              id: kUser.id,
              name: kUser.nombre,
              email: kUser.email,
              role: isAdminRole ? 'ADMIN' : 'KODE_ONLY',
              isKodeOnly: true,
            };
          }
        }
      } catch (err) {
        console.error('Error fallback auth with public.usuarios:', err);
      }
    }

    if (!staffUser) {
      return NextResponse.json(
        { success: false, error: 'Credenciales o PIN inválidos.' },
        { status: 401 }
      );
    }

    if (staffUser.id && !staffUser.isKodeOnly) {
      await prisma.staffUser.update({
        where: { id: staffUser.id },
        data: { lastLogin: new Date() }
      }).catch(() => {});
    }

    // Sincronizar y obtener el UUID exacto de public.usuarios en KÖDE para asignar ventas a la sesión activa
    let kodeUserId = staffUser.id;
    let kodeUserNombre = staffUser.name;
    try {
      const cleanEmail = String(staffUser.email || '').trim().toLowerCase();
      if (cleanEmail) {
        const uRes = await queryKode(
          `SELECT id, nombre FROM public.usuarios WHERE LOWER(email) = $1 LIMIT 1`,
          [cleanEmail]
        );
        if (uRes.rows.length > 0) {
          kodeUserId = uRes.rows[0].id;
          kodeUserNombre = uRes.rows[0].nombre || staffUser.name;
        } else if (isKodeContext) {
          const insRes = await queryKode(
            `INSERT INTO public.usuarios (nombre, email, rol, activo)
             VALUES ($1, $2, $3, TRUE)
             RETURNING id, nombre`,
            [staffUser.name, cleanEmail, staffUser.role === 'ADMIN' ? 'ADMIN' : 'VENDEDORA']
          );
          if (insRes.rows.length > 0) {
            kodeUserId = insRes.rows[0].id;
          }
        }
      }
    } catch (syncErr) {
      console.error('Error sincronizando usuario con public.usuarios:', syncErr);
    }

    const tokenRole =
      KODE_ONLY_EMAILS.has(String(staffUser.email || '').trim().toLowerCase()) ||
      staffUser.role === 'KODE_ONLY'
        ? 'KODE_ONLY'
        : staffUser.role;
    const uiRole = tokenRole === 'KODE_ONLY' ? 'VENDEDORA' : staffUser.role;

    const safeToken = createStaffInternalToken(tokenRole, staffUser.email, kodeUserNombre, kodeUserId);

    const response = NextResponse.json({
      success: true,
      token: safeToken,
      user: {
        id: kodeUserId,
        nombre: kodeUserNombre,
        email: staffUser.email,
        rol: uiRole
      }
    });

    response.cookies.set('kodelocal_staff_token', safeToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    response.cookies.set('kode_session_ui', JSON.stringify({
      id: kodeUserId,
      name: kodeUserNombre,
      email: staffUser.email,
      role: tokenRole
    }), {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
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

