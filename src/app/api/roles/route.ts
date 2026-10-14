import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';
import { INITIAL_ROLES, CustomRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ROLES_CATEGORY = 'system_config';
const ROLES_TOPIC = 'custom_roles';

export async function GET() {
  try {
    const record = await prisma.mirandaBusinessMemory.findFirst({
      where: {
        category: ROLES_CATEGORY,
        topic: ROLES_TOPIC,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (record?.instruction) {
      try {
        const parsed = JSON.parse(record.instruction);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ success: true, roles: parsed });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, roles: INITIAL_ROLES });
  } catch (error: any) {
    return NextResponse.json({ success: true, roles: INITIAL_ROLES, error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieHeader = request.headers.get('cookie') || '';
    const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
    const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

    const isStaff =
      verifyStaffInternalToken(staffHeaderToken) ||
      verifyStaffInternalToken(bearerToken) ||
      verifyStaffInternalToken(staffCookieToken);

    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Se requiere autenticacion de administrador.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const roles: CustomRole[] = Array.isArray(body.roles) ? body.roles : [];
    if (roles.length === 0) {
      return NextResponse.json({ success: false, error: 'Lista de roles vacía' }, { status: 400 });
    }

    const existing = await prisma.mirandaBusinessMemory.findFirst({
      where: {
        category: ROLES_CATEGORY,
        topic: ROLES_TOPIC,
      },
    });

    if (existing) {
      await prisma.mirandaBusinessMemory.update({
        where: { id: existing.id },
        data: { instruction: JSON.stringify(roles) },
      });
    } else {
      await prisma.mirandaBusinessMemory.create({
        data: {
          category: ROLES_CATEGORY,
          topic: ROLES_TOPIC,
          instruction: JSON.stringify(roles),
        },
      });
    }

    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
