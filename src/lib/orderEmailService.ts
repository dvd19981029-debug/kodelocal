export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  department?: string;
  municipality?: string;
  shippingAddress?: string;
  deliveryReference?: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  items: Array<{
    productName: string;
    presentation?: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

/**
 * Envía el correo de confirmación de pedido al cliente llamando al Webhook de Google Apps Script.
 * Se ejecuta en segundo plano sin interrumpir ni demorar la respuesta de compra del cliente.
 */
export async function sendOrderConfirmationEmail(orderData: OrderEmailData): Promise<boolean> {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_ORDER_EMAIL_URL;

  if (!scriptUrl) {
    console.log('ℹ️ GOOGLE_APPS_SCRIPT_ORDER_EMAIL_URL no está configurada en las variables de entorno. Omitiendo envío de correo.');
    return false;
  }

  if (!orderData.customerEmail) {
    console.warn(`⚠️ Orden ${orderData.orderNumber} no tiene correo del cliente registrado. No se puede enviar confirmación.`);
    return false;
  }

  try {
    console.log(`📧 Enviando correo de confirmación para orden ${orderData.orderNumber} a ${orderData.customerEmail} vía Google Apps Script...`);
    
    // Llamada con timeout para que nunca bloquee la ejecución
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ Google Apps Script respondió con status ${response.status} al enviar orden ${orderData.orderNumber}`);
      return false;
    }

    const result = await response.json().catch(() => ({ success: true }));
    console.log(`✅ Correo de orden ${orderData.orderNumber} procesado exitosamente por Google Apps Script:`, result);
    return true;
  } catch (err: any) {
    console.error(`⚠️ Error al enviar correo de orden ${orderData.orderNumber} a Google Apps Script:`, err?.message || err);
    return false;
  }
}
