// src/app/wp-json/wp/v2/categories/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/blog';
import { isWpAuthorized, wpCorsHeaders } from '@/lib/wp-auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: wpCorsHeaders,
  });
}

const WP_DEFAULT_CATEGORIES = [
  { id: 1, name: 'Guías & Rendimiento', slug: 'guias-rendimiento', description: 'Técnicas de fijación, maceración y formulación de perfumes' },
  { id: 2, name: 'Tendencias & Selección', slug: 'tendencias-seleccion', description: 'Novedades de la perfumería y fragancias de inspiración olfativa' },
  { id: 3, name: 'Emprendimiento & Mayoreo', slug: 'emprendimiento-mayoreo', description: 'Negocio de perfumería, precios mayoristas y márgenes' },
  { id: 4, name: 'Perfumería Fina', slug: 'perfumeria-fina', description: 'Familias olfativas, notas y esencias 100% puras' },
  { id: 5, name: 'Frascos & Envases', slug: 'frascos-envases', description: 'Botes de vidrio, atomizadores de lujo y empaque' },
];

/**
 * GET /wp-json/wp/v2/categories
 * Retorna las categorías en formato WordPress REST API para Holo AI y conectores.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || 'https://aromaniaksv.com';

  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { category: true },
    });

    const countsMap = new Map<string, number>();
    posts.forEach((p) => {
      if (p.category) {
        countsMap.set(p.category, (countsMap.get(p.category) || 0) + 1);
      }
    });

    const allCategoryNames = new Set([
      ...WP_DEFAULT_CATEGORIES.map((c) => c.name),
      ...Array.from(countsMap.keys()),
    ]);

    let idCounter = 1;
    const responseCategories = Array.from(allCategoryNames).map((catName) => {
      const existingDef = WP_DEFAULT_CATEGORIES.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      );
      const catId = existingDef ? existingDef.id : 10 + idCounter++;
      const catSlug = existingDef ? existingDef.slug : slugify(catName);
      const catDesc = existingDef ? existingDef.description : `Artículos sobre ${catName}`;
      const count = countsMap.get(catName) || 0;

      return {
        id: catId,
        count,
        description: catDesc,
        link: `${origin}/blog?category=${encodeURIComponent(catName)}`,
        name: catName,
        slug: catSlug,
        taxonomy: 'category',
        parent: 0,
        meta: [],
        _links: {
          self: [{ href: `${origin}/wp-json/wp/v2/categories/${catId}` }],
          collection: [{ href: `${origin}/wp-json/wp/v2/categories` }],
        },
      };
    });

    return NextResponse.json(responseCategories, {
      status: 200,
      headers: {
        ...wpCorsHeaders,
        'Content-Type': 'application/json',
        'X-WP-Total': String(responseCategories.length),
        'X-WP-TotalPages': '1',
      },
    });
  } catch (error) {
    console.error('Error al obtener categorías WP REST:', error);
    const fallback = WP_DEFAULT_CATEGORIES.map((c) => ({
      id: c.id,
      count: 1,
      description: c.description,
      link: `${origin}/blog?category=${encodeURIComponent(c.name)}`,
      name: c.name,
      slug: c.slug,
      taxonomy: 'category',
      parent: 0,
      meta: [],
    }));
    return NextResponse.json(fallback, {
      status: 200,
      headers: {
        ...wpCorsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * POST /wp-json/wp/v2/categories
 * Permite a una IA registrar una nueva categoría.
 */
export async function POST(req: NextRequest) {
  if (!isWpAuthorized(req)) {
    return NextResponse.json(
      { code: 'rest_cannot_create', message: 'No autorizado.', data: { status: 401 } },
      { status: 401, headers: wpCorsHeaders }
    );
  }

  try {
    const origin = req.nextUrl.origin || 'https://aromaniaksv.com';
    const body = await req.json();
    const name = (body.name || '').trim();
    if (!name) {
      return NextResponse.json(
        { code: 'rest_missing_param', message: 'El nombre de categoría es requerido.' },
        { status: 400, headers: wpCorsHeaders }
      );
    }

    const newCat = {
      id: Math.floor(Math.random() * 9000) + 1000,
      count: 0,
      description: body.description || `Artículos sobre ${name}`,
      link: `${origin}/blog?category=${encodeURIComponent(name)}`,
      name,
      slug: slugify(name),
      taxonomy: 'category',
      parent: 0,
      meta: [],
    };

    return NextResponse.json(newCat, {
      status: 201,
      headers: {
        ...wpCorsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: 'rest_error', message: err.message || 'Error al procesar categoría' },
      { status: 500, headers: wpCorsHeaders }
    );
  }
}
