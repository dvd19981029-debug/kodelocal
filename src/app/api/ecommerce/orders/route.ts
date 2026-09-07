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

    return NextResponse.json({ success: true, orders });
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
    } = body;

    const newOrder = await prisma.ecommerceOrder.create({
      data: {
        orderNumber: orderNumber || `WEB-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: customerId || null,
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
            productId: it.productId,
            productName: it.productName || it.name || 'Perfume',
            presentation: it.presentation || it.presentationName || '50ml',
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

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Error creating ecommerce order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
