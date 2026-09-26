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
            create: (items || []).map((it: any) => ({
              productId: it.productId,
              productName: it.name || it.productName || 'Producto',
              quantity: Number(it.quantity || 1),
              unitPrice: Number(it.unitPrice || it.price || 0),
              ivaRate: 0.13,
              total: Number(it.total || 0),
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
      if (items && Array.isArray(items) && items.length > 0) {
        const productIds = Array.from(
          new Set(items.map((it: any) => it.productId).filter(Boolean))
        ) as string[];

        if (productIds.length > 0) {
          // Consulta única en lote para todos los productos de la venta (elimina N+1)
          const dbProducts = await tx.product.findMany({
            where: { id: { in: productIds } },
          });
          const productMap = new Map(dbProducts.map((p) => [p.id, p]));

          // Calcular reducciones agrupadas por producto
          const stockDeltas = new Map<string, number>();
          for (const it of items) {
            if (!it.productId) continue;
            const prod = productMap.get(it.productId);
            if (!prod) continue;

            const isHalfOz =
              it.presentation === 'MEDIA_ONZA' ||
              it.unit === '½ Onza' ||
              String(it.name || '').includes('½');
            const soldQty = isHalfOz
              ? Math.ceil(Number(it.quantity || 0) * 0.5)
              : Number(it.quantity || 0);

            const currentDeduct = stockDeltas.get(prod.id) || 0;
            stockDeltas.set(prod.id, currentDeduct + soldQty);
          }

          // Descuento atómico de existencias y registro exacto en Kardex (REQ-DB-02)
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
            const prod = productMap.get(prodId)!;

            const updatedRows: Array<{ stock: number }> = await tx.$queryRaw`
              UPDATE "Product"
              SET "stock" = "stock" - ${totalDeduct},
                  "updatedAt" = NOW()
              WHERE "id" = ${prodId} AND "stock" >= ${totalDeduct}
              RETURNING "stock"
            `;

            if (!updatedRows || updatedRows.length === 0) {
              throw new Error(`INSUFFICIENT_STOCK: Inventario insuficiente para "${prod.name}".`);
            }

            const newStock = updatedRows[0].stock;
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

          // Inserción en lote en una sola instrucción SQL de Kardex
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

