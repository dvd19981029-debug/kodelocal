import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createWompiPaymentLink } from '@/lib/wompi';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, orderNumber, amount, customerEmail, customerName, customerPhone } = body;

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Identificador de pedido requerido' },
        { status: 400 }
      );
    }

    // Buscar el pedido en la base de datos
    const order = await prisma.ecommerceOrder.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(orderNumber ? [{ orderNumber }] : []),
        ],
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;

    const num = order.orderNumber;
    const finalAmount = amount ? Number(amount) : Number(order.total);

    // Generar enlace seguro en Wompi
    const link = await createWompiPaymentLink({
      orderNumber: num,
      amount: finalAmount,
      customerName: customerName || order.customerName,
      customerEmail: customerEmail || order.customerEmail || undefined,
      customerPhone: customerPhone || order.customerPhone || undefined,
      redirectUrl: `${baseUrl}/checkout/resultado`,
      returnUrl: `${baseUrl}/checkout`,
      webhookUrl: `${baseUrl}/api/wompi/webhook`,
    });

    // Guardar referencia en el pedido
    await prisma.ecommerceOrder.update({
      where: { id: order.id },
      data: {
        notes: [
          order.notes,
          `[Wompi idEnlace: ${link.idEnlace}]`,
        ].filter(Boolean).join(' '),
      },
    });

    return NextResponse.json({
      success: true,
      idEnlace: link.idEnlace,
      urlEnlace: link.urlEnlace,
      urlQrCodeEnlace: link.urlQrCodeEnlace,
      estaProductivo: link.estaProductivo,
    });
  } catch (error: any) {
    console.error('Error en /api/wompi/create-checkout:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al conectar con Wompi' },
      { status: 500 }
    );
  }
}
