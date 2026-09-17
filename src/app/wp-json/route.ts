// src/app/wp-json/route.ts

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
 * GET /wp-json
 * Punto de entrada y descubrimiento de WordPress REST API.
 * Indispensable para que clientes como Holo AI reconozcan el sitio como WordPress.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || 'https://aromaniaksv.com';

  const discoveryData = {
    name: 'Aromaniak SV',
    description: 'Distribuidora de Esencias Perfumería Fina en El Salvador',
    url: origin,
    home: origin,
    gmt_offset: '-6',
    timezone_string: 'America/El_Salvador',
    namespaces: ['wp/v2'],
    authentication: {
      'application_passwords': {
        endpoints: {
          authorization: `${origin}/wp-admin/authorize-application.php`,
        },
      },
    },
    routes: {
      '/': {
        namespace: '',
        methods: ['GET'],
        endpoints: [{ methods: ['GET'], args: {} }],
        _links: { self: [{ href: `${origin}/wp-json/` }] },
      },
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
      help: [{ href: 'https://developer.wordpress.org/rest-api/' }],
    },
  };

  return NextResponse.json(discoveryData, {
    status: 200,
    headers: {
      ...wpCorsHeaders,
      'Content-Type': 'application/json',
      'Link': `<${origin}/wp-json/>; rel="https://api.w.org/"`,
    },
  });
}
