import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffInternalToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
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
