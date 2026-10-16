import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWompiTransaction } from '@/lib/wompi';
import { verifyCustomerToken, verifyStaffInternalToken, verifyStaffRequest } from '@/lib/customerAuthToken';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDocument } from '@/lib/sanitize';
import { sendOrderConfirmationEmail } from '@/lib/orderEmailService';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { resolveGiroMH, formatGiroOption } from '@/lib/svGirosCat019';
import { c807Client } from '@/lib/c807';

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

    const isStaff =
      verifyStaffRequest(request).authorized ||
      verifyStaffInternalToken(staffHeaderToken) ||
      verifyStaffInternalToken(bearerToken);
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

    if (targetCustomerId) {
      try {
        const custRecord = await prisma.customer.findUnique({
          where: { id: targetCustomerId },
          select: { id: true, email: true, documentNum: true },
        });
        if (custRecord) {
          const cleanEmail = custRecord.email?.trim();
          const cleanDoc = custRecord.documentNum?.trim();
          if (cleanEmail) {
            await prisma.ecommerceOrder.updateMany({
              where: {
                customerId: null,
                customerEmail: { equals: cleanEmail, mode: 'insensitive' },
              },
              data: { customerId: custRecord.id },
            });
            await prisma.sale.updateMany({
              where: {
                customerId: null,
                OR: [
                  { notes: { contains: cleanEmail, mode: 'insensitive' } },
                  { dteDocument: { requestJson: { contains: cleanEmail, mode: 'insensitive' } } },
                ],
              },
              data: { customerId: custRecord.id },
            });
          }
          if (cleanDoc && cleanDoc !== '00000000-0') {
            await prisma.sale.updateMany({
              where: {
                customerId: null,
                OR: [
                  { notes: { contains: cleanDoc } },
                  { dteDocument: { requestJson: { contains: cleanDoc } } },
                ],
              },
              data: { customerId: custRecord.id },
            });
          }
        }
      } catch (_) {}
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

    // Si se consulta un cliente específico, incluir también sus compras en tienda física (POS) para unificar su historial
    let formattedSales: any[] = [];
    if (targetCustomerId) {
      try {
        const posSales = await prisma.sale.findMany({
          where: {
            customerId: targetCustomerId,
            channel: 'POS',
            NOT: {
              OR: [
                { orderStatus: 'CANCELLED' },
                { orderStatus: 'CANCELADO' },
                { orderStatus: 'ANULADA' },
              ],
            },
          },
          include: {
            dteDocument: true,
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        formattedSales = posSales.map((s) => ({
          id: s.id,
          orderNumber: s.saleNumber,
          customerId: s.customerId,
          customerName: s.cashierName || 'Venta Mostrador',
          customerEmail: null,
          customerPhone: '',
          department: 'San Salvador',
          municipality: 'San Salvador',
          shippingAddress: 'Compra en Tienda Física (POS)',
          deliveryReference: 'Venta de Mostrador',
          subtotal: Number(s.subtotal || 0),
          shippingCost: 0,
          total: Number(s.total || 0),
          paymentMethod: s.paymentMethod,
          paymentStatus: s.paymentStatus,
          orderStatus: s.orderStatus === 'COMPLETED' ? 'ENTREGADO' : (s.orderStatus || 'ENTREGADO'),
          trackingNumber: null,
          courierName: 'Mostrador / Sucursal',
          whatsappNotified: false,
          channel: 'POS',
          origin: 'Tienda Física (POS)',
          notes: s.notes || (s.tipoComprobante === '03' ? 'Crédito Fiscal (CCF)' : 'Factura (FC)'),
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.createdAt.toISOString(),
          sale: s,
          items: (s.items || []).map((it) => ({
            id: it.id,
            orderId: s.id,
            productId: it.productId,
            productName: it.productName,
            presentation: it.productName.includes('½') ? '½ Onza' : '1 Onza',
            unitPrice: Number(it.unitPrice || 0),
            quantity: Number(it.quantity || 1),
            total: Number(it.total || 0),
          })),
        }));
      } catch (salesErr) {
        console.error('Error fetching POS sales for customer history:', salesErr);
      }
    }

    const allPurchases = [...formatted, ...formattedSales].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, orders: allPurchases });
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
    const isStaff =
      verifyStaffRequest(request).authorized ||
      verifyStaffInternalToken(staffHeaderToken) ||
      verifyStaffInternalToken(bearerToken);
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

    // SEC-01: Protección contra marcado arbitrario de pedidos como COMPLETED (excepto personal de Caja/POS autorizado)
    if (paymentStatus === 'COMPLETED' && !isStaff) {
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

    // SEC-01: Prohibir cancelaciones no autorizadas por parte de clientes
    if (!isStaff && (orderStatus === 'CANCELADO' || paymentStatus === 'CANCELLED' || paymentStatus === 'REJECTED')) {
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

    // Si se cancela o rechaza el pedido y no estaba cancelado previamente (o se fuerza restock), restaurar existencias una única vez
    const isAlreadyCancelled = order.orderStatus === 'CANCELADO' || order.paymentStatus === 'CANCELLED';
    const isCancelling = (orderStatus === 'CANCELADO' || paymentStatus === 'CANCELLED' || paymentStatus === 'REJECTED' || restock === true) && !isAlreadyCancelled;
    if (isCancelling && order.items && order.items.length > 0 && restock !== false) {
      const existingReturn = await prisma.stockMovement.findFirst({
        where: {
          reference: `Devolución Web #${order.orderNumber}`,
          type: 'RETURN',
        },
      });
      if (!existingReturn) {
        for (const it of order.items) {
          if (it.productId) {
            const qty = Math.max(1, it.quantity || 1);
            const presLower = String(it.presentation || '').toLowerCase();
            const isHalfRestore = presLower.includes('media') || presLower.includes('½');
            try {
              const updatedProd = await prisma.product.update({
                where: { id: it.productId },
                data: isHalfRestore
                  ? { stockHalf: { increment: qty } }
                  : { stock: { increment: qty } },
              });
              
              await prisma.stockMovement.create({
                data: {
                  productId: it.productId,
                  type: 'RETURN',
                  quantity: qty,
                  previousStock: isHalfRestore ? (updatedProd as any).stockHalf - qty : updatedProd.stock - qty,
                  newStock: isHalfRestore ? (updatedProd as any).stockHalf : updatedProd.stock,
                  reference: `Devolución Web #${order.orderNumber}`,
                  notes: isHalfRestore ? '½ Onza • Reversión de pedido cancelado/rechazado' : 'Reversión de pedido cancelado/rechazado',
                  userName: 'Sistema',
                }
              });
            } catch (stockErr) {
              console.warn(`No se pudo restaurar inventario para producto ${it.productId}:`, stockErr);
            }
          }
        }
      }
    }

    let resolvedTracking = trackingNumber;
    let resolvedCourier = courierName;
    let resolvedOrderStatus = isCancelling ? 'CANCELADO' : orderStatus;

    if (body.generarGuiaC807 && isStaff) {
      const isPickupOrder =
        /retiro/i.test(order.deliveryReference || '') ||
        /retiro/i.test(order.shippingAddress || '') ||
        /retiro/i.test(order.notes || '') ||
        Number(order.shippingCost ?? 1) === 0;
      if (isPickupOrder) {
        return NextResponse.json(
          { success: false, error: 'No se permite generar guía C807 para pedidos con retiro en sucursal.' },
          { status: 400 }
        );
      }
      if (order.trackingNumber) {
        return NextResponse.json(
          { success: false, error: `Este pedido ya tiene guía generada: ${order.trackingNumber}` },
          { status: 409 }
        );
      }
      const c807Res = await c807Client.generarGuia({
        numero_pedido: order.orderNumber,
        cliente_nombre: order.customerName,
        cliente_direccion: order.shippingAddress,
        cliente_telefono: order.customerPhone,
        cliente_correo: order.customerEmail || undefined,
        cliente_departamento: order.department,
        cliente_municipio: order.municipality,
        cliente_referencia: order.deliveryReference || undefined,
        tipo_pago:
          order.paymentStatus === 'COMPLETED'
            ? 'TARJETA'
            : order.paymentMethod === 'TRANSFER'
            ? 'TRANSFERENCIA'
            : 'CONTRAENTREGA',
        total: Number(order.total || 0),
        observaciones: `Pedido Aromaniak #${order.orderNumber}`,
      });
      if (!c807Res.success) {
        return NextResponse.json(
          { success: false, error: c807Res.error || 'Error al generar guía en C807 Express' },
          { status: 502 }
        );
      }
      resolvedTracking = c807Res.numero_guia;
      resolvedCourier = 'C807 Express';
      resolvedOrderStatus = 'EN_RUTA';
    }

    const safePaymentStatus = (paymentStatus === 'REJECTED' || paymentStatus === 'CANCELLED' || isCancelling) ? 'CANCELLED' : paymentStatus;
    const safeOrderStatus = resolvedOrderStatus;

    const updated = await prisma.ecommerceOrder.update({
      where: { id: order.id },
      data: {
        ...(safeOrderStatus ? { orderStatus: safeOrderStatus } : {}),
        ...(safePaymentStatus ? { paymentStatus: safePaymentStatus } : {}),
        ...(resolvedCourier ? { courierName: resolvedCourier } : {}),
        ...(resolvedTracking ? { trackingNumber: resolvedTracking } : {}),
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
      businessName,
      fiscalAddress,
    } = body;

    // Sanitización estricta de entradas (SEC-07)
    const cleanCustomerName = sanitizeText(customerName, 100) || 'Cliente Online';
    const cleanBusinessName = sanitizeText(businessName, 150) || null;
    const cleanCustomerEmail = sanitizeEmail(customerEmail);
    const cleanCustomerPhone = sanitizePhone(customerPhone) || '';
    const cleanDepartment = sanitizeText(department, 50) || 'San Salvador';
    const cleanMunicipality = sanitizeText(municipality, 60) || 'San Salvador Centro';
    const cleanShippingAddress = sanitizeText(shippingAddress, 255);
    const cleanFiscalAddress = sanitizeText(fiscalAddress, 255) || null;
    const cleanDeliveryReference = sanitizeText(deliveryReference, 255) || null;
    const cleanNotes = sanitizeText(notes, 500) || null;
    const cleanNumDoc = sanitizeDocument(numDoc, 30) || '00000000-0';
    const cleanNrc = sanitizeDocument(nrc, 30) || null;
    const cleanGiro = sanitizeText(giro, 200) || null;
    const resolvedGiro = resolveGiroMH(cleanGiro);
    const resolvedActivityCode = resolvedGiro?.code || null;
    const resolvedActivityDesc = resolvedGiro ? formatGiroOption(resolvedGiro) : cleanGiro;
    const cleanTipoComprobante = sanitizeText(tipoComprobante, 10) || '01';

    // Verificar si el comprador tiene sesión autenticada de cliente o de personal
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : (body.sessionToken || null);
    const staffHeaderToken = request.headers.get('x-staff-token');
    const isStaff = verifyStaffInternalToken(staffHeaderToken) || verifyStaffInternalToken(bearerToken);
    const verifiedCustomer = verifyCustomerToken(bearerToken);

    let resolvedCustomerId = verifiedCustomer ? verifiedCustomer.customerId : (isStaff ? customerId : null);
    if (resolvedCustomerId || cleanCustomerEmail || cleanCustomerPhone || cleanCustomerName) {
      try {
        let cust = null;
        if (cleanCustomerEmail) {
          cust = await prisma.customer.findFirst({
            where: { email: { equals: cleanCustomerEmail, mode: 'insensitive' } },
          });
        }
        if (!cust && resolvedCustomerId) {
          cust = await prisma.customer.findUnique({
            where: { id: resolvedCustomerId },
          });
        }
        if (!cust && cleanCustomerPhone) {
          cust = await prisma.customer.findFirst({
            where: { phone: cleanCustomerPhone },
          });
        }

        const isCcfOrder = cleanTipoComprobante === '03' || Boolean(cleanNrc);

        if (cust) {
          cust = await prisma.customer.update({
            where: { id: cust.id },
            data: {
              ...(cleanCustomerEmail && !cust.email ? { email: cleanCustomerEmail } : {}),
              ...(cleanCustomerPhone ? { phone: cleanCustomerPhone } : {}),
              ...(cleanBusinessName ? { businessName: cleanBusinessName, name: cleanBusinessName } : {}),
              ...(cleanCustomerName && cleanCustomerName !== 'Cliente Online' ? { tradeName: cleanCustomerName } : {}),
              ...(cleanNumDoc && cleanNumDoc !== '00000000-0' ? {
                documentNum: cleanNumDoc,
                documentType: isCcfOrder ? 'NIT' : (cust.documentType || 'DUI'),
              } : {}),
              ...(cleanNrc ? { nrc: cleanNrc } : {}),
              ...(resolvedActivityCode ? { activityCode: resolvedActivityCode } : {}),
              ...(resolvedActivityDesc ? { activityDesc: resolvedActivityDesc } : {}),
              ...(isCcfOrder ? { preferredDoc: '03' } : (cleanTipoComprobante ? { preferredDoc: cleanTipoComprobante } : {})),
              ...(cleanFiscalAddress || cleanShippingAddress ? { address: cleanFiscalAddress || cleanShippingAddress } : {}),
              ...(cleanDepartment ? { department: cleanDepartment } : {}),
              ...(cleanMunicipality ? { municipality: cleanMunicipality } : {}),
            },
          });
          resolvedCustomerId = cust.id;
        } else {
          cust = await prisma.customer.create({
            data: {
              name: cleanBusinessName || cleanCustomerName,
              businessName: cleanBusinessName || (isCcfOrder ? cleanCustomerName : null),
              tradeName: cleanCustomerName,
              email: cleanCustomerEmail || null,
              phone: cleanCustomerPhone || null,
              documentType: isCcfOrder ? 'NIT' : 'DUI',
              documentNum: cleanNumDoc,
              nrc: cleanNrc,
              activityCode: resolvedActivityCode,
              activityDesc: resolvedActivityDesc,
              preferredDoc: cleanTipoComprobante,
              department: cleanDepartment,
              municipality: cleanMunicipality,
              address: cleanFiscalAddress || cleanShippingAddress || null,
            },
          });
          resolvedCustomerId = cust.id;
        }
      } catch (custErr) {
        console.error('Error asociando cliente a la orden:', custErr);
      }
    }

    // SEC-PRICING: Solo aplicar precios especiales mayoristas / VIP si el cliente demostró su identidad con sessionToken válido (o es personal del POS)
    const isAuthenticatedForSpecialPricing = Boolean(
      isStaff || (verifiedCustomer && resolvedCustomerId && verifiedCustomer.customerId === resolvedCustomerId)
    );

    const newOrder = await prisma.$transaction(async (tx) => {
      // 0. Obtener cliente registrado para verificar si tiene precios especiales o descuentos VIP (solo si está autenticado)
      const dbCustomer = (resolvedCustomerId && isAuthenticatedForSpecialPricing)
        ? await tx.customer.findUnique({
            where: { id: resolvedCustomerId },
            include: { tier: true, bottleTier: true, suppliesTier: true },
          })
        : null;

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
      const halfDeltas = new Map<string, number>();

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
              stockDeltas.set(essenceProd.id, (stockDeltas.get(essenceProd.id) || 0) + qty);
              if (isPlus) {
                halfDeltas.set(essenceProd.id, (halfDeltas.get(essenceProd.id) || 0) + qty);
              }
            }
          }

          let kitUnitPrice = isPlus ? Number((baseKitPrice + dynamicExtraShotPrice).toFixed(2)) : baseKitPrice;
          if (dbCustomer?.tier) {
            let appliedPct = 0;
            if (dbCustomer.tier.name === 'Personalizado' && dbCustomer.customDiscountPct) {
              appliedPct = Number(dbCustomer.customDiscountPct);
            } else if (dbCustomer.tier.discountPct) {
              appliedPct = Number(dbCustomer.tier.discountPct);
            }
            if (appliedPct > 0) {
              const discountAmt = kitUnitPrice * (appliedPct / 100);
              kitUnitPrice = Number((kitUnitPrice - discountAmt).toFixed(2));
            }
          } else if (dbCustomer?.customDiscountPct && Number(dbCustomer.customDiscountPct) > 0) {
            const appliedPct = Number(dbCustomer.customDiscountPct);
            const discountAmt = kitUnitPrice * (appliedPct / 100);
            kitUnitPrice = Number((kitUnitPrice - discountAmt).toFixed(2));
          }
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

        // Determinar precio unitario legítimo según categoría, presentación y precios especiales del cliente
        let legitimateUnitPrice = Number(prod.price || 0);
        const catName = prod.category?.name || '';
        const prodNameLower = prod.name.toLowerCase();
        const isEssence = catName === 'Esencias para Perfume' || catName === 'Esencias & Fragancias' || prod.unit === 'Onza' || !catName;
        const isBottle = !isEssence && (catName === 'Botes' || catName === 'Botes & Envases' || catName === 'Envases & Botes' || prodNameLower.includes('bote') || prodNameLower.includes('frasco'));

        if (isEssence && dbCustomer?.specialEssencePrice) {
          legitimateUnitPrice = Number(dbCustomer.specialEssencePrice);
          if (presLower.includes('media') || presLower.includes('½') || presLower.includes('half')) {
            legitimateUnitPrice = Number((legitimateUnitPrice / 2).toFixed(2));
          }
        } else if (isBottle && dbCustomer?.specialBottlePrice) {
          legitimateUnitPrice = Number(dbCustomer.specialBottlePrice);
        } else if (isEssence) {
          if (presLower.includes('media') || presLower.includes('½') || presLower.includes('half')) {
            legitimateUnitPrice = prod.priceHalfOunce != null ? Number(prod.priceHalfOunce) : Number((legitimateUnitPrice / 2).toFixed(2));
          }
        }

        // Aplicar descuento por nivel VIP según la categoría específica del producto (Esencias, Botes o Insumos)
        const activeCategoryTier = isEssence
          ? dbCustomer?.tier
          : isBottle
          ? dbCustomer?.bottleTier
          : dbCustomer?.suppliesTier;
        const activeCategoryCustomPct = isEssence
          ? dbCustomer?.customDiscountPct
          : isBottle
          ? dbCustomer?.bottleCustomDiscountPct
          : dbCustomer?.suppliesCustomDiscountPct;

        if (activeCategoryTier) {
          let appliedPct = 0;
          if (activeCategoryTier.name === 'Personalizado' && activeCategoryCustomPct) {
            appliedPct = Number(activeCategoryCustomPct);
          } else if (activeCategoryTier.discountPct) {
            appliedPct = Number(activeCategoryTier.discountPct);
          }
          if (appliedPct > 0) {
            const discountAmt = legitimateUnitPrice * (appliedPct / 100);
            legitimateUnitPrice = Number((legitimateUnitPrice - discountAmt).toFixed(2));
          }
        } else if (activeCategoryCustomPct && Number(activeCategoryCustomPct) > 0) {
          const appliedPct = Number(activeCategoryCustomPct);
          const discountAmt = legitimateUnitPrice * (appliedPct / 100);
          legitimateUnitPrice = Number((legitimateUnitPrice - discountAmt).toFixed(2));
        }

        const lineTotal = Number((legitimateUnitPrice * qty).toFixed(2));
        verifiedSubtotal += lineTotal;

        // Descontar existencias: acumular en stockDeltas para ejecución atómica
        const isHalfLine = presLower.includes('media') || presLower.includes('½');
        if (isHalfLine) {
          halfDeltas.set(prod.id, (halfDeltas.get(prod.id) || 0) + qty);
        } else {
          stockDeltas.set(prod.id, (stockDeltas.get(prod.id) || 0) + qty);
        }

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

        const newStock = updatedRows[0].stock;
        await tx.stockMovement.create({
          data: {
            productId: prodId,
            type: 'OUT_SALE',
            quantity: deductQty,
            previousStock: newStock + deductQty,
            newStock,
            reference: `Pedido Web #${orderNumber || 'Pendiente'}`,
            notes: `Venta Ecommerce (${paymentMethod})`,
            userName: cleanCustomerName,
          }
        });
      }

      for (const [prodId, deductHalf] of halfDeltas.entries()) {
        const prod = productMap.get(prodId);
        const prodName = prod?.officialName?.trim() || prod?.name || 'Producto';
        const rows: Array<{ stockHalf: number }> = await tx.$queryRaw`
          UPDATE "Product"
          SET "stockHalf" = "stockHalf" - ${deductHalf},
              "updatedAt" = NOW()
          WHERE "id" = ${prodId} AND "stockHalf" >= ${deductHalf}
          RETURNING "stockHalf"
        `;
        if (!rows || rows.length === 0) {
          throw new Error(`INSUFFICIENT_STOCK: Inventario de ½ onza insuficiente para "${prodName}".`);
        }

        const newStockHalf = rows[0].stockHalf;
        await tx.stockMovement.create({
          data: {
            productId: prodId,
            type: 'OUT_SALE',
            quantity: deductHalf,
            previousStock: newStockHalf + deductHalf,
            newStock: newStockHalf,
            reference: `Pedido Web #${orderNumber || 'Pendiente'}`,
            notes: `½ Onza • Venta Ecommerce (${paymentMethod})`,
            userName: cleanCustomerName,
          }
        });
      }

      verifiedSubtotal = Number(verifiedSubtotal.toFixed(2));

      // Determinar costo de envío legítimo en el servidor
      const isRetiro = (cleanDeliveryReference && cleanDeliveryReference.includes('Retiro')) ||
                       (cleanShippingAddress && cleanShippingAddress.includes('Retiro')) ||
                       (cleanNotes && cleanNotes.includes('Retiro'));
      const verifiedShippingCost = isRetiro ? 0.00 : 2.99;
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
