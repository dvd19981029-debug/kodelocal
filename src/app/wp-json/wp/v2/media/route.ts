// src/app/wp-json/wp/v2/media/route.ts

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
 * POST /wp-json/wp/v2/media
 * Soporta carga o recepción de referencias multimedia desde conectores como Holo AI.
 */
export async function POST(req: NextRequest) {
  if (!isWpAuthorized(req)) {
    return NextResponse.json(
      {
        code: 'rest_cannot_create',
        message: 'No autorizado para subir contenido multimedia.',
        data: { status: 401 },
      },
      {
        status: 401,
        headers: wpCorsHeaders,
      }
    );
  }

  const origin = req.nextUrl.origin || 'https://aromaniaksv.com';
  const mediaId = Math.floor(Math.random() * 80000) + 1000;
  const now = new Date().toISOString();

  return NextResponse.json(
    {
      id: mediaId,
      date: now,
      slug: `media-${mediaId}`,
      type: 'attachment',
      link: `${origin}/images/hero_perfume_art.png`,
      title: { rendered: `Media ${mediaId}` },
      author: 1,
      source_url: `${origin}/images/hero_perfume_art.png`,
      media_details: {
        width: 1200,
        height: 800,
        file: 'hero_perfume_art.png',
      },
    },
    {
      status: 201,
      headers: {
        ...wpCorsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
