import { NextResponse } from 'next/server';
import { recordVisit } from '@/lib/visits';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let isNewSession = true;
    try {
      const body = await request.json();
      if (body && typeof body.isNewSession === 'boolean') {
        isNewSession = body.isNewSession;
      }
    } catch {
      // Si el body está vacío, asume nueva sesión
    }

    recordVisit(isNewSession);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
