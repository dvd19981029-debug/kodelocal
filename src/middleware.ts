import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Detección de subdominio pos.aromaniaksv.com o pos.localhost
  const isPosSubdomain = host.startsWith('pos.');

  if (isPosSubdomain && pathname === '/') {
    // Redirigir la raíz del subdominio pos directamente al Punto de Venta
    return NextResponse.redirect(new URL('/pos', request.url));
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
