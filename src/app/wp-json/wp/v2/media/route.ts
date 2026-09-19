// src/app/wp-json/wp/v2/media/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isWpAuthorized, wpCorsHeaders } from '@/lib/wp-auth';
import { uploadMediaToStorage } from '@/lib/wp-media';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: wpCorsHeaders,
  });
}

/**
 * GET /wp-json/wp/v2/media
 * Devuelve listado de medios en formato compatible con WordPress REST API.
 */
export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin || 'https://aromaniaksv.com';
    const mediaList = await prisma.wpMedia.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted = mediaList.map((m) => ({
      id: m.mediaId,
      date: m.createdAt.toISOString(),
      date_gmt: m.createdAt.toISOString(),
      slug: `media-${m.mediaId}`,
      status: 'inherit',
      type: 'attachment',
      link: m.url,
      title: { rendered: m.title || `Media ${m.mediaId}` },
      author: 1,
      caption: { rendered: '' },
      alt_text: m.title || '',
      media_type: 'image',
      mime_type: m.mimeType || 'image/jpeg',
      source_url: m.url,
      guid: { rendered: m.url },
      media_details: {
        width: 1200,
        height: 800,
        sizes: {
          full: {
            source_url: m.url,
            url: m.url,
            width: 1200,
            height: 800,
            mime_type: m.mimeType || 'image/jpeg',
          },
        },
      },
      post: m.postId || null,
    }));

    return NextResponse.json(formatted, {
      status: 200,
      headers: {
        ...wpCorsHeaders,
        'Content-Type': 'application/json',
        'X-WP-Total': String(formatted.length),
        'X-WP-TotalPages': '1',
      },
    });
  } catch (error: any) {
    console.error('Error al consultar medios en /wp-json/wp/v2/media:', error);
    return NextResponse.json([], { status: 200, headers: wpCorsHeaders });
  }
}

/**
 * POST /wp-json/wp/v2/media
 * Recibe archivos multimedia o referencias de URLs enviadas por Soro, Holo AI u otros conectores WP.
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
  const contentType = req.headers.get('content-type') || '';
  const postParam = req.nextUrl.searchParams.get('post');

  let imageUrl = '';
  let filename = `media_${Date.now()}.jpg`;
  let mimeType = 'image/jpeg';
  let title = `Media ${Date.now()}`;
  let attachedPostId: string | null = postParam ? String(postParam).trim() : null;

  try {
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      const postField = formData.get('post') || formData.get('postId');
      const titleField = formData.get('title') || formData.get('caption');
      const directUrl = formData.get('source_url') || formData.get('url') || formData.get('src');

      if (postField) {
        attachedPostId = String(postField).trim();
      }
      if (titleField && typeof titleField === 'string') {
        title = titleField.trim();
      }

      if (typeof directUrl === 'string' && directUrl.trim().startsWith('http')) {
        imageUrl = directUrl.trim();
      } else if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const fileObj = file as File;
        filename = fileObj.name || filename;
        mimeType = fileObj.type || mimeType;
        const arrayBuf = await fileObj.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        imageUrl = await uploadMediaToStorage(buffer, filename, mimeType);
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      const directUrl =
        body.source_url ||
        body.url ||
        body.src ||
        body.link ||
        body.image_url ||
        body.file;

      if (typeof directUrl === 'string' && directUrl.trim().startsWith('http')) {
        imageUrl = directUrl.trim();
      }
      if (body.post || body.postId) {
        attachedPostId = String(body.post || body.postId).trim();
      }
      if (body.title?.rendered || body.title) {
        title = String(body.title?.rendered || body.title).trim();
      }
    } else if (
      contentType.startsWith('image/') ||
      contentType === 'application/octet-stream'
    ) {
      mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
      const disposition = req.headers.get('content-disposition') || '';
      const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        filename = match[1];
      }
      const arrayBuf = await req.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      imageUrl = await uploadMediaToStorage(buffer, filename, mimeType);
    }

    // Si aún no se resolvió una imagen válida, usar fallback seguro
    if (!imageUrl || !imageUrl.startsWith('http')) {
      imageUrl = `${origin}/images/promo/banner_aromas.webp`;
    }

    const mediaId = Math.floor(Date.now() / 1000) % 2000000000;
    const now = new Date();

    // Guardar en tabla persistente WpMedia
    await prisma.wpMedia.upsert({
      where: { mediaId },
      create: {
        mediaId,
        url: imageUrl,
        title,
        mimeType,
        postId: attachedPostId,
      },
      update: {
        url: imageUrl,
        title,
        mimeType,
        postId: attachedPostId,
      },
    });

    // Si se indicó un post asociado, actualizar su portada de inmediato
    if (attachedPostId) {
      try {
        const postToUpdate = await prisma.blogPost.findFirst({
          where: {
            OR: [
              { id: attachedPostId },
              { slug: attachedPostId },
            ],
          },
        });

        if (postToUpdate) {
          await prisma.blogPost.update({
            where: { id: postToUpdate.id },
            data: { coverImage: imageUrl },
          });

          revalidatePath('/');
          revalidatePath('/blog');
          revalidatePath(`/blog/${postToUpdate.slug}`);
        }
      } catch (err) {
        console.error('Error asociando portada a BlogPost:', err);
      }
    }

    return NextResponse.json(
      {
        id: mediaId,
        date: now.toISOString(),
        date_gmt: now.toISOString(),
        slug: `media-${mediaId}`,
        status: 'inherit',
        type: 'attachment',
        link: imageUrl,
        title: { rendered: title },
        author: 1,
        caption: { rendered: '' },
        alt_text: title,
        media_type: 'image',
        mime_type: mimeType,
        source_url: imageUrl,
        guid: { rendered: imageUrl },
        media_details: {
          width: 1200,
          height: 800,
          file: filename,
          sizes: {
            full: {
              file: filename,
              width: 1200,
              height: 800,
              mime_type: mimeType,
              source_url: imageUrl,
            },
          },
        },
        post: attachedPostId,
      },
      {
        status: 201,
        headers: {
          ...wpCorsHeaders,
          'Content-Type': 'application/json',
          'Location': `${origin}/wp-json/wp/v2/media/${mediaId}`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error procesando subida de medio en /wp-json/wp/v2/media:', error);
    return NextResponse.json(
      {
        code: 'internal_error',
        message: 'Error al procesar el archivo multimedia.',
      },
      { status: 500, headers: wpCorsHeaders }
    );
  }
}
