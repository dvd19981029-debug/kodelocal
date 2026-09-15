import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffInternalToken } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Rate Limiting para generación de token de staff (REQ-SEC-01: máx 5 req/min por IP)
    const rl = await checkRateLimit(request, {
      keyPrefix: 'staff_token',
      maxRequests: 5,
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

    const body = await request.json();
    const { email, role } = body;

    // Buscar en StaffUser si coincide o si es una consulta de rol operativo
    let matchedRole = role || 'STAFF';
    if (email) {
      const staff = await prisma.staffUser.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          isActive: true,
        },
      });
      if (staff) {
        matchedRole = staff.role;
      }
    }

    const token = createStaffInternalToken(matchedRole);
    return NextResponse.json({ success: true, token, role: matchedRole });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
