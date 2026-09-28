import { NextResponse } from 'next/server';
import { recordVisit } from '@/lib/visits';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let isNewSession = true;
    let referrer = '';
    let device = 'mobile';
    try {
      const body = await request.json();
      if (body) {
        if (typeof body.isNewSession === 'boolean') isNewSession = body.isNewSession;
        if (typeof body.referrer === 'string') referrer = body.referrer;
        if (typeof body.device === 'string') device = body.device;
      }
    } catch {
      // Si el body está vacío, asume nueva sesión
    }

    recordVisit(isNewSession, referrer, device);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
