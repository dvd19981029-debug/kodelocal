import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { authorized, payload } = verifyStaffRequest(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const isAdmin = String(payload?.role || '').toUpperCase() === 'ADMIN';

    const staff = await prisma.staffUser.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // Convert to frontend UserAccount format without revealing hash (and only expose PIN to ADMIN)
    const formatted = staff.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      cashRegister: s.cashRegister,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      pin: isAdmin ? (s.pin || '0000') : '****'
    }));

    return NextResponse.json({ success: true, staff: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request, ['ADMIN']);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'No autorizado: se requiere rol de Administrador' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, role, cashRegister, isActive, pin } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Nombre y correo requeridos' }, { status: 400 });
    }

    const data = {
      name,
      email: email.toLowerCase(),
      role: role || 'CASHIER',
      cashRegister: cashRegister || 'Caja Principal',
      isActive: isActive !== false,
      pin: pin || '1234',
      passwordHash: 'GOOGLE_OAUTH_ONLY' // Default dummy hash
    };

    let user;
    if (id && !id.startsWith('user-')) {
      user = await prisma.staffUser.update({
        where: { id },
        data,
      });
    } else {
      // Check existing email
      const existing = await prisma.staffUser.findUnique({ where: { email: data.email } });
      if (existing) {
        user = await prisma.staffUser.update({ where: { id: existing.id }, data });
      } else {
        user = await prisma.staffUser.create({ data });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request, ['ADMIN']);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'No autorizado: se requiere rol de Administrador' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });

    const user = await prisma.staffUser.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 });
    if (user.role === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'No se puede eliminar a un administrador' }, { status: 400 });
    }

    await prisma.staffUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

