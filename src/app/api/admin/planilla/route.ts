import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

const PLANILLA_CATEGORY = 'system_config';
const PLANILLA_TOPIC = 'payroll_planilla_sv_v1';

export async function GET() {
  try {
    const record = await prisma.mirandaBusinessMemory.findFirst({
      where: {
        category: PLANILLA_CATEGORY,
        topic: PLANILLA_TOPIC,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (record?.instruction) {
      try {
        const parsed = JSON.parse(record.instruction);
        if (parsed && typeof parsed === 'object') {
          return NextResponse.json({ success: true, data: parsed });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: null, error: error.message });
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
        { success: false, error: 'No autorizado: Se requiere sesión de administración.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Datos de planilla inválidos' }, { status: 400 });
    }

    const existing = await prisma.mirandaBusinessMemory.findFirst({
      where: {
        category: PLANILLA_CATEGORY,
        topic: PLANILLA_TOPIC,
      },
    });

    const serialized = JSON.stringify(body);

    if (existing) {
      await prisma.mirandaBusinessMemory.update({
        where: { id: existing.id },
        data: { instruction: serialized },
      });
    } else {
      await prisma.mirandaBusinessMemory.create({
        data: {
          category: PLANILLA_CATEGORY,
          topic: PLANILLA_TOPIC,
          instruction: serialized,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
