import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/store';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
};

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inStockOnly = searchParams.get('inStock') === 'true';
    const isFreshRequested = searchParams.get('fresh') === 'true' || searchParams.has('_t');
    const responseHeaders = isFreshRequested ? NO_CACHE_HEADERS : CACHE_HEADERS;

    // Consultar productos en la base de datos de Supabase
    const dbProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        isAvailableOnline: true,
        ...(inStockOnly ? { stock: { gt: 0 } } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [
        { stock: 'desc' },
        { sku: 'asc' },
      ],
    });

    if (dbProducts.length === 0) {
      // Si la base de datos no tiene productos aún, devolver fallback
      return NextResponse.json({
        success: true,
        source: 'fallback',
        products: INITIAL_PRODUCTS,
        counts: {
          total: INITIAL_PRODUCTS.length,
          inStock: INITIAL_PRODUCTS.filter(p => p.stock > 0).length,
          outOfStock: INITIAL_PRODUCTS.filter(p => p.stock <= 0).length,
        }
      }, { headers: NO_CACHE_HEADERS });
    }

    const formatted = dbProducts.map((p) => ({
      id: p.id,
      sku: p.sku || '',
      barcode: p.barcode || '',
      name: p.name,
      officialName: (p as any).officialName || '',
      brand: (p.category?.name === 'Botes' || p.brand === 'Yahua Industrial' || p.brand === 'APAESA') ? '' : (p.brand || ''),
      gender: p.gender || 'Unisex',
      category: p.category?.name || 'Esencias para Perfume',
      unit: p.unit || 'Onza',
      price: Number(p.price),
      priceHalfOunce: p.priceHalfOunce != null ? Number(p.priceHalfOunce) : (p.category?.name === 'Esencias para Perfume' || !p.category?.name ? Number((Number(p.price) / 2).toFixed(2)) : undefined),
      finishedPerfumePrice: p.finishedPerfumePrice != null ? Number(p.finishedPerfumePrice) : (p.category?.name === 'Esencias para Perfume' || !p.category?.name ? 15.00 : undefined),
      cost: Number(p.cost || 0),
      stock: p.stock,
      minStock: p.minStock,
      imageUrl: (p.category?.name === 'Botes' || p.category?.name === 'Botes & Envases')
        ? (p.imageUrl && p.imageUrl.startsWith('/images/botes/') ? p.imageUrl : '/images/botes/bote_100ml_sauvage_degrade_negro.jpg')
        : (p.category?.name === 'Esencias para Perfume' || !p.category?.name)
        ? `/images/esencias/esencia_${p.sku || p.id}.webp?v=aroma_official_v3`
        : (p.imageUrl || '/images/essence_bottle_blank.webp'),
      description: p.description || '',
      isAvailableOnline: p.isAvailableOnline,
      puesto: (p as any).puesto || '',
    }));

    const total = formatted.length;
    const inStock = formatted.filter(p => p.stock > 0).length;
    const outOfStock = formatted.filter(p => p.stock <= 0).length;

    return NextResponse.json({
      success: true,
      source: 'database',
      products: formatted,
      counts: {
        total,
        inStock,
        outOfStock,
      }
    }, { headers: responseHeaders });
  } catch (error: any) {
    console.error('Error fetching products from DB:', error);
    // Fallback seguro en caso de error de conexión transitoria
    return NextResponse.json({
      success: true,
      source: 'fallback_error',
      products: INITIAL_PRODUCTS,
      counts: {
        total: INITIAL_PRODUCTS.length,
        inStock: INITIAL_PRODUCTS.filter(p => p.stock > 0).length,
        outOfStock: INITIAL_PRODUCTS.filter(p => p.stock <= 0).length,
      }
    }, { headers: NO_CACHE_HEADERS });
  }
}

export async function PATCH(request: Request) {
  try {
    // SEC-FIND-01: Exigir autenticación de personal/staff para modificar productos
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieHeader = request.headers.get('cookie') || '';
    const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
    const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

    let isStaff = verifyStaffInternalToken(staffHeaderToken) || 
                  verifyStaffInternalToken(bearerToken) || 
                  verifyStaffInternalToken(staffCookieToken);

    // Si viene de operaciones internas del POS local o localhost
    if (!isStaff) {
      const host = request.headers.get('host') || '';
      const referer = request.headers.get('referer') || '';
      const isInternalLocal = host.includes('localhost') || host.includes('127.0.0.1') || referer.includes('/pos') || referer.includes('/inventario') || referer.includes('/admin');
      if (isInternalLocal) {
        isStaff = true;
      }
    }

    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere autenticación de personal administrativo para modificar productos.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Actualización masiva por categoría (ej. esencias)
    if (body.bulk === true) {
      const { category, price, cost, priceHalfOunce, finishedPerfumePrice } = body;
      const updateData: any = {};
      if (typeof price === 'number') updateData.price = price;
      if (typeof cost === 'number') updateData.cost = cost;
      if (typeof priceHalfOunce === 'number') updateData.priceHalfOunce = priceHalfOunce;
      if (typeof finishedPerfumePrice === 'number') updateData.finishedPerfumePrice = finishedPerfumePrice;

      let whereClause: any = {};
      if (category) {
        const cat = await prisma.category.findFirst({ where: { name: category } });
        if (cat) {
          whereClause.categoryId = cat.id;
        } else {
          whereClause.category = { name: category };
        }
      }

      const result = await prisma.product.updateMany({
        where: whereClause,
        data: updateData,
      });

      return NextResponse.json({ success: true, count: result.count });
    }

    const { id, sku, stock, isAvailableOnline, price, cost, priceHalfOunce, finishedPerfumePrice, puesto, officialName, imageUrl, name, brand, description } = body;

    if (!id && !sku) {
      return NextResponse.json({ success: false, error: 'Product ID or SKU required' }, { status: 400 });
    }

    let existing = null;
    if (id) {
      existing = await prisma.product.findUnique({ where: { id } });
    }
    if (!existing && sku) {
      existing = await prisma.product.findUnique({ where: { sku: String(sku).trim() } });
    }
    if (!existing && id) {
      existing = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: String(id).trim() },
            { barcode: String(id).trim() },
          ],
        },
      });
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado en la base de datos' }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(typeof stock === 'number' ? { stock } : {}),
        ...(typeof isAvailableOnline === 'boolean' ? { isAvailableOnline } : {}),
        ...(typeof price === 'number' ? { price } : {}),
        ...(typeof cost === 'number' ? { cost } : {}),
        ...(typeof priceHalfOunce === 'number' ? { priceHalfOunce } : {}),
        ...(typeof finishedPerfumePrice === 'number' ? { finishedPerfumePrice } : {}),
        ...(typeof puesto === 'string' ? { puesto } : {}),
        ...(typeof officialName === 'string' ? { officialName } : {}),
        ...(typeof imageUrl === 'string' ? { imageUrl } : {}),
        ...(typeof name === 'string' ? { name } : {}),
        ...(typeof brand === 'string' ? { brand } : {}),
        ...(typeof description === 'string' ? { description } : {}),
      },
      include: {
        category: true,
      },
    });

    const formattedUpdated = {
      id: updated.id,
      sku: updated.sku || '',
      barcode: updated.barcode || '',
      name: updated.name,
      officialName: updated.officialName || '',
      brand: updated.brand || '',
      gender: updated.gender || 'Unisex',
      category: updated.category?.name || 'Esencias para Perfume',
      unit: updated.unit || 'Onza',
      price: Number(updated.price),
      priceHalfOunce: updated.priceHalfOunce != null ? Number(updated.priceHalfOunce) : undefined,
      finishedPerfumePrice: updated.finishedPerfumePrice != null ? Number(updated.finishedPerfumePrice) : undefined,
      cost: Number(updated.cost || 0),
      stock: updated.stock,
      minStock: updated.minStock,
      imageUrl: updated.imageUrl || '',
      description: updated.description || '',
      isAvailableOnline: updated.isAvailableOnline,
      puesto: updated.puesto || '',
    };

    return NextResponse.json({ success: true, product: formattedUpdated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
