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

    // Si por alguna razón no viene htmlBody, generar un resumen de respaldo
    if (!htmlContent) {
      htmlContent = "<h2>¡Gracias por tu compra en Aromaniak SV!</h2>" +
        "<p>Distribuidora de esencias y más</p>" +
        "<p>Tu orden <strong>#" + data.orderNumber + "</strong> por un total de <strong>$" + Number(data.total).toFixed(2) + "</strong> está en preparación.</p>";
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
