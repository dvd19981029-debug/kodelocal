import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/store';
import {
  buildMetaCatalogRows,
  serializeMetaCatalogCsv,
  MetaCatalogProductInput,
} from '@/lib/metaCatalogFeed';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const strictStock = url.searchParams.get('stock') === 'strict';

    // Consultar todos los productos en la base de datos (incluyendo nuevos, actualizados y descontinuados)
    const [dbProducts, sysConfig] = await Promise.all([
      prisma.product.findMany({
        include: { category: true },
        orderBy: { sku: 'asc' },
      }),
      prisma.systemConfig.findFirst().catch(() => null),
    ]);

    const initialMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));

    let products: MetaCatalogProductInput[] = INITIAL_PRODUCTS;
    if (dbProducts.length > 0) {
      products = dbProducts.map((p) => {
        const init = initialMap.get(p.id);
        return {
          id: p.id,
          sku: p.sku || init?.sku || '',
          name: p.name,
          officialName: p.officialName || init?.officialName || '',
          brand: p.brand || init?.brand || '',
          gender: (p.gender as any) || init?.gender || 'Unisex',
          category: p.category?.name || init?.category || 'Esencias para Perfume',
          unit: p.unit || init?.unit || 'Onza',
          cost: Number(p.cost || init?.cost || 0),
          price: Number(p.price ?? init?.price ?? 3.75),
          priceHalfOunce:
            p.priceHalfOunce != null
              ? Number(p.priceHalfOunce)
              : init?.priceHalfOunce ?? 1.9,
          finishedPerfumePrice:
            p.finishedPerfumePrice != null
              ? Number(p.finishedPerfumePrice)
              : init?.finishedPerfumePrice ?? 15.0,
          stock: Number(p.stock ?? 0),
          stockHalf: Number(p.stockHalf ?? 0),
          minStock: Number(p.minStock ?? 15),
          barcode: p.barcode || init?.barcode || '',
          description: p.description || init?.description || '',
          imageUrl: p.imageUrl || init?.imageUrl || '',
          isAvailableOnline: p.isAvailableOnline !== false,
          isActive: p.isActive !== false,
        };
      });
    }

    const kitStandardPrice = Number(
      (sysConfig as any)?.kitStandardPrice || 11.0
    );
    const kitPlusPrice = Number((sysConfig as any)?.kitPlusPrice || 14.0);

    const rows = buildMetaCatalogRows(products, {
      strictStock,
      kitStandardPrice,
      kitPlusPrice,
    });
    const csv = serializeMetaCatalogCsv(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'inline; filename="catalogo-meta-aromaniak.csv"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[Meta Feed Error]:', err);
    const rows = buildMetaCatalogRows(INITIAL_PRODUCTS);
    const csv = serializeMetaCatalogCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'inline; filename="catalogo-meta-aromaniak.csv"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}
