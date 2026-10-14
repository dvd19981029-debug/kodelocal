// src/lib/thermalTicketPdf.ts
// Generador profesional de Ticket Térmico en PDF continuo de 80mm usando jsPDF

import { SaleRecord } from './store';

export interface ThermalTicketOptions {
  autoPrint?: boolean;
}

/**
 * Calcula con exactitud la altura total en milímetros requerida para el ticket según su contenido.
 */
function calculateTicketHeightMm(ticket: SaleRecord): number {
  let h = 10; // Margen superior/inferior inicial

  // 1. Encabezado emisor: ~36mm
  h += 36;

  // 2. Metadatos venta (Recibo, cajero, sucursal, fecha): ~18mm
  h += 18;

  // 3. Bloque fiscal / DTE:
  const isDte = Boolean(ticket.dteInfo?.codigoGeneracion);
  if (isDte) {
    h += 34; // Código gen, control, sello, fecha
  } else {
    h += 12; // Comprobante interno
  }

  // Cliente si existe
  if (ticket.cliente?.nombre) {
    h += 10;
    if (ticket.cliente?.nrc) h += 5;
  }

  // 4. Encabezado de tabla: ~8mm
  h += 8;

  // 5. Ítems: cada producto ocupa entre 6mm y 10mm dependiendo del largo del nombre
  const items = ticket.items || [];
  for (const it of items) {
    const name = it.name || 'PRODUCTO';
    // Si el nombre tiene más de 20 caracteres probablemente use 2 líneas
    const lines = Math.ceil(name.length / 22);
    h += Math.max(6, lines * 4 + 2);
  }

  // 6. Resumen de totales e impuestos: ~28mm
  h += 28;
  if (ticket.cashReceived != null) {
    h += 10; // Efectivo recibido y cambio
  }

  // 7. Pie de página y leyenda: ~26mm
  h += 26;
  if (isDte) {
    h += 12; // Enlace consulta hacienda
  }

  // 8. Código de barras: ~18mm
  h += 18;

  // Margen de seguridad para corte de papel
  h += 12;

  return Math.ceil(h);
}

/**
 * Construye el documento jsPDF con formato continuo de 80 mm
 */
export async function buildThermalTicketPdf(ticket: SaleRecord): Promise<any> {
  const { jsPDF } = await import('jspdf');

  const totalHeight = calculateTicketHeightMm(ticket);
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, totalHeight],
  });

  const leftM = 4;
  const rightM = 76;
  const centerX = 40;

  let y = 6;

  const drawDashedDivider = (currentY: number) => {
    doc.setLineDashPattern([1, 1], 0);
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);
    doc.line(leftM, currentY, rightM, currentY);
    doc.setLineDashPattern([], 0);
  };

  const drawSolidDivider = (currentY: number) => {
    doc.setLineWidth(0.25);
    doc.setDrawColor(0, 0, 0);
    doc.line(leftM, currentY, rightM, currentY);
  };

  // ================= 1. ENCABEZADO DEL EMISOR =================
  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text('AROMANIAK SV', centerX, y, { align: 'center' });
  y += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('VENTA DE PERFUMERIA Y FRAGANCIAS', centerX, y, { align: 'center' });
  y += 3.5;

  doc.setFontSize(7.5);
  doc.text('COLONIA ESCALON, CALLE PRINCIPAL #123', centerX, y, { align: 'center' });
  y += 3.2;

  doc.text('MUNICIPIO Y DEPARTAMENTO DE', centerX, y, { align: 'center' });
  y += 3.2;

  doc.text('SAN SALVADOR, EL SALVADOR', centerX, y, { align: 'center' });
  y += 3.2;

  doc.text('IVA DL 245678-9  NIT: 0614-120590-101-2', centerX, y, { align: 'center' });
  y += 3.5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('AROMANIAK S.A. DE C.V.', centerX, y, { align: 'center' });
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.text('GIRO: VENTA AL POR MENOR DE PERFUMERIA Y COSMETICOS', centerX, y, { align: 'center' });
  y += 4;

  drawDashedDivider(y);
  y += 3.5;

  // ================= 2. METADATOS DE VENTA Y CAJA =================
  const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  const formattedDate = ticketDate.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
  const formattedTime = ticketDate.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toLowerCase();

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Rec.: ${ticket.saleNumber || ticket.id}`, leftM, y);
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Cajero: ${(ticket.cajero || 'Caja 1').slice(0, 16)}`, leftM, y);
  doc.text(`Trans: ${(ticket.id ? ticket.id.slice(-6).toUpperCase() : '1001')}`, rightM, y, { align: 'right' });
  y += 3.3;

  doc.text('Suc.: S001', leftM, y);
  doc.text('Caja: 1', rightM, y, { align: 'right' });
  y += 3.3;

  doc.text(`Fecha: ${formattedDate} ${formattedTime}`, leftM, y);
  y += 4;

  drawDashedDivider(y);
  y += 3.5;

  // ================= 3. BLOQUE FISCAL DTE / HACIENDA =================
  const isDte = Boolean(ticket.dteInfo && ticket.dteInfo.codigoGeneracion);
  const docTipoLabel = ticket.tipoComprobante === '03'
    ? 'COMPROBANTE DE CREDITO FISCAL'
    : 'FACTURA CONSUMIDOR FINAL';

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(isDte ? 'NO ES UN DOCUMENTO FISCAL' : 'COMPROBANTE INTERNO DE PAGO', centerX, y, { align: 'center' });
  y += 3.5;

  doc.setFontSize(7.5);
  doc.text(`TIPO DOC: ${docTipoLabel}`, leftM, y);
  y += 3.5;

  if (isDte && ticket.dteInfo) {
    const dte = ticket.dteInfo;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('Fecha y hora de generacion:', leftM, y);
    y += 3;
    const dteDate = dte.fhProcesamiento ? new Date(dte.fhProcesamiento).toLocaleString('es-SV') : `${formattedDate} ${formattedTime}`;
    doc.text(`  ${dteDate}`, leftM, y);
    y += 3.2;

    doc.text('Codigo de generacion:', leftM, y);
    y += 3;
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.text(`  ${dte.codigoGeneracion || ''}`, leftM, y);
    y += 3.2;

    if (dte.numeroControl) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text('Numero de control:', leftM, y);
      y += 3;
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.text(`  ${dte.numeroControl}`, leftM, y);
      y += 3.2;
    }

    if (dte.selloRecepcion) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text('Sello de recepcion MH:', leftM, y);
      y += 3;
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.text(`  ${dte.selloRecepcion.slice(0, 36)}`, leftM, y);
      y += 3.2;
    }
  }

  // Datos de cliente si aplica
  if (ticket.cliente?.nombre) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`CLIENTE: ${ticket.cliente.nombre.slice(0, 30)}`, leftM, y);
    y += 3.2;
    if (ticket.cliente.numDocumento) {
      doc.text(`DOC: ${ticket.cliente.numDocumento}`, leftM, y);
      y += 3.2;
    }
    if (ticket.cliente.nrc) {
      doc.text(`NRC: ${ticket.cliente.nrc}`, leftM, y);
      y += 3.2;
    }
  }

  y += 1;
  drawDashedDivider(y);
  y += 3.5;

  // ================= 4. TABLA DE ÍTEMS / PRODUCTOS =================
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('CANT', leftM, y);
  doc.text('DESCRIPCION', leftM + 10, y);
  doc.text('P.U.', rightM - 18, y, { align: 'right' });
  doc.text('TOTAL', rightM, y, { align: 'right' });
  y += 2.5;

  drawSolidDivider(y);
  y += 3;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);

  const items = ticket.items || [];
  for (const it of items) {
    const qty = String(it.quantity || 1);
    const price = Number(it.price || 0).toFixed(2);
    const itemTotal = `${Number(it.total || 0).toFixed(2)}G`;
    const fullName = `${(it.name || 'PRODUCTO').toUpperCase()}${it.unit ? ` (${it.unit})` : ''}`;

    // Partir descripción si es larga para que no se sobreponga
    const splitDesc = doc.splitTextToSize(fullName, 36);

    doc.text(qty, leftM, y);
    doc.text(splitDesc[0], leftM + 10, y);
    doc.text(price, rightM - 18, y, { align: 'right' });
    doc.text(itemTotal, rightM, y, { align: 'right' });

    y += 3.2;

    // Si hubo más líneas de descripción
    for (let i = 1; i < splitDesc.length; i++) {
      doc.text(splitDesc[i], leftM + 10, y);
      y += 3;
    }
  }

  y += 1;
  drawDashedDivider(y);
  y += 3.5;

  // ================= 5. RESUMEN DE TOTALES E IMPUESTOS =================
  const subtotal = Number(ticket.subtotal || ticket.total || 0).toFixed(2);
  const total = Number(ticket.total || 0).toFixed(2);
  const totalItemsCount = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.text('G=GRAVADO   E=EXENTO', leftM, y);
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text('SUB TOTAL $:', leftM, y);
  doc.text(subtotal, rightM, y, { align: 'right' });
  y += 3.2;

  doc.text('EXENTO $:', leftM, y);
  doc.text('0.00', rightM, y, { align: 'right' });
  y += 3.2;

  doc.text('GRAVADO $:', leftM, y);
  doc.text(subtotal, rightM, y, { align: 'right' });
  y += 3.5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL A PAGAR $:', leftM, y);
  doc.text(`$${total}`, rightM, y, { align: 'right' });
  y += 4;

  // Forma de pago
  const payLabel = ticket.paymentMethod === 'CARD'
    ? 'TARJETA (WOMPI)'
    : ticket.paymentMethod === 'TRANSFER'
    ? 'TRANSFERENCIA BANCARIA'
    : ticket.paymentMethod === 'BITCOIN'
    ? 'BITCOIN'
    : 'EFECTIVO';

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`PAGO: ${payLabel}:`, leftM, y);
  doc.text(`$${total}`, rightM, y, { align: 'right' });
  y += 3.2;

  if (ticket.cashReceived != null) {
    doc.text('EFECTIVO RECIBIDO:', leftM, y);
    doc.text(`$${Number(ticket.cashReceived).toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.2;

    doc.text('CAMBIO ENTREGADO:', leftM, y);
    doc.text(`$${Number(ticket.cashChange || 0).toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.2;
  }

  doc.text('NUMERO DE PRODUCTOS:', leftM, y);
  doc.text(String(totalItemsCount), rightM, y, { align: 'right' });
  y += 4;

  drawDashedDivider(y);
  y += 4;

  // ================= 6. PIE DE PÁGINA Y LEYENDA =================
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('GRACIAS POR TU COMPRA', centerX, y, { align: 'center' });
  y += 3.5;

  doc.text('AROMANIAK SV', centerX, y, { align: 'center' });
  y += 3.2;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text('www.aromaniaksv.com', centerX, y, { align: 'center' });
  y += 3.2;

  doc.text('SERVICIO AL CLIENTE TEL. +503 2245-8800', centerX, y, { align: 'center' });
  y += 3.2;

  doc.setFontSize(6.8);
  doc.text('Para reclamos presentar este Ticket', centerX, y, { align: 'center' });
  y += 3;
  doc.text('y tu Documento de Identidad Personal', centerX, y, { align: 'center' });
  y += 4;

  if (isDte) {
    drawDashedDivider(y);
    y += 3.5;
    doc.setFontSize(6.5);
    doc.text('Consulta tu factura electronica en:', centerX, y, { align: 'center' });
    y += 3;
    doc.setFont('courier', 'bold');
    doc.text('https://admin.factura.gob.sv/consultaPublica', centerX, y, { align: 'center' });
    y += 4.5;
  }

  // ================= 7. CÓDIGO DE BARRAS TÉRMICO =================
  const barPattern = [
    2, 4, 1, 3, 2, 5, 1, 3, 2, 4, 2, 3, 1, 5, 2, 3, 1, 4, 2, 5, 1, 3, 2, 4, 1, 3, 2, 4, 1, 5, 2, 3
  ];
  let barX = centerX - 24;
  const barH = 7;

  doc.setFillColor(0, 0, 0);
  for (let i = 0; i < barPattern.length; i++) {
    const w = barPattern[i] * 0.35;
    if (i % 2 === 0) {
      doc.rect(barX, y, w, barH, 'F');
    }
    barX += w + 0.35;
  }
  y += barH + 2.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`*${ticket.saleNumber || ticket.id}*`, centerX, y, { align: 'center' });

  return doc;
}

/**
 * Descarga directamente el PDF de 80 mm en el dispositivo
 */
export async function downloadThermalTicketPdf(ticket: SaleRecord): Promise<void> {
  const doc = await buildThermalTicketPdf(ticket);
  const filename = `Ticket-${ticket.saleNumber || ticket.id}.pdf`;
  doc.save(filename);
}

/**
 * Abre el PDF de 80 mm en una pestaña limpia del navegador
 */
export async function openThermalTicketPdf(ticket: SaleRecord): Promise<void> {
  const doc = await buildThermalTicketPdf(ticket);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

/**
 * Imprime directamente el ticket de 80 mm mediante un iframe aislado sin que se imprima la página web
 */
export async function printThermalTicketPdf(ticket: SaleRecord): Promise<void> {
  try {
    const doc = await buildThermalTicketPdf(ticket);
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    // 1. Crear iframe invisible dedicado a la impresión del PDF
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.focus();
          iframe.contentWindow?.print();
        } catch {
          // Si el navegador bloquea la impresión dentro del iframe por sandbox, abrir en ventana limpia
          window.open(blobUrl, '_blank');
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }
      }, 300);
    };
  } catch (err) {
    console.error('Error generando o imprimiendo ticket térmico PDF:', err);
    // Fallback: abrir en nueva ventana
    await openThermalTicketPdf(ticket);
  }
}
