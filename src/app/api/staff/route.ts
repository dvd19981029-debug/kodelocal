import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffRequest, hashPasswordSecure } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

async function isRequestFromAdmin(request: Request): Promise<{ authorized: boolean; isAdmin: boolean }> {
  const { authorized, payload } = verifyStaffRequest(request);
  if (!authorized || !payload) {
    return { authorized: false, isAdmin: false };
  }
  if (String(payload.role || '').toUpperCase() === 'ADMIN') {
    return { authorized: true, isAdmin: true };
  }
  if (payload.id || payload.email) {
    const dbUser = await prisma.staffUser.findFirst({
      where: {
        OR: [
          ...(payload.id ? [{ id: String(payload.id) }] : []),
          ...(payload.email ? [{ email: String(payload.email).toLowerCase().trim() }] : []),
        ],
        isActive: true,
      },
    });
    if (dbUser && String(dbUser.role || '').toUpperCase() === 'ADMIN') {
      return { authorized: true, isAdmin: true };
    }
  }
  return { authorized: true, isAdmin: false };
}

export async function GET(request: Request) {
  try {
    const { authorized, isAdmin } = await isRequestFromAdmin(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

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
    const { authorized, isAdmin } = await isRequestFromAdmin(request);
    if (!authorized || !isAdmin) {
      return NextResponse.json({ success: false, error: 'No autorizado: se requiere rol de Administrador' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, role, cashRegister, isActive, pin, password } = body;

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      return NextResponse.json({ success: false, error: 'Nombre y correo requeridos' }, { status: 400 });
    }

    const cleanPassword = typeof password === 'string' ? password.trim() : '';
    const baseData = {
      name: cleanName,
      email: cleanEmail,
      role: role || 'CASHIER',
      cashRegister: cashRegister || 'Caja Principal',
      isActive: isActive !== false,
      pin: pin ? String(pin).trim() : '1234',
    };

    const isTempId = !id || String(id).startsWith('usr-') || String(id).startsWith('user-');
    const existingById = !isTempId
      ? await prisma.staffUser.findUnique({ where: { id: String(id) } })
      : null;

    let user;
    if (existingById) {
      user = await prisma.staffUser.update({
        where: { id: existingById.id },
        data: {
          ...baseData,
          ...(cleanPassword ? { passwordHash: hashPasswordSecure(cleanPassword) } : {}),
        },
      });
    } else {
      const existingByEmail = await prisma.staffUser.findUnique({ where: { email: cleanEmail } });
      if (existingByEmail) {
        user = await prisma.staffUser.update({
          where: { id: existingByEmail.id },
          data: {
            ...baseData,
            ...(cleanPassword ? { passwordHash: hashPasswordSecure(cleanPassword) } : {}),
          },
        });
      } else {
        user = await prisma.staffUser.create({
          data: {
            ...baseData,
            passwordHash: cleanPassword ? hashPasswordSecure(cleanPassword) : 'GOOGLE_OAUTH_ONLY',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cashRegister: user.cashRegister,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        pin: user.pin || '0000',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { authorized, isAdmin } = await isRequestFromAdmin(request);
    if (!authorized || !isAdmin) {
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


