import type { MetadataRoute } from 'next';
import { INITIAL_PRODUCTS } from '@/lib/store';
import { prisma } from '@/lib/prisma';

import { getProductUrl } from '@/lib/productUrl';

export const revalidate = 86400; // Regenerar el sitemap al menos una vez cada 24 horas

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aromaniaksv.com';

  // Obtener productos de la base de datos con fallback a INITIAL_PRODUCTS
  let productEntries: Array<{ id: string; sku?: string | null; categoryName?: string | null; updatedAt?: Date }> = [];
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      const dbProducts = await prisma.product.findMany({
        select: { id: true, sku: true, category: { select: { name: true } }, updatedAt: true },
      });
      if (dbProducts.length > 0) {
        productEntries = dbProducts.map(p => ({
          id: p.id,
          sku: p.sku,
          categoryName: p.category?.name,
          updatedAt: p.updatedAt,
        }));
      }
    }
  } catch (err) {
    console.error('Error cargando productos para sitemap desde BD:', err);
  }

  // Si no se pudieron cargar de BD, usar el catálogo estático para garantizar indexación completa
  if (productEntries.length === 0) {
    productEntries = INITIAL_PRODUCTS.map(p => ({
      id: p.id,
      sku: p.sku,
      categoryName: p.category,
    }));
  }

  const productUrls: MetadataRoute.Sitemap = productEntries.map((p) => ({
    url: `${baseUrl}${getProductUrl({ id: p.id, sku: p.sku, category: p.categoryName })}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Obtener artículos publicados del blog para indexación inmediata en Google
  let blogUrls: MetadataRoute.Sitemap = [];
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      const dbPosts = await prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true, publishedAt: true },
      });
      blogUrls = dbPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error('Error cargando posts de blog para sitemap:', err);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...productUrls,
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    ...blogUrls,
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/politica-privacidad`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ];
}

