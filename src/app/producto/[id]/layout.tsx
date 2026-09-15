import type { Metadata } from 'next';
import { INITIAL_PRODUCTS, ProductItem } from '@/lib/store';
import { prisma } from '@/lib/prisma';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { getFragranceProfile } from '@/lib/fragranceProfiles';

async function getProductForSEO(id: string): Promise<ProductItem | null> {
  const decoded = decodeURIComponent(id || '').toLowerCase().trim();
  const cleanDecoded = decoded.replace(/^prod-/, '').replace(/^esencia-/, '');

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      const dbProd = await prisma.product.findFirst({
        where: {
          OR: [
            { id: decoded },
            { sku: decoded },
            { barcode: decoded },
            ...(cleanDecoded ? [{ sku: cleanDecoded }] : []),
          ],
        },
        include: { category: true },
      });
      if (dbProd) {
        return {
          ...dbProd,
          sku: dbProd.sku || '',
          barcode: dbProd.barcode || '',
          officialName: dbProd.officialName || undefined,
          brand: dbProd.brand || undefined,
          gender: dbProd.gender || undefined,
          description: dbProd.description || undefined,
          puesto: (dbProd as any).puesto || undefined,
          supplier: (dbProd as any).supplier || undefined,
          imageUrl: dbProd.imageUrl || '/images/logo.png',
          minStock: Number(dbProd.minStock || 0),
          isAvailableOnline: Boolean(dbProd.isAvailableOnline),
          unit: dbProd.unit || 'Onza',
          category: dbProd.category?.name || 'Esencias para Perfume',
          price: Number(dbProd.price || 0),
          priceHalfOunce: dbProd.priceHalfOunce != null ? Number(dbProd.priceHalfOunce) : undefined,
          finishedPerfumePrice: dbProd.finishedPerfumePrice != null ? Number(dbProd.finishedPerfumePrice) : undefined,
          cost: Number(dbProd.cost || 0),
          stock: Number(dbProd.stock || 0),
        };
      }
    }
  } catch (err) {
    console.error('Error cargando producto para SEO:', err);
  }

  return INITIAL_PRODUCTS.find(p => {
    const pId = p.id.toLowerCase().trim();
    const pSku = String(p.sku || '').toLowerCase().trim();
    const pBarcode = String(p.barcode || '').toLowerCase().trim();
    const pCleanId = pId.replace(/^prod-/, '').replace(/^esencia-/, '');
    return (
      pId === decoded ||
      pSku === decoded ||
      pBarcode === decoded ||
      (cleanDecoded !== '' && (pCleanId === cleanDecoded || pSku === cleanDecoded))
    );
  }) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForSEO(id);

  if (!product) {
    return {
      title: 'Producto | Aromaniak SV - Perfumería Fina',
      description: 'Catálogo de esencias para perfumería fina, contratipos y materias primas en El Salvador.',
    };
  }

  const profile = getFragranceProfile(product);
  const notesText = profile?.topNotes?.length
    ? `Notas de salida: ${profile.topNotes.join(', ')}. `
    : '';

  const inspiracion = getInspiracionPerfumeName(product);
  const title = `Esencia de Perfume ${product.name} | Aromaniak SV`;
  const description = `Compra esencia concentrada de perfumería fina ${product.name} (${product.officialName || inspiracion || 'Alta Gama'}). ${notesText}Venta por onza y media onza en El Salvador con envíos a todo el país.`;
  const canonical = `https://aromaniaksv.com/producto/${encodeURIComponent(product.id)}`;
  const imageUrl = product.imageUrl
    ? (product.imageUrl.startsWith('http') ? product.imageUrl : `https://aromaniaksv.com${product.imageUrl}`)
    : 'https://aromaniaksv.com/images/logo.png';

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Aromaniak SV',
      locale: 'es_SV',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 600,
          alt: `${product.name} - Esencia de Perfume Aromaniak`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductForSEO(id);

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Esencia de Perfume ${product.name} (${product.officialName || 'Pura'})`,
    description: `Esencia 100% concentrada para perfumería fina inspirada en ${product.brand || 'fragancia fina'}. Disponible por onza y media onza en El Salvador.`,
    image: product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : `https://aromaniaksv.com${product.imageUrl}`) : 'https://aromaniaksv.com/images/logo.png',
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Aromaniak SV',
    },
    offers: {
      '@type': 'Offer',
      url: `https://aromaniaksv.com/producto/${encodeURIComponent(product.id)}`,
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Aromaniak SV',
      },
    },
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
