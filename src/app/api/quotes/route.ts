import { NextResponse } from 'next/server';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function isStaffRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const staffHeaderToken = request.headers.get('x-staff-token');
  const cookieHeader = request.headers.get('cookie') || '';
  const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
  const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

  return !!(
    verifyStaffInternalToken(staffHeaderToken) ||
    verifyStaffInternalToken(bearerToken) ||
    verifyStaffInternalToken(staffCookieToken)
  );
}

// Precio de lista actual de un producto según la presentación cotizada
function currentListPrice(
  prod: { price: any; priceHalfOunce: any },
  presentation?: string
): number {
  if (presentation === 'MEDIA_ONZA') {
    return prod.priceHalfOunce != null
      ? Number(prod.priceHalfOunce)
      : Number((Number(prod.price) / 2).toFixed(2));
  }
  return Number(prod.price);
}

// Estado de la prefactura. Se guarda como JSON en `notes` (sin migración de BD):
// sin marca = PENDIENTE; con marca = ENVIADA_BODEGA o ANULADA.
type QuoteMeta = {
  __q: 1;
  status: 'ENVIADA_BODEGA' | 'ANULADA';
  saleNumber?: string | null;
  at?: string;
  reason?: string | null;
};

function parseQuoteMeta(notes: string | null | undefined): QuoteMeta | null {
  if (!notes) return null;
  try {
    const p = JSON.parse(notes);
    if (p && p.__q === 1 && (p.status === 'ENVIADA_BODEGA' || p.status === 'ANULADA')) return p as QuoteMeta;
  } catch {}
  return null;
}

// Filtro Prisma: prefacturas sin marca de estado (pendientes)
const PENDING_WHERE = {
  OR: [{ notes: null }, { NOT: { notes: { contains: '"__q"' } } }],
};

export async function GET(request: Request) {
  try {
    if (!isStaffRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Contador rápido de prefacturas pendientes (insignia del menú lateral)
    if (searchParams.get('countOnly') === '1') {
      const pending = await prisma.quote.count({ where: PENDING_WHERE });
      return NextResponse.json({ success: true, pending });
    }

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 250);
    const search = (searchParams.get('search') || '').trim();

    const quotes = await prisma.quote.findMany({
      where: search
        ? {
            OR: [
              { quoteNumber: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
              { customerDoc: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Precios actuales de los productos cotizados
    const productIds = Array.from(
      new Set(
        quotes.flatMap((q) =>
          (Array.isArray(q.items) ? (q.items as any[]) : []).map((it) => it.productId).filter(Boolean)
        )
      )
    ) as string[];

    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true, priceHalfOunce: true },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Promociones vigentes hoy
    const now = new Date();
    const activePromotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    const promotions = activePromotions
      .filter((p) => p.maxUses == null || p.usedCount < p.maxUses)
      .map((p) => ({
        code: p.code,
        description: p.description,
        discountType: p.discountType,
        discountValue: Number(p.discountValue),
        minPurchase: p.minPurchase != null ? Number(p.minPurchase) : null,
        endDate: p.endDate,
      }));

    const result = quotes.map((q) => {
      const items = Array.isArray(q.items) ? (q.items as any[]) : [];
      const priceChanges: Array<{
        productId: string;
        name: string;
        quotedListPrice: number;
        currentListPrice: number;
      }> = [];

      for (const it of items) {
        const prod = it.productId ? productMap.get(it.productId) : null;
        if (!prod || it.listPrice == null) continue;
        const current = currentListPrice(prod, it.presentation);
        const quoted = Number(it.listPrice);
        if (Math.abs(current - quoted) >= 0.005) {
          priceChanges.push({
            productId: it.productId,
            name: it.name,
            quotedListPrice: quoted,
            currentListPrice: current,
          });
        }
      }

      const meta = parseQuoteMeta(q.notes);

      return {
        id: q.id,
        quoteNumber: q.quoteNumber,
        customerName: q.customerName,
        customerDoc: q.customerDoc,
        customerNrc: q.customerNrc,
        customerEmail: q.customerEmail,
        customerPhone: q.customerPhone,
        customerAddress: q.customerAddress,
        tipoComprobante: q.tipoComprobante,
        subtotal: Number(q.subtotal),
        ivaTotal: Number(q.ivaTotal),
        total: Number(q.total),
        sellerName: q.sellerName,
        notes: meta ? null : q.notes,
        status: meta?.status || 'PENDIENTE',
        sentSaleNumber: meta?.saleNumber || null,
        statusAt: meta?.at || null,
        statusReason: meta?.reason || null,
        validUntil: q.validUntil,
        createdAt: q.createdAt,
        items,
        priceChanges,
        isExpired: q.validUntil < now,
      };
    });

    return NextResponse.json({ success: true, quotes: result, promotions });
  } catch (error: any) {
    console.error('Error listando cotizaciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isStaffRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      customerName,
      customerDoc,
      customerNrc,
      customerEmail,
      customerPhone,
      customerAddress,
      tipoComprobante,
      subtotal,
      ivaTotal,
      total,
      sellerName,
      notes,
      items,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'La cotización requiere al menos un producto' }, { status: 400 });
    }

    // Buscar si el cliente cotizado tiene tarifas especiales o nivel de descuento VIP en la BD
    const candidateConditions: any[] = [];
    if (customerId && typeof customerId === 'string' && !customerId.startsWith('cli-')) {
      candidateConditions.push({ id: customerId });
    }
    const cleanEmail = String(customerEmail || '').trim().toLowerCase();
    if (cleanEmail) {
      candidateConditions.push({ email: { equals: cleanEmail, mode: 'insensitive' } });
    }
    const phoneDigits8 = String(customerPhone || '').replace(/\D/g, '').slice(-8);
    if (phoneDigits8.length === 8) {
      candidateConditions.push(
        { phone: { endsWith: phoneDigits8 } },
        { phone: { endsWith: `${phoneDigits8.slice(0, 4)}-${phoneDigits8.slice(4)}` } }
      );
    }
    const cleanDoc = String(customerDoc || '').trim();
    if (cleanDoc && cleanDoc !== '00000000-0') {
      candidateConditions.push({ documentNum: cleanDoc });
      const dDigits = cleanDoc.replace(/\D/g, '');
      if (dDigits.length === 9 && !/^(0+|9+|12345678\d*)$/.test(dDigits)) {
        candidateConditions.push(
          { documentNum: dDigits },
          { documentNum: `${dDigits.slice(0, 8)}-${dDigits.slice(8)}` }
        );
      }
    }
    const cleanNrc = String(customerNrc || '').trim();
    if (cleanNrc) {
      candidateConditions.push({ nrc: cleanNrc });
    }
    const cleanName = String(customerName || '').trim();
    if (cleanName && cleanName.toLowerCase() !== 'consumidor final') {
      candidateConditions.push({ name: { equals: cleanName, mode: 'insensitive' } });
    }

    const matchedCustomers = candidateConditions.length > 0
      ? await prisma.customer.findMany({
          where: { OR: candidateConditions },
          include: { tier: true, bottleTier: true, suppliesTier: true },
        })
      : [];

    const primaryCust =
      (customerId ? matchedCustomers.find((c) => c.id === customerId) : null) ||
      matchedCustomers[0] ||
      null;

    const dbCustomer = primaryCust
      ? {
          ...primaryCust,
          tier: primaryCust.tier || matchedCustomers.find((c) => c.tier)?.tier || null,
          customDiscountPct:
            primaryCust.customDiscountPct ??
            matchedCustomers.find((c) => c.customDiscountPct != null)?.customDiscountPct ??
            null,
          bottleTier: primaryCust.bottleTier || matchedCustomers.find((c) => c.bottleTier)?.bottleTier || null,
          bottleCustomDiscountPct:
            primaryCust.bottleCustomDiscountPct ??
            matchedCustomers.find((c) => c.bottleCustomDiscountPct != null)?.bottleCustomDiscountPct ??
            null,
          suppliesTier: primaryCust.suppliesTier || matchedCustomers.find((c) => c.suppliesTier)?.suppliesTier || null,
          suppliesCustomDiscountPct:
            primaryCust.suppliesCustomDiscountPct ??
            matchedCustomers.find((c) => c.suppliesCustomDiscountPct != null)?.suppliesCustomDiscountPct ??
            null,
          specialEssencePrice:
            primaryCust.specialEssencePrice ??
            matchedCustomers.find((c) => c.specialEssencePrice != null)?.specialEssencePrice ??
            null,
          specialHalfEssencePrice:
            (primaryCust as any).specialHalfEssencePrice ??
            (matchedCustomers.find((c) => (c as any).specialHalfEssencePrice != null) as any)?.specialHalfEssencePrice ??
            null,
          specialBottlePrice:
            primaryCust.specialBottlePrice ??
            matchedCustomers.find((c) => c.specialBottlePrice != null)?.specialBottlePrice ??
            null,
        }
      : null;

    // El precio de lista vigente al momento de cotizar se toma de la BD (no del cliente),
    // para poder avisar después si cambió.
    const productIds = Array.from(new Set(items.map((it: any) => it.productId).filter(Boolean))) as string[];
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, category: { select: { name: true } }, unit: true, price: true, priceHalfOunce: true },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const cleanItems = items.map((it: any) => {
      const prod = it.productId ? productMap.get(it.productId) : null;
      const qty = Number(it.quantity || 0);
      let unitPrice = Number(it.price || 0);
      const catalogListPrice = prod ? currentListPrice(prod, it.presentation) : null;

      if (prod && dbCustomer) {
        const cat = prod.category?.name || '';
        const nameLower = String(prod.name || it.name || '').toLowerCase();
        const isEssence =
          cat === 'Esencias para Perfume' ||
          cat === 'Esencias & Fragancias' ||
          (!cat && prod.unit === 'Onza');
        const isBottle =
          !isEssence &&
          (cat === 'Botes' ||
            cat === 'Botes & Envases' ||
            cat === 'Envases & Botes' ||
            nameLower.startsWith('bote') ||
            nameLower.includes('frasco'));
        const isLogistics =
          cat === 'Logística' ||
          cat === 'Logistica' ||
          prod.id === 'ENVIO-DOM' ||
          prod.unit === 'Servicio';

        let basePrice = catalogListPrice != null ? catalogListPrice : unitPrice;
        if (isEssence && it.presentation === 'MEDIA_ONZA') {
          if (dbCustomer.specialHalfEssencePrice != null && Number(dbCustomer.specialHalfEssencePrice) > 0) {
            basePrice = Number(dbCustomer.specialHalfEssencePrice);
          }
        } else if (isEssence) {
          if (dbCustomer.specialEssencePrice != null && Number(dbCustomer.specialEssencePrice) > 0) {
            basePrice = Number(dbCustomer.specialEssencePrice);
          }
        } else if (isBottle) {
          if (dbCustomer.specialBottlePrice != null && Number(dbCustomer.specialBottlePrice) > 0) {
            basePrice = Number(dbCustomer.specialBottlePrice);
          }
        }

        const activeCategoryTier = isLogistics
          ? null
          : isEssence
          ? dbCustomer.tier
          : isBottle
          ? dbCustomer.bottleTier
          : dbCustomer.suppliesTier;
        const activeCategoryCustomPct = isLogistics
          ? null
          : isEssence
          ? dbCustomer.customDiscountPct
          : isBottle
          ? dbCustomer.bottleCustomDiscountPct
          : dbCustomer.suppliesCustomDiscountPct;

        let appliedPct = 0;
        if (activeCategoryTier) {
          if (activeCategoryTier.name === 'Personalizado' && activeCategoryCustomPct) {
            appliedPct = Number(activeCategoryCustomPct);
          } else if (activeCategoryTier.discountPct) {
            appliedPct = Number(activeCategoryTier.discountPct);
          }
        } else if (activeCategoryCustomPct && Number(activeCategoryCustomPct) > 0) {
          appliedPct = Number(activeCategoryCustomPct);
        }

        let customerDiscountedPrice = basePrice;
        if (appliedPct > 0) {
          const discAmt = Number((basePrice * (appliedPct / 100)).toFixed(4));
          customerDiscountedPrice = Number((basePrice - discAmt).toFixed(2));
        }

        if (customerDiscountedPrice > 0 && customerDiscountedPrice < unitPrice) {
          unitPrice = customerDiscountedPrice;
        }
      }

      const lineTotal = Number((qty * unitPrice).toFixed(2));
      return {
        productId: it.productId || null,
        name: String(it.name || ''),
        quantity: qty,
        price: unitPrice,
        total: lineTotal,
        unit: it.unit || null,
        presentation: it.presentation || null,
        puesto: it.puesto || null,
        listPrice: catalogListPrice,
      };
    });

    const computedTotal = Number(cleanItems.reduce((sum, it) => sum + it.total, 0).toFixed(2));
    const finalTotal = computedTotal > 0 ? computedTotal : Number(total || 0);
    const finalSubtotal = computedTotal > 0 ? Number((finalTotal / 1.13).toFixed(2)) : Number(subtotal || 0);
    const finalIvaTotal = computedTotal > 0 ? Number((finalTotal - finalSubtotal).toFixed(2)) : Number(ivaTotal || 0);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 15);

    const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    let created: any = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const quoteNumber = `COT-${yymmdd}-${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        created = await prisma.quote.create({
          data: {
            quoteNumber,
            customerName: String(customerName || 'Consumidor Final'),
            customerDoc: customerDoc || null,
            customerNrc: customerNrc || null,
            customerEmail: customerEmail || null,
            customerPhone: customerPhone || null,
            customerAddress: customerAddress || null,
            tipoComprobante: tipoComprobante || null,
            subtotal: finalSubtotal,
            ivaTotal: finalIvaTotal,
            total: finalTotal,
            sellerName: sellerName || null,
            notes: notes || null,
            validUntil,
            items: cleanItems,
          },
        });
      } catch (err: any) {
        if (err?.code !== 'P2002') throw err; // solo reintenta por número duplicado
      }
    }

    if (!created) {
      return NextResponse.json({ success: false, error: 'No se pudo generar un número de cotización único' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: created.id,
        quoteNumber: created.quoteNumber,
        createdAt: created.createdAt,
        validUntil: created.validUntil,
        subtotal: Number(created.subtotal),
        ivaTotal: Number(created.ivaTotal),
        total: Number(created.total),
        items: created.items,
      },
    });
  } catch (error: any) {
    console.error('Error creando cotización:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Cambia el estado de una prefactura:
//  - send:    la marca como ENVIADA_BODEGA (reclamo atómico: evita doble envío entre cajeros)
//  - cancel:  la marca como ANULADA
//  - release: revierte un `send` (si falló la creación de la comanda)
export async function PATCH(request: Request) {
  try {
    if (!isStaffRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action, saleNumber, reason } = await request.json();
    if (!id || !['send', 'cancel', 'release'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Solicitud inválida' }, { status: 400 });
    }

    if (action === 'release') {
      const released = await prisma.quote.updateMany({
        where: { id, notes: { contains: '"ENVIADA_BODEGA"' } },
        data: { notes: null },
      });
      return NextResponse.json({ success: true, released: released.count });
    }

    const meta: QuoteMeta = {
      __q: 1,
      status: action === 'send' ? 'ENVIADA_BODEGA' : 'ANULADA',
      saleNumber: action === 'send' ? String(saleNumber || '') || null : null,
      at: new Date().toISOString(),
      reason: action === 'cancel' ? String(reason || '') || null : null,
    };

    // Solo se puede cambiar el estado si sigue pendiente (reclamo atómico)
    const claim = await prisma.quote.updateMany({
      where: { id, ...PENDING_WHERE },
      data: { notes: JSON.stringify(meta) },
    });

    if (claim.count === 0) {
      const q = await prisma.quote.findUnique({ where: { id }, select: { notes: true } });
      if (!q) {
        return NextResponse.json({ success: false, error: 'Prefactura no encontrada' }, { status: 404 });
      }
      const current = parseQuoteMeta(q.notes);
      return NextResponse.json(
        {
          success: false,
          error:
            current?.status === 'ENVIADA_BODEGA'
              ? 'Esta prefactura ya fue enviada a bodega'
              : 'Esta prefactura ya fue anulada',
          status: current?.status || null,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, status: meta.status });
  } catch (error: any) {
    console.error('Error actualizando cotización:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
