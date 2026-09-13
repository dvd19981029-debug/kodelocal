import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');

    const orders = await prisma.ecommerceOrder.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
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
    const { orderId, orderNumber, orderStatus, paymentStatus, courierName, trackingNumber, notes } = body;

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
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }

    const updated = await prisma.ecommerceOrder.update({
      where: { id: order.id },
      data: {
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
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

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && (customerEmail || customerPhone || customerName)) {
      try {
        const normalizedEmail = customerEmail?.trim()?.toLowerCase();
        let cust = await prisma.customer.findFirst({
          where: {
            OR: [
              ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
              ...(customerPhone ? [{ phone: customerPhone.trim() }] : []),
            ],
          },
        });

        if (cust) {
          cust = await prisma.customer.update({
            where: { id: cust.id },
            data: {
              ...(numDoc ? { documentNum: numDoc } : {}),
              ...(nrc ? { nrc } : {}),
              ...(giro ? { activityDesc: giro } : {}),
              ...(tipoComprobante ? { preferredDoc: tipoComprobante } : {}),
              ...(shippingAddress && !cust.address ? { address: shippingAddress } : {}),
              ...(department && !cust.department ? { department } : {}),
              ...(municipality && !cust.municipality ? { municipality } : {}),
            },
          });
          resolvedCustomerId = cust.id;
        } else {
          cust = await prisma.customer.create({
            data: {
              name: customerName || 'Cliente Online',
              email: normalizedEmail || null,
              phone: customerPhone?.trim() || null,
              documentType: tipoComprobante === '03' ? 'NIT' : 'DUI',
              documentNum: numDoc?.trim() || '00000000-0',
              nrc: nrc?.trim() || null,
              activityDesc: giro?.trim() || null,
              preferredDoc: tipoComprobante || '01',
              department: department || 'San Salvador',
              municipality: municipality || 'San Salvador',
              address: shippingAddress || null,
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
      const isRetiro = (deliveryReference && deliveryReference.includes('Retiro')) ||
                       (shippingAddress && shippingAddress.includes('Retiro')) ||
                       (notes && notes.includes('Retiro'));
      const verifiedShippingCost = isRetiro ? 0.00 : 3.50;
      const verifiedTotal = Number((verifiedSubtotal + verifiedShippingCost).toFixed(2));

      // 2. Crear la orden oficial de ecommerce con los precios y totales verificados
      return await tx.ecommerceOrder.create({
        data: {
          orderNumber: orderNumber || `WEB-${Math.floor(1000 + Math.random() * 9000)}`,
          customerId: resolvedCustomerId || null,
          customerName: customerName || 'Cliente Online',
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || '',
          department: department || 'San Salvador',
          municipality: municipality || 'San Salvador',
          shippingAddress: shippingAddress || '',
          deliveryReference: deliveryReference || null,
          subtotal: verifiedSubtotal,
          shippingCost: verifiedShippingCost,
          total: verifiedTotal,
          paymentMethod: paymentMethod || 'CASH',
          paymentStatus: 'PENDING',
          orderStatus: 'NUEVO',
          notes: notes || null,
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
