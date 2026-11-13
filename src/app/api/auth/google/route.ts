import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Falta configurar GOOGLE_CLIENT_ID en el servidor.' }, { status: 500 });
  }

  // Detect base URL dynamically for the callback
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const mode = url.searchParams.get('mode');
  const rawReturnTo = url.searchParams.get('returnTo') || '/';
  const safeReturnTo =
    rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');

  if (mode === 'customer') {
    const statePayload = Buffer.from(
      JSON.stringify({ mode: 'customer', returnTo: safeReturnTo })
    ).toString('base64url');
    authUrl.searchParams.set('state', statePayload);
  }

  return NextResponse.redirect(authUrl.toString());
}
