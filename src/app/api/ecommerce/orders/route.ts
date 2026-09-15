import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWompiTransaction } from '@/lib/wompi';
import { verifyCustomerToken, verifyStaffInternalToken } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDocument } from '@/lib/sanitize';
import { sendOrderConfirmationEmail } from '@/lib/orderEmailService';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryCustomerId = searchParams.get('customerId');
    const queryOrderNumbers = searchParams.get('orderNumbers');
    const queryOrderNumber = searchParams.get('orderNumber');
    const status = searchParams.get('status');
    const includeIncomplete = searchParams.get('includeIncomplete') === 'true';

    // Manejo de consulta de pedidos para INVITADOS (Guest Mode) por números de orden
    const guestNumbersRaw = [
      ...(queryOrderNumbers ? queryOrderNumbers.split(',') : []),
      ...(queryOrderNumber ? [queryOrderNumber] : [])
    ]
      .map(num => num.trim().toUpperCase())
      .filter(num => num.length > 0 && /^[A-Z0-9\-]+$/.test(num))
      .slice(0, 20);

    const isGuestQuery = guestNumbersRaw.length > 0;

    // 1. Verificar autenticación: Staff vs Cliente (omitido si es consulta explícita de invitado con números de orden)
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');

    const isStaff = verifyStaffInternalToken(staffHeaderToken) || verifyStaffInternalToken(bearerToken);
    const customerPayload = verifyCustomerToken(bearerToken);

    // SEC-BOLA-01: Proteger consultas de invitados contra ataques de fuerza bruta / scraping
    if (isGuestQuery && !isStaff && !customerPayload) {
      const rl = await checkRateLimit(request, {
        keyPrefix: 'guest_order_lookup',
        maxRequests: 30,
        windowMs: 60 * 1000,
      });
      if (!rl.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Has superado el límite de consultas de pedidos. Por favor espera ${rl.resetSeconds} segundos.`,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(rl.resetSeconds) },
          }
        );
      }
    }

    if (!isGuestQuery && !isStaff && !customerPayload) {
      return NextResponse.json(
        {
          success: false,
          error: 'Acceso no autorizado. Se requiere autenticación de cliente o personal para consultar pedidos.',
        },
        { status: 401 }
      );
    }

    // 2. Determinar el customerId efectivo
    // Si es un cliente autenticado, FORZAR su propio customerId (inmune a BOLA / IDOR / spoofing)
    // Si es staff operativo, puede consultar pedidos globales o filtrar por un customerId específico
    let targetCustomerId: string | undefined = undefined;
    if (customerPayload) {
      targetCustomerId = customerPayload.customerId;
    } else if (isStaff && queryCustomerId) {
      targetCustomerId = queryCustomerId;
    }

    const orders = await prisma.ecommerceOrder.findMany({
      where: {
        ...(isGuestQuery ? {
          orderNumber: { in: guestNumbersRaw },
        } : {
          ...(targetCustomerId ? {
            customerId: targetCustomerId,
            // Para el cliente, excluir intentos de pago con tarjeta abandonados o nunca pagados
            ...(!includeIncomplete ? {
              NOT: {
                AND: [
                  { paymentMethod: 'CARD' },
                  { OR: [{ paymentStatus: 'PENDING' }, { paymentStatus: 'CANCELLED' }] },
                ],
              },
            } : {}),
          } : {}),
        }),
        ...(status ? { orderStatus: status as any } : {}),
      },
      include: {
        customer: true,
        sale: {
          include: {
            dteDocument: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      department: o.department,
      municipality: o.municipality,
      shippingAddress: o.shippingAddress,
      deliveryReference: o.deliveryReference,
      subtotal: Number(o.subtotal || 0),
      shippingCost: Number(o.shippingCost || 0),
      total: Number(o.total || 0),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      trackingNumber: o.trackingNumber,
      courierName: o.courierName,
      whatsappNotified: o.whatsappNotified,
      notes: o.notes,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      customer: isStaff ? o.customer : undefined,
      sale: isStaff ? o.sale : undefined,
      items: (o.items || []).map((it) => {
        const prod = it.product;
        const officialName = prod?.officialName?.trim();
        const displayName = officialName || it.productName;
        const isEssence = String(it.presentation || '').toLowerCase().includes('onza') ||
                          Boolean(prod?.name && prod?.name !== officialName);
        const inspired = isEssence && prod ? getInspiracionPerfumeName(prod) : null;
        return {
          id: it.id,
          orderId: it.orderId,
          productId: it.productId,
          productName: displayName,
          inspiredBy: inspired,
          presentation: it.presentation,
          unitPrice: Number(it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
          total: Number(it.total || 0),
          product: prod ? {
            ...prod,
            price: Number(prod.price || 0),
            cost: isStaff ? Number(prod.cost || 0) : undefined,
          } : null,
        };
      }),
    }));

    return NextResponse.json({ success: true, orders: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, orderNumber, orderStatus, paymentStatus, courierName, trackingNumber, notes, restock } = body;

    if (!orderId && !orderNumber) {
      return NextResponse.json({ success: false, error: 'orderId o orderNumber es requerido' }, { status: 400 });
    }

    const order = await prisma.ecommerceOrder.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(orderNumber ? [{ orderNumber }] : []),
        ],
      },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Autenticación de la solicitud: ¿Es personal interno (bodega/admin) o cliente?
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const isStaff = verifyStaffInternalToken(staffHeaderToken) || verifyStaffInternalToken(bearerToken);
    const customerPayload = verifyCustomerToken(bearerToken);

    // SEC-02: Control de autorización de despacho (BOLA / IDOR)
    // Solo personal autorizado con token de staff puede modificar estado de entrega, despachar o cambiar courier
    const isUpdatingStaffFields = Boolean(
      courierName ||
      trackingNumber ||
      (orderStatus && ['PROCESANDO', 'LISTO_ENTREGA', 'EN_RUTA', 'ENTREGADO'].includes(orderStatus))
    );
    if (isUpdatingStaffFields && !isStaff) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado: Se requieren permisos de personal para actualizar el estado logístico de la orden.' },
        { status: 403 }
      );
    }

    // Si se intenta cancelar, validar que sea staff o sea el checkout de tarjeta pendiente del propio usuario
    const isAttemptingCancellation = orderStatus === 'CANCELADO' || paymentStatus === 'CANCELLED' || paymentStatus === 'REJECTED';
    if (isAttemptingCancellation && !isStaff) {
      const isPendingCardAttempt = order.paymentMethod === 'CARD' && order.paymentStatus === 'PENDING';
      const isOwnerCustomer = customerPayload && order.customerId === customerPayload.customerId;
      if (!isPendingCardAttempt && !isOwnerCustomer) {
        return NextResponse.json(
          { success: false, error: 'No autorizado para cancelar este pedido.' },
          { status: 403 }
        );
      }
    }

    // SEC-01: Protección contra marcado arbitrario de pedidos como COMPLETED
    if (paymentStatus === 'COMPLETED') {
      if (order.paymentStatus === 'COMPLETED') {
        return NextResponse.json({ success: true, order });
      }

      // Exigir ID de transacción y verificarla directamente con la API oficial de Wompi
      const txId = body.transactionId || body.idTransaccion;
      if (!txId) {
        return NextResponse.json(
          { success: false, error: 'No autorizado: se requiere comprobante/ID de transacción bancaria verificado.' },
          { status: 403 }
        );
      }

      try {
        const txData = await getWompiTransaction(String(txId));
        const isApproved = txData.esAprobada === true || txData.resultadoTransaccion === 'ExitosaAprobada';
        const numMatches = !txData.identificadorEnlaceComercio || txData.identificadorEnlaceComercio === order.orderNumber;
        const txMonto = Number(txData.monto ?? txData.Monto ?? 0);
        const orderTotal = Number(order.total);

        if (!isApproved || !numMatches) {
          return NextResponse.json(
            { success: false, error: 'Transacción denegada o no corresponde a esta orden.' },
            { status: 403 }
          );
        }

        // SEC-FINANCIAL: Verificar que el monto pagado en Wompi cubra el total de la orden
        if (txMonto > 0 && txMonto < orderTotal - 0.05) {
          return NextResponse.json(
            { success: false, error: `El monto pagado ($${txMonto}) es menor al total de la orden ($${orderTotal}).` },
            { status: 403 }
          );
        }
      } catch (err: any) {
        console.error('Error validando transacción bancaria en Wompi:', err);
        return NextResponse.json(
          { success: false, error: 'Error verificando la autenticidad del pago con la pasarela bancaria.' },
          { status: 502 }
        );
      }
    }

    // SEC-01: Prohibir cancelaciones ilegítimas de órdenes pagadas o despachadas
    if (orderStatus === 'CANCELADO' || paymentStatus === 'CANCELLED' || paymentStatus === 'REJECTED') {
      if (order.paymentStatus === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'No se puede cancelar una orden con pago ya procesado y completado.' },
          { status: 400 }
        );
      }
      if (order.orderStatus === 'EN_RUTA' || order.orderStatus === 'ENTREGADO') {
        return NextResponse.json(
          { success: false, error: 'No se puede cancelar una orden en tránsito o entregada.' },
          { status: 400 }
        );
      }
    }

    // Si se cancela o rechaza el pedido y no estaba cancelado previamente (o se fuerza restock), restaurar existencias
    const isAlreadyCancelled = order.orderStatus === 'CANCELADO' || order.paymentStatus === 'CANCELLED';
    const isCancelling = (orderStatus === 'CANCELADO' || paymentStatus === 'CANCELLED' || paymentStatus === 'REJECTED' || restock === true) && !isAlreadyCancelled;
    if (isCancelling && order.items && order.items.length > 0) {
      for (const it of order.items) {
        if (it.productId) {
          const qty = Math.max(1, it.quantity || 1);
          const presLower = String(it.presentation || '').toLowerCase();
          const stockToRestore = (presLower.includes('media') || presLower.includes('½')) ? Math.ceil(qty * 0.5) : qty;
          try {
            await prisma.product.update({
              where: { id: it.productId },
              data: {
                stock: { increment: stockToRestore },
              },
            });
          } catch (stockErr) {
            console.warn(`No se pudo restaurar inventario para producto ${it.productId}:`, stockErr);
          }
        }
      }
    }

    const safePaymentStatus = (paymentStatus === 'REJECTED' || paymentStatus === 'CANCELLED' || isCancelling) ? 'CANCELLED' : paymentStatus;
    const safeOrderStatus = isCancelling ? 'CANCELADO' : orderStatus;

    const updated = await prisma.ecommerceOrder.update({
      where: { id: order.id },
      data: {
        ...(safeOrderStatus ? { orderStatus: safeOrderStatus } : {}),
        ...(safePaymentStatus ? { paymentStatus: safePaymentStatus } : {}),
        ...(courierName ? { courierName } : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(notes ? { notes: [order.notes, notes].filter(Boolean).join(' ') } : {}),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    // Enviar confirmación por correo si el pago se completó exitosamente (ej. retorno de Wompi)
    if (safePaymentStatus === 'COMPLETED' && order.paymentStatus !== 'COMPLETED' && updated.customerEmail) {
      try {
        await sendOrderConfirmationEmail({
          orderNumber: updated.orderNumber,
          customerName: updated.customerName,
          customerEmail: updated.customerEmail,
          customerPhone: updated.customerPhone,
          department: updated.department,
          municipality: updated.municipality,
          shippingAddress: updated.shippingAddress,
          deliveryReference: updated.deliveryReference,
          subtotal: Number(updated.subtotal || 0),
          shippingCost: Number(updated.shippingCost || 0),
          total: Number(updated.total || 0),
          paymentMethod: updated.paymentMethod,
          paymentStatus: updated.paymentStatus,
          items: (updated.items || []).map((it) => {
            const prod = (it as any).product;
            const officialName = prod?.officialName?.trim();
            const displayName = officialName || it.productName;
            const isEssence = String(it.presentation || '').toLowerCase().includes('onza') ||
                              Boolean(prod?.name && prod?.name !== officialName);
            const inspired = isEssence && prod ? getInspiracionPerfumeName(prod) : null;
            return {
              productName: displayName,
              inspiredBy: inspired,
              presentation: it.presentation,
              quantity: it.quantity,
              unitPrice: Number(it.unitPrice || 0),
              total: Number(it.total || 0),
            };
          }),
        });
      } catch (err) {
        console.error('Error enviando correo de confirmación de pedido (PATCH):', err);
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting para creación de pedidos (SEC-05 / REQ-SEC-01)
    const rl = await checkRateLimit(request, {
      keyPrefix: 'ecommerce_orders_create',
      maxRequests: 10,
      windowMs: 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Has alcanzado el límite de creación de pedidos. Por favor espera ${rl.resetSeconds} segundos antes de intentar nuevamente.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.resetSeconds) },
        }
      );
    }

    const body = await request.json();
    const {
      orderNumber,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      department,
      municipality,
      shippingAddress,
      deliveryReference,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
      items,
      notes,
      numDoc,
      nrc,
      giro,
      tipoComprobante,
    } = body;

    // Sanitización estricta de entradas (SEC-07)
    const cleanCustomerName = sanitizeText(customerName, 100) || 'Cliente Online';
    const cleanCustomerEmail = sanitizeEmail(customerEmail);
    const cleanCustomerPhone = sanitizePhone(customerPhone) || '';
    const cleanDepartment = sanitizeText(department, 50) || 'San Salvador';
    const cleanMunicipality = sanitizeText(municipality, 60) || 'San Salvador Centro';
    const cleanShippingAddress = sanitizeText(shippingAddress, 255);
    const cleanDeliveryReference = sanitizeText(deliveryReference, 255) || null;
    const cleanNotes = sanitizeText(notes, 500) || null;
    const cleanNumDoc = sanitizeDocument(numDoc, 30) || '00000000-0';
    const cleanNrc = sanitizeDocument(nrc, 30) || null;
    const cleanGiro = sanitizeText(giro, 200) || null;
    const cleanTipoComprobante = sanitizeText(tipoComprobante, 10) || '01';

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && (cleanCustomerEmail || cleanCustomerPhone || cleanCustomerName)) {
      try {
        let cust = await prisma.customer.findFirst({
          where: {
            OR: [
              ...(cleanCustomerEmail ? [{ email: cleanCustomerEmail }] : []),
              ...(cleanCustomerPhone ? [{ phone: cleanCustomerPhone }] : []),
            ],
          },
        });

        if (cust) {
          cust = await prisma.customer.update({
            where: { id: cust.id },
            data: {
              ...(cleanNumDoc ? { documentNum: cleanNumDoc } : {}),
              ...(cleanNrc ? { nrc: cleanNrc } : {}),
              ...(cleanGiro ? { activityDesc: cleanGiro } : {}),
              ...(cleanTipoComprobante ? { preferredDoc: cleanTipoComprobante } : {}),
              ...(cleanShippingAddress && !cust.address ? { address: cleanShippingAddress } : {}),
              ...(cleanDepartment && !cust.department ? { department: cleanDepartment } : {}),
              ...(cleanMunicipality && !cust.municipality ? { municipality: cleanMunicipality } : {}),
            },
          });
          resolvedCustomerId = cust.id;
        } else {
          cust = await prisma.customer.create({
            data: {
              name: cleanCustomerName,
              email: cleanCustomerEmail || null,
              phone: cleanCustomerPhone || null,
              documentType: cleanTipoComprobante === '03' ? 'NIT' : 'DUI',
              documentNum: cleanNumDoc,
              nrc: cleanNrc,
              activityDesc: cleanGiro,
              preferredDoc: cleanTipoComprobante,
              department: cleanDepartment,
              municipality: cleanMunicipality,
              address: cleanShippingAddress || null,
            },
          });
          resolvedCustomerId = cust.id;
        }
      } catch (custErr) {
        console.error('Error asociando cliente a la orden:', custErr);
      }
    }

    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Validar existencias y verificar precios legítimos directamente en la base de datos
      const verifiedItems: {
        productId: string;
        productName: string;
        presentation: string;
        unitPrice: number;
        quantity: number;
        total: number;
      }[] = [];

      let verifiedSubtotal = 0;

      // Obtener configuración global de kit de perfume (base y extra shot)
      let dynamicKitBasePrice = 15.00;
      let dynamicExtraShotPrice = 3.00;
      try {
        const catConfig = await tx.category.findFirst({
          where: {
            OR: [
              { name: 'Esencias para Perfume' },
              { slug: 'esencias-para-perfume' },
            ],
          },
        });
        if (catConfig?.description) {
          try {
            const parsed = JSON.parse(catConfig.description);
            if (typeof parsed.basePrice === 'number' && !isNaN(parsed.basePrice) && parsed.basePrice > 0) {
              dynamicKitBasePrice = parsed.basePrice;
            }
            if (typeof parsed.extraShotPrice === 'number' && !isNaN(parsed.extraShotPrice) && parsed.extraShotPrice >= 0) {
              dynamicExtraShotPrice = parsed.extraShotPrice;
            }
          } catch (_) {}
        }
      } catch (_) {}

      // 1. Identificar todos los productos referenciados para consulta en lote (REQ-DB-03)
      const requestedItems = Array.isArray(items) ? items : [];
      const productIdsToFetch = new Set<string>();

      for (const it of requestedItems) {
        if (!it.productId) continue;
        if (it.productId.startsWith('kit-')) {
          const parts = it.productId.split('-');
          const essenceId = parts[1];
          if (essenceId) productIdsToFetch.add(essenceId);
        } else {
          productIdsToFetch.add(it.productId);
        }
      }

      // Consulta en lote de todos los productos del carrito en una sola llamada SQL
      const fetchedProducts = productIdsToFetch.size > 0
        ? await tx.product.findMany({
            where: { id: { in: Array.from(productIdsToFetch) } },
            include: { category: true },
          })
        : [];
      const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

      // Fallback para kits si fuera necesario
      let defaultFallbackProdId: string | null = null;

      // Acumulador de deducción de stock por producto (unifica múltiples items que compartan la misma esencia)
      const stockDeltas = new Map<string, number>();

      for (const it of requestedItems) {
        const qty = Math.max(1, parseInt(it.quantity || 1, 10));
        const presentationStr = String(it.presentation || it.presentationName || '1 Onza').trim();
        const presLower = presentationStr.toLowerCase();

        // Si es un kit preparado de "Arma tu perfume"
        if (it.productId && it.productId.startsWith('kit-')) {
          const isPlus = presLower.includes('plus') || presLower.includes('1.5');
          const parts = it.productId.split('-');
          const essenceId = parts[1];

          let targetProductId = '';
          let baseKitPrice = dynamicKitBasePrice;

          if (essenceId) {
            const essenceProd = productMap.get(essenceId);
            if (essenceProd) {
              targetProductId = essenceProd.id;
              if (essenceProd.finishedPerfumePrice != null) {
                baseKitPrice = Number(essenceProd.finishedPerfumePrice);
              }
              const stockNeeded = isPlus ? Math.ceil(qty * 1.5) : qty;
              stockDeltas.set(essenceProd.id, (stockDeltas.get(essenceProd.id) || 0) + stockNeeded);
            }
          }

          const kitUnitPrice = isPlus ? Number((baseKitPrice + dynamicExtraShotPrice).toFixed(2)) : baseKitPrice;
          const lineTotal = Number((kitUnitPrice * qty).toFixed(2));
          verifiedSubtotal += lineTotal;

          if (!targetProductId) {
            if (!defaultFallbackProdId) {
              const fallbackProd = await tx.product.findFirst();
              if (fallbackProd) defaultFallbackProdId = fallbackProd.id;
            }
            if (defaultFallbackProdId) targetProductId = defaultFallbackProdId;
          }

          if (targetProductId) {
            verifiedItems.push({
              productId: targetProductId,
              productName: it.productName || it.name || (isPlus ? 'Perfume Preparado PLUS (100ml)' : 'Perfume Preparado (100ml)'),
              presentation: presentationStr,
              unitPrice: kitUnitPrice,
              quantity: qty,
              total: lineTotal,
            });
          }
          continue;
        }

        if (!it.productId) continue;

        const prod = productMap.get(it.productId);
        if (!prod) {
          throw new Error(`El producto solicitado ya no se encuentra disponible.`);
        }

        // Determinar precio unitario legítimo según categoría y presentación directamente desde BD
        let legitimateUnitPrice = Number(prod.price || 0);
        const catName = prod.category?.name || '';
        if (catName === 'Esencias para Perfume' || !catName) {
          if (presLower.includes('media') || presLower.includes('½') || presLower.includes('half')) {
            legitimateUnitPrice = prod.priceHalfOunce != null ? Number(prod.priceHalfOunce) : Number((legitimateUnitPrice / 2).toFixed(2));
          }
        }

        const lineTotal = Number((legitimateUnitPrice * qty).toFixed(2));
        verifiedSubtotal += lineTotal;

        // Descontar existencias: acumular en stockDeltas para ejecución atómica
        const stockToDeduct = (presLower.includes('media') || presLower.includes('½')) ? Math.ceil(qty * 0.5) : qty;
        stockDeltas.set(prod.id, (stockDeltas.get(prod.id) || 0) + stockToDeduct);

        verifiedItems.push({
          productId: prod.id,
          productName: prod.officialName?.trim() || prod.name,
          presentation: presentationStr,
          unitPrice: legitimateUnitPrice,
          quantity: qty,
          total: lineTotal,
        });
      }

      // 2. Descuento atómico de existencias en PostgreSQL con control estricto anti-overselling (REQ-DB-02)
      for (const [prodId, deductQty] of stockDeltas.entries()) {
        const prod = productMap.get(prodId);
        const prodName = prod?.officialName?.trim() || prod?.name || 'Producto';

        const updatedRows: Array<{ stock: number }> = await tx.$queryRaw`
          UPDATE "Product"
          SET "stock" = "stock" - ${deductQty},
              "updatedAt" = NOW()
          WHERE "id" = ${prodId} AND "stock" >= ${deductQty}
          RETURNING "stock"
        `;

        if (!updatedRows || updatedRows.length === 0) {
          throw new Error(`INSUFFICIENT_STOCK: Inventario insuficiente para "${prodName}".`);
        }
      }

      verifiedSubtotal = Number(verifiedSubtotal.toFixed(2));

      // Determinar costo de envío legítimo en el servidor
      const isRetiro = (cleanDeliveryReference && cleanDeliveryReference.includes('Retiro')) ||
                       (cleanShippingAddress && cleanShippingAddress.includes('Retiro')) ||
                       (cleanNotes && cleanNotes.includes('Retiro'));
      const verifiedShippingCost = isRetiro ? 0.00 : 3.50;
      const verifiedTotal = Number((verifiedSubtotal + verifiedShippingCost).toFixed(2));

      // 3. Crear la orden oficial de ecommerce con los precios y totales verificados
      return await tx.ecommerceOrder.create({
        data: {
          orderNumber: orderNumber || `WEB-${Math.floor(100000 + Math.random() * 900000)}`,
          customerId: resolvedCustomerId || null,
          customerName: cleanCustomerName,
          customerEmail: cleanCustomerEmail || null,
          customerPhone: cleanCustomerPhone,
          department: cleanDepartment,
          municipality: cleanMunicipality,
          shippingAddress: cleanShippingAddress,
          deliveryReference: cleanDeliveryReference,
          subtotal: verifiedSubtotal,
          shippingCost: verifiedShippingCost,
          total: verifiedTotal,
          paymentMethod: paymentMethod || 'CASH',
          paymentStatus: 'PENDING',
          orderStatus: 'NUEVO',
          notes: cleanNotes,
          items: {
            create: verifiedItems.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              presentation: it.presentation,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
              total: it.total,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });
    }, {
      maxWait: 10000, // Tiempo máximo para obtener conexión del pool (10s)
      timeout: 20000, // Tiempo máximo de ejecución para carritos con múltiples productos (20s)
    });

    // Enviar confirmación por correo (Google Apps Script)
    if (newOrder.customerEmail && (newOrder.paymentMethod === 'CASH' || newOrder.paymentMethod === 'TRANSFER')) {
      try {
        await sendOrderConfirmationEmail({
          orderNumber: newOrder.orderNumber,
          customerName: newOrder.customerName,
          customerEmail: newOrder.customerEmail,
          customerPhone: newOrder.customerPhone,
          department: newOrder.department,
          municipality: newOrder.municipality,
          shippingAddress: newOrder.shippingAddress,
          deliveryReference: newOrder.deliveryReference,
          subtotal: Number(newOrder.subtotal || 0),
          shippingCost: Number(newOrder.shippingCost || 0),
          total: Number(newOrder.total || 0),
          paymentMethod: newOrder.paymentMethod,
          paymentStatus: newOrder.paymentStatus,
          items: (newOrder.items || []).map((it) => {
            const prod = (it as any).product;
            const officialName = prod?.officialName?.trim();
            const displayName = officialName || it.productName;
            const isEssence = String(it.presentation || '').toLowerCase().includes('onza') ||
                              Boolean(prod?.name && prod?.name !== officialName);
            const inspired = isEssence && prod ? getInspiracionPerfumeName(prod) : null;
            return {
              productName: displayName,
              inspiredBy: inspired,
              presentation: it.presentation,
              quantity: it.quantity,
              unitPrice: Number(it.unitPrice || 0),
              total: Number(it.total || 0),
            };
          }),
        });
      } catch (err) {
        console.error('Error enviando correo de confirmación de pedido (POST):', err);
      }
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Error creating ecommerce order:', error);
    const isInsufficientStock = String(error?.message || '').includes('INSUFFICIENT_STOCK');
    const status = isInsufficientStock ? 409 : 400;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
