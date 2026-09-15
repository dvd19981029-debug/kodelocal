// src/lib/orderEmailService.ts

export interface OrderEmailItem {
  productName: string;
  inspiredBy?: string | null;
  presentation?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

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
  storeTagline?: string;
  items: OrderEmailItem[];
  htmlBody?: string;
}

/**
 * Genera una plantilla de correo electrónico HTML con estilo Claymórfico Puro en Blanco,
 * totalmente blindada contra la inversión de color del Modo Oscuro en Gmail, Apple Mail y Outlook.
 * Cero mención a 'contratipos' (exclusivamente 'Distribuidora de esencias y más').
 */
export function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const isTransfer = data.paymentMethod === 'TRANSFER';
  const isCard = data.paymentMethod === 'CARD';
  const isPaid = data.paymentStatus === 'COMPLETED' || (!isTransfer && isCard);

  const statusBadgeBg = isPaid ? '#ecfdf5' : '#fef3c7';
  const statusBadgeBorder = isPaid ? '#a7f3d0' : '#fde68a';
  const statusBadgeColor = isPaid ? '#047857' : '#92400e';
  const statusBadgeText = isPaid ? 'PAGO CONFIRMADO' : (isTransfer ? 'PENDIENTE DE TRANSFERENCIA' : 'PEDIDO EN PREPARACIÓN');

  const trackingUrl = `https://aromaniaksv.com/checkout/resultado?identificadorEnlaceComercio=${encodeURIComponent(data.orderNumber)}&esAprobada=true`;
  const whatsappUrl = `https://wa.me/50378339470?text=${encodeURIComponent(`Hola Aromaniak, consulto por mi orden #${data.orderNumber}`)}`;

  const isRetiro = (data.deliveryReference && data.deliveryReference.toLowerCase().includes('retiro')) ||
                   (data.shippingAddress && data.shippingAddress.toLowerCase().includes('retiro'));

  const itemsHtml = data.items.map((it) => {
    const hasInspired = it.inspiredBy && it.inspiredBy.trim().length > 0;
    return `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; background-color: #ffffff;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #0f172a; line-height: 1.3;">
            ${it.productName}
          </div>
          ${hasInspired ? `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; color: #6366f1; margin-top: 3px;">
              Inspirado en: <span style="color: #475569; font-weight: 500;">${it.inspiredBy}</span>
            </div>
          ` : ''}
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #94a3b8; margin-top: 2px;">
            ${it.presentation || '1 Onza'} &bull; Cantidad: <strong style="color: #475569;">${it.quantity}</strong> &times; $${it.unitPrice.toFixed(2)}
          </div>
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; vertical-align: top; font-family: 'Courier New', Courier, monospace; font-size: 13.5px; font-weight: 700; color: #4338ca; background-color: #ffffff; white-space: nowrap;">
          $${it.total.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Confirmación de Pedido #${data.orderNumber} - Aromaniak SV</title>
  <style type="text/css">
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f8fafc !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    /* Neutralizar Dark Mode agresivo en clientes de correo */
    @media (prefers-color-scheme: dark) {
      .bg-canvas { background-color: #f8fafc !important; }
      .card-white { background-color: #ffffff !important; color: #0f172a !important; }
      .text-dark { color: #0f172a !important; }
      .text-muted { color: #64748b !important; }
      .text-indigo { color: #4f46e5 !important; }
    }
    [data-ogsc] .bg-canvas { background-color: #f8fafc !important; }
    [data-ogsc] .card-white { background-color: #ffffff !important; color: #0f172a !important; }
  </style>
</head>
<body bgcolor="#f8fafc" class="bg-canvas" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Contenedor Principal Centrado -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f8fafc" class="bg-canvas" style="background-color: #f8fafc; margin: 0 auto; padding: 24px 12px;">
    <tr>
      <td align="center" style="padding: 0;">
        
        <!-- Tarjeta Claymórfica Blanca -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="card-white" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03); overflow: hidden;">
          
          <!-- Encabezado con Logo y Subtítulo Oficial -->
          <tr>
            <td align="center" bgcolor="#ffffff" style="padding: 32px 24px 20px 24px; background-color: #ffffff; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <a href="https://aromaniaksv.com" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://aromaniaksv.com/logo.png" alt="Aromaniak - Distribuidora de esencias y más" width="150" style="display: block; width: 150px; max-width: 150px; height: auto; margin: 0 auto 10px auto; border: 0;" />
              </a>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #6366f1;">
                Distribuidora de esencias y más
              </div>
            </td>
          </tr>

          <!-- Cuerpo: Estado de Orden y Saludo -->
          <tr>
            <td bgcolor="#ffffff" style="padding: 24px 24px 12px 24px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 18px;">
                <span style="display: inline-block; padding: 5px 14px; background-color: ${statusBadgeBg}; border: 1px solid ${statusBadgeBorder}; border-radius: 9999px; font-size: 11px; font-weight: 800; color: ${statusBadgeColor}; letter-spacing: 0.05em;">
                  ${statusBadgeText}
                </span>
                <h1 class="text-dark" style="margin: 12px 0 4px 0; font-size: 22px; font-weight: 900; color: #0f172a; line-height: 1.2;">
                  ¡Gracias por tu compra, ${data.customerName}!
                </h1>
                <p class="text-muted" style="margin: 0; font-size: 12.5px; color: #64748b;">
                  Tu orden <strong style="color: #4338ca; font-family: 'Courier New', Courier, monospace;">#${data.orderNumber}</strong> ha sido recibida y registrada exitosamente.
                </p>
              </div>

              <!-- Ficha Claymórfica de Resumen de Productos -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                <thead>
                  <tr bgcolor="#f8fafc" style="background-color: #f8fafc;">
                    <th align="left" style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;">
                      Producto / Esencia
                    </th>
                    <th align="right" style="padding: 10px 14px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr bgcolor="#ffffff">
                    <td style="padding: 10px 14px 4px 14px; font-size: 12px; color: #64748b;">Subtotal:</td>
                    <td align="right" style="padding: 10px 14px 4px 14px; font-family: 'Courier New', Courier, monospace; font-size: 12.5px; font-weight: 700; color: #334155;">
                      $${data.subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr bgcolor="#ffffff">
                    <td style="padding: 4px 14px; font-size: 12px; color: #64748b;">
                      ${isRetiro ? 'Retiro en Local San Salvador:' : 'Envío a Domicilio:'}
                    </td>
                    <td align="right" style="padding: 4px 14px; font-family: 'Courier New', Courier, monospace; font-size: 12.5px; font-weight: 700; color: ${data.shippingCost === 0 ? '#059669' : '#334155'};">
                      ${data.shippingCost === 0 ? 'GRATIS' : `$${data.shippingCost.toFixed(2)}`}
                    </td>
                  </tr>
                  <tr bgcolor="#f8fafc" style="background-color: #f8fafc;">
                    <td style="padding: 12px 14px; font-size: 14px; font-weight: 900; color: #0f172a; border-top: 1px solid #e2e8f0;">
                      Total a Pagar:
                    </td>
                    <td align="right" style="padding: 12px 14px; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 900; color: #4338ca; border-top: 1px solid #e2e8f0;">
                      $${data.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <!-- Ficha de Entrega y Destino -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #4338ca; letter-spacing: 0.05em; margin-bottom: 6px;">
                      ${isRetiro ? '📍 Modalidad de Entrega' : '🚚 Dirección de Envío'}
                    </div>
                    <div style="font-size: 12.5px; font-weight: 700; color: #1e293b; margin-bottom: 2px;">
                      ${data.shippingAddress || (isRetiro ? 'Retiro en Local San Salvador' : 'Envío a domicilio')}
                    </div>
                    <div style="font-size: 11.5px; color: #64748b;">
                      ${data.municipality || 'San Salvador Centro'}, ${data.department || 'San Salvador'}
                    </div>
                    ${data.deliveryReference ? `
                      <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
                        Referencia: <em>${data.deliveryReference}</em>
                      </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              ${isTransfer && !isPaid ? `
                <!-- Ficha de Cuentas para Transferencia -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px; padding: 14px;">
                  <tr>
                    <td>
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #b45309; letter-spacing: 0.05em; margin-bottom: 4px;">
                        🏦 Cuentas Bancarias para Transferir
                      </div>
                      <div style="font-size: 11.5px; color: #92400e; margin-bottom: 8px;">
                        Titular: <strong>Aromaniak El Salvador</strong> &bull; Monto: <strong>$${data.total.toFixed(2)}</strong>
                      </div>
                      <div style="font-size: 11.5px; color: #78350f; line-height: 1.6;">
                        &bull; <strong>Banco Agrícola (Ahorro):</strong> 300-478921-0<br>
                        &bull; <strong>BAC Credomatic (Ahorro):</strong> 201-839210<br>
                        &bull; <strong>Banco Cuscatlán (Corriente):</strong> 024-109283-7
                      </div>
                      <div style="margin-top: 10px;">
                        <a href="${whatsappUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 11.5px; font-weight: 800; border-radius: 10px;">
                          Enviar comprobante por WhatsApp (7833-9470) &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>
                </table>
              ` : ''}

              <!-- Botón Principal de Acción (Rastreo de Pedido) -->
              <div style="text-align: center; margin-top: 24px; margin-bottom: 8px;">
                <a href="${trackingUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; border-radius: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); letter-spacing: 0.02em;">
                  Ver Mi Pedido y Envío &rarr;
                </a>
              </div>

            </td>
          </tr>

          <!-- Pie de Correo Anti-Spam y Transparencia -->
          <tr>
            <td align="center" bgcolor="#f8fafc" style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <div style="font-size: 11.5px; font-weight: 700; color: #475569; margin-bottom: 4px;">
                Aromaniak SV &bull; Distribuidora de esencias y más
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 8px;">
                San Salvador, El Salvador &bull; WhatsApp: <a href="https://wa.me/50378339470" style="color: #6366f1; text-decoration: none; font-weight: 700;">+503 7833-9470</a>
              </div>
              <div style="font-size: 10px; color: #cbd5e1; line-height: 1.3;">
                Has recibido este correo porque realizaste una compra en <a href="https://aromaniaksv.com" style="color: #94a3b8; text-decoration: underline;">aromaniaksv.com</a>.<br>
                Si tienes dudas o necesitas asistencia con tu paquete, responde a este correo o escríbenos directamente a nuestro WhatsApp oficial.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Envía el correo de confirmación de pedido al cliente llamando al Webhook de Google Apps Script.
 * Se ejecuta en segundo plano sin interrumpir ni demorar la respuesta de compra del cliente.
 */
export async function sendOrderConfirmationEmail(orderData: OrderEmailData): Promise<boolean> {
  const scriptUrl =
    process.env.GOOGLE_APPS_SCRIPT_ORDER_EMAIL_URL ||
    'https://script.google.com/macros/s/AKfycbwyIh24jLuSBr5iRKXh1q_EgZNrSSQNhexweALIPiNTYmo6wnaYsDm9bbS152tySx3r/exec';

  if (!scriptUrl) {
    console.log('ℹ️ GOOGLE_APPS_SCRIPT_ORDER_EMAIL_URL no está configurada en las variables de entorno. Omitiendo envío de correo.');
    return false;
  }

  if (!orderData.customerEmail) {
    console.warn(`⚠️ Orden ${orderData.orderNumber} no tiene correo del cliente registrado. No se puede enviar confirmación.`);
    return false;
  }

  try {
    console.log(`📧 Generando correo de confirmación para orden ${orderData.orderNumber} a ${orderData.customerEmail}...`);
    
    // Generar el HTML claymórfico blanco enriquecido
    const generatedHtml = buildOrderConfirmationHtml(orderData);

    const payload = {
      ...orderData,
      storeTagline: 'Distribuidora de esencias y más',
      htmlBody: generatedHtml,
      html: generatedHtml,
      body: generatedHtml,
    };

    // Llamada con timeout para que nunca bloquee la ejecución
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
