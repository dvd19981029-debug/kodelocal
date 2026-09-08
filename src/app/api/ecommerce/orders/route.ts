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
    const { orderId, orderStatus, paymentStatus, courierName, trackingNumber } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId es requerido' }, { status: 400 });
    }

    const updated = await prisma.ecommerceOrder.update({
      where: { id: orderId },
      data: {
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(courierName ? { courierName } : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
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
      // 1. Validar que no se venda más de lo que hay en inventario
      for (const it of (items || [])) {
        if (!it.productId || it.productId.startsWith('kit-')) continue;

        const prod = await tx.product.findUnique({
          where: { id: it.productId },
        });

        if (prod) {
          const qtyRequested = Number(it.quantity || 1);
          const pres = (it.presentation || '').toLowerCase();
          const stockToDeduct = pres.includes('media') ? Math.ceil(qtyRequested * 0.5) : qtyRequested;

          if (prod.stock < stockToDeduct) {
            throw new Error(`Inventario insuficiente para ${prod.officialName || prod.name}. Disponibles: ${prod.stock}`);
          }

          // Descontar inventario en la base de datos
          await tx.product.update({
            where: { id: it.productId },
            data: {
              stock: Math.max(0, prod.stock - stockToDeduct),
            },
          });
        }
      }

      // 2. Crear la orden de ecommerce
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
          subtotal: Number(subtotal || 0),
          shippingCost: Number(shippingCost || 3.50),
          total: Number(total || 0),
          paymentMethod: paymentMethod || 'CASH',
          paymentStatus: 'PENDING',
          orderStatus: 'NUEVO',
          notes: notes || null,
          items: {
            create: (items || []).map((it: any) => ({
              productId: it.productId && !it.productId.startsWith('kit-') ? it.productId : null,
              productName: it.productName || it.name || 'Perfume',
              presentation: it.presentation || it.presentationName || '1 Onza',
              unitPrice: Number(it.unitPrice || it.price || 0),
              quantity: Number(it.quantity || 1),
              total: Number(it.total || 0),
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Error creating ecommerce order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
