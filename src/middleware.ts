import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OPERATIONAL_ROUTES = [
  '/pos',
  '/admin',
  '/bodega',
  '/ventas',
  '/inventario',
  '/logistica',
  '/login',
  '/kode'
];

const OPERATIONAL_API_ROUTES = [
  '/api/shifts',
  '/api/purchases',
  '/api/suppliers',
  '/api/dte',
  '/api/sales',
  '/api/customers',
  '/api/staff',
  '/api/kode',
  '/api/admin',
  '/api/kardex',
  '/api/quotes',
  '/api/wompi/enlaces',
];

const PUBLIC_OPERATIONAL_API_EXCEPTIONS = [
  '/api/kode/auth/login',
  '/api/kode/auth/logout',
  '/api/kode/auth/me',
  '/api/kode/vendedoras',
  '/api/kode/c807/webhook',
  '/api/staff/token',
];

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getEdgeAuthSecret(): Promise<string> {
  const secret = process.env.AUTH_SECRET || process.env.WOMPI_API_SECRET;
  if (secret) return secret;
  if (process.env.DATABASE_URL) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`aromaniak_auth_${process.env.DATABASE_URL}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return 'aromaniak_auth_token_secret_prod_fallback_2026';
}

const KODE_ONLY_EMAILS = new Set([
  'pm3923193@gmail.com',
  'm3923193@gmail.com',
  'dayanajimenezelena7@gmail.com',
]);

async function getStaffTokenPayloadEdge(token?: string | null): Promise<{
  role?: string;
  email?: string;
  name?: string;
  id?: string;
  scope?: string;
} | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, receivedSig] = parts;

  try {
    const secret = await getEdgeAuthSecret();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlToUint8Array(receivedSig);
    const isValidSig = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer as ArrayBuffer,
      encoder.encode(payloadB64)
    );
    if (!isValidSig) return null;

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(payloadJson);
    const graceMs = 30 * 24 * 60 * 60 * 1000;
    if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp + graceMs) {
      return null;
    }
    if (payload.scope !== 'internal_operations') return null;
    return payload;
  } catch {
    return null;
  }
}

function isKodeRestrictedPayload(payload: { role?: string; email?: string } | null): boolean {
  if (!payload) return false;
  if (payload.role === 'KODE_ONLY') return true;
  const emailLower = String(payload.email || '').trim().toLowerCase();
  return KODE_ONLY_EMAILS.has(emailLower);
}

async function verifyStaffTokenEdge(token?: string | null): Promise<boolean> {
  const payload = await getStaffTokenPayloadEdge(token);
  return payload !== null;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    return NextResponse.next();
  }

  const isKodeSubdomain = host.startsWith('kode.') || host.includes('kode.aromaniaksv.com');
  if (isKodeSubdomain) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/kode', request.url));
    }
    if (!pathname.startsWith('/kode') && !pathname.startsWith('/api')) {
      return NextResponse.rewrite(new URL(`/kode${pathname}`, request.url));
    }
  }

  const isPosSubdomain = host.startsWith('pos.');
  const isCustomerDomain = host.includes('aromaniaksv.com') && !isPosSubdomain && !isKodeSubdomain;

  const isOperational = OPERATIONAL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isOperationalApi = OPERATIONAL_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 1. En el subdominio de empleados (pos.aromaniaksv.com)
  if (isPosSubdomain) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    if (!isOperational && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL(`https://aromaniaksv.com${pathname}`, request.url));
    }
  }

  // 2. En el dominio de clientes (aromaniaksv.com), bloquear páginas operativas
  if (isCustomerDomain && isOperational) {
    const redirectRes = NextResponse.redirect(new URL(`https://pos.aromaniaksv.com${pathname}`, request.url));
    redirectRes.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    return redirectRes;
  }

  // 3. En el dominio de clientes (aromaniaksv.com), bloquear APIs operacionales/administrativas
  if (isCustomerDomain && isOperationalApi) {
    return NextResponse.json(
      {
        success: false,
        error: 'Acceso denegado: API reservada exclusivamente para el entorno operativo pos.aromaniaksv.com',
      },
      {
        status: 403,
        headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet' },
      }
    );
  }

  // 4. En el dominio de clientes (aromaniaksv.com), bloquear modificaciones de catálogo (PATCH/POST/DELETE)
  if (isCustomerDomain && pathname.startsWith('/api/products') && request.method !== 'GET') {
    return NextResponse.json(
      {
        success: false,
        error: 'Acceso denegado: Modificación de productos reservada para el entorno operativo pos.aromaniaksv.com',
      },
      {
        status: 403,
        headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet' },
      }
    );
  }

  // 5. PROTECCIÓN CRIPTOGRÁFICA DE RUTAS DE INTERFAZ OPERATIVA (MECANIC OS SECURITY)
  const isProtectedUiRoute = ['/pos', '/admin', '/bodega', '/ventas', '/inventario', '/logistica'].some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedUiRoute) {
    const token = request.cookies.get('kodelocal_staff_token')?.value;
    const payload = await getStaffTokenPayloadEdge(token);
    if (!payload) {
      const loginRedirect = NextResponse.redirect(new URL('/login', request.url));
      loginRedirect.cookies.delete('kodelocal_staff_token');
      loginRedirect.cookies.delete('kode_session_ui');
      return loginRedirect;
    }
    // Usuarios exclusivos de KÖDE (Patricia, Isis, etc.) no pueden acceder a Aromaniak
    if (isKodeRestrictedPayload(payload)) {
      return NextResponse.redirect(new URL('/kode', request.url));
    }
  }

  // 6. PROTECCIÓN CRIPTOGRÁFICA DE APIs OPERATIVAS Y ADMINISTRATIVAS
  const isPublicApiException =
    PUBLIC_OPERATIONAL_API_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    (pathname.startsWith('/api/dte/') && (request.method === 'GET' || request.method === 'HEAD')) ||
    (pathname.startsWith('/api/kode/dte/') && (request.method === 'GET' || request.method === 'HEAD'));

  if (isOperationalApi && !isPublicApiException) {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieToken = request.cookies.get('kodelocal_staff_token')?.value;

    const cookiePayload = await getStaffTokenPayloadEdge(cookieToken);
    const headerPayload = !cookiePayload ? await getStaffTokenPayloadEdge(staffHeaderToken) : cookiePayload;
    const activePayload = !headerPayload ? await getStaffTokenPayloadEdge(bearerToken) : headerPayload;

    if (!activePayload) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Se requiere sesión activa de personal operativo.',
        },
        {
          status: 401,
          headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet' },
        }
      );
    }

    const isKodeAllowedApi =
      pathname.startsWith('/api/kode') ||
      pathname.startsWith('/api/wompi/enlaces') ||
      pathname.startsWith('/api/dte');

    if (isKodeRestrictedPayload(activePayload) && !isKodeAllowedApi) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado: Este usuario tiene acceso exclusivo al sistema KÖDE.',
        },
        {
          status: 403,
          headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet' },
        }
      );
    }
  }

  const response = NextResponse.next();

  // 7. Blindaje absoluto de SEO: Cualquier ruta operativa o del subdominio POS recibe X-Robots-Tag
  if (isPosSubdomain || isOperational || isOperationalApi) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
