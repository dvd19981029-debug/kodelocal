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

    const formatted = purchases.map((p) => ({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      tipoDte: p.tipoDte,
      supplierId: p.supplierId,
      supplierName: p.supplierName,
      purchaseDate: p.purchaseDate ? p.purchaseDate.toISOString().split('T')[0] : '',
      dueDate: p.dueDate ? p.dueDate.toISOString().split('T')[0] : undefined,
      creditDays: Number(p.creditDays || 0),
      docNumber: p.docNumber,
      controlNumber: p.controlNumber || undefined,
      condicion: p.condicion,
      paymentMethod: p.paymentMethod || undefined,
      paymentStatus: p.paymentStatus,
      subtotalNeto: Number(p.subtotalNeto || 0),
      iva: Number(p.iva || 0),
      total: Number(p.total || 0),
      saldoPendiente: Number(p.saldoPendiente || 0),
      notes: p.notes || undefined,
      receptionStatus: p.receptionStatus || 'RECIBIDO',
      receivedAt: p.receivedAt ? p.receivedAt.toISOString() : undefined,
      receivedBy: p.receivedBy || undefined,
      items: (p.items || []).map((it) => ({
        id: it.id,
        purchaseId: it.purchaseId,
        productId: it.productId || '',
        productName: it.productName,
        productSku: it.productSku || '',
        unit: it.unit || 'Onza',
        quantity: Number(it.quantity || 0),
        costPrice: Number(it.costPrice || 0),
        subtotal: Number(it.subtotal || 0),
      })),
      payments: (p.payments || []).map((pay) => ({
        id: pay.id,
        purchaseId: pay.purchaseId,
        date: pay.date ? pay.date.toISOString().split('T')[0] : '',
        amount: Number(pay.amount || 0),
        paymentMethod: pay.paymentMethod,
        reference: pay.reference || undefined,
        notes: pay.notes || undefined,
      })),
    }));

    return NextResponse.json({ success: true, purchases: formatted });
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
      receptionStatus,
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
          receptionStatus: receptionStatus || 'PENDIENTE',
          receivedAt: receptionStatus === 'RECIBIDO' ? new Date() : null,
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

      // 2. Si la compra es de ingreso directo (RECIBIDO), aumentar stock y Kardex de una vez
      if (receptionStatus === 'RECIBIDO' && items && Array.isArray(items)) {
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
      } else if (items && Array.isArray(items)) {
        // Si queda PENDIENTE de bodega, actualizamos solo el costo de compra en catálogo
        for (const it of items) {
          if (it.productId && Number(it.costPrice) > 0) {
            await tx.product.update({
              where: { id: it.productId },
              data: { cost: Number(it.costPrice) },
            });
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { purchaseId, action, receivedBy, receivedNotes, items } = body;

    if (!purchaseId) {
      return NextResponse.json({ success: false, error: 'purchaseId es requerido' }, { status: 400 });
    }

    if (action === 'receive') {
      const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.findUnique({
          where: { id: purchaseId },
          include: { items: true },
        });

        if (!purchase) {
          throw new Error('Compra no encontrada en Supabase');
        }

        if (purchase.receptionStatus === 'RECIBIDO') {
          return { purchase, alreadyReceived: true };
        }

        // 1. Actualizar estado de compra a RECIBIDO con firma del bodeguero
        const updatedPurchase = await tx.purchase.update({
          where: { id: purchaseId },
          data: {
            receptionStatus: 'RECIBIDO',
            receivedAt: new Date(),
            receivedBy: receivedBy || 'Bodeguero en Turno',
            notes: receivedNotes ? `${purchase.notes || ''}\n[Bodega]: ${receivedNotes}`.trim() : purchase.notes,
          },
          include: { items: true, supplier: true, payments: true },
        });

        // 2. Incrementar stock de productos e ingresar a Kardex
        const itemsToProcess = items && Array.isArray(items) ? items : purchase.items;

        for (const it of itemsToProcess) {
          const prodId = it.productId;
          if (prodId) {
            const product = await tx.product.findUnique({ where: { id: prodId } });
            if (product) {
              const prevStock = product.stock;
              const addedQty = Number(it.receivedQty ?? it.quantity ?? 0);
              const newStock = prevStock + addedQty;
              const costPrice = Number(it.costPrice || product.cost || 0);

              await tx.product.update({
                where: { id: product.id },
                data: {
                  stock: newStock,
                  ...(costPrice > 0 ? { cost: costPrice } : {}),
                },
              });

              await tx.stockMovement.create({
                data: {
                  productId: product.id,
                  type: 'IN_PURCHASE',
                  quantity: addedQty,
                  previousStock: prevStock,
                  newStock: newStock,
                  costPrice: costPrice,
                  userName: receivedBy || 'Bodeguero',
                  reference: `Ingreso a Bodega #${purchase.purchaseNumber} (Doc: ${purchase.docNumber})`,
                  notes: `Confrontado y recibido físicamente por ${receivedBy || 'Bodeguero'}`,
                },
              });
            }
          }
        }

        return { purchase: updatedPurchase };
      });

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ success: false, error: 'Acción no soportada' }, { status: 400 });
  } catch (error: any) {
    console.error('Error aplicando ingreso a bodega en Supabase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
