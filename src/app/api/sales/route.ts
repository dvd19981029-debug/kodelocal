import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: true,
        payments: true,
        dteDocument: true,
        shift: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, sales });
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
    } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Venta principal
      const createdSale = await tx.sale.create({
        data: {
          saleNumber: saleNumber || `VEN-${Date.now().toString().slice(-6)}`,
          channel: channel || 'POS',
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
        },
      });

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

      // 3. Descontar existencias y asentar Kardex (OUT_SALE)
      if (items && Array.isArray(items)) {
        for (const it of items) {
          if (it.productId) {
            const prod = await tx.product.findUnique({ where: { id: it.productId } });
            if (prod) {
              const prev = prod.stock;
              const soldQty = Number(it.quantity || 0);
              const nextStock = Math.max(0, prev - soldQty);

              await tx.product.update({
                where: { id: prod.id },
                data: { stock: nextStock },
              });

              await tx.stockMovement.create({
                data: {
                  productId: prod.id,
                  type: 'OUT_SALE',
                  quantity: soldQty,
                  previousStock: prev,
                  newStock: nextStock,
                  reference: `Venta #${createdSale.saleNumber}`,
                  notes: `Venta cobrada por ${cashierName || 'Caja'} (${paymentMethod})`,
                },
              });
            }
          }
        }
      }

      return { sale: createdSale, payment: paymentRecord };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error procesando cobro de venta en Supabase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
