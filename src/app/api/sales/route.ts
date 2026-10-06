import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 250);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const skip = (page - 1) * limit;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          items: true,
          payments: true,
          dteDocument: true,
          shift: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      sales,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      saleNumber,
      channel,
      subtotal,
      ivaTotal,
      discountTotal,
      total,
      paymentMethod,
      paymentStatus,
      cashReceived,
      cashChange,
      notes,
      cashierName,
      customerId,
      shiftId,
      items,
      paymentReference,
      tipoComprobante,
      codigoGeneracion,
      orderStatus,
    } = body;

    // 0. Idempotencia: Si la venta ya existe registrada en la base de datos (ej: sincronización repetida o reconexión)
    if (saleNumber) {
      const existingSale = await prisma.sale.findUnique({
        where: { saleNumber },
        include: { items: true, customer: true, dteDocument: true, payments: true },
      });
      if (existingSale) {
        if (codigoGeneracion) {
          await prisma.dteDocument.updateMany({
            where: { codigoGeneracion },
            data: { saleId: existingSale.id },
          });
        }
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          sale: existingSale,
          message: `Venta #${saleNumber} ya existía en la base de datos.`,
        });
      }
    }

    // Pre-validar productos existentes en DB para evitar violaciones de clave foránea en SaleItem
    const rawItems = Array.isArray(items) ? items : [];
    const rawProductIds = rawItems.map((it: any) => it.productId).filter(Boolean);
    const existingDbProducts = await prisma.product.findMany({
      where: { id: { in: rawProductIds } },
    });
    const existingDbProductIds = new Set(existingDbProducts.map((p) => p.id));
    let fallbackProduct = existingDbProducts[0];
    if (!fallbackProduct) {
      fallbackProduct = (await prisma.product.findFirst({ select: { id: true, name: true } })) as any;
    }

    const resolvedItems = rawItems.map((it: any) => {
      let finalProductId = it.productId;
      if (!existingDbProductIds.has(finalProductId)) {
        finalProductId = fallbackProduct?.id || 'esencia-apae-001';
      }
      return {
        productId: finalProductId,
        productName: it.name || it.productName || 'Producto',
        quantity: Math.max(1, Math.round(Number(it.quantity || 1))),
        unitPrice: Number(it.unitPrice || it.price || 0),
        ivaRate: 0.13,
        total: Number(it.total || 0),
        presentation: it.presentation,
        unit: it.unit,
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Venta principal
      const createdSale = await tx.sale.create({
        data: {
          saleNumber: saleNumber || `VEN-${Date.now().toString().slice(-6)}`,
          channel: channel || 'POS',
          tipoComprobante: tipoComprobante || (notes === '01' || notes === '03' ? notes : 'TICKET'),
          orderStatus: orderStatus || 'COMPLETED',
          subtotal: Number(subtotal || 0),
          ivaTotal: Number(ivaTotal || 0),
          discountTotal: Number(discountTotal || 0),
          total: Number(total || 0),
          paymentMethod: paymentMethod || 'CASH',
          paymentStatus: paymentStatus || 'COMPLETED',
          cashReceived: cashReceived ? Number(cashReceived) : null,
          cashChange: cashChange ? Number(cashChange) : null,
          notes: notes || null,
          cashierName: cashierName || 'Caja 1',
          customerId: customerId || null,
          shiftId: shiftId || null,
          items: {
            create: resolvedItems.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              ivaRate: it.ivaRate,
              total: it.total,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
          dteDocument: true,
        },
      });

      // 1.1 Si vino código de generación de DTE, vincularlo a esta venta
      if (codigoGeneracion) {
        await tx.dteDocument.updateMany({
          where: { codigoGeneracion },
          data: { saleId: createdSale.id },
        });
      }

      // 2. Registrar el PAGO RECIBIDO en la tabla SalePayment
      const paymentRecord = await tx.salePayment.create({
        data: {
          saleId: createdSale.id,
          amount: Number(total || 0),
          paymentMethod: paymentMethod || 'CASH',
          reference: paymentReference || null,
          notes: cashReceived ? `Efectivo recibido: $${Number(cashReceived).toFixed(2)}, Cambio: $${Number(cashChange || 0).toFixed(2)}` : null,
          cashierName: cashierName || 'Caja 1',
          shiftId: shiftId || null,
        },
      });

      // 3. Descontar existencias y asentar Kardex en lote (OUT_SALE)
      if (resolvedItems.length > 0) {
        const productIds = Array.from(
          new Set(resolvedItems.map((it) => it.productId).filter(Boolean))
        ) as string[];

        if (productIds.length > 0) {
          const dbProducts = await tx.product.findMany({
            where: { id: { in: productIds } },
          });
          const productMap = new Map(dbProducts.map((p) => [p.id, p]));

          const stockDeltas = new Map<string, number>();
          const halfDeltas = new Map<string, number>();
          for (const it of resolvedItems) {
            if (!it.productId) continue;
            const prod = productMap.get(it.productId);
            if (!prod) continue;

            const isHalfOz =
              it.presentation === 'MEDIA_ONZA' ||
              it.unit === '½ Onza' ||
              String(it.productName || '').includes('½');

            if (isHalfOz) {
              halfDeltas.set(prod.id, (halfDeltas.get(prod.id) || 0) + Number(it.quantity || 0));
              continue;
            }
            const soldQty = Number(it.quantity || 0);

            const currentDeduct = stockDeltas.get(prod.id) || 0;
            stockDeltas.set(prod.id, currentDeduct + soldQty);
          }

          const kardexData: Array<{
            productId: string;
            type: 'OUT_SALE';
            quantity: number;
            previousStock: number;
            newStock: number;
            reference: string;
            notes: string;
          }> = [];

          for (const [prodId, totalDeduct] of stockDeltas.entries()) {
            const prod = productMap.get(prodId);
            if (!prod) continue;

            const updatedRows: Array<{ stock: number }> = await tx.$queryRaw`
              UPDATE "Product"
              SET "stock" = GREATEST(0, "stock" - ${totalDeduct}),
                  "updatedAt" = NOW()
              WHERE "id" = ${prodId}
              RETURNING "stock"
            `;

            const newStock = updatedRows && updatedRows.length > 0 ? updatedRows[0].stock : 0;
            const previousStock = newStock + totalDeduct;

            kardexData.push({
              productId: prodId,
              type: 'OUT_SALE',
              quantity: totalDeduct,
              previousStock,
              newStock,
              reference: `Venta #${createdSale.saleNumber}`,
              notes: `Venta cobrada por ${cashierName || 'Caja'} (${paymentMethod})`,
            });
          }

          for (const [prodId, totalHalf] of halfDeltas.entries()) {
            const updatedRows: Array<{ stockHalf: number }> = await tx.$queryRaw`
              UPDATE "Product"
              SET "stockHalf" = GREATEST(0, "stockHalf" - ${totalHalf}),
                  "updatedAt" = NOW()
              WHERE "id" = ${prodId}
              RETURNING "stockHalf"
            `;
            const newHalf = updatedRows && updatedRows.length > 0 ? updatedRows[0].stockHalf : 0;
            kardexData.push({
              productId: prodId,
              type: 'OUT_SALE',
              quantity: totalHalf,
              previousStock: newHalf + totalHalf,
              newStock: newHalf,
              reference: `Venta #${createdSale.saleNumber}`,
              notes: `½ Onza • Venta cobrada por ${cashierName || 'Caja'} (${paymentMethod})`,
            });
          }

          if (kardexData.length > 0) {
            await tx.stockMovement.createMany({
              data: kardexData,
            });
          }
        }
      }

      return { sale: createdSale, payment: paymentRecord };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error procesando cobro de venta en Supabase:', error);
    const isInsufficientStock = String(error?.message || '').includes('INSUFFICIENT_STOCK');
    const status = isInsufficientStock ? 409 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, saleNumber, orderStatus, paymentStatus, notes } = body;

    if (!id && !saleNumber) {
      return NextResponse.json({ success: false, error: 'id o saleNumber es requerido' }, { status: 400 });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(saleNumber ? [{ saleNumber }] : []),
        ],
      },
    });

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Venta no encontrada' }, { status: 404 });
    }

    const updated = await prisma.sale.update({
      where: { id: sale.id },
      data: {
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(notes ? { notes: [sale.notes, notes].filter(Boolean).join(' ') } : {}),
      },
      include: {
        customer: true,
        items: true,
        dteDocument: true,
      },
    });

    return NextResponse.json({ success: true, sale: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

