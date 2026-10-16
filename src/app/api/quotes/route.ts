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

    // El precio de lista vigente al momento de cotizar se toma de la BD (no del cliente),
    // para poder avisar después si cambió.
    const productIds = Array.from(new Set(items.map((it: any) => it.productId).filter(Boolean))) as string[];
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true, priceHalfOunce: true },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const cleanItems = items.map((it: any) => {
      const prod = it.productId ? productMap.get(it.productId) : null;
      return {
        productId: it.productId || null,
        name: String(it.name || ''),
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
        total: Number(it.total || 0),
        unit: it.unit || null,
        presentation: it.presentation || null,
        puesto: it.puesto || null,
        listPrice: prod ? currentListPrice(prod, it.presentation) : null,
      };
    });

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
            subtotal: Number(subtotal || 0),
            ivaTotal: Number(ivaTotal || 0),
            total: Number(total || 0),
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
