import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStaffInternalToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent('Google login cancelado')}`);
    }

    if (!code) {
      return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent('Código de autorización faltante')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${url.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent('Google Auth no configurado en el servidor')}`);
    }

    // Intercambiar el código por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent('Fallo al verificar con Google')}`);
    }

    // Decodificar el id_token (JWT de Google)
    // El id_token tiene 3 partes base64, la segunda es el payload.
    const payloadB64 = tokenData.id_token.split('.')[1];
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const googleProfile = JSON.parse(payloadStr);

    const email = googleProfile.email.toLowerCase();

    // Buscar si el empleado existe
    const staffUser = await prisma.staffUser.findUnique({
      where: { email },
    });

    if (!staffUser || !staffUser.isActive) {
      // Usuario no autorizado
      return NextResponse.redirect(`${url.origin}/login?error=${encodeURIComponent(`El correo ${email} no tiene acceso operativo autorizado.`)}`);
    }

    // Actualizar ultimo login
    await prisma.staffUser.update({
      where: { id: staffUser.id },
      data: { lastLogin: new Date() }
    });

    // Crear el token seguro interno
    const token = createStaffInternalToken(staffUser.role);

    // Redirigir según el rol
    const targetUrl = staffUser.role === 'ADMIN' ? '/admin' : '/pos';
    const response = NextResponse.redirect(`${url.origin}${targetUrl}`);

    // Sellar sesión con cookie HTTPOnly
    response.cookies.set('kodelocal_staff_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Cookie pública solo para la UI (nombre, rol) no usable para APIs
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
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    return NextResponse.redirect(`${new URL(request.url).origin}/login?error=${encodeURIComponent('Error interno del servidor al autenticar')}`);
  }
}
