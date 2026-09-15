import type { MetadataRoute } from 'next';
import { INITIAL_PRODUCTS } from '@/lib/store';
import { prisma } from '@/lib/prisma';

export const revalidate = 86400; // Regenerar el sitemap al menos una vez cada 24 horas

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://aromaniaksv.com';

  // Obtener productos de la base de datos de Supabase con fallback a INITIAL_PRODUCTS
  let productEntries: Array<{ id: string; updatedAt?: Date }> = [];
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      const dbProducts = await prisma.product.findMany({
        select: { id: true, updatedAt: true },
      });
      if (dbProducts.length > 0) {
        productEntries = dbProducts;
      }
    }
  } catch (err) {
    console.error('Error cargando productos para sitemap desde BD:', err);
  }

  // Si no se pudieron cargar de BD, usar el catálogo estático para garantizar indexación completa
  if (productEntries.length === 0) {
    productEntries = INITIAL_PRODUCTS.map(p => ({ id: p.id }));
  }

  const productUrls: MetadataRoute.Sitemap = productEntries.map((p) => ({
    url: `${baseUrl}/producto/${encodeURIComponent(p.id)}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...productUrls,
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
