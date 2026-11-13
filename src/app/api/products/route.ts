import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import { exec } from 'child_process';
import { prisma } from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/store';
import { formatWithGenderSuffix } from '@/lib/perfumeNames';
import { verifyStaffInternalToken, verifyStaffRequest } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';

function syncEssenceCatalogAndPushToGitHub(product: {
  sku?: string | null;
  name: string;
  officialName?: string | null;
  brand?: string | null;
  gender?: string | null;
}) {
  try {
    const labelsDir = '/Users/luis/.gemini/antigravity/scratch/sistema-etiquetas-esencias';
    const labelsCatalogPath = `${labelsDir}/apaesa_catalog.json`;
    const labelsHtmlPath = `${labelsDir}/index.html`;

    if (!fs.existsSync(labelsCatalogPath)) return;

    const raw = fs.readFileSync(labelsCatalogPath, 'utf8');
    const cat = JSON.parse(raw);
    const cleanName = product.name.replace(/(?:\s+[FHMUD])+$/i, '').trim().toUpperCase();
    const cleanOfficial = (product.officialName || product.name).replace(/(?:\s+[FHMUD])+$/i, '').trim().toUpperCase();
    const gUpper = String(product.gender || '').trim().toLowerCase();
    const normGen = gUpper.includes('dama') || gUpper.includes('mujer') || gUpper === 'f'
      ? 'F'
      : gUpper.includes('caballero') || gUpper.includes('hombre') || gUpper === 'h'
      ? 'H'
      : 'U';

    let found = false;
    for (let i = 0; i < cat.length; i++) {
      if (
        (cat[i].sku && String(cat[i].sku) === String(product.sku)) ||
        (cat[i].inspirado && cat[i].inspirado.toUpperCase() === cleanName) ||
        (cat[i].contratipo && cat[i].contratipo.toUpperCase() === cleanOfficial)
      ) {
        cat[i].contratipo = cleanOfficial;
        cat[i].inspirado = cleanName;
        cat[i].genero = normGen;
        if (product.brand) cat[i].marca = product.brand;
        if (product.sku) cat[i].sku = String(product.sku);
        found = true;
        break;
      }
    }
    if (!found) {
      cat.push({
        contratipo: cleanOfficial,
        inspirado: cleanName,
        genero: normGen,
        original: product.brand ? `${cleanName} ${product.brand.toUpperCase()}` : cleanName,
        marca: product.brand || '',
        sku: String(product.sku || ''),
      });
    }

    const catJsonStr = JSON.stringify(cat, null, 2);
    fs.writeFileSync(labelsCatalogPath, catJsonStr, 'utf8');

    if (fs.existsSync(labelsHtmlPath)) {
      let html = fs.readFileSync(labelsHtmlPath, 'utf8');
      html = html.replace(
        /\/\/ Catálogo completo de las \d+ esencias de APAESA \(Grupo Kode\)\s*const defaultCatalog = \[[\s\S]*?\];/,
        `// Catálogo completo de las ${cat.length} esencias de APAESA (Grupo Kode)\n    const defaultCatalog = ${catJsonStr};`
      );
      html = html.replace(/Catálogo APAESA \(\d+\)/g, `Catálogo APAESA (${cat.length})`);
      html = html.replace(/id="catalog-count-badge">\d+</g, `id="catalog-count-badge">${cat.length}<`);
      fs.writeFileSync(labelsHtmlPath, html, 'utf8');
    }

    // Subir automáticamente a GitHub en segundo plano para mantener sincronizadas todas las máquinas
    const safeSku = String(product.sku || cleanName).replace(/[^a-zA-Z0-9_-]/g, '');
    const kodelocalDir = '/Users/luis/.gemini/antigravity/scratch/kodelocal';
    exec(
      `git -C "${labelsDir}" add apaesa_catalog.json index.html && git -C "${labelsDir}" commit -m "Auto-sync catálogo etiquetas SKU ${safeSku}" && git -C "${labelsDir}" push origin main`,
      (err) => {
        if (err && !String(err.message).includes('nothing to commit')) {
          console.error('Aviso git push etiquetas:', err.message);
        }
      }
    );
    exec(
      `cd "${kodelocalDir}" && npx tsx scripts/generate_aromaniak_catalog.ts && npx tsx scripts/generate_minimalist_kode_catalog.ts && git add public/catalogo-aromaniak.pdf public/catalogo-kode.pdf && git commit -m "Auto-sync catálogos PDF SKU ${safeSku}" && git push origin main`,
      (err) => {
        if (err && !String(err.message).includes('nothing to commit')) {
          console.error('Aviso git push kodelocal:', err.message);
        }
      }
    );
  } catch (syncErr) {
    console.error('Error sincronizando con catálogo de etiquetas:', syncErr);
  }
}

export const dynamic = 'force-dynamic';

let bulkColumnsEnsured = false;
async function ensureBulkKgColumns() {
  if (bulkColumnsEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public."Product" ADD COLUMN IF NOT EXISTS "stockKg" NUMERIC(10,3) NOT NULL DEFAULT 0;
      ALTER TABLE public."Product" ADD COLUMN IF NOT EXISTS "costPerKg" NUMERIC(10,2) NOT NULL DEFAULT 0;
      ALTER TABLE public."Product" ADD COLUMN IF NOT EXISTS "yieldOzPerKg" INTEGER NOT NULL DEFAULT 32;
      ALTER TABLE public."Product" ADD COLUMN IF NOT EXISTS "yieldHalfPerKg" INTEGER NOT NULL DEFAULT 8;
    `);
    bulkColumnsEnsured = true;
  } catch (e) {
    console.warn('Aviso al asegurar columnas de Kg en Product:', e);
  }
}

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
  } else if (lower === 'stickers' || lower === 'sticker' || lower === 'etiquetas') {
    canonicalName = 'Stickers';
    canonicalSlug = 'stickers';
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
    await ensureBulkKgColumns();
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
      let categoryBaseKitPrice = 10.00;
      if (isEssence && p.category?.description) {
        try {
          const parsedKit = JSON.parse(p.category.description);
          if (typeof parsedKit?.basePrice === 'number' && !isNaN(parsedKit.basePrice) && parsedKit.basePrice > 0) {
            categoryBaseKitPrice = parsedKit.basePrice;
          }
        } catch {}
      }
      const genderVal = p.gender || 'Unisex';
      const rawName = p.name || '';
      const rawOfficial = (p as any).officialName || '';
      return {
        id: p.id,
        sku: p.sku || '',
        barcode: p.barcode || '',
        name: isEssence ? formatWithGenderSuffix(rawName, genderVal) : rawName,
        officialName: isEssence && rawOfficial ? formatWithGenderSuffix(rawOfficial, genderVal) : rawOfficial,
        brand: catName === 'Botes' ? '' : (p.brand || '').replace(/&amp;/g, '&'),
        gender: genderVal,
        category: catName,
        unit: p.unit || (isEssence ? 'Onza' : 'Unidad'),
        price: Number(p.price),
        priceHalfOunce: isEssence
          ? (p.priceHalfOunce != null ? Number(p.priceHalfOunce) : Number((Number(p.price) / 2).toFixed(2)))
          : (p.priceHalfOunce != null ? Number(p.priceHalfOunce) : undefined),
        finishedPerfumePrice: isEssence
          ? (p.finishedPerfumePrice != null ? Number(p.finishedPerfumePrice) : categoryBaseKitPrice)
          : (p.finishedPerfumePrice != null ? Number(p.finishedPerfumePrice) : undefined),
        ...(isStaff ? { cost: Number(p.cost || 0), costPerKg: Number((p as any).costPerKg || 0) } : {}),
        stock: p.stock,
        stockHalf: (p as any).stockHalf ?? 0,
        stockKg: Number((p as any).stockKg ?? 0),
        yieldOzPerKg: Number((p as any).yieldOzPerKg ?? 32),
        yieldHalfPerKg: Number((p as any).yieldHalfPerKg ?? 8),
        minStock: p.minStock,
        imageUrl: (catName === 'Botes' || catName === 'Botes & Envases')
          ? (p.imageUrl && p.imageUrl.startsWith('/images/botes/') ? p.imageUrl : '/images/botes/bote_100ml_degrade_azul_noche.jpg')
          : isEssence
          ? '/images/essence_bottle_blank.webp'
          : (p.imageUrl || '/images/essence_bottle_blank.webp'),
        description: p.description || '',
        isAvailableOnline: p.isAvailableOnline,
        puesto: (p as any).puesto || '',
        supplier: (p as any).supplier || 'APAESA',
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
    await ensureBulkKgColumns();

    // Acción especial: Envasado / Fraccionamiento de Kg a Onzas (1 Oz) y Medias Onzas (½ Oz)
    if (body.action === 'envasar_kg') {
      const {
        id,
        sku,
        kgProcessed,
        ozProduced,
        halfOzProduced,
        puesto,
        costPerKg,
        saveYieldAsDefault,
        deductFromGarrafa = true,
        userName,
        notes,
      } = body;

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
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Esencia no encontrada en la base de datos' }, { status: 404 });
      }

      const usedKg = Math.max(0, Number(kgProcessed || 0));
      const addedOz = Math.max(0, Math.round(Number(ozProduced || 0)));
      const addedHalf = Math.max(0, Math.round(Number(halfOzProduced || 0)));

      if (addedOz === 0 && addedHalf === 0) {
        return NextResponse.json(
          { success: false, error: 'Debes ingresar al menos 1 onza o ½ onza producida en el envasado.' },
          { status: 400 }
        );
      }

      const prevStockOz = existing.stock || 0;
      const prevStockHalf = (existing as any).stockHalf || 0;
      const prevStockKg = Number((existing as any).stockKg || 0);

      const newStockOz = prevStockOz + addedOz;
      const newStockHalf = prevStockHalf + addedHalf;
      const newStockKg =
        deductFromGarrafa !== false
          ? Math.max(0, Number((prevStockKg - usedKg).toFixed(3)))
          : prevStockKg;

      const equivOz = Number((addedOz + addedHalf * 0.5).toFixed(2));
      const effectiveCostPerKg =
        typeof costPerKg === 'number' && costPerKg > 0
          ? Number(costPerKg)
          : Number((existing as any).costPerKg || 0);
      const calculatedUnitCostOz =
        effectiveCostPerKg > 0 && equivOz > 0
          ? Number((effectiveCostPerKg / equivOz).toFixed(2))
          : Number(existing.cost || 0);

      const newYieldOzPerKg =
        saveYieldAsDefault && usedKg > 0
          ? Math.max(1, Math.round(addedOz / usedKg))
          : Number((existing as any).yieldOzPerKg ?? 32);
      const newYieldHalfPerKg =
        saveYieldAsDefault && usedKg > 0
          ? Math.max(0, Math.round(addedHalf / usedKg))
          : Number((existing as any).yieldHalfPerKg ?? 8);

      const finalPuesto =
        typeof puesto === 'string' && puesto.trim() ? puesto.trim() : existing.puesto;

      const updated = await prisma.$transaction(async (tx) => {
        const prod = await tx.product.update({
          where: { id: existing.id },
          data: {
            stock: newStockOz,
            stockHalf: newStockHalf,
            stockKg: newStockKg,
            cost: calculatedUnitCostOz,
            costPerKg: effectiveCostPerKg,
            yieldOzPerKg: newYieldOzPerKg,
            yieldHalfPerKg: newYieldHalfPerKg,
            ...(finalPuesto ? { puesto: finalPuesto } : {}),
          },
          include: { category: true },
        });

        await tx.stockMovement.create({
          data: {
            productId: existing.id,
            type: 'IN_PURCHASE',
            quantity: addedOz,
            previousStock: prevStockOz,
            newStock: newStockOz,
            costPrice: calculatedUnitCostOz,
            reference: `Envasado (${usedKg} Kg → ${equivOz} oz equiv.)`,
            notes: `🧪 Envasado de ${usedKg} Kg: +${addedOz} (1 Oz) y +${addedHalf} (½ Oz) [Stock ½ Oz: ${prevStockHalf} → ${newStockHalf}] | Garrafa: ${prevStockKg} Kg → ${newStockKg} Kg${finalPuesto ? ` | Puesto: ${finalPuesto}` : ''}${notes ? ` | ${notes}` : ''}`,
            userName: userName || 'Bodega / Envasado',
          },
        });

        return prod;
      });

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
        costPerKg: Number((updated as any).costPerKg || 0),
        stock: updated.stock,
        stockHalf: (updated as any).stockHalf ?? 0,
        stockKg: Number((updated as any).stockKg ?? 0),
        yieldOzPerKg: Number((updated as any).yieldOzPerKg ?? 32),
        yieldHalfPerKg: Number((updated as any).yieldHalfPerKg ?? 8),
        minStock: updated.minStock,
        imageUrl: updated.imageUrl || (isUpdatedEssence ? '/images/essence_bottle_blank.webp' : ''),
        description: updated.description || '',
        isAvailableOnline: updated.isAvailableOnline,
        puesto: updated.puesto || '',
        supplier: (updated as any).supplier || 'APAESA',
      };

      try {
        revalidatePath('/api/products');
        revalidatePath('/');
      } catch (_) {}

      return NextResponse.json({
        success: true,
        product: formattedUpdated,
        summary: {
          usedKg,
          addedOz,
          addedHalf,
          equivOz,
          calculatedUnitCostOz,
          newStockOz,
          newStockHalf,
          newStockKg,
        },
      });
    }

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
      stockKg,
      costPerKg,
      yieldOzPerKg,
      yieldHalfPerKg,
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
      supplier,
    } = body;

    if (typeof stock === 'number') stock = Math.round(stock);
    if (typeof stockHalf === 'number') stockHalf = Math.round(stockHalf);
    if (typeof stockKg === 'number') stockKg = Math.max(0, Number(stockKg.toFixed(3)));
    if (typeof yieldOzPerKg === 'number') yieldOzPerKg = Math.max(0, Math.round(yieldOzPerKg));
    if (typeof yieldHalfPerKg === 'number') yieldHalfPerKg = Math.max(0, Math.round(yieldHalfPerKg));
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
        ...(typeof stockKg === 'number' ? { stockKg } : {}),
        ...(typeof costPerKg === 'number' ? { costPerKg } : {}),
        ...(typeof yieldOzPerKg === 'number' ? { yieldOzPerKg } : {}),
        ...(typeof yieldHalfPerKg === 'number' ? { yieldHalfPerKg } : {}),
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
        ...(typeof supplier === 'string' && supplier.trim() ? { supplier: supplier.trim() } : {}),
        ...(resolvedCategoryId ? { categoryId: resolvedCategoryId } : {}),
        ...(resolvedUnit ? { unit: resolvedUnit } : {}),
      },
      include: {
        category: true,
      },
    });

    // Sincronización inmediata con el sistema de etiquetas y GitHub si es una esencia
    if (updated.category?.name === 'Esencias para Perfume') {
      syncEssenceCatalogAndPushToGitHub(updated);
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
      costPerKg: Number((updated as any).costPerKg || 0),
      stock: updated.stock,
      stockHalf: (updated as any).stockHalf ?? 0,
      stockKg: Number((updated as any).stockKg ?? 0),
      yieldOzPerKg: Number((updated as any).yieldOzPerKg ?? 32),
      yieldHalfPerKg: Number((updated as any).yieldHalfPerKg ?? 8),
      minStock: updated.minStock,
      imageUrl: updated.imageUrl || (isUpdatedEssence ? '/images/essence_bottle_blank.webp' : ''),
      description: updated.description || '',
      isAvailableOnline: updated.isAvailableOnline,
      puesto: updated.puesto || '',
      supplier: (updated as any).supplier || 'APAESA',
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
      supplier,
    } = body;

    const catRec = await resolveCategoryRecord(category || 'Esencias para Perfume');
    const categoryId = catRec ? catRec.id : null;
    const catName = catRec?.name || 'Esencias para Perfume';
    const isEssence = catName === 'Esencias para Perfume';
    let categoryBaseKitPrice = 10.00;
    if (isEssence && catRec?.description) {
      try {
        const parsedKit = JSON.parse(catRec.description);
        if (typeof parsedKit?.basePrice === 'number' && !isNaN(parsedKit.basePrice) && parsedKit.basePrice > 0) {
          categoryBaseKitPrice = parsedKit.basePrice;
        }
      } catch {}
    }
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
        finishedPerfumePrice: isEssence
          ? (typeof finishedPerfumePrice === 'number' ? finishedPerfumePrice : categoryBaseKitPrice)
          : null,
        categoryId: categoryId,
        isAvailableOnline: typeof isAvailableOnline === 'boolean' ? isAvailableOnline : true,
        stock: typeof stock === 'number' ? Math.round(stock) : 0,
        stockHalf: typeof stockHalf === 'number' ? Math.round(stockHalf) : 0,
        puesto: puesto ? String(puesto).trim() : null,
        officialName: officialName ? String(officialName).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        supplier: supplier ? String(supplier).trim() : 'APAESA',
      },
      include: {
        category: true,
      },
    });

    if (isEssence) {
      syncEssenceCatalogAndPushToGitHub(created);
    }

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
      supplier: (created as any).supplier || 'APAESA',
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
