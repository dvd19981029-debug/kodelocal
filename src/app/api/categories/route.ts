import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';
import { PERFUME_CATEGORIES } from '@/lib/store';

export const dynamic = 'force-dynamic';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET() {
  try {
    const dbCats = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const catSet = new Set<string>(PERFUME_CATEGORIES);
    for (const c of dbCats) {
      if (c.name && c.name.trim()) {
        catSet.add(c.name.trim());
      }
    }

    return NextResponse.json({
      success: true,
      categories: Array.from(catSet),
      records: dbCats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: true, categories: PERFUME_CATEGORIES, error: error.message },
      { status: 200 }
    );
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
    const rawName = String(body.name || '').trim();
    if (!rawName) {
      return NextResponse.json({ success: false, error: 'El nombre de la categoría es obligatorio' }, { status: 400 });
    }

    const slug = slugify(rawName) || `cat-${Date.now()}`;

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ slug }, { name: { equals: rawName, mode: 'insensitive' } }],
      },
    });

    const category = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: { name: rawName },
        })
      : await prisma.category.create({
          data: {
            name: rawName,
            slug,
          },
        });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let name = searchParams.get('name');
    if (!name) {
      const body = await request.json().catch(() => ({}));
      name = body.name;
    }

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 });
    }

    await prisma.category.deleteMany({
      where: {
        name: { equals: String(name).trim(), mode: 'insensitive' },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
