import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('kode_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    const userData = JSON.parse(sessionCookie.value);
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: userData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
}
