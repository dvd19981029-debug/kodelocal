import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugify, formatContentForBlog, calculateReadingTime, extractExcerpt } from '@/lib/blog';


/**
 * Valida la autenticación para WordPress REST API
 */
function isWpAuthorized(req: NextRequest): boolean {
  const secret = process.env.BLOG_API_KEY;
  if (!secret) return false;

  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // 1. Bearer Token
    if (authHeader.startsWith('Bearer ') && authHeader.substring(7).trim() === secret) {
      return true;
    }
    // 2. Basic Auth (Username:Password o Application Password)
    if (authHeader.startsWith('Basic ')) {
      try {
        const decoded = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
        const [user, pass] = decoded.split(':');
        if (pass && pass.trim() === secret) return true;
        if (user && user.trim() === secret) return true;
      } catch (e) {
        // Ignorar error de base64
      }
    }
  }

  // 3. Fallback a custom header o query param
  const customHeader = req.headers.get('x-api-key');
  if (customHeader && customHeader.trim() === secret) return true;

  const queryKey = req.nextUrl.searchParams.get('apiKey');
  if (queryKey && queryKey.trim() === secret) return true;

  return false;
}

/**
 * POST /wp-json/wp/v2/posts
 * Endpoint compatible con WordPress REST API para Holo AI y conectores de IA.
 */
export async function POST(req: NextRequest) {
  if (!isWpAuthorized(req)) {
    return NextResponse.json(
      {
        code: 'rest_cannot_create',
        message: 'Disculpa, no tienes autorización para publicar artículos.',
        data: { status: 401 },
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    // Extraer título (soporta { title: "..." } o { title: { raw: "..." } })
    let title = '';
    if (typeof body.title === 'string') {
      title = body.title;
    } else if (body.title && typeof body.title.raw === 'string') {
      title = body.title.raw;
    } else if (body.title && typeof body.title.rendered === 'string') {
      title = body.title.rendered;
    }

    // Extraer contenido
    let content = '';
    if (typeof body.content === 'string') {
      content = body.content;
    } else if (body.content && typeof body.content.raw === 'string') {
      content = body.content.raw;
    } else if (body.content && typeof body.content.rendered === 'string') {
      content = body.content.rendered;
    }

    if (!title.trim() || !content.trim()) {
      return NextResponse.json(
        {
          code: 'rest_missing_callback_param',
          message: 'Faltan parámetros requeridos: title o content.',
          data: { status: 400 },
        },
        { status: 400 }
      );
    }

    // Extraer excerpt
    let excerpt = '';
    if (typeof body.excerpt === 'string') {
      excerpt = body.excerpt;
    } else if (body.excerpt && typeof body.excerpt.raw === 'string') {
      excerpt = body.excerpt.raw;
    } else if (body.excerpt && typeof body.excerpt.rendered === 'string') {
      excerpt = body.excerpt.rendered;
    }

    const cleanContent = formatContentForBlog(content);

    const finalExcerpt = excerpt.trim() ? excerpt.trim() : extractExcerpt(cleanContent, 160);
    const slug = slugify(body.slug ? String(body.slug) : title);
    const isPublished = body.status !== 'draft';
    const readingTimeMin = calculateReadingTime(cleanContent);

    // Upsert
    const post = await prisma.blogPost.upsert({
      where: { slug },
      create: {
        slug,
        title: title.trim(),
        content: cleanContent,
        excerpt: finalExcerpt,
        coverImage: body.featured_media_url || body.coverImage || null,
        author: body.author_name || 'Equipo Aromaniak',
        category: body.categories_names || 'Perfumería',
        metaTitle: `${title.trim()} | Aromaniak SV`,
        metaDescription: finalExcerpt,
        canonicalUrl: `https://aromaniaksv.com/blog/${slug}`,
        isPublished,
        publishedAt: new Date(),
        readingTimeMin,
      },
      update: {
        title: title.trim(),
        content: cleanContent,
        excerpt: finalExcerpt,
        coverImage: body.featured_media_url || body.coverImage || undefined,
        isPublished,
        readingTimeMin,
      },
    });

    // Formato de respuesta estándar de WordPress REST API
    return NextResponse.json(
      {
        id: post.id,
        date: post.createdAt.toISOString(),
        slug: post.slug,
        status: post.isPublished ? 'publish' : 'draft',
        type: 'post',
        link: `https://aromaniaksv.com/blog/${post.slug}`,
        title: { rendered: post.title },
        content: { rendered: post.content },
        excerpt: { rendered: post.excerpt },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error en WordPress REST API endpoint:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Error interno al procesar el artículo.' },
      { status: 500 }
    );
  }
}
