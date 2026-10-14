import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffInternalToken, verifyStaffRequest } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Rate Limiting para generación de token de staff (REQ-SEC-01: máx 15 req/min por IP)
    const rl = await checkRateLimit(request, {
      keyPrefix: 'staff_token',
      maxRequests: 15,
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

    // SEC-CRITICAL: Exigir sesión activa autenticada mediante cookie HttpOnly firmada (kodelocal_staff_token)
    const { authorized, payload } = verifyStaffRequest(request);
    if (!authorized || !payload) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Debes iniciar sesión como personal operativo.',
        },
        { status: 401 }
      );
    }

    let matchedRole = payload.role || 'STAFF';
    let matchedEmail = payload.email || 'staff@kodelocal.com';
    let matchedName = payload.name || 'Personal';
    let matchedId = payload.id || 'system';

    if (matchedEmail && matchedEmail !== 'admin@kodelocal.com') {
      const staff = await prisma.staffUser.findFirst({
        where: {
          email: matchedEmail.toLowerCase().trim(),
          isActive: true,
        },
      });
      if (staff) {
        matchedRole = staff.role;
        matchedName = staff.name;
        matchedId = staff.id;
      }
    }

    const token = createStaffInternalToken(matchedRole, matchedEmail, matchedName, matchedId);
    return NextResponse.json({ success: true, token, role: matchedRole });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

