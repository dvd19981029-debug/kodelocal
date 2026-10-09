import { NextResponse } from 'next/server';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieHeader = request.headers.get('cookie') || '';
    const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
    const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

    let isStaff = verifyStaffInternalToken(staffHeaderToken) || 
                  verifyStaffInternalToken(bearerToken) || 
                  verifyStaffInternalToken(staffCookieToken);

    if (!isStaff) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Se requiere autenticacion de administrador.' }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    let isStaff = verifyStaffInternalToken(staffHeaderToken) || 
                  verifyStaffInternalToken(bearerToken) || 
                  verifyStaffInternalToken(staffCookieToken);

    if (!isStaff) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Se requiere autenticacion de administrador.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, contactPerson, nit, nrc, phone, email, address, category, creditDays, notes } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'El nombre del proveedor es obligatorio' }, { status: 400 });
    }

    let supplier;
    if (id && !id.startsWith('SUP-')) {
      supplier = await prisma.supplier.update({
        where: { id },
        data: { name, contactPerson, nit, nrc, phone, email, address, category: category || 'Esencias & Fragancias', creditDays: Number(creditDays || 0), notes },
      });
    } else {
      supplier = await prisma.supplier.create({
        data: { name, contactPerson, nit, nrc, phone, email, address, category: category || 'Esencias & Fragancias', creditDays: Number(creditDays || 0), notes },
      });
    }

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
