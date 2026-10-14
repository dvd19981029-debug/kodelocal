import { NextResponse } from 'next/server';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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
      return NextResponse.json({ success: false, error: 'Unauthorized: Se requiere autenticacion de administrador.' }, { status: 401 });
    }

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
      return NextResponse.json({ success: false, error: 'Unauthorized: Se requiere autenticacion de administrador.' }, { status: 401 });
    }

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

    // 0. Idempotencia: Si la venta ya existe registrada en la base de datos (ej: comanda enviada a Bodega que ahora se factura, o reconexión)
    const targetOrderStatus = orderStatus || 'COMPLETED';
    const targetPaymentStatus = paymentStatus || 'COMPLETED';
    const isIncomingCompleted = targetPaymentStatus === 'COMPLETED' || targetOrderStatus === 'COMPLETED';

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

        const wasAlreadyCompleted =
          existingSale.paymentStatus === 'COMPLETED' || existingSale.orderStatus === 'COMPLETED';
        const isCancelled =
          existingSale.orderStatus === 'CANCELLED' ||
          existingSale.orderStatus === 'CANCELADO' ||
          existingSale.orderStatus === 'ANULADA';

        // Si la venta existía como comanda pendiente (PENDING_PREPARATION / READY_AT_WINDOW) y ahora se está facturando/cobrando:
        if (isIncomingCompleted && !wasAlreadyCompleted && !isCancelled) {
          const claim = await prisma.sale.updateMany({
            where: {
              id: existingSale.id,
              paymentStatus: { not: 'COMPLETED' },
              OR: [{ orderStatus: null }, { orderStatus: { not: 'COMPLETED' } }],
            },
            data: {
              orderStatus: 'COMPLETED',
              paymentStatus: 'COMPLETED',
              ...(paymentMethod ? { paymentMethod } : {}),
              ...(tipoComprobante ? { tipoComprobante } : {}),
              ...(cashReceived !== undefined ? { cashReceived: cashReceived ? Number(cashReceived) : null } : {}),
              ...(cashChange !== undefined ? { cashChange: cashChange ? Number(cashChange) : null } : {}),
              ...(cashierName ? { cashierName } : {}),
            },
          });

          if (claim.count > 0 && existingSale.items && existingSale.items.length > 0) {
            const existingDeduction = await prisma.stockMovement.findFirst({
              where: {
                reference: {
                  in: [
                    `Venta #${existingSale.saleNumber}`,
                    `Cobro Comanda #${existingSale.saleNumber}`,
                    `Pedido Web #${existingSale.saleNumber}`,
                  ],
                },
                type: 'OUT_SALE',
              },
            });

            const isWebOrder =
              existingSale.channel === 'ONLINE' || String(existingSale.saleNumber || '').startsWith('WEB-');

            if (!existingDeduction && !isWebOrder) {
              await prisma.$transaction(async (tx) => {
                const productIds = Array.from(
                  new Set(existingSale.items.map((it) => it.productId).filter(Boolean))
                ) as string[];
                const dbProducts = productIds.length > 0
                  ? await tx.product.findMany({ where: { id: { in: productIds } } })
                  : [];
                const productMap = new Map(dbProducts.map((p) => [p.id, p]));
                const stockDeltas = new Map<string, number>();
                const halfDeltas = new Map<string, number>();

                for (const it of existingSale.items) {
                  if (!it.productId || it.productId === 'ENVIO-DOM') continue;
                  const nameLower = String(it.productName || '').toLowerCase();
                  if (nameLower.includes('servicio de envío')) continue;
                  const prod = productMap.get(it.productId);
                  if (!prod) continue;

                  const unitLower = String(it.unit || '').toLowerCase();
                  const isHalfOz =
                    unitLower.includes('media') ||
                    unitLower.includes('½') ||
                    nameLower.includes('media onza') ||
                    nameLower.includes('½');
                  const qty = Math.max(1, Number(it.quantity || 1));

                  if (isHalfOz) {
                    halfDeltas.set(prod.id, (halfDeltas.get(prod.id) || 0) + qty);
                  } else {
                    stockDeltas.set(prod.id, (stockDeltas.get(prod.id) || 0) + qty);
                  }
                }

                for (const [prodId, totalDeduct] of stockDeltas.entries()) {
                  const updatedRows: Array<{ stock: number }> = await tx.$queryRaw`
                    UPDATE "Product"
                    SET "stock" = GREATEST(0, "stock" - ${totalDeduct}),
                        "updatedAt" = NOW()
                    WHERE "id" = ${prodId}
                    RETURNING "stock"
                  `;
                  const newStock = updatedRows && updatedRows.length > 0 ? updatedRows[0].stock : 0;
                  await tx.stockMovement.create({
                    data: {
                      productId: prodId,
                      type: 'OUT_SALE',
                      quantity: totalDeduct,
                      previousStock: newStock + totalDeduct,
                      newStock,
                      reference: `Cobro Comanda #${existingSale.saleNumber}`,
                      notes: `Venta cobrada por ${cashierName || existingSale.cashierName || 'Caja'} (${paymentMethod || existingSale.paymentMethod})`,
                      userName: cashierName || existingSale.cashierName || 'Sistema (Caja)',
                    },
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
                  await tx.stockMovement.create({
                    data: {
                      productId: prodId,
                      type: 'OUT_SALE',
                      quantity: totalHalf,
                      previousStock: newHalf + totalHalf,
                      newStock: newHalf,
                      reference: `Cobro Comanda #${existingSale.saleNumber}`,
                      notes: `½ Onza • Venta cobrada por ${cashierName || existingSale.cashierName || 'Caja'} (${paymentMethod || existingSale.paymentMethod})`,
                      userName: cashierName || existingSale.cashierName || 'Sistema (Caja)',
                    },
                  });
                }
              });
            }

            if (!existingSale.payments || existingSale.payments.length === 0) {
              await prisma.salePayment.create({
                data: {
                  saleId: existingSale.id,
                  amount: Number(total || existingSale.total || 0),
                  paymentMethod: paymentMethod || existingSale.paymentMethod || 'CASH',
                  reference: paymentReference || null,
                  notes: cashReceived ? `Efectivo recibido: $${Number(cashReceived).toFixed(2)}, Cambio: $${Number(cashChange || 0).toFixed(2)}` : null,
                  cashierName: cashierName || existingSale.cashierName || 'Caja 1',
                  shiftId: existingSale.shiftId || null,
                },
              });
            }
          }

          const refreshedSale = await prisma.sale.findUnique({
            where: { id: existingSale.id },
            include: { items: true, customer: true, dteDocument: true, payments: true },
          });
          return NextResponse.json({
            success: true,
            sale: refreshedSale || existingSale,
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

    // Pre-validar y resolver productos en DB con precisión (por ID, SKU, código de barras o nombre)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Venta Fantasma Detectada: La orden no puede ser procesada sin artículos.' }, { status: 400 });
    }
    const rawItems = Array.isArray(items) ? items : [];
    const rawProductIds = rawItems
      .map((it: any) => String(it.productId || '').trim())
      .filter((id: string) => id.length > 0 && id !== 'ENVIO-DOM');

    const existingDbProducts = await prisma.product.findMany({
      where: rawProductIds.length > 0
        ? {
            OR: [
              { id: { in: rawProductIds } },
              { sku: { in: rawProductIds } },
              { barcode: { in: rawProductIds } },
            ],
          }
        : undefined,
    });

    const byId = new Map(existingDbProducts.map((p) => [p.id, p]));
    const bySku = new Map(
      existingDbProducts.filter((p) => p.sku).map((p) => [String(p.sku).toLowerCase().trim(), p])
    );
    const byBarcode = new Map(
      existingDbProducts.filter((p) => p.barcode).map((p) => [String(p.barcode).toLowerCase().trim(), p])
    );

    let fallbackProduct = existingDbProducts[0];
    if (!fallbackProduct) {
      fallbackProduct = (await prisma.product.findFirst({ select: { id: true, name: true } })) as any;
    }

    const resolvedItems: any[] = [];
    for (const it of rawItems) {
      const rawId = String(it.productId || '').trim();
      const rawName = String(it.name || it.productName || 'Producto').trim();
      const nameLower = rawName.toLowerCase();

      const isServiceItem =
        rawId === 'ENVIO-DOM' ||
        it.tipoItem === 2 ||
        nameLower.includes('servicio de envío');

      let matchedProd = !isServiceItem
        ? byId.get(rawId) || bySku.get(rawId.toLowerCase()) || byBarcode.get(rawId.toLowerCase())
        : undefined;

      // Si aún no coincidió por ID/SKU y no es un servicio, buscar por nombre limpio en la DB
      if (!matchedProd && !isServiceItem && rawName) {
        const cleanBaseName = rawName
          .replace(/\s*\(½\s*Oz\)/gi, '')
          .replace(/\s*\(1\s*Onza\)/gi, '')
          .replace(/\s*\(Media\s*Onza\)/gi, '')
          .trim();
        matchedProd = (await prisma.product.findFirst({
          where: {
            OR: [
              { name: { equals: cleanBaseName, mode: 'insensitive' } },
              { officialName: { equals: cleanBaseName, mode: 'insensitive' } },
            ],
          },
        })) as any;
        if (matchedProd) {
          byId.set(matchedProd.id, matchedProd);
        }
      }

      const unitLower = String(it.unit || '').toLowerCase();
      const presUpper = String(it.presentation || '').toUpperCase();
      const isHalfOz =
        presUpper === 'MEDIA_ONZA' ||
        unitLower.includes('media') ||
        unitLower.includes('½') ||
        nameLower.includes('media onza') ||
        nameLower.includes('½');

      const finalProductId = matchedProd ? matchedProd.id : (fallbackProduct?.id || 'esencia-apae-001');
      const skipStockDeduction = isServiceItem || !matchedProd;

      resolvedItems.push({
        productId: finalProductId,
        productName: rawName,
        quantity: Math.max(1, Math.round(Number(it.quantity || 1))),
        unitPrice: Number(it.unitPrice || it.price || 0),
        ivaRate: 0.13,
        total: Number(it.total || 0),
        presentation: isHalfOz ? 'MEDIA_ONZA' : (it.presentation || 'ONZA_COMPLETA'),
        unit: isServiceItem ? 'Servicio' : isHalfOz ? '½ Onza' : (it.unit || 'Onza'),
        puesto: it.puesto || matchedProd?.puesto || null,
        isHalfOz,
        skipStockDeduction,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Venta principal
      
      // Auto-asignar al turno abierto si no se especifica y viene del POS
      let actualShiftId = shiftId;
      if (!actualShiftId && (channel === 'POS' || !channel)) {
        const activeShift = await tx.cashShift.findFirst({
          where: { status: 'OPEN' },
          orderBy: { openedAt: 'desc' }
        });
        if (activeShift) {
          actualShiftId = activeShift.id;
        }
      }

      let validCustomerId: string | null = null;
      if (customerId) {
        const foundCust = await tx.customer.findUnique({
          where: { id: String(customerId) },
          select: { id: true },
        });
        if (foundCust) validCustomerId = foundCust.id;
      }
      if (!validCustomerId) {
        const clientEmail = String(body.cliente?.email || body.cliente?.correo || '').trim().toLowerCase();
        if (clientEmail) {
          const foundByEmail = await tx.customer.findFirst({
            where: { email: { equals: clientEmail, mode: 'insensitive' } },
            select: { id: true },
          });
          if (foundByEmail) validCustomerId = foundByEmail.id;
        }
      }

      // Verificar si corresponde a un pedido de Ecommerce existente (cuyo stock YA fue descontado al crear el pedido web)
      const isOnlineOrderNumber = String(saleNumber || '').startsWith('WEB-');
      const linkedEcommerceOrder = saleNumber
        ? await tx.ecommerceOrder.findUnique({
            where: { orderNumber: String(saleNumber) },
            select: { id: true, customerId: true },
          })
        : null;

      if (!validCustomerId && linkedEcommerceOrder?.customerId) {
        validCustomerId = linkedEcommerceOrder.customerId;
      }

      const effectiveChannel =
        linkedEcommerceOrder || isOnlineOrderNumber || channel === 'ONLINE' ? 'ONLINE' : (channel || 'POS');

      const createdSale = await tx.sale.create({
        data: {
          saleNumber: saleNumber || `VEN-${Date.now().toString().slice(-6)}`,
          channel: effectiveChannel,
          tipoComprobante: tipoComprobante || (notes === '01' || notes === '03' ? notes : 'TICKET'),
          orderStatus: targetOrderStatus,
          subtotal: Number(subtotal || 0),
          ivaTotal: Number(ivaTotal || 0),
          discountTotal: Number(discountTotal || 0),
          total: Number(total || 0),
          paymentMethod: paymentMethod || 'CASH',
          paymentStatus: targetPaymentStatus,
          cashReceived: cashReceived ? Number(cashReceived) : null,
          cashChange: cashChange ? Number(cashChange) : null,
          notes: notes || null,
          cashierName: cashierName || 'Caja 1',
          customerId: validCustomerId,
          shiftId: actualShiftId || null,
          items: {
            create: resolvedItems.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              ivaRate: it.ivaRate,
              total: it.total,
              unit: it.unit,
              puesto: it.puesto,
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

      // 1.2 Si corresponde a una orden de Ecommerce, vincular la venta a EcommerceOrder.saleId
      if (linkedEcommerceOrder) {
        await tx.ecommerceOrder.update({
          where: { id: linkedEcommerceOrder.id },
          data: { saleId: createdSale.id },
        });
      }

      // 2. Registrar el PAGO RECIBIDO en la tabla SalePayment SOLO si la venta ya está pagada/completada
      let paymentRecord = null;
      if (isIncomingCompleted) {
        paymentRecord = await tx.salePayment.create({
          data: {
            saleId: createdSale.id,
            amount: Number(total || 0),
            paymentMethod: paymentMethod || 'CASH',
            reference: paymentReference || null,
            notes: cashReceived ? `Efectivo recibido: $${Number(cashReceived).toFixed(2)}, Cambio: $${Number(cashChange || 0).toFixed(2)}` : null,
            cashierName: cashierName || 'Caja 1',
            shiftId: actualShiftId || null,
          },
        });
      }

      // 3. Descontar existencias y asentar Kardex en lote (OUT_SALE) SOLO SI:
      //    - La venta está facturada/completada (no es una comanda pendiente de cobro)
      //    - NO es una orden web cuyo inventario ya se descontó en POST /api/ecommerce/orders
      //    - NO tiene ya un movimiento OUT_SALE previo para este número de venta
      const priorMovement = await tx.stockMovement.findFirst({
        where: {
          reference: {
            in: [
              `Venta #${createdSale.saleNumber}`,
              `Cobro Comanda #${createdSale.saleNumber}`,
              `Pedido Web #${createdSale.saleNumber}`,
            ],
          },
          type: 'OUT_SALE',
        },
      });

      const shouldDeductInventory =
        isIncomingCompleted &&
        !linkedEcommerceOrder &&
        !isOnlineOrderNumber &&
        effectiveChannel !== 'ONLINE' &&
        !priorMovement;

      if (shouldDeductInventory && resolvedItems.length > 0) {
        const physicalItems = resolvedItems.filter((it) => !it.skipStockDeduction && it.productId);
        const productIds = Array.from(new Set(physicalItems.map((it) => it.productId))) as string[];

        if (productIds.length > 0) {
          const dbProducts = await tx.product.findMany({
            where: { id: { in: productIds } },
          });
          const productMap = new Map(dbProducts.map((p) => [p.id, p]));

          const stockDeltas = new Map<string, number>();
          const halfDeltas = new Map<string, number>();
          for (const it of physicalItems) {
            const prod = productMap.get(it.productId);
            if (!prod) continue;

            const soldQty = Math.max(1, Number(it.quantity || 1));
            if (it.isHalfOz) {
              halfDeltas.set(prod.id, (halfDeltas.get(prod.id) || 0) + soldQty);
            } else {
              stockDeltas.set(prod.id, (stockDeltas.get(prod.id) || 0) + soldQty);
            }
          }

          const kardexData: Array<{
            productId: string;
            type: 'OUT_SALE';
            quantity: number;
            previousStock: number;
            newStock: number;
            reference: string;
            notes: string;
            userName: string;
          }> = [];

          for (const [prodId, totalDeduct] of stockDeltas.entries()) {
            const updatedRows: Array<{ stock: number }> = await tx.$queryRaw`
              UPDATE "Product"
              SET "stock" = GREATEST(0, "stock" - ${totalDeduct}),
                  "updatedAt" = NOW()
              WHERE "id" = ${prodId}
              RETURNING "stock"
            `;
            const newStock = updatedRows && updatedRows.length > 0 ? updatedRows[0].stock : 0;

            kardexData.push({
              productId: prodId,
              type: 'OUT_SALE',
              quantity: totalDeduct,
              previousStock: newStock + totalDeduct,
              newStock,
              reference: `Venta #${createdSale.saleNumber}`,
              notes: `Venta cobrada por ${cashierName || 'Caja'} (${paymentMethod || 'CASH'})`,
              userName: cashierName || 'Sistema (Caja)',
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
              notes: `½ Onza • Venta cobrada por ${cashierName || 'Caja'} (${paymentMethod || 'CASH'})`,
              userName: cashierName || 'Sistema (Caja)',
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
    const { id, saleNumber, orderStatus, paymentStatus, notes, tipoComprobante, customerId } = body;

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
      include: { items: true } // NECESARIO PARA RESTAURAR INVENTARIO Y FACTURAR
    });

    if (!sale) {
      return NextResponse.json({ success: false, error: 'Venta no encontrada' }, { status: 404 });
    }

    // Control de conflictos entre dispositivos: si el cliente indica el estado que esperaba
    // y la venta ya cambió (p. ej. Caja la cobró mientras Bodega la cancelaba), se rechaza.
    const { expectedStatus } = body as { expectedStatus?: string | string[] };
    if (expectedStatus) {
      const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      const current = sale.orderStatus || 'COMPLETED';
      if (!allowed.includes(current)) {
        return NextResponse.json(
          { success: false, error: 'La comanda cambió de estado en otro dispositivo', code: 'STATE_CONFLICT', currentStatus: current },
          { status: 409 }
        );
      }
    }

    const isAlreadyCancelled = sale.orderStatus === 'CANCELLED' || sale.orderStatus === 'CANCELADO' || sale.orderStatus === 'ANULADA';
    const isCancelling = (orderStatus === 'CANCELLED' || orderStatus === 'CANCELADO' || orderStatus === 'ANULADA') && !isAlreadyCancelled;
    
    const isAlreadyCompleted = sale.paymentStatus === 'COMPLETED' || sale.orderStatus === 'COMPLETED';

    // Una venta ya cancelada no puede completarse (evitaría descontar stock de una comanda anulada)
    if (isAlreadyCancelled && (paymentStatus === 'COMPLETED' || orderStatus === 'COMPLETED')) {
      return NextResponse.json(
        { success: false, error: 'La comanda ya fue cancelada', code: 'STATE_CONFLICT', currentStatus: sale.orderStatus },
        { status: 409 }
      );
    }

    const isCompletingNow = !isAlreadyCompleted && (paymentStatus === 'COMPLETED' || orderStatus === 'COMPLETED') && !isCancelling;

    // Reclamo atómico de la transición a COMPLETED: si dos peticiones llegan a la vez,
    // solo una obtiene count > 0 y descuenta el inventario.
    let shouldDeduct = isCompletingNow;
    if (isCompletingNow) {
      const claim = await prisma.sale.updateMany({
        where: {
          id: sale.id,
          paymentStatus: { not: 'COMPLETED' },
          OR: [{ orderStatus: null }, { orderStatus: { not: 'COMPLETED' } }],
        },
        data: {
          ...(orderStatus ? { orderStatus } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
        },
      });
      shouldDeduct = claim.count > 0;
    }

    // Si está transicionando a completado (ej. cobrando una comanda que estaba pendiente)
    if (shouldDeduct && sale.items && sale.items.length > 0) {
      const priorOutMovement = await prisma.stockMovement.findFirst({
        where: {
          reference: {
            in: [
              `Venta #${sale.saleNumber}`,
              `Cobro Comanda #${sale.saleNumber}`,
              `Pedido Web #${sale.saleNumber}`,
            ],
          },
          type: 'OUT_SALE',
        },
      });
      const isOnlineSale = sale.channel === 'ONLINE' || String(sale.saleNumber || '').startsWith('WEB-');

      if (!priorOutMovement && !isOnlineSale) {
        try {
          await prisma.$transaction(async (tx) => {
            const productIds = Array.from(new Set(sale.items.map((it) => it.productId).filter(Boolean))) as string[];
            if (productIds.length > 0) {
              const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });
              const productMap = new Map(dbProducts.map((p) => [p.id, p]));
              const stockDeltas = new Map<string, number>();
              const halfDeltas = new Map<string, number>();

              for (const it of sale.items) {
                if (!it.productId || it.productId === 'ENVIO-DOM') continue;
                const nameLower = String(it.productName || '').toLowerCase();
                if (nameLower.includes('servicio de envío')) continue;
                const prod = productMap.get(it.productId);
                if (!prod) continue;

                const unitLower = String(it.unit || '').toLowerCase();
                const isHalfOz =
                  unitLower.includes('media') ||
                  unitLower.includes('½') ||
                  nameLower.includes('media onza') ||
                  nameLower.includes('½');
                const qty = Math.max(1, Number(it.quantity || 1));

                if (isHalfOz) {
                  halfDeltas.set(prod.id, (halfDeltas.get(prod.id) || 0) + qty);
                } else {
                  stockDeltas.set(prod.id, (stockDeltas.get(prod.id) || 0) + qty);
                }
              }

              // Deducir normales
              for (const [prodId, totalDeduct] of stockDeltas.entries()) {
                const updatedRows: Array<{ stock: number }> = await tx.$queryRaw`
                  UPDATE "Product"
                  SET "stock" = GREATEST(0, "stock" - ${totalDeduct}),
                      "updatedAt" = NOW()
                  WHERE "id" = ${prodId}
                  RETURNING "stock"
                `;
                const newStock = updatedRows && updatedRows.length > 0 ? updatedRows[0].stock : 0;
                await tx.stockMovement.create({
                  data: {
                    productId: prodId,
                    type: 'OUT_SALE',
                    quantity: totalDeduct,
                    previousStock: newStock + totalDeduct,
                    newStock,
                    reference: `Cobro Comanda #${sale.saleNumber}`,
                    notes: 'Descuento de inventario post-facturación',
                    userName: 'Sistema (Caja)',
                  },
                });
              }

              // Deducir medias
              for (const [prodId, totalHalf] of halfDeltas.entries()) {
                const updatedRows: Array<{ stockHalf: number }> = await tx.$queryRaw`
                  UPDATE "Product"
                  SET "stockHalf" = GREATEST(0, "stockHalf" - ${totalHalf}),
                      "updatedAt" = NOW()
                  WHERE "id" = ${prodId}
                  RETURNING "stockHalf"
                `;
                if (updatedRows && updatedRows.length > 0) {
                  await tx.stockMovement.create({
                    data: {
                      productId: prodId,
                      type: 'OUT_SALE',
                      quantity: totalHalf,
                      previousStock: updatedRows[0].stockHalf + totalHalf,
                      newStock: updatedRows[0].stockHalf,
                      reference: `Cobro Comanda #${sale.saleNumber}`,
                      notes: '½ Onza - Descuento de inventario post-facturación',
                      userName: 'Sistema (Caja)',
                    },
                  });
                }
              }
            }
          });
        } catch (deductErr) {
          // Revertir el reclamo para que la comanda pueda reintentarse sin quedar completada sin descuento
          await prisma.sale.updateMany({
            where: { id: sale.id },
            data: {
              orderStatus: sale.orderStatus,
              paymentStatus: sale.paymentStatus,
            },
          });
          throw deductErr;
        }
      }
    }
    
    // Si se está CANCELANDO, solo devolver stock si realmente fue descontado previamente
    // (venta que ya estaba facturada/completada o con movimiento previo OUT_SALE en Kardex).
    // Las comandas en mostrador/ventanilla pendientes de cobro NUNCA descuentan stock, por lo que NO deben devolver stock para no inflar el inventario.
    const hasStockDeduction = isAlreadyCompleted || (await prisma.stockMovement.findFirst({
      where: {
        reference: { in: [`Venta #${sale.saleNumber}`, `Cobro Comanda #${sale.saleNumber}`] },
        type: 'OUT_SALE',
      },
    })) !== null;

    const alreadyRestocked = (await prisma.stockMovement.findFirst({
      where: {
        reference: `Anulación Venta #${sale.saleNumber}`,
        type: 'ADJUSTMENT',
      },
    })) !== null;

    // Reclamo atómico: solo una petición concurrente obtiene count > 0 y devuelve el stock.
    let shouldRestock = isCancelling && hasStockDeduction && !alreadyRestocked && body.restock !== false;
    if (shouldRestock) {
      const cancelClaim = await prisma.sale.updateMany({
        where: {
          id: sale.id,
          OR: [{ orderStatus: null }, { orderStatus: { notIn: ['CANCELLED', 'CANCELADO', 'ANULADA'] } }],
        },
        data: { orderStatus },
      });
      shouldRestock = cancelClaim.count > 0;
    }
    if (shouldRestock && sale.items && sale.items.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const it of sale.items) {
          if (it.productId && it.productId !== 'ENVIO-DOM') {
            const nameLower = String(it.productName || '').toLowerCase();
            if (nameLower.includes('servicio de envío')) continue;

            const qty = Math.max(1, it.quantity || 1);
            const presLower = String(it.unit || '').toLowerCase();
            const isHalfRestore =
              presLower.includes('media') ||
              presLower.includes('½') ||
              nameLower.includes('media onza') ||
              nameLower.includes('½');

            let updatedRows: Array<{ stock: number; stockHalf: number }> = [];
            if (isHalfRestore) {
              updatedRows = await tx.$queryRaw`
                UPDATE "Product"
                SET "stockHalf" = COALESCE("stockHalf", 0) + ${qty},
                    "updatedAt" = NOW()
                WHERE "id" = ${it.productId}
                RETURNING "stock", "stockHalf"
              `;
            } else {
              updatedRows = await tx.$queryRaw`
                UPDATE "Product"
                SET "stock" = COALESCE("stock", 0) + ${qty},
                    "updatedAt" = NOW()
                WHERE "id" = ${it.productId}
                RETURNING "stock", "stockHalf"
              `;
            }

            if (updatedRows && updatedRows.length > 0) {
              const currentStock = isHalfRestore ? updatedRows[0].stockHalf : updatedRows[0].stock;
              // Registrar movimiento en Kardex
              await tx.stockMovement.create({
                data: {
                  productId: it.productId,
                  type: 'ADJUSTMENT',
                  quantity: qty,
                  previousStock: Math.max(0, currentStock - qty),
                  newStock: currentStock,
                  reference: `Anulación Venta #${sale.saleNumber}`,
                  notes: `Restauración de inventario por cancelación de venta (${isHalfRestore ? '½ Onza' : 'Normal'})`,
                  userName: 'Sistema (Anulación)',
                }
              });
            }
          }
        }
      });
    }


    let updatedNotes: string | undefined = undefined;
    if (sale.notes && sale.notes.trim().startsWith('{')) {
      try {
        const lastBrace = sale.notes.lastIndexOf('}');
        const jsonPart = lastBrace !== -1 ? sale.notes.slice(0, lastBrace + 1) : sale.notes;
        const parsed = JSON.parse(jsonPart);
        if (tipoComprobante) parsed.tipoComprobante = tipoComprobante;
        if (notes) parsed.statusLog = [parsed.statusLog, notes].filter(Boolean).join(' ');
        updatedNotes = JSON.stringify(parsed);
      } catch (_) {
        if (notes) updatedNotes = [sale.notes, notes].filter(Boolean).join(' ');
      }
    } else if (notes) {
      updatedNotes = [sale.notes, notes].filter(Boolean).join(' ');
    }

    const updated = await prisma.sale.update({
      where: { id: sale.id },
      data: {
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(tipoComprobante ? { tipoComprobante } : {}),
        ...(customerId !== undefined ? { customerId: customerId || null } : {}),
        ...(updatedNotes !== undefined ? { notes: updatedNotes } : {}),
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

