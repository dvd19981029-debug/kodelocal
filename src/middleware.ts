import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OPERATIONAL_ROUTES = [
  '/pos',
  '/admin',
  '/bodega',
  '/ventas',
  '/inventario',
  '/logistica'
];

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  const isPosSubdomain = host.startsWith('pos.');
  const isCustomerDomain = host.includes('aromaniaksv.com') && !isPosSubdomain;

  const isOperational = OPERATIONAL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 1. En el subdominio de empleados (pos.aromaniaksv.com), la raíz abre directo el Punto de Venta
  if (isPosSubdomain && pathname === '/') {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  // 2. En el dominio de clientes (aromaniaksv.com), bloquear todo acceso a rutas de empleados
  // Redirige al subdominio operativo pos.aromaniaksv.com para aislar completamente el dominio de clientes
  if (isCustomerDomain && isOperational) {
    return NextResponse.redirect(new URL(`https://pos.aromaniaksv.com${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
