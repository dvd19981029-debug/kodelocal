import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/store';
import { verifyStaffInternalToken, verifyStaffRequest } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
};

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function resolveCategoryRecord(rawCategory?: string) {
  if (!rawCategory) return null;
  const trimmed = String(rawCategory).trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  let canonicalName = trimmed;
  let canonicalSlug = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (lower === 'esencias' || lower === 'esencia' || lower === 'esencias para perfume') {
    canonicalName = 'Esencias para Perfume';
    canonicalSlug = 'esencias-para-perfume';
  } else if (lower === 'insumos' || lower === 'insumo' || lower === 'insumos y materia prima') {
    canonicalName = 'Insumos y Materia Prima';
    canonicalSlug = 'insumos-materia-prima';
  } else if (lower === 'botes' || lower === 'bote' || lower === 'botes & envases') {
    canonicalName = 'Botes';
    canonicalSlug = 'botes';
  } else if (lower === 'otro' || lower === 'otros') {
    canonicalName = 'Otro';
    canonicalSlug = 'otro';
  } else if (lower === 'empaque') {
    canonicalName = 'Empaque';
    canonicalSlug = 'empaque';
  } else if (lower === 'logística' || lower === 'logistica') {
    canonicalName = 'Logística';
    canonicalSlug = 'logistica';
  }

  let cat = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: canonicalName, mode: 'insensitive' } },
        { slug: canonicalSlug },
        { name: { equals: trimmed, mode: 'insensitive' } },
      ],
    },
  });

  if (!cat) {
    cat = await prisma.category.create({
      data: {
        name: canonicalName,
        slug: `${canonicalSlug}-${Date.now().toString().slice(-4)}`,
      },
    });
  }

  return cat;
}

export async function GET(request: Request) {
  try {
    // Rate Limiting para lectura de catálogo (REQ-SEC-01: máx 100 req/min por IP)
    const rl = await checkRateLimit(request, {
      keyPrefix: 'products_get',
      maxRequests: 100,
      windowMs: 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: `Límite de consultas excedido. Por favor espera ${rl.resetSeconds} segundos.` },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const { authorized: isStaff } = verifyStaffRequest(request);
    const { searchParams } = new URL(request.url);
    const inStockOnly = searchParams.get('inStock') === 'true';
    const onlineOnly = searchParams.get('onlineOnly') === 'true';
    const isFreshRequested = searchParams.get('fresh') === 'true' || searchParams.has('_t') || isStaff;
    const responseHeaders = isFreshRequested ? NO_CACHE_HEADERS : CACHE_HEADERS;

    // Consultar productos en la base de datos de Supabase
    const dbProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(onlineOnly ? { isAvailableOnline: true } : {}),
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
        products: INITIAL_PRODUCTS.map(({ cost, ...rest }) => (isStaff ? { ...rest, cost } : rest)),
        counts: {
          total: INITIAL_PRODUCTS.length,
          inStock: INITIAL_PRODUCTS.filter(p => p.stock > 0).length,
          outOfStock: INITIAL_PRODUCTS.filter(p => p.stock <= 0).length,
        }
      }, { headers: NO_CACHE_HEADERS });
    }

    const formatted = dbProducts.map((p) => {
      const catName = p.category?.name || 'Esencias para Perfume';
      const isEssence = catName === 'Esencias para Perfume';
      return {
        id: p.id,
        sku: p.sku || '',
        barcode: p.barcode || '',
        name: p.name,
        officialName: (p as any).officialName || '',
        brand: catName === 'Botes' ? '' : (p.brand || ''),
        gender: p.gender || 'Unisex',
        category: catName,
        unit: p.unit || (isEssence ? 'Onza' : 'Unidad'),
        price: Number(p.price),
        priceHalfOunce: isEssence
          ? (p.priceHalfOunce != null ? Number(p.priceHalfOunce) : Number((Number(p.price) / 2).toFixed(2)))
          : (p.priceHalfOunce != null ? Number(p.priceHalfOunce) : undefined),
        finishedPerfumePrice: isEssence
          ? (p.finishedPerfumePrice != null ? Number(p.finishedPerfumePrice) : 15.00)
          : (p.finishedPerfumePrice != null ? Number(p.finishedPerfumePrice) : undefined),
        ...(isStaff ? { cost: Number(p.cost || 0) } : {}),
        stock: p.stock,
        stockHalf: (p as any).stockHalf ?? 0,
        minStock: p.minStock,
        imageUrl: (catName === 'Botes' || catName === 'Botes & Envases')
          ? (p.imageUrl && p.imageUrl.startsWith('/images/botes/') ? p.imageUrl : '/images/botes/bote_100ml_degrade_azul_noche.jpg')
          : isEssence
          ? '/images/essence_bottle_blank.webp'
          : (p.imageUrl || '/images/essence_bottle_blank.webp'),
        description: p.description || '',
        isAvailableOnline: p.isAvailableOnline,
        puesto: (p as any).puesto || '',
      };
    });

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

      try {
        revalidatePath('/api/products');
        revalidatePath('/');
      } catch (_) {}

      return NextResponse.json({ success: true, count: result.count });
    }

    let {
      id,
      sku,
      stock,
      stockHalf,
      isAvailableOnline,
      price,
      cost,
      priceHalfOunce,
      finishedPerfumePrice,
      puesto,
      officialName,
      imageUrl,
      name,
      brand,
      description,
      category,
      unit,
      gender,
    } = body;

    if (typeof stock === 'number') stock = Math.round(stock);
    if (typeof stockHalf === 'number') stockHalf = Math.round(stockHalf);
    if (!id && !sku) {
      return NextResponse.json({ success: false, error: 'Product ID or SKU required' }, { status: 400 });
    }

    let existing = null;
    if (id) {
      existing = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    }
    if (!existing && sku) {
      existing = await prisma.product.findUnique({ where: { sku: String(sku).trim() }, include: { category: true } });
    }
    if (!existing && id) {
      existing = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: String(id).trim() },
            { barcode: String(id).trim() },
          ],
        },
        include: { category: true }
      });
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado en la base de datos' }, { status: 404 });
    }

    let resolvedCategoryId: string | undefined = undefined;
    let resolvedCategoryName = existing.category?.name || 'Esencias para Perfume';
    if (typeof category === 'string' && category.trim()) {
      const catRec = await resolveCategoryRecord(category);
      if (catRec) {
        resolvedCategoryId = catRec.id;
        resolvedCategoryName = catRec.name;
      }
    }

    const isTargetEssence = resolvedCategoryName === 'Esencias para Perfume';
    let resolvedUnit: string | undefined = typeof unit === 'string' && unit.trim() ? unit.trim() : undefined;
    if (resolvedCategoryId) {
      if (!isTargetEssence && (!resolvedUnit || resolvedUnit === 'Onza')) {
        resolvedUnit = 'Unidad';
      } else if (isTargetEssence && (!resolvedUnit || resolvedUnit === 'Unidad')) {
        resolvedUnit = 'Onza';
      }
    }

    const oldStock = existing.stock;
    const oldStockHalf = (existing as any).stockHalf ?? 0;

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(typeof sku === 'string' && sku.trim() ? { sku: sku.trim() } : {}),
        ...(typeof stock === 'number' ? { stock } : {}),
        ...(typeof stockHalf === 'number' ? { stockHalf } : {}),
        ...(typeof isAvailableOnline === 'boolean' ? { isAvailableOnline } : {}),
        ...(typeof price === 'number' ? { price } : {}),
        ...(typeof cost === 'number' ? { cost } : {}),
        ...(priceHalfOunce === null || !isTargetEssence
          ? { priceHalfOunce: typeof priceHalfOunce === 'number' && isTargetEssence ? priceHalfOunce : null }
          : typeof priceHalfOunce === 'number'
          ? { priceHalfOunce }
          : {}),
        ...(finishedPerfumePrice === null || !isTargetEssence
          ? { finishedPerfumePrice: typeof finishedPerfumePrice === 'number' && isTargetEssence ? finishedPerfumePrice : null }
          : typeof finishedPerfumePrice === 'number'
          ? { finishedPerfumePrice }
          : {}),
        ...(typeof puesto === 'string' ? { puesto } : {}),
        ...(typeof officialName === 'string' ? { officialName } : {}),
        ...(typeof imageUrl === 'string' ? { imageUrl } : {}),
        ...(typeof name === 'string' ? { name } : {}),
        ...(typeof brand === 'string' ? { brand } : {}),
        ...(typeof description === 'string' ? { description } : {}),
        ...(typeof gender === 'string' && gender.trim() ? { gender: gender.trim() } : {}),
        ...(resolvedCategoryId ? { categoryId: resolvedCategoryId } : {}),
        ...(resolvedUnit ? { unit: resolvedUnit } : {}),
      },
      include: {
        category: true,
      },
    });

    // Sincronización inmediata con el sistema de etiquetas si es una esencia
    if (updated.category?.name === 'Esencias para Perfume') {
      try {
        const labelsCatalogPath = '/Users/luis/.gemini/antigravity/scratch/sistema-etiquetas-esencias/apaesa_catalog.json';
        if (fs.existsSync(labelsCatalogPath)) {
          const raw = fs.readFileSync(labelsCatalogPath, 'utf8');
          const cat = JSON.parse(raw);
          const cleanName = updated.name.replace(/\s+[FHU]$/i, '').trim().toUpperCase();
          const cleanOfficial = (updated.officialName || updated.name).replace(/\s+[FHU]$/i, '').trim().toUpperCase();
          const normGen = updated.gender === 'Dama' ? 'M' : updated.gender === 'Caballero' ? 'H' : 'U';

          let found = false;
          for (let i = 0; i < cat.length; i++) {
            if ((cat[i].sku && String(cat[i].sku) === String(updated.sku)) ||
                (cat[i].inspirado && cat[i].inspirado.toUpperCase() === cleanName) ||
                (cat[i].contratipo && cat[i].contratipo.toUpperCase() === cleanOfficial)) {
              cat[i].contratipo = cleanOfficial;
              cat[i].inspirado = cleanName;
              cat[i].genero = normGen;
              if (updated.brand) cat[i].marca = updated.brand;
              if (updated.sku) cat[i].sku = String(updated.sku);
              found = true;
              break;
            }
          }
          if (!found) {
            cat.push({
              contratipo: cleanOfficial,
              inspirado: cleanName,
              genero: normGen,
              original: cleanName,
              marca: updated.brand || '',
              sku: String(updated.sku || ''),
            });
          }
          fs.writeFileSync(labelsCatalogPath, JSON.stringify(cat, null, 2), 'utf8');
        }
      } catch (syncErr) {
        console.error('Error sincronizando con catálogo de etiquetas:', syncErr);
      }
    }

    // Si hubo cambio de inventario manual, registrar en Kardex
    if (typeof stock === 'number' && stock !== oldStock) {
      await prisma.stockMovement.create({
        data: {
          productId: existing.id,
          type: 'ADJUSTMENT',
          quantity: Math.abs(stock - oldStock),
          previousStock: oldStock,
          newStock: stock,
          reference: 'Ajuste Manual',
          notes: `Ajuste manual de inventario (1 Onza). Diferencia: ${stock - oldStock}`,
          userName: 'Personal/Admin',
        }
      });
    }
    
    if (typeof stockHalf === 'number' && stockHalf !== oldStockHalf) {
      await prisma.stockMovement.create({
        data: {
          productId: existing.id,
          type: 'ADJUSTMENT',
          quantity: Math.abs(stockHalf - oldStockHalf),
          previousStock: oldStockHalf,
          newStock: stockHalf,
          reference: 'Ajuste Manual',
          notes: `Ajuste manual de inventario (½ Onza). Diferencia: ${stockHalf - oldStockHalf}`,
          userName: 'Personal/Admin',
        }
      });
    }

    const updatedCatName = updated.category?.name || 'Esencias para Perfume';
    const isUpdatedEssence = updatedCatName === 'Esencias para Perfume';

    const formattedUpdated = {
      id: updated.id,
      sku: updated.sku || '',
      barcode: updated.barcode || '',
      name: updated.name,
      officialName: updated.officialName || '',
      brand: updated.brand || '',
      gender: updated.gender || 'Unisex',
      category: updatedCatName,
      unit: updated.unit || (isUpdatedEssence ? 'Onza' : 'Unidad'),
      price: Number(updated.price),
      priceHalfOunce: updated.priceHalfOunce != null ? Number(updated.priceHalfOunce) : undefined,
      finishedPerfumePrice: updated.finishedPerfumePrice != null ? Number(updated.finishedPerfumePrice) : undefined,
      cost: Number(updated.cost || 0),
      stock: updated.stock,
      stockHalf: (updated as any).stockHalf ?? 0,
      minStock: updated.minStock,
      imageUrl: updated.imageUrl || (isUpdatedEssence ? '/images/essence_bottle_blank.webp' : ''),
      description: updated.description || '',
      isAvailableOnline: updated.isAvailableOnline,
      puesto: updated.puesto || '',
    };

    try {
      revalidatePath('/api/products');
      revalidatePath('/');
    } catch (_) {}

    return NextResponse.json({ success: true, product: formattedUpdated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieHeader = request.headers.get('cookie') || '';
    const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
    const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

    let isStaff = verifyStaffInternalToken(staffHeaderToken) || 
                  verifyStaffInternalToken(bearerToken) || 
                  verifyStaffInternalToken(staffCookieToken);

    if (!isStaff) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sku,
      name,
      brand,
      description,
      price,
      cost,
      priceHalfOunce,
      finishedPerfumePrice,
      category,
      unit,
      gender,
      isAvailableOnline,
      stock,
      stockHalf,
      puesto,
      officialName,
      imageUrl,
    } = body;

    const catRec = await resolveCategoryRecord(category || 'Esencias para Perfume');
    const categoryId = catRec ? catRec.id : null;
    const catName = catRec?.name || 'Esencias para Perfume';
    const isEssence = catName === 'Esencias para Perfume';
    const resolvedUnit = typeof unit === 'string' && unit.trim()
      ? unit.trim()
      : (isEssence ? 'Onza' : 'Unidad');

    let finalSku = String(sku || '').trim();
    if (!finalSku) {
      finalSku = `PROD-${Date.now().toString().slice(-5)}`;
    } else {
      const existingSku = await prisma.product.findUnique({ where: { sku: finalSku } });
      if (existingSku) {
        finalSku = `${finalSku}-${Date.now().toString().slice(-3)}`;
      }
    }

    const created = await prisma.product.create({
      data: {
        sku: finalSku,
        name: String(name || 'Nuevo Producto').trim(),
        brand: brand ? String(brand).trim() : null,
        gender: gender ? String(gender).trim() : 'Unisex',
        unit: resolvedUnit,
        description: description ? String(description) : null,
        price: typeof price === 'number' ? price : 0,
        cost: typeof cost === 'number' ? cost : 0,
        priceHalfOunce: isEssence && typeof priceHalfOunce === 'number' ? priceHalfOunce : null,
        finishedPerfumePrice: isEssence && typeof finishedPerfumePrice === 'number' ? finishedPerfumePrice : null,
        categoryId: categoryId,
        isAvailableOnline: typeof isAvailableOnline === 'boolean' ? isAvailableOnline : true,
        stock: typeof stock === 'number' ? Math.round(stock) : 0,
        stockHalf: typeof stockHalf === 'number' ? Math.round(stockHalf) : 0,
        puesto: puesto ? String(puesto).trim() : null,
        officialName: officialName ? String(officialName).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
      },
      include: {
        category: true,
      },
    });

    const formattedCreated = {
      id: created.id,
      sku: created.sku || '',
      barcode: created.barcode || '',
      name: created.name,
      officialName: created.officialName || '',
      brand: created.brand || '',
      gender: created.gender || 'Unisex',
      category: created.category?.name || catName,
      unit: created.unit || resolvedUnit,
      price: Number(created.price),
      priceHalfOunce: created.priceHalfOunce != null ? Number(created.priceHalfOunce) : undefined,
      finishedPerfumePrice: created.finishedPerfumePrice != null ? Number(created.finishedPerfumePrice) : undefined,
      cost: Number(created.cost || 0),
      stock: created.stock,
      stockHalf: (created as any).stockHalf ?? 0,
      minStock: created.minStock,
      imageUrl: created.imageUrl || (isEssence ? '/images/essence_bottle_blank.webp' : ''),
      description: created.description || '',
      isAvailableOnline: created.isAvailableOnline,
      puesto: created.puesto || '',
    };

    try {
      revalidatePath('/api/products');
      revalidatePath('/');
    } catch (_) {}

    return NextResponse.json({ success: true, product: formattedCreated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
