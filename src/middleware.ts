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
  '/api/kode'
];

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

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
    // Si entran a la raíz de pos.aromaniaksv.com, abrir directo el POS
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    // Si intentan entrar a páginas de tienda (ej: /checkout) en el subdominio pos, mandar a la tienda oficial
    // (no redirigir llamadas /api)
    if (!isOperational && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL(`https://aromaniaksv.com${pathname}`, request.url));
    }
  }

  // 2. En el dominio de clientes (aromaniaksv.com), bloquear páginas operativas
  // Redirige al subdominio operativo pos.aromaniaksv.com con cabecera noindex
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
        headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet' }
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
        headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet' }
      }
    );
  }

  const response = NextResponse.next();

  // 5. Blindaje absoluto de SEO: Cualquier ruta operativa o del subdominio POS recibe X-Robots-Tag
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
