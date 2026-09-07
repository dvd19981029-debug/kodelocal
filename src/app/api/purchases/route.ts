import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        items: true,
        payments: true,
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return NextResponse.json({ success: true, purchases });
  } catch (error: any) {
    console.error('Error fetching purchases from Supabase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      purchaseNumber,
      tipoDte,
      supplierId,
      supplierName,
      purchaseDate,
      dueDate,
      creditDays,
      docNumber,
      controlNumber,
      condicion,
      paymentMethod,
      paymentStatus,
      subtotalNeto,
      iva,
      total,
      saldoPendiente,
      notes,
      items,
    } = body;

    // Crear la compra con sus ítems en una transacción de Supabase
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear registro de compra
      const createdPurchase = await tx.purchase.create({
        data: {
          purchaseNumber: purchaseNumber || `CMP-${Date.now().toString().slice(-6)}`,
          tipoDte: tipoDte || 'CCF',
          supplierId: supplierId || 'prov-1',
          supplierName: supplierName || 'Proveedor',
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          creditDays: Number(creditDays || 0),
          docNumber: docNumber || '000000',
          controlNumber: controlNumber || null,
          condicion: condicion || 'CONTADO',
          paymentMethod: paymentMethod || 'EFECTIVO',
          paymentStatus: paymentStatus || 'PAGADO',
          subtotalNeto: Number(subtotalNeto || 0),
          iva: Number(iva || 0),
          total: Number(total || 0),
          saldoPendiente: Number(saldoPendiente || 0),
          notes: notes || null,
          receptionStatus: 'RECIBIDO',
          receivedAt: new Date(),
          items: {
            create: (items || []).map((it: any) => ({
              productId: it.productId || null,
              productName: it.productName || 'Producto',
              productSku: it.productSku || null,
              unit: it.unit || 'Onza',
              quantity: Number(it.quantity || 1),
              costPrice: Number(it.costPrice || 0),
              subtotal: Number(it.subtotal || 0),
            })),
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      // 2. Aumentar stock de productos y actualizar costo en Supabase
      if (items && Array.isArray(items)) {
        for (const it of items) {
          if (it.productId) {
            const product = await tx.product.findUnique({ where: { id: it.productId } });
            if (product) {
              const prevStock = product.stock;
              const addedQty = Number(it.quantity || 0);
              const newStock = prevStock + addedQty;
              const newCost = Number(it.costPrice) > 0 ? Number(it.costPrice) : Number(product.cost);

              await tx.product.update({
                where: { id: product.id },
                data: {
                  stock: newStock,
                  cost: newCost,
                },
              });

              // Registrar movimiento en el Kardex
              await tx.stockMovement.create({
                data: {
                  productId: product.id,
                  type: 'IN_PURCHASE',
                  quantity: addedQty,
                  previousStock: prevStock,
                  newStock: newStock,
                  reference: `Compra #${createdPurchase.purchaseNumber} (Doc: ${createdPurchase.docNumber})`,
                  notes: `Ingreso por compra a ${createdPurchase.supplierName}`,
                },
              });
            }
          }
        }
      }

      return createdPurchase;
    });

    return NextResponse.json({ success: true, purchase: result });
  } catch (error: any) {
    console.error('Error saving purchase to Supabase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
