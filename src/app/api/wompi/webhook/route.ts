import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWompiWebhook } from '@/lib/wompi';
import { sendOrderConfirmationEmail } from '@/lib/orderEmailService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const hashHeader = request.headers.get('wompi_hash');

    // SEC-03: Validar autenticidad de la notificación OBLIGATORIAMENTE con el header wompi_hash
    if (!hashHeader) {
      console.warn('⚠️ Webhook de Wompi descartado: encabezado wompi_hash ausente');
      return NextResponse.json({ success: false, error: 'Firma requerida' }, { status: 401 });
    }

    const isValid = validateWompiWebhook(rawBody, hashHeader);
    if (!isValid) {
      console.warn('⚠️ Webhook de Wompi descartado por firma inválida');
      return NextResponse.json({ success: false, error: 'Firma inválida' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const {
      IdTransaccion,
      ResultadoTransaccion,
      CodigoAutorizacion,
      Monto,
      EnlacePago,
      EsProductiva
    } = payload;

    const orderNumber = EnlacePago?.IdentificadorEnlaceComercio;
    const isApproved = ResultadoTransaccion === 'ExitosaAprobada';

    console.log(`💳 Webhook Wompi recibido: Orden=${orderNumber} Resultado=${ResultadoTransaccion} Tx=${IdTransaccion} Real=${EsProductiva}`);

    if (orderNumber && isApproved) {
      // Buscar pedido
      const order = await prisma.ecommerceOrder.findFirst({
        where: { orderNumber },
      });

      if (order) {
        // SEC-08: Control de idempotencia ante reintentos de red de Wompi
        const alreadyHasTx = IdTransaccion && order.notes?.includes(String(IdTransaccion));
        if (order.paymentStatus === 'COMPLETED' || alreadyHasTx) {
          console.log(`ℹ️ Webhook Wompi: Orden ${orderNumber} ya fue procesada anteriormente. Respuesta idempotente.`);
          return NextResponse.json({ success: true, message: 'Transacción ya procesada' });
        }

        // SEC-FINANCIAL: Validar que el monto cobrado por Wompi coincida con el total de la orden
        if (Monto !== undefined && Monto !== null) {
          const paid = Number(Monto);
          const expected = Number(order.total);
          if (paid < expected - 0.05) {
            console.error(`🚨 ALERTA FINANCIERA: Monto recibido en Wompi ($${paid}) es menor al esperado ($${expected}) para orden ${orderNumber}`);
            await prisma.ecommerceOrder.update({
              where: { id: order.id },
              data: {
                notes: [
                  order.notes,
                  `[ALERTA PAGO PARCIAL/DISCREPANCIA: Pagado $${paid} de esperado $${expected} - Tx: ${IdTransaccion}]`,
                ].filter(Boolean).join(' '),
              },
            });
            return NextResponse.json({ success: false, error: 'Monto insuficiente' }, { status: 400 });
          }
        }

        // Actualizar pedido a PAGADO
        const paidOrder = await prisma.ecommerceOrder.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'COMPLETED',
            notes: [
              order.notes,
              `[Pago Aprobado Wompi Tx: ${IdTransaccion || 'N/A'} - Cod: ${CodigoAutorizacion || 'N/A'}]`,
            ].filter(Boolean).join(' '),
          },
          include: {
            items: true,
          },
        });

        // Enviar correo de confirmación de pago
        if (paidOrder.customerEmail) {
          sendOrderConfirmationEmail({
            orderNumber: paidOrder.orderNumber,
            customerName: paidOrder.customerName,
            customerEmail: paidOrder.customerEmail,
            customerPhone: paidOrder.customerPhone,
            department: paidOrder.department,
            municipality: paidOrder.municipality,
            shippingAddress: paidOrder.shippingAddress,
            deliveryReference: paidOrder.deliveryReference,
            subtotal: Number(paidOrder.subtotal || 0),
            shippingCost: Number(paidOrder.shippingCost || 0),
            total: Number(paidOrder.total || 0),
            paymentMethod: 'CARD',
            paymentStatus: 'COMPLETED',
            items: (paidOrder.items || []).map((it) => ({
              productName: it.productName,
              presentation: it.presentation,
              quantity: it.quantity,
              unitPrice: Number(it.unitPrice || 0),
              total: Number(it.total || 0),
            })),
          }).catch((err) => console.error('Error enviando correo Wompi:', err));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error procesando Webhook Wompi:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
