// src/app/wp-json/wp/v2/media/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isWpAuthorized, wpCorsHeaders } from '@/lib/wp-auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: wpCorsHeaders,
  });
}

/**
 * GET /wp-json/wp/v2/media/[id]
 * Devuelve los detalles de un medio específico por su mediaId.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    const media = await prisma.wpMedia.findFirst({
      where: {
        OR: [
          ...(isNaN(numericId) ? [] : [{ mediaId: numericId }]),
          { postId: id },
        ],
      },
    });

    if (!media) {
      return NextResponse.json(
        {
          code: 'rest_post_invalid_id',
          message: 'Medio no encontrado.',
          data: { status: 404 },
        },
        { status: 404, headers: wpCorsHeaders }
      );
    }

    return NextResponse.json(
      {
        id: media.mediaId,
        date: media.createdAt.toISOString(),
        date_gmt: media.createdAt.toISOString(),
        slug: `media-${media.mediaId}`,
        status: 'inherit',
        type: 'attachment',
        link: media.url,
        title: { rendered: media.title || `Media ${media.mediaId}` },
        author: 1,
        caption: { rendered: '' },
        alt_text: media.title || '',
        media_type: 'image',
        mime_type: media.mimeType || 'image/jpeg',
        source_url: media.url,
        guid: { rendered: media.url },
        media_details: {
          width: 1200,
          height: 800,
          sizes: {
            full: {
              source_url: media.url,
              url: media.url,
              width: 1200,
              height: 800,
              mime_type: media.mimeType || 'image/jpeg',
            },
          },
        },
        post: media.postId || null,
      },
      {
        status: 200,
        headers: {
          ...wpCorsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error al obtener medio por ID:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Error al consultar medio.' },
      { status: 500, headers: wpCorsHeaders }
    );
  }
}

/**
 * POST /wp-json/wp/v2/media/[id]
 * Permite actualizar datos o asociar el medio a un post.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isWpAuthorized(req)) {
    return NextResponse.json(
      {
        code: 'rest_cannot_edit',
        message: 'No autorizado para editar este medio.',
        data: { status: 401 },
      },
      { status: 401, headers: wpCorsHeaders }
    );
  }

  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    const body = await req.json().catch(() => ({}));

    const media = await prisma.wpMedia.findFirst({
      where: {
        OR: [
          ...(isNaN(numericId) ? [] : [{ mediaId: numericId }]),
          { postId: id },
        ],
      },
    });

    if (!media) {
      return NextResponse.json(
        { code: 'rest_post_invalid_id', message: 'Medio no encontrado.' },
        { status: 404, headers: wpCorsHeaders }
      );
    }

    const updated = await prisma.wpMedia.update({
      where: { id: media.id },
      data: {
        title: body.title?.rendered || body.title || media.title,
        postId: body.post ? String(body.post) : media.postId,
      },
    });

    return NextResponse.json(
      {
        id: updated.mediaId,
        link: updated.url,
        source_url: updated.url,
        title: { rendered: updated.title },
        post: updated.postId,
      },
      {
        status: 200,
        headers: {
          ...wpCorsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error al actualizar medio por ID:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Error al actualizar medio.' },
      { status: 500, headers: wpCorsHeaders }
    );
  }
}
