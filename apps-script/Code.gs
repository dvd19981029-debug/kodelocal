/**
 * Google Apps Script - Webhook de Confirmación de Pedidos Aromaniak SV
 * 
 * Distribuidora de esencias y más.
 * Recibe los datos del pedido y envía el correo con diseño claymórfico blanco anti-modo-oscuro.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    if (!data.customerEmail) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: "customerEmail es requerido" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var subject = "Confirmación de Pedido #" + data.orderNumber + " - Aromaniak SV";
    var htmlContent = data.htmlBody || data.html || data.body;

    // Si no viene htmlBody pre-renderizado, generar la plantilla claymórfica completa con todos los datos
    if (!htmlContent) {
      var isTransfer = data.paymentMethod === 'TRANSFER';
      var isPaid = data.paymentStatus === 'COMPLETED' || (!isTransfer && data.paymentMethod === 'CARD');
      var items = data.items || [];

      var rowsHtml = items.map(function(it) {
        var inspired = it.inspiredBy ? '<div style="font-size:11px;color:#6366f1;font-weight:600;margin-top:2px;">Inspirado en: <span style="color:#475569;font-weight:500;">' + it.inspiredBy + '</span></div>' : '';
        return '<tr>' +
          '<td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">' +
            '<strong>' + (it.productName || 'Producto') + '</strong>' + inspired +
            '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">' + (it.presentation || '1 Onza') + ' &bull; Cantidad: ' + (it.quantity || 1) + ' &times; $' + Number(it.unitPrice || 0).toFixed(2) + '</div>' +
          '</td>' +
          '<td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:700;color:#4338ca;font-family:monospace;">$' + Number(it.total || 0).toFixed(2) + '</td>' +
        '</tr>';
      }).join('');

      htmlContent = '<!DOCTYPE html><html><body style="margin:0;padding:20px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">' +
        '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:24px;box-shadow:0 8px 20px -4px rgba(99,102,241,0.08);">' +
          '<div style="text-align:center;padding-bottom:16px;border-bottom:1px solid #f1f5f9;">' +
            '<img src="https://aromaniaksv.com/logo.png" alt="Aromaniak" style="width:140px;height:auto;margin-bottom:6px;" /><br>' +
            '<span style="font-size:11px;font-weight:800;color:#6366f1;letter-spacing:0.06em;text-transform:uppercase;">Distribuidora de esencias y más</span>' +
          '</div>' +
          '<div style="text-align:center;margin-top:16px;">' +
            '<h2 style="font-size:20px;color:#0f172a;margin:8px 0 4px 0;">¡Gracias por tu compra, ' + (data.customerName || 'Cliente') + '!</h2>' +
            '<p style="font-size:12px;color:#64748b;margin:0;">Orden <strong style="color:#4338ca;font-family:monospace;">#' + data.orderNumber + '</strong> recibida y registrada.</p>' +
          '</div>' +
          '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">' +
            '<thead><tr style="background:#f8fafc;"><th align="left" style="padding:8px 12px;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0;">PRODUCTO / ESENCIA</th><th align="right" style="padding:8px 12px;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0;">TOTAL</th></tr></thead>' +
            '<tbody>' + rowsHtml + '</tbody>' +
            '<tfoot>' +
              '<tr><td style="padding:8px 12px;font-size:12px;color:#64748b;">Subtotal:</td><td align="right" style="padding:8px 12px;font-family:monospace;font-size:12px;font-weight:700;">$' + Number(data.subtotal || 0).toFixed(2) + '</td></tr>' +
              '<tr><td style="padding:4px 12px;font-size:12px;color:#64748b;">Envío:</td><td align="right" style="padding:4px 12px;font-family:monospace;font-size:12px;font-weight:700;color:' + (Number(data.shippingCost) === 0 ? '#059669' : '#334155') + ';">' + (Number(data.shippingCost) === 0 ? 'GRATIS' : '$' + Number(data.shippingCost || 0).toFixed(2)) + '</td></tr>' +
              '<tr style="background:#f8fafc;"><td style="padding:10px 12px;font-size:14px;font-weight:900;color:#0f172a;border-top:1px solid #e2e8f0;">Total:</td><td align="right" style="padding:10px 12px;font-family:monospace;font-size:16px;font-weight:900;color:#4338ca;border-top:1px solid #e2e8f0;">$' + Number(data.total || 0).toFixed(2) + '</td></tr>' +
            '</tfoot>' +
          '</table>' +
          '<div style="margin-top:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px;font-size:12px;color:#1e293b;">' +
            '<strong style="color:#4338ca;font-size:11px;text-transform:uppercase;">📍 Entrega y Destino</strong><br>' +
            (data.shippingAddress || 'Envío a domicilio') + '<br>' +
            '<span style="color:#64748b;font-size:11px;">' + (data.municipality || 'San Salvador Centro') + ', ' + (data.department || 'San Salvador') + (data.customerPhone ? ' &bull; Tel: ' + data.customerPhone : '') + '</span>' +
            (data.deliveryReference ? '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Ref: ' + data.deliveryReference + '</div>' : '') +
          '</div>' +
          (isTransfer && !isPaid ? '<div style="margin-top:14px;background:#fffbeb;border:1px solid #fef3c7;border-radius:14px;padding:12px;font-size:11.5px;color:#92400e;">' +
            '<strong style="color:#b45309;font-size:11px;text-transform:uppercase;">🏦 Cuentas para Transferencia</strong><br>' +
            'Titular: Aromaniak El Salvador &bull; Monto: $' + Number(data.total || 0).toFixed(2) + '<br>' +
            '&bull; Banco Agrícola (Ahorro): 300-478921-0<br>' +
            '&bull; BAC Credomatic (Ahorro): 201-839210<br>' +
            '&bull; Banco Cuscatlán (Corriente): 024-109283-7<br>' +
            '<div style="margin-top:8px;"><a href="https://wa.me/50378339470?text=' + encodeURIComponent('Hola Aromaniak, envío comprobante de orden #' + data.orderNumber) + '" style="display:inline-block;padding:6px 12px;background:#16a34a;color:#ffffff;text-decoration:none;font-size:11px;font-weight:bold;border-radius:8px;">Enviar comprobante por WhatsApp (7833-9470) &rarr;</a></div>' +
          '</div>' : '') +
          '<div style="text-align:center;margin-top:20px;">' +
            '<a href="https://aromaniaksv.com/checkout/resultado?identificadorEnlaceComercio=' + encodeURIComponent(data.orderNumber) + '&esAprobada=true" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;border-radius:12px;">Ver Mi Pedido y Envío &rarr;</a>' +
          '</div>' +
          '<div style="text-align:center;margin-top:20px;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px;">' +
            'Aromaniak SV &bull; Distribuidora de esencias y más &bull; WhatsApp: +503 7833-9470' +
          '</div>' +
        '</div>' +
      '</body></html>';
    }

    var plainText = "¡Gracias por tu compra en Aromaniak! Tu orden #" + data.orderNumber + " ha sido recibida. Distribuidora de esencias y más.";

    MailApp.sendEmail({
      to: data.customerEmail,
      subject: subject,
      body: plainText,
      htmlBody: htmlContent,
      name: "Aromaniak - Distribuidora de esencias y más"
    });

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      orderNumber: data.orderNumber 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "Aromaniak Email Webhook Activo",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
