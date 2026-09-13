import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWompiWebhook } from '@/lib/wompi';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const hashHeader = request.headers.get('wompi_hash');

    // Validar autenticidad de la notificación si viene el hash
    if (hashHeader) {
      const isValid = validateWompiWebhook(rawBody, hashHeader);
      if (!isValid) {
        console.warn('⚠️ Webhook de Wompi descartado por firma inválida');
        return NextResponse.json({ success: false, error: 'Firma inválida' }, { status: 401 });
      }
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
        // Actualizar pedido a PAGADO
        await prisma.ecommerceOrder.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'COMPLETED',
            notes: [
              order.notes,
              `[Pago Aprobado Wompi Tx: ${IdTransaccion || 'N/A'} - Cod: ${CodigoAutorizacion || 'N/A'}]`,
            ].filter(Boolean).join(' '),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error procesando Webhook Wompi:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
