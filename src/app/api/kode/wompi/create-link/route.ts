import { NextResponse } from 'next/server';
import { createWompiPaymentLink } from '@/lib/wompi';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      monto,
      clienteNombre,
      clienteTelefono,
      clienteEmail,
      pedidoNumero,
    } = body;

    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      return NextResponse.json(
        { success: false, error: 'Monto inválido para generar el enlace de pago ($)' },
        { status: 400 }
      );
    }

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;

    // Generar identificador de pedido único o usar el provisto
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = (pedidoNumero && typeof pedidoNumero === 'string' && pedidoNumero.trim())
      ? pedidoNumero.trim()
      : `KOD-${dateStr}-${randomSuffix}`;

    const link = await createWompiPaymentLink({
      orderNumber,
      amount: Number(parsedMonto.toFixed(2)),
      productName: `KÖDE Perfumes - Pedido #${orderNumber}`,
      productDescription: `Perfumería KÖDE - Fragancias Terminadas (${clienteNombre || 'Cliente WhatsApp'})`,
      customerName: clienteNombre?.trim() || undefined,
      customerEmail: clienteEmail?.trim() || undefined,
      customerPhone: clienteTelefono ? clienteTelefono.toString() : undefined,
      redirectUrl: `${baseUrl}/checkout/resultado`,
      returnUrl: `${baseUrl}/kode`,
      webhookUrl: `${baseUrl}/api/wompi/webhook`,
    });

    return NextResponse.json({
      success: true,
      idEnlace: link.idEnlace,
      urlEnlace: link.urlEnlace,
      urlQrCodeEnlace: link.urlQrCodeEnlace,
      estaProductivo: link.estaProductivo,
      orderNumber,
    });
  } catch (error: any) {
    console.error('Error generando enlace de pago Wompi en KÖDE:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'No se pudo generar el enlace de pago con Wompi',
      },
      { status: 500 }
    );
  }
}
