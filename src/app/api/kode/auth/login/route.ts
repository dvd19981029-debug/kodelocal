import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffInternalToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, isPin } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Ingresa credenciales o PIN' },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim();
    const cleanPwd = String(password).trim();

    let staffUser = null;

    if (isPin) {
      staffUser = await prisma.staffUser.findFirst({
        where: { email: cleanId, pin: cleanPwd, isActive: true }
      });
    } else {
      // For standard password logic (if they want non-Google passwords in future)
      staffUser = await prisma.staffUser.findFirst({
        where: { email: cleanId, passwordHash: cleanPwd, isActive: true }
      });
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

    const safeToken = createStaffInternalToken(staffUser.role);

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
