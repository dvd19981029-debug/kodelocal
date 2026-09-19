// src/app/wp-json/wp/v2/posts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { 
  slugify, 
  formatContentForBlog, 
  calculateReadingTime, 
  extractExcerpt, 
  decodeHtmlEntities 
} from '@/lib/blog';
import { resolveFeaturedImage } from '@/lib/wp-media';
import { isWpAuthorized, wpCorsHeaders } from '@/lib/wp-auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: wpCorsHeaders,
  });
}

function formatPostForWp(post: any, origin: string) {
  return {
    id: post.id,
    date: (post.publishedAt || post.createdAt).toISOString(),
    date_gmt: (post.publishedAt || post.createdAt).toISOString(),
    slug: post.slug,
    status: post.isPublished ? 'publish' : 'draft',
    type: 'post',
    link: `${origin}/blog/${post.slug}`,
    title: {
      raw: post.title,
      rendered: post.title,
    },
    content: {
      raw: post.content,
      rendered: post.content,
      protected: false,
    },
    excerpt: {
      raw: post.excerpt || '',
      rendered: post.excerpt ? `<p>${post.excerpt}</p>` : '',
      protected: false,
    },
    author: 1,
    featured_media: 101,
    featured_media_url: post.coverImage || null,
    jetpack_featured_media_url: post.coverImage || null,
    yoast_head_json: {
      og_image: post.coverImage ? [{ url: post.coverImage }] : [],
    },
    _embedded: {
      'wp:featuredmedia': post.coverImage
        ? [
            {
              source_url: post.coverImage,
              media_details: {
                sizes: {
                  full: {
                    source_url: post.coverImage,
                  },
                },
              },
            },
          ]
        : [],
    },
    comment_status: 'closed',
    ping_status: 'closed',
    sticky: false,
    template: '',
    format: 'standard',
    meta: [],
    categories: [1],
    tags: [],
    _links: {
      self: [{ href: `${origin}/wp-json/wp/v2/posts/${post.id}` }],
      collection: [{ href: `${origin}/wp-json/wp/v2/posts` }],
    },
  };
}

/**
 * GET /wp-json/wp/v2/posts/[id]
 * Devuelve un artículo específico por id o slug.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const origin = req.nextUrl.origin || 'https://aromaniaksv.com';
    const { id } = await params;

    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!post) {
      return NextResponse.json(
        {
          code: 'rest_post_invalid_id',
          message: 'Artículo no encontrado.',
          data: { status: 404 },
        },
        { status: 404, headers: wpCorsHeaders }
      );
    }

    return NextResponse.json(formatPostForWp(post, origin), {
      status: 200,
      headers: {
        ...wpCorsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error al obtener post por id:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Error al consultar artículo.' },
      { status: 500, headers: wpCorsHeaders }
    );
  }
}

/**
 * POST /wp-json/wp/v2/posts/[id]
 * Permite actualizar o asociar imágenes destacadas a un artículo ya creado por Soro/Holo AI.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

async function handleUpdate(
  req: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  if (!isWpAuthorized(req)) {
    return NextResponse.json(
      {
        code: 'rest_cannot_edit',
        message: 'No autorizado para editar este artículo.',
        data: { status: 401 },
      },
      { status: 401, headers: wpCorsHeaders }
    );
  }

  try {
    const origin = req.nextUrl.origin || 'https://aromaniaksv.com';
    const { id } = await paramsPromise;
    const body = await req.json().catch(() => ({}));

    const existingPost = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          code: 'rest_post_invalid_id',
          message: 'Artículo no encontrado para actualizar.',
          data: { status: 404 },
        },
        { status: 404, headers: wpCorsHeaders }
      );
    }

    const updateData: any = {};

    // 1. Título
    let titleStr: string | null = null;
    if (typeof body.title === 'string') {
      titleStr = body.title;
    } else if (body.title && typeof body.title.raw === 'string') {
      titleStr = body.title.raw;
    } else if (body.title && typeof body.title.rendered === 'string') {
      titleStr = body.title.rendered;
    }
    if (titleStr && titleStr.trim()) {
      updateData.title = decodeHtmlEntities(titleStr.trim());
    }

    // 2. Contenido
    let contentStr: string | null = null;
    if (typeof body.content === 'string') {
      contentStr = body.content;
    } else if (body.content && typeof body.content.raw === 'string') {
      contentStr = body.content.raw;
    } else if (body.content && typeof body.content.rendered === 'string') {
      contentStr = body.content.rendered;
    }
    if (contentStr && contentStr.trim()) {
      updateData.content = formatContentForBlog(contentStr);
      updateData.readingTimeMin = calculateReadingTime(updateData.content);
    }

    // 3. Extracto
    let excerptStr: string | null = null;
    if (typeof body.excerpt === 'string') {
      excerptStr = body.excerpt;
    } else if (body.excerpt && typeof body.excerpt.raw === 'string') {
      excerptStr = body.excerpt.raw;
    } else if (body.excerpt && typeof body.excerpt.rendered === 'string') {
      excerptStr = body.excerpt.rendered;
    }
    if (excerptStr && excerptStr.trim()) {
      updateData.excerpt = decodeHtmlEntities(
        excerptStr.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      );
    }

    // 4. Estado de publicación
    if (body.status !== undefined) {
      updateData.isPublished = body.status !== 'draft';
    }

    // 5. Imagen destacada (resolución exhaustiva de medios)
    const resolvedCover = await resolveFeaturedImage(
      body,
      contentStr || existingPost.content
    );
    if (resolvedCover) {
      updateData.coverImage = resolvedCover;
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: existingPost.id },
      data: updateData,
    });

    try {
      revalidatePath('/');
      revalidatePath('/blog');
      revalidatePath(`/blog/${updatedPost.slug}`);
      revalidatePath('/sitemap.xml');
    } catch {
      // Ignorar en entornos estáticos
    }

    return NextResponse.json(formatPostForWp(updatedPost, origin), {
      status: 200,
      headers: {
        ...wpCorsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar artículo por ID:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Error interno al actualizar el artículo.' },
      { status: 500, headers: wpCorsHeaders }
    );
  }
}

/**
 * DELETE /wp-json/wp/v2/posts/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isWpAuthorized(req)) {
    return NextResponse.json(
      { code: 'rest_cannot_delete', message: 'No autorizado.', data: { status: 401 } },
      { status: 401, headers: wpCorsHeaders }
    );
  }

  try {
    const origin = req.nextUrl.origin || 'https://aromaniaksv.com';
    const { id } = await params;

    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!post) {
      return NextResponse.json(
        { code: 'rest_post_invalid_id', message: 'Artículo no encontrado.' },
        { status: 404, headers: wpCorsHeaders }
      );
    }

    await prisma.blogPost.delete({ where: { id: post.id } });

    try {
      revalidatePath('/');
      revalidatePath('/blog');
      revalidatePath('/sitemap.xml');
    } catch {}

    return NextResponse.json(
      {
        deleted: true,
        previous: formatPostForWp(post, origin),
      },
      { status: 200, headers: wpCorsHeaders }
    );
  } catch (error: any) {
    console.error('Error al eliminar artículo:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Error al eliminar artículo.' },
      { status: 500, headers: wpCorsHeaders }
    );
  }
}
