// src/app/wp-json/wp/v2/users/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { isWpAuthorized, wpCorsHeaders } from '@/lib/wp-auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: wpCorsHeaders,
  });
}

/**
 * GET /wp-json/wp/v2/users/me
 * Endpoint estándar de WordPress para verificar credenciales y permisos del usuario conectado.
 */
export async function GET(req: NextRequest) {
  if (!isWpAuthorized(req)) {
    return NextResponse.json(
      {
        code: 'rest_not_logged_in',
        message: 'No tienes autorización para acceder a este recurso. Verifica tu Application Password o token.',
        data: { status: 401 },
      },
      {
        status: 401,
        headers: wpCorsHeaders,
      }
    );
  }

  const origin = req.nextUrl.origin || 'https://aromaniaksv.com';

  const userMeData = {
    id: 1,
    name: 'Aromaniak Admin',
    url: origin,
    description: 'Administrador de Contenidos y Blog Editorial de Aromaniak SV',
    link: `${origin}/blog`,
    slug: 'aromaniak-admin',
    avatar_urls: {
      '24': `${origin}/icon.png`,
      '48': `${origin}/icon.png`,
      '96': `${origin}/icon.png`,
    },
    meta: [],
    roles: ['administrator'],
    capabilities: {
      publish_posts: true,
      edit_posts: true,
      delete_posts: true,
      upload_files: true,
      manage_categories: true,
      administrator: true,
    },
    extra_capabilities: {
      administrator: true,
    },
    _links: {
      self: [{ href: `${origin}/wp-json/wp/v2/users/me` }],
      collection: [{ href: `${origin}/wp-json/wp/v2/users` }],
    },
  };

  return NextResponse.json(userMeData, {
    status: 200,
    headers: {
      ...wpCorsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
