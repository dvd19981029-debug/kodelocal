// src/app/api/blog/posts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { slugify, formatContentForBlog, calculateReadingTime, extractExcerpt } from '@/lib/blog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


/**
 * Valida la clave de autorización para publicación automatizada (Holo AI, Webhooks, SEO Tools).
 */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.BLOG_API_KEY;
  if (!secret) return false;

  const authHeader = req.headers.get('authorization');
  const customHeader = req.headers.get('x-api-key');
  const queryKey = req.nextUrl.searchParams.get('apiKey');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === secret) return true;
  }

  if (customHeader && customHeader.trim() === secret) {
    return true;
  }

  if (queryKey && queryKey.trim() === secret) {
    return true;
  }

  return false;
}

/**
 * GET /api/blog/posts
 * Consulta listado de posts para frontend o integraciones externas.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const category = searchParams.get('category');
    const query = searchParams.get('q');
    const status = searchParams.get('status');

    // Por defecto solo posts publicados, a menos que esté autenticado con la API key
    const authenticated = isAuthorized(req);
    const whereClause: any = {};

    if (!authenticated || status === 'published') {
      whereClause.isPublished = true;
    } else if (status === 'draft') {
      whereClause.isPublished = false;
    }

    if (category && category !== 'Todos') {
      whereClause.category = category;
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where: whereClause }),
      prisma.blogPost.findMany({
        where: whereClause,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          author: true,
          category: true,
          tags: true,
          readingTimeMin: true,
          viewsCount: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error al listar posts del blog:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al consultar el blog' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/posts
 * Endpoint receptor para Holo AI, automatizaciones de SEO y CMS externos.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: 'No autorizado. Se requiere un BLOG_API_KEY válido en Header Authorization o x-api-key.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'El cuerpo de la petición debe ser un objeto JSON válido.' },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      slug: rawSlug,
      excerpt: rawExcerpt,
      coverImage,
      author,
      category,
      tags: rawTags,
      metaTitle,
      metaDescription,
      canonicalUrl,
      isPublished = true,
      publishedAt: rawPublishedAt,
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El campo "title" es obligatorio.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El campo "content" es obligatorio.' },
        { status: 400 }
      );
    }

    // 1. Slug amigable
    const slug = slugify(rawSlug ? String(rawSlug) : title);
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'No se pudo generar un slug válido para este artículo.' },
        { status: 400 }
      );
    }

    // 2. Sanitización y formateo (Markdown a HTML + seguridad XSS)
    const cleanContent = formatContentForBlog(content);


    // 3. Extracto (si no viene, se extrae del contenido)
    const excerpt = rawExcerpt && typeof rawExcerpt === 'string' && rawExcerpt.trim()
      ? rawExcerpt.trim()
      : extractExcerpt(cleanContent, 160);

    // 4. Tags normalizados a string separado por comas
    let tagsStr: string | null = null;
    if (Array.isArray(rawTags)) {
      tagsStr = rawTags.map(t => String(t).trim()).filter(Boolean).join(', ');
    } else if (typeof rawTags === 'string') {
      tagsStr = rawTags.trim();
    }

    // 5. Tiempo de lectura
    const readingTimeMin = calculateReadingTime(cleanContent);

    // 6. Fecha de publicación
    let publishedAt: Date = new Date();
    if (rawPublishedAt) {
      const parsedDate = new Date(rawPublishedAt);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate;
      }
    }

    // 7. Metadatos SEO y Canónica
    const finalMetaTitle = metaTitle && typeof metaTitle === 'string' && metaTitle.trim()
      ? metaTitle.trim()
      : `${title.trim()} | Aromaniak El Salvador`;

    const finalMetaDescription = metaDescription && typeof metaDescription === 'string' && metaDescription.trim()
      ? metaDescription.trim()
      : excerpt;

    const finalCanonicalUrl = canonicalUrl && typeof canonicalUrl === 'string' && canonicalUrl.trim()
      ? canonicalUrl.trim()
      : `https://aromaniaksv.com/blog/${slug}`;

    // 8. Upsert en base de datos (si ya existe por slug se actualiza, si no se crea)
    const post = await prisma.blogPost.upsert({
      where: { slug },
      create: {
        slug,
        title: title.trim(),
        content: cleanContent,
        excerpt,
        coverImage: coverImage && typeof coverImage === 'string' ? coverImage.trim() : null,
        author: author && typeof author === 'string' ? author.trim() : 'Equipo Aromaniak',
        category: category && typeof category === 'string' ? category.trim() : 'Perfumería',
        tags: tagsStr,
        metaTitle: finalMetaTitle,
        metaDescription: finalMetaDescription,
        canonicalUrl: finalCanonicalUrl,
        isPublished: Boolean(isPublished),
        publishedAt,
        readingTimeMin,
      },
      update: {
        title: title.trim(),
        content: cleanContent,
        excerpt,
        coverImage: coverImage && typeof coverImage === 'string' ? coverImage.trim() : undefined,
        author: author && typeof author === 'string' ? author.trim() : undefined,
        category: category && typeof category === 'string' ? category.trim() : undefined,
        tags: tagsStr !== null ? tagsStr : undefined,
        metaTitle: finalMetaTitle,
        metaDescription: finalMetaDescription,
        canonicalUrl: finalCanonicalUrl,
        isPublished: Boolean(isPublished),
        publishedAt,
        readingTimeMin,
      },
    });

    try {
      revalidatePath('/');
      revalidatePath('/blog');
      revalidatePath(`/blog/${slug}`);
      revalidatePath('/sitemap.xml');
    } catch {
      // Ignorar en entornos estáticos
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Artículo procesado exitosamente.',
        post: {
          id: post.id,
          slug: post.slug,
          title: post.title,
          isPublished: post.isPublished,
          publishedAt: post.publishedAt,
          url: `https://aromaniaksv.com/blog/${post.slug}`,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear/actualizar post de blog con IA:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la publicación en base de datos' },
      { status: 500 }
    );
  }
}
