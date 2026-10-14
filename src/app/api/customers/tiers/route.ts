import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const tiers = await prisma.customerTier.findMany({
      orderBy: { discountPct: 'asc' },
    });
    return NextResponse.json({ success: true, tiers });
  } catch (error: any) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || body.discountPct === undefined) {
       return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
    }
    const data = {
       name: body.name,
       discountPct: Number(body.discountPct),
       badgeColor: body.badgeColor || '#6366f1',
    };
    let tier;
    if (body.id) {
       tier = await prisma.customerTier.update({ where: { id: body.id }, data });
    } else {
       tier = await prisma.customerTier.create({ data });
    }
    return NextResponse.json({ success: true, tier });
  } catch (error: any) {
    console.error('Error saving tier:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

