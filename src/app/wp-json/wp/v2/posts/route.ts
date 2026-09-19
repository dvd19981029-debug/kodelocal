// src/app/wp-json/wp/v2/posts/route.ts

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

/**
 * GET /wp-json/wp/v2/posts
 * Endpoint compatible con WordPress REST API para consultar artículos existentes.
 */
export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin || 'https://aromaniaksv.com';
    const searchParams = req.nextUrl.searchParams;
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const slug = searchParams.get('slug');

    const where: any = { isPublished: true };
    if (slug) {
      where.slug = slug;
    }

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const totalPages = Math.ceil(total / perPage) || 1;

    const formattedPosts = posts.map((post) => ({
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
    }));

    return NextResponse.json(formattedPosts, {
      status: 200,
      headers: {
        ...wpCorsHeaders,
        'Content-Type': 'application/json',
        'X-WP-Total': String(total),
        'X-WP-TotalPages': String(totalPages),
      },
    });
  } catch (error: any) {
    console.error('Error al obtener posts en WP REST API:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Error interno al consultar artículos.' },
      { status: 500, headers: wpCorsHeaders }
    );
  }
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
        message: 'Disculpa, no tienes autorización para publicar artículos. Verifica tus credenciales de WordPress / Application Password.',
        data: { status: 401 },
      },
      { status: 401, headers: wpCorsHeaders }
    );
  }

  try {
    const origin = req.nextUrl.origin || 'https://aromaniaksv.com';
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
        { status: 400, headers: wpCorsHeaders }
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

    title = decodeHtmlEntities(title);
    const cleanContent = formatContentForBlog(content);
    const finalExcerpt = excerpt.trim()
      ? decodeHtmlEntities(excerpt.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
      : extractExcerpt(cleanContent, 160);
    const slug = slugify(body.slug ? String(body.slug) : title);
    const isPublished = body.status !== 'draft';
    const readingTimeMin = calculateReadingTime(cleanContent);

    // Detección exhaustiva de imagen destacada (campos WP, Holo, Soro o dentro del markdown/HTML)
    const coverImage = await resolveFeaturedImage(body, content);

    // Si la imagen ya fue extraída como portada, evitar duplicarla al inicio del cuerpo
    let finalContent = cleanContent;
    if (coverImage) {
      const escapedUrl = coverImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      finalContent = finalContent.replace(
        new RegExp(`<figure[^>]*><img[^>]+src=["']${escapedUrl}["'][^>]*>.*?</figure>`, 'i'),
        ''
      );
    }

    // Mapeo flexible de categorías para IAs (soporta IDs numéricos de WP, arrays o nombres)
    let categoryName = 'Perfumería Fina';
    const WP_CAT_MAP: Record<number, string> = {
      1: 'Guías & Rendimiento',
      2: 'Tendencias & Selección',
      3: 'Emprendimiento & Mayoreo',
      4: 'Perfumería Fina',
      5: 'Frascos & Envases',
    };

    if (Array.isArray(body.categories) && body.categories.length > 0) {
      const firstCat = body.categories[0];
      if (typeof firstCat === 'number' && WP_CAT_MAP[firstCat]) {
        categoryName = WP_CAT_MAP[firstCat];
      } else if (typeof firstCat === 'string' && firstCat.trim()) {
        categoryName = firstCat.trim();
      }
    } else if (typeof body.category === 'string' && body.category.trim()) {
      categoryName = body.category.trim();
    } else if (typeof body.categories_names === 'string' && body.categories_names.trim()) {
      categoryName = body.categories_names.trim();
    } else if (Array.isArray(body.categories_names) && body.categories_names.length > 0) {
      categoryName = String(body.categories_names[0]).trim();
    }

    // Upsert
    const post = await prisma.blogPost.upsert({
      where: { slug },
      create: {
        slug,
        title: title.trim(),
        content: finalContent,
        excerpt: finalExcerpt,
        coverImage,
        author: body.author_name || 'Equipo Aromaniak',
        category: categoryName,
        metaTitle: `${title.trim()} | Aromaniak SV`,
        metaDescription: finalExcerpt,
        canonicalUrl: `${origin}/blog/${slug}`,
        isPublished,
        publishedAt: new Date(),
        readingTimeMin,
      },
      update: {
        title: title.trim(),
        content: finalContent,
        excerpt: finalExcerpt,
        coverImage: coverImage || undefined,
        isPublished,
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

    // Formato de respuesta estándar de WordPress REST API
    return NextResponse.json(
      {
        id: post.id,
        date: post.createdAt.toISOString(),
        slug: post.slug,
        status: post.isPublished ? 'publish' : 'draft',
        type: 'post',
        link: `${origin}/blog/${post.slug}`,
        title: { rendered: post.title },
        content: { rendered: post.content },
        excerpt: { rendered: post.excerpt },
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
        categories: [1],
      },
      {
        status: 201,
        headers: {
          ...wpCorsHeaders,
          'Content-Type': 'application/json',
          'Location': `${origin}/wp-json/wp/v2/posts/${post.id}`,
        },
      }
    );
  } catch (error: any) {
    console.error('Error en WordPress REST API endpoint:', error);
    return NextResponse.json(
      { code: 'internal_error', message: 'Error interno al procesar el artículo.' },
      { status: 500, headers: wpCorsHeaders }
    );
  }
}
