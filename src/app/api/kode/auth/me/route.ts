import { NextResponse } from 'next/server';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { authorized, payload } = verifyStaffRequest(request);

    if (!authorized || !payload) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: payload.id,
        nombre: payload.name,
        email: payload.email,
        rol: payload.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
}

