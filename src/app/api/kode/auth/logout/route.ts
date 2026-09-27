import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });

  response.cookies.set('kode_session', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
