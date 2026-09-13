import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWompiTransaction } from '@/lib/wompi';
import { verifyCustomerToken, verifyStaffInternalToken } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDocument } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryCustomerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const includeIncomplete = searchParams.get('includeIncomplete') === 'true';

    // 1. Verificar autenticación: Staff vs Cliente
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');

    const isStaff = verifyStaffInternalToken(staffHeaderToken) || verifyStaffInternalToken(bearerToken);
    const customerPayload = verifyCustomerToken(bearerToken);

    if (!isStaff && !customerPayload) {
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
        ...(status ? { orderStatus: status as any } : {}),
      },
      include: {
        customer: true,
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
      customer: o.customer,
      items: (o.items || []).map((it) => ({
        id: it.id,
        orderId: it.orderId,
        productId: it.productId,
        productName: it.productName,
        presentation: it.presentation,
        unitPrice: Number(it.unitPrice || 0),
        quantity: Number(it.quantity || 1),
        total: Number(it.total || 0),
        product: it.product ? {
          ...it.product,
          price: Number(it.product.price || 0),
          cost: Number(it.product.cost || 0),
        } : null,
      })),
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

        if (!isApproved || !numMatches) {
          return NextResponse.json(
            { success: false, error: 'Transacción denegada o no corresponde a esta orden.' },
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
    const isCancelling = (orderStatus === 'CANCELADO' || paymentStatus === 'CANCELLED' || paymentStatus === 'REJECTED' || restock === true) && order.orderStatus !== 'CANCELADO';
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

    const safePaymentStatus = paymentStatus === 'REJECTED' ? 'CANCELLED' : paymentStatus;

    const updated = await prisma.ecommerceOrder.update({
      where: { id: order.id },
      data: {
        ...(orderStatus ? { orderStatus } : {}),
        ...(safePaymentStatus ? { paymentStatus: safePaymentStatus } : {}),
        ...(courierName ? { courierName } : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(notes ? { notes: [order.notes, notes].filter(Boolean).join(' ') } : {}),
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 0. Rate Limiting para creación de pedidos (SEC-05)
    const rl = checkRateLimit(request, {
      keyPrefix: 'ecommerce_orders_create',
      maxRequests: 10,
      windowMs: 5 * 60 * 1000,
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

      for (const it of (items || [])) {
        const qty = Math.max(1, parseInt(it.quantity || 1, 10));
        const presentationStr = String(it.presentation || it.presentationName || '1 Onza').trim();
        const presLower = presentationStr.toLowerCase();

        // Si es un kit preparado de "Arma tu perfume"
        if (it.productId && it.productId.startsWith('kit-')) {
          const isPlus = presLower.includes('plus') || presLower.includes('1.5');
          const kitUnitPrice = isPlus ? 18.00 : 15.00;
          const lineTotal = Number((kitUnitPrice * qty).toFixed(2));
          verifiedSubtotal += lineTotal;

          const parts = it.productId.split('-');
          const essenceId = parts[1];

          let targetProductId = '';
          if (essenceId) {
            const essenceProd = await tx.product.findUnique({
              where: { id: essenceId },
            });
            if (essenceProd) {
              targetProductId = essenceProd.id;
              const stockNeeded = isPlus ? Math.ceil(qty * 1.5) : qty;
              await tx.product.update({
                where: { id: essenceProd.id },
                data: {
                  stock: Math.max(0, essenceProd.stock - stockNeeded),
                },
              });
            }
          }

          if (!targetProductId) {
            const fallbackProd = await tx.product.findFirst();
            if (fallbackProd) targetProductId = fallbackProd.id;
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

        const prod = await tx.product.findUnique({
          where: { id: it.productId },
          include: { category: true },
        });

        if (!prod) {
          throw new Error(`El producto solicitado ya no se encuentra disponible.`);
        }

        // Determinar precio unitario legítimo según categoría y presentación
        let legitimateUnitPrice = Number(prod.price || 0);
        const catName = prod.category?.name || '';
        if (catName === 'Esencias para Perfume' || !catName) {
          if (presLower.includes('media') || presLower.includes('½') || presLower.includes('half')) {
            legitimateUnitPrice = Number((legitimateUnitPrice / 2).toFixed(2));
          }
        }

        const lineTotal = Number((legitimateUnitPrice * qty).toFixed(2));
        verifiedSubtotal += lineTotal;

        // Descontar existencias en la base de datos
        const stockToDeduct = (presLower.includes('media') || presLower.includes('½')) ? Math.ceil(qty * 0.5) : qty;
        if (prod.stock < stockToDeduct) {
          throw new Error(`Inventario insuficiente para ${prod.officialName || prod.name}. Disponibles: ${prod.stock}`);
        }

        await tx.product.update({
          where: { id: it.productId },
          data: {
            stock: Math.max(0, prod.stock - stockToDeduct),
          },
        });

        verifiedItems.push({
          productId: prod.id,
          productName: prod.officialName?.trim() || prod.name,
          presentation: presentationStr,
          unitPrice: legitimateUnitPrice,
          quantity: qty,
          total: lineTotal,
        });
      }

      verifiedSubtotal = Number(verifiedSubtotal.toFixed(2));

      // Determinar costo de envío legítimo en el servidor
      const isRetiro = (cleanDeliveryReference && cleanDeliveryReference.includes('Retiro')) ||
                       (cleanShippingAddress && cleanShippingAddress.includes('Retiro')) ||
                       (cleanNotes && cleanNotes.includes('Retiro'));
      const verifiedShippingCost = isRetiro ? 0.00 : 3.50;
      const verifiedTotal = Number((verifiedSubtotal + verifiedShippingCost).toFixed(2));

      // 2. Crear la orden oficial de ecommerce con los precios y totales verificados
      return await tx.ecommerceOrder.create({
        data: {
          orderNumber: orderNumber || `WEB-${Math.floor(1000 + Math.random() * 9000)}`,
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
          items: true,
          customer: true,
        },
      });
    }, {
      maxWait: 10000, // Tiempo máximo para obtener conexión del pool (10s)
      timeout: 20000, // Tiempo máximo de ejecución para carritos con múltiples productos (20s)
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Error creating ecommerce order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
