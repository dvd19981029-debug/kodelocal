// src/app/wp-json/wp/v2/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { wpCorsHeaders } from '@/lib/wp-auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: wpCorsHeaders,
  });
}

/**
 * GET /wp-json/wp/v2
 * Descripción del espacio de nombres wp/v2 para clientes WordPress REST API.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || 'https://aromaniaksv.com';

  const namespaceData = {
    namespace: 'wp/v2',
    routes: {
      '/wp/v2': {
        namespace: 'wp/v2',
        methods: ['GET'],
        endpoints: [{ methods: ['GET'], args: {} }],
        _links: { self: [{ href: `${origin}/wp-json/wp/v2` }] },
      },
      '/wp/v2/posts': {
        namespace: 'wp/v2',
        methods: ['GET', 'POST'],
        endpoints: [
          { methods: ['GET'], args: {} },
          { methods: ['POST'], args: {} },
        ],
        _links: { self: [{ href: `${origin}/wp-json/wp/v2/posts` }] },
      },
      '/wp/v2/categories': {
        namespace: 'wp/v2',
        methods: ['GET', 'POST'],
        endpoints: [
          { methods: ['GET'], args: {} },
          { methods: ['POST'], args: {} },
        ],
        _links: { self: [{ href: `${origin}/wp-json/wp/v2/categories` }] },
      },
      '/wp/v2/users/me': {
        namespace: 'wp/v2',
        methods: ['GET'],
        endpoints: [{ methods: ['GET'], args: {} }],
        _links: { self: [{ href: `${origin}/wp-json/wp/v2/users/me` }] },
      },
      '/wp/v2/media': {
        namespace: 'wp/v2',
        methods: ['POST'],
        endpoints: [{ methods: ['POST'], args: {} }],
        _links: { self: [{ href: `${origin}/wp-json/wp/v2/media` }] },
      },
    },
    _links: {
      up: [{ href: `${origin}/wp-json/` }],
    },
  };

  return NextResponse.json(namespaceData, {
    status: 200,
    headers: {
      ...wpCorsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
