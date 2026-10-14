import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });

  const clearOpts = {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set('kodelocal_staff_token', '', { ...clearOpts, httpOnly: true });
  response.cookies.set('kode_session_ui', '', clearOpts);
  response.cookies.set('kode_session', '', clearOpts);

  return response;
}

