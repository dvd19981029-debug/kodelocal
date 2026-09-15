import type { Metadata } from 'next';
import { INITIAL_PRODUCTS, ProductItem } from '@/lib/store';
import { prisma } from '@/lib/prisma';
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
      title: 'Esencias de Perfumería Fina & Insumos | Aromaniak SV',
      description: 'Venta de esencias de perfumería fina, aromas químicos, botes de vidrio y materias primas en El Salvador.',
    };
  }

  const profile = getFragranceProfile(product);
  const notesText = profile?.topNotes?.length
    ? `Notas olfativas: ${profile.topNotes.join(', ')}. `
    : '';

  const isBottle = product.category?.toLowerCase().includes('bote') || product.name.toLowerCase().includes('bote');

  const title = isBottle
    ? `${product.name} | Botes de Vidrio para Perfume Aromaniak SV`
    : `Esencia ${product.officialName || product.name} | Perfumería Fina Aromaniak SV`;

  const description = isBottle
    ? `Bote de vidrio y envase con atomizador para elaboración y envasado de perfumes. Insumos y frascos de perfumería fina en El Salvador.`
    : `Esencia pura concentrada y aromas de esencias para la elaboración de perfumería fina (${product.officialName || product.name}). ${notesText}Venta de materias primas e insumos por onza y media onza en El Salvador con envíos a todo el país.`;

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
          alt: `${product.name} - Aromaniak SV`,
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

  const isBottle = product ? (product.category?.toLowerCase().includes('bote') || product.name.toLowerCase().includes('bote')) : false;

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: isBottle
      ? `${product.name} - Bote de Vidrio para Perfume`
      : `Esencia de Perfumería Fina ${product.officialName || product.name}`,
    description: isBottle
      ? 'Bote de vidrio y atomizador para envasado y elaboración de perfumes en El Salvador.'
      : 'Esencia concentrada pura de perfumería fina y aromas químicos para formulación de fragancias.',
    image: product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : `https://aromaniaksv.com${product.imageUrl}`) : 'https://aromaniaksv.com/images/logo.png',
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Aromaniak SV',
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
