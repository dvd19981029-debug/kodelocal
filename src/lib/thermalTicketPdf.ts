// src/lib/thermalTicketPdf.ts
// Generador profesional de Ticket Térmico en PDF continuo de 80mm usando jsPDF

import { SaleRecord, ProductItem, getOrderPaymentDisplayInfo } from './store';
import { getOriginalFragranceInfo, parseKitOrderItem } from './perfumeNames';

export interface ThermalTicketOptions {
  autoPrint?: boolean;
}

/**
 * Dibuja el contenido del ticket en el documento jsPDF y retorna la coordenada Y final exacta en mm.
 */
function renderTicketToDoc(doc: any, ticket: SaleRecord): number {
  const leftM = 3;
  const rightM = 68;
  const centerX = 35.5;

  // Los primeros 32mm (256 líneas de puntos a 203 DPI = Banda 0 del driver POS-80 en macOS)
  // se dejan 100% en blanco (bytes 0x00 NUL). Como jsPDF dibuja el texto hacia arriba desde
  // la línea base (y), iniciamos en y = 42mm para que incluso la parte superior de las letras
  // de "AROMANIAK SV" quede después de los 32mm y el Bloque 0 no tenga ni un solo píxel negro.
  let y = 42;

  const drawDashedDivider = (currentY: number) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text('------------------------------------------', centerX, currentY, { align: 'center' });
  };

  const drawSolidDivider = (currentY: number) => {
    doc.setLineWidth(0.25);
    doc.setDrawColor(0, 0, 0);
    doc.line(leftM, currentY, rightM, currentY);
  };

  // ================= 1. ENCABEZADO DEL EMISOR =================
  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text('AROMANIAK SV', centerX, y, { align: 'center' });
  y += 3.8;

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('GRUPO KODE, S.A.S. DE C.V.', centerX, y, { align: 'center' });
  y += 3.2;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('NIT: 0623-290726-106-9   NRC: 390357-8', centerX, y, { align: 'center' });
  y += 3.1;

  doc.setFontSize(6.5);
  doc.text('GIRO: VENTA AL POR MENOR DE ARTICULOS DE BAZAR', centerX, y, { align: 'center' });
  y += 3.0;

  doc.text('CL. LAS VIOLETAS Y 39 AV. NORTE #33, URB. UNIVERSITARIA', centerX, y, { align: 'center' });
  y += 2.9;

  doc.text('NIVEL 3, SAN SALVADOR CENTRO, SAN SALVADOR', centerX, y, { align: 'center' });
  y += 3.5;

  drawDashedDivider(y);
  y += 3.5;

  // ================= 2. METADATOS DE VENTA Y CAJA =================
  const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  const safeTicketDate = !isNaN(ticketDate.getTime()) ? ticketDate : new Date();
  const formattedDate = safeTicketDate.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
  const formattedTime = safeTicketDate.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toLowerCase();

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(`Rec.: ${ticket.saleNumber || ticket.id}`, leftM, y);
  y += 3.3;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text(`Cajero: ${(ticket.cajero || 'Caja 1').slice(0, 16)}`, leftM, y);
  doc.text(`Trans: ${(ticket.id ? ticket.id.slice(-6).toUpperCase() : '1001')}`, rightM, y, { align: 'right' });
  y += 3.1;

  doc.text('Suc.: S001', leftM, y);
  doc.text('Caja: 1', rightM, y, { align: 'right' });
  y += 3.1;

  doc.text(`Fecha: ${formattedDate} ${formattedTime}`, leftM, y);
  y += 3.5;

  drawDashedDivider(y);
  y += 3.5;

  // ================= 3. BLOQUE FISCAL DTE / HACIENDA =================
  const isDte = Boolean(ticket.dteInfo && ticket.dteInfo.codigoGeneracion);
  const docTipoLabel = ticket.tipoComprobante === '03'
    ? 'COMPROBANTE DE CREDITO FISCAL'
    : ticket.tipoComprobante === 'TICKET'
    ? 'TICKET DE VENTA'
    : 'FACTURA CONSUMIDOR FINAL';

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.8);
  doc.text(isDte ? 'NO ES UN DOCUMENTO FISCAL' : 'COMPROBANTE INTERNO DE PAGO', centerX, y, { align: 'center' });
  y += 3.3;

  doc.setFontSize(7.2);
  doc.text(`TIPO DOC: ${docTipoLabel}`, leftM, y);
  y += 3.3;

  if (isDte && ticket.dteInfo) {
    const dte = ticket.dteInfo;
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.8);
    doc.text('Fecha y hora de generacion:', leftM, y);
    y += 2.9;
    const parsedDteDate = dte.fhProcesamiento ? new Date(dte.fhProcesamiento) : null;
    const dteDate =
      parsedDteDate && !isNaN(parsedDteDate.getTime())
        ? parsedDteDate.toLocaleString('es-SV')
        : dte.fhProcesamiento && !String(dte.fhProcesamiento).includes('Invalid')
        ? String(dte.fhProcesamiento)
        : `${formattedDate} ${formattedTime}`;
    doc.text(`  ${dteDate}`, leftM, y);
    y += 3.1;

    doc.text('Codigo de generacion:', leftM, y);
    y += 2.9;
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.4);
    doc.text(`  ${dte.codigoGeneracion || ''}`, leftM, y);
    y += 3.1;

    if (dte.numeroControl) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.8);
      doc.text('Numero de control:', leftM, y);
      y += 2.9;
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.8);
      doc.text(`  ${dte.numeroControl}`, leftM, y);
      y += 3.1;
    }

    if (dte.selloRecepcion) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.8);
      doc.text('Sello de recepcion MH:', leftM, y);
      y += 2.9;
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.2);
      doc.text(`  ${dte.selloRecepcion.slice(0, 36)}`, leftM, y);
      y += 3.1;
    }
  }

  // Datos de cliente si aplica
  if (ticket.cliente?.nombre) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.2);
    doc.text(`CLIENTE: ${ticket.cliente.nombre.slice(0, 28)}`, leftM, y);
    y += 3.1;
    const ticketPhone = ticket.cliente.telefono || (ticket as any).customerPhone || ticket.domicilio?.customerPhone;
    if (ticketPhone) {
      doc.text(`TEL: ${ticketPhone}`, leftM, y);
      y += 3.1;
    }
    if (ticket.cliente.numDocumento) {
      doc.text(`DOC: ${ticket.cliente.numDocumento}`, leftM, y);
      y += 3.1;
    }
    if (ticket.cliente.nrc) {
      doc.text(`NRC: ${ticket.cliente.nrc}`, leftM, y);
      y += 3.1;
    }
  }

  y += 0.5;
  drawDashedDivider(y);
  y += 3.5;

  // ================= 4. TABLA DE ÍTEMS / PRODUCTOS =================
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.text('CANT', leftM, y);
  doc.text('DESCRIPCION', leftM + 8, y);
  doc.text('P.U.', rightM - 16, y, { align: 'right' });
  doc.text('TOTAL', rightM, y, { align: 'right' });
  y += 2.2;

  drawSolidDivider(y);
  y += 3.2;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);

  const items = ticket.items || [];
  for (const it of items) {
    const qty = String(it.quantity || 1);
    const price = Number(it.price || 0).toFixed(2);
    const itemTotal = `${Number(it.total || 0).toFixed(2)}G`;
    const baseName = (it.name || 'PRODUCTO').toUpperCase();
    const alreadyHasUnit = /\((?:1\s*)?onza|½\s*(?:onza|oz)|1\/2\s*(?:onza|oz)|media\s*onza\)/i.test(baseName);
    const fullName = `${baseName}${it.unit && !alreadyHasUnit ? ` (${it.unit})` : ''}`;

    // Partir descripción si es larga para que no se sobreponga
    const splitDesc = doc.splitTextToSize(fullName, 33);

    doc.text(qty, leftM, y);
    doc.text(splitDesc[0], leftM + 8, y);
    doc.text(price, rightM - 16, y, { align: 'right' });
    doc.text(itemTotal, rightM, y, { align: 'right' });

    y += 3.1;

    // Si hubo más líneas de descripción
    for (let i = 1; i < splitDesc.length; i++) {
      doc.text(splitDesc[i], leftM + 8, y);
      y += 2.9;
    }
  }

  y += 0.8;
  drawDashedDivider(y);
  y += 3.5;

  // ================= 5. RESUMEN DE TOTALES E IMPUESTOS =================
  const subtotal = Number(ticket.subtotal || ticket.total || 0).toFixed(2);
  const total = Number(ticket.total || 0).toFixed(2);
  const totalItemsCount = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.text('G=GRAVADO   E=EXENTO', leftM, y);
  y += 3.2;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text('SUB TOTAL $:', leftM, y);
  doc.text(subtotal, rightM, y, { align: 'right' });
  y += 3.1;

  doc.text('EXENTO $:', leftM, y);
  doc.text('0.00', rightM, y, { align: 'right' });
  y += 3.1;

  doc.text('GRAVADO $:', leftM, y);
  doc.text(subtotal, rightM, y, { align: 'right' });
  y += 3.4;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL A PAGAR $:', leftM, y);
  doc.text(`$${total}`, rightM, y, { align: 'right' });
  y += 3.8;

  // Forma de pago
  const payLabel = ticket.paymentMethod === 'CARD'
    ? 'TARJETA'
    : ticket.paymentMethod === 'TRANSFER'
    ? 'TRANSFERENCIA'
    : ticket.paymentMethod === 'WOMPI'
    ? 'WOMPI'
    : ticket.paymentMethod === 'CONTRA_ENTREGA'
    ? 'CONTRA ENTREGA'
    : 'EFECTIVO';

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text(`PAGO: ${payLabel}:`, leftM, y);
  doc.text(`$${total}`, rightM, y, { align: 'right' });
  y += 3.1;

  if (ticket.cashReceived != null) {
    doc.text('EFECTIVO RECIBIDO:', leftM, y);
    doc.text(`$${Number(ticket.cashReceived).toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.1;

    doc.text('CAMBIO ENTREGADO:', leftM, y);
    doc.text(`$${Number(ticket.cashChange || 0).toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.1;
  }

  doc.text('NUMERO DE PRODUCTOS:', leftM, y);
  doc.text(String(totalItemsCount), rightM, y, { align: 'right' });
  y += 3.5;

  drawDashedDivider(y);
  y += 3.5;

  // ================= 6. PIE DE PÁGINA Y LEYENDA =================
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('GRACIAS POR TU COMPRA', centerX, y, { align: 'center' });
  y += 3.3;

  doc.text('AROMANIAK SV', centerX, y, { align: 'center' });
  y += 3.1;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text('www.aromaniaksv.com', centerX, y, { align: 'center' });
  y += 3.1;

  doc.setFontSize(6.5);
  doc.text('Para reclamos presentar este Ticket', centerX, y, { align: 'center' });
  y += 2.9;
  doc.text('y tu Documento de Identidad Personal', centerX, y, { align: 'center' });
  y += 3.5;

  if (isDte) {
    drawDashedDivider(y);
    y += 3.3;
    doc.setFontSize(6.2);
    doc.text('Consulta tu factura electronica en:', centerX, y, { align: 'center' });
    y += 2.9;
    doc.setFont('courier', 'bold');
    doc.text('https://admin.factura.gob.sv/consultaPublica', centerX, y, { align: 'center' });
    y += 4;
  }

  // ================= 7. CÓDIGO DE BARRAS TÉRMICO =================
  const barPattern = [
    2, 4, 1, 3, 2, 5, 1, 3, 2, 4, 2, 3, 1, 5, 2, 3, 1, 4, 2, 5, 1, 3, 2, 4, 1, 3, 2, 4, 1, 5, 2, 3
  ];
  let barX = centerX - 22;
  const barH = 6.5;

  doc.setFillColor(0, 0, 0);
  for (let i = 0; i < barPattern.length; i++) {
    const w = barPattern[i] * 0.32;
    if (i % 2 === 0) {
      doc.rect(barX, y, w, barH, 'F');
    }
    barX += w + 0.32;
  }
  y += barH + 2.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text(`*${ticket.saleNumber || ticket.id}*`, centerX, y, { align: 'center' });

  return Math.ceil(y + 6);
}

/**
 * Construye el documento jsPDF con formato continuo exacto de 72 mm (área imprimible de rollo 80 mm)
 */
export async function buildThermalTicketPdf(ticket: SaleRecord): Promise<any> {
  const { jsPDF } = await import('jspdf');

  // Pasada 1: medir el alto exacto real para evitar espacio vacío inferior que desplace el origen PDF hacia arriba
  const measureDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, 300],
  });
  const exactHeight = Math.max(80, renderTicketToDoc(measureDoc, ticket));

  // Pasada 2: generar el PDF con el alto exacto
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, exactHeight],
  });
  renderTicketToDoc(doc, ticket);

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

// ============================================================================
// ORDEN DE DESPACHO / BODEGA (FORMATO TÉRMICO 80MM EN PDF)
// ============================================================================

const cleanPdfText = (s: string) =>
  String(s || '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/×/g, 'x')
    .replace(/•/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Dibuja la Orden de Despacho de Bodega en formato térmico de 80mm (72mm área imprimible)
 * mostrando claramente:
 *  - Perfume con su nombre y su inspiración
 *  - Posición clara del estante (Puesto)
 *  - Cantidad claramente expresada
 */
function renderDispatchOrderToDoc(doc: any, ticket: SaleRecord, products?: ProductItem[]): number {
  const leftM = 3;
  const rightM = 68;
  const centerX = 35.5;

  // Mismo margen superior seguro de 42mm para impresora térmica POS-80
  let y = 42;

  const drawDashedDivider = (currentY: number) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text('------------------------------------------', centerX, currentY, { align: 'center' });
  };

  const drawSolidDivider = (currentY: number, lineWidth = 0.35) => {
    doc.setLineWidth(lineWidth);
    doc.setDrawColor(0, 0, 0);
    doc.line(leftM, currentY, rightM, currentY);
  };

  // ================= 1. ENCABEZADO ORDEN DE DESPACHO =================
  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('AROMANIAK SV', centerX, y, { align: 'center' });
  y += 3.5;

  drawSolidDivider(y, 0.4);
  y += 4.2;

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.text('ORDEN DE DESPACHO - BODEGA', centerX, y, { align: 'center' });
  y += 2.2;

  drawSolidDivider(y, 0.4);
  y += 4.2;

  // ================= 2. DATOS DE LA ORDEN =================
  const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
  const safeTicketDate = !isNaN(ticketDate.getTime()) ? ticketDate : new Date();
  const formattedDate = safeTicketDate.toLocaleDateString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
  const formattedTime = safeTicketDate.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();

  const items = ticket.items || [];
  const isEnvioItem = (it: any) =>
    it.productId === 'ENVIO-DOM' || String(it.name || '').toLowerCase().includes('envío a domicilio');
  const envioItemInList = items.find(isEnvioItem);
  const itemsSubtotal = items.reduce(
    (acc, it) => acc + (Number(it.total) || Number(it.price || 0) * Number(it.quantity || 1)),
    0
  );
  const nonShippingSubtotal = items
    .filter((it) => !isEnvioItem(it))
    .reduce((acc, it) => acc + (Number(it.total) || Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const shippingAmount = envioItemInList
    ? Number(envioItemInList.total || envioItemInList.price || ticket.shippingCost || 0)
    : Number(ticket.shippingCost || 0);
  const resolvedTotal =
    Number(ticket.total || 0) > 0
      ? Number(ticket.total)
      : itemsSubtotal + (envioItemInList ? 0 : shippingAmount);

  const customerName = cleanPdfText(ticket.cliente?.nombre || 'Consumidor Final');
  const customerPhone = cleanPdfText(
    ticket.cliente?.telefono || (ticket as any).customerPhone || ticket.domicilio?.customerPhone || ''
  );
  const customerDoc = cleanPdfText(ticket.cliente?.numDocumento || ticket.cliente?.nrc || '');
  const docTypeLabel =
    (ticket.tipoComprobante || (ticket.cliente?.nrc ? '03' : '01')) === '03'
      ? 'Credito Fiscal (CCF)'
      : ticket.tipoComprobante === 'TICKET'
      ? 'Ticket'
      : 'Factura (FC)';
  const paymentInfo = getOrderPaymentDisplayInfo(ticket);
  const paymentMethodLabel = cleanPdfText(paymentInfo.methodLabel);
  const paymentStatusClean = cleanPdfText(paymentInfo.statusLabel);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(`ORDEN: #${cleanPdfText(ticket.saleNumber || ticket.id)}`, leftM, y);
  doc.text(`$${resolvedTotal.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 3.8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Fecha: ${formattedDate} ${formattedTime}`, leftM, y);
  y += 3.3;

  const origenLabel = cleanPdfText(ticket.vendedor || ticket.cajero || 'Caja 1');
  doc.text(`Origen: ${origenLabel.slice(0, 32)}`, leftM, y);
  y += 3.3;

  doc.text(`Comprobante: ${docTypeLabel}`, leftM, y);
  y += 3.3;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.2);
  const splitPayStatus = doc.splitTextToSize(`PAGO: ${paymentStatusClean}`, 64);
  for (const line of splitPayStatus) {
    doc.text(line, leftM, y);
    y += 3.4;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.8);
  const splitClient = doc.splitTextToSize(`CLIENTE: ${customerName.toUpperCase()}`, 64);
  for (const line of splitClient) {
    doc.text(line, leftM, y);
    y += 3.5;
  }

  if (customerPhone) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.2);
    doc.text(`TEL: ${customerPhone}`, leftM, y);
    y += 3.4;
  }
  if (customerDoc) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Doc/NRC: ${customerDoc}`, leftM, y);
    y += 3.3;
  }

  if (ticket.deliveryNotes) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.2);
    const splitNotes = doc.splitTextToSize(cleanPdfText(ticket.deliveryNotes), 64);
    for (const line of splitNotes) {
      doc.text(line, leftM, y);
      y += 3.1;
    }
  }

  y += 0.8;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.2);
  doc.text(paymentInfo.isPaid ? 'TOTAL PAGADO:' : 'TOTAL A CANCELAR:', leftM, y);
  doc.text(`$${resolvedTotal.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 2.2;

  drawSolidDivider(y, 0.35);
  y += 3.8;

  // ================= 3. DETALLE DE PRODUCTOS Y ESTANTES =================
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(`PRODUCTOS A PREPARAR (${items.length}):`, leftM, y);
  y += 2.5;

  drawDashedDivider(y);
  y += 4;

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const origInfo = getOriginalFragranceInfo(it, products);
    const kitInfo = parseKitOrderItem(it, products);
    const shelfLocation = cleanPdfText(
      kitInfo?.essencePuesto || it.puesto || products?.find(p => p.id === it.productId)?.puesto || 'A1'
    ).toUpperCase();

    const unitStr = cleanPdfText(it.unit || 'Oz');
    const qtyFormatted = kitInfo
      ? `${it.quantity} Perfume(s) 100ml`
      : /^\d/.test(unitStr)
      ? `${it.quantity} x ${unitStr}`
      : `${it.quantity} ${unitStr}`;

    const perfumeName = kitInfo
      ? cleanPdfText(`ARMA TU PERFUME: ${kitInfo.fragranceName}`)
      : cleanPdfText(it.name || 'PRODUCTO');

    // Caja destacada de PUESTO / ESTANTE a la derecha
    const boxW = 22;
    const boxH = 5.4;
    const boxX = rightM - boxW;
    const boxY = y - 3.8;
    doc.setLineWidth(0.35);
    doc.setDrawColor(0, 0, 0);
    doc.rect(boxX, boxY, boxW, boxH);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.2);
    doc.text(`PUESTO: ${shelfLocation}`, boxX + boxW / 2, y - 0.3, { align: 'center' });

    // Nombre del perfume con casilla de chequeo
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    const splitName = doc.splitTextToSize(`[ ] ${idx + 1}. ${perfumeName}`, 41);
    for (let i = 0; i < splitName.length; i++) {
      doc.text(splitName[i], leftM, y);
      y += 3.4;
    }

    // Si el nombre solo ocupó 1 línea, asegurar espacio debajo de la caja del puesto
    if (splitName.length === 1) {
      y += 0.8;
    }

    // Inspiración / Original bien claro
    const effectiveOriginal = kitInfo?.originalName || origInfo?.originalName;
    const effectiveBrand = kitInfo?.brand || origInfo?.brand;
    if (effectiveOriginal) {
      const inspText = `Inspiracion: ${cleanPdfText(effectiveOriginal)}${
        effectiveBrand ? ` (${cleanPdfText(effectiveBrand)})` : ''
      }`;
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.8);
      const splitInsp = doc.splitTextToSize(inspText, 62);
      for (const line of splitInsp) {
        doc.text(line, leftM + 2, y);
        y += 3.2;
      }
    }

    // Si es un pedido de Arma tu propio perfume, imprimir Fórmula, Bote 100ml y Etiqueta
    if (kitInfo) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.8);
      const formulaLine = `Concentracion: ${kitInfo.isPlus ? 'PLUS 1.5 Oz (1 Oz + 1/2 Oz)' : 'Estandar 1 Oz'}`;
      doc.text(cleanPdfText(formulaLine), leftM + 2, y);
      y += 3.2;

      const bottleLine = `Bote 100ml: ${kitInfo.bottleName} [Estante ${kitInfo.bottlePuesto}]`;
      const splitBottle = doc.splitTextToSize(cleanPdfText(bottleLine), 62);
      for (const bLine of splitBottle) {
        doc.text(bLine, leftM + 2, y);
        y += 3.2;
      }

      const labelLine = `Etiqueta: ${kitInfo.hasLabel ? 'CON ETIQUETA (Impresa)' : 'SIN ETIQUETA (Frasco liso)'}`;
      doc.text(cleanPdfText(labelLine), leftM + 2, y);
      y += 3.2;
    }

    // Cantidad y Posición en Estante claramente expresadas
    y += 0.5;
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.8);
    doc.text(`CANTIDAD: ${qtyFormatted}`, leftM + 2, y);
    doc.text(`ESTANTE: ${shelfLocation}`, rightM, y, { align: 'right' });
    y += 3.2;

    const lineUnitPrice = Number(it.price || 0);
    const lineSubtotal = Number(it.total) || lineUnitPrice * Number(it.quantity || 1);
    if (lineSubtotal > 0 || lineUnitPrice > 0) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text(`P.Unit: $${lineUnitPrice.toFixed(2)}`, leftM + 2, y);
      doc.setFont('courier', 'bold');
      doc.text(`Subtotal: $${lineSubtotal.toFixed(2)}`, rightM, y, { align: 'right' });
      y += 3.1;
    }

    drawDashedDivider(y);
    y += 3.8;
  }

  // ================= 4. RESUMEN Y CONTROL DE DESPACHO =================
  const totalUnidades = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.0);
  doc.text(`TOTAL LINEAS: ${items.length}`, leftM, y);
  doc.text(`VOLUMEN TOTAL: ${totalUnidades}`, rightM, y, { align: 'right' });
  y += 3.5;

  drawSolidDivider(y, 0.35);
  y += 3.8;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.2);
  const splitFooterClient = doc.splitTextToSize(
    `CLIENTE: ${customerName.toUpperCase()}${customerPhone ? ` - TEL: ${customerPhone}` : ''}`,
    64
  );
  for (const line of splitFooterClient) {
    doc.text(line, leftM, y);
    y += 3.4;
  }

  if (shippingAmount > 0) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.6);
    doc.text('SUBTOTAL PRODUCTOS:', leftM, y);
    doc.text(`$${nonShippingSubtotal.toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.1;

    doc.text('ENVIO A DOMICILIO:', leftM, y);
    doc.text(`$${shippingAmount.toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.3;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.0);
  const splitFooterPay = doc.splitTextToSize(`ESTADO PAGO: ${paymentStatusClean} (${paymentMethodLabel})`, 64);
  for (const line of splitFooterPay) {
    doc.text(line, leftM, y);
    y += 3.3;
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.2);
  doc.text(paymentInfo.isPaid ? 'TOTAL PAGADO:' : 'TOTAL A CANCELAR:', leftM, y);
  doc.text(`$${resolvedTotal.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 2.5;

  drawSolidDivider(y, 0.4);
  y += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text('Preparado por: _______________________', leftM, y);
  y += 4.5;

  // Código de barras de referencia de la orden
  const barPattern = [
    2, 4, 1, 3, 2, 5, 1, 3, 2, 4, 2, 3, 1, 5, 2, 3, 1, 4, 2, 5, 1, 3, 2, 4, 1, 3, 2, 4, 1, 5, 2, 3
  ];
  let barX = centerX - 22;
  const barH = 5.5;

  doc.setFillColor(0, 0, 0);
  for (let i = 0; i < barPattern.length; i++) {
    const w = barPattern[i] * 0.32;
    if (i % 2 === 0) {
      doc.rect(barX, y, w, barH, 'F');
    }
    barX += w + 0.32;
  }
  y += barH + 2.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text(`*${cleanPdfText(ticket.saleNumber || ticket.id)}*`, centerX, y, { align: 'center' });

  return Math.ceil(y + 6);
}

/**
 * Construye el documento jsPDF de 80mm (72mm área imprimible) para la Orden de Despacho de Bodega
 */
export async function buildDispatchTicketPdf(ticket: SaleRecord, products?: ProductItem[]): Promise<any> {
  const { jsPDF } = await import('jspdf');

  const measureDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, 300],
  });
  const exactHeight = Math.max(80, renderDispatchOrderToDoc(measureDoc, ticket, products));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, exactHeight],
  });
  renderDispatchOrderToDoc(doc, ticket, products);

  return doc;
}

/**
 * Descarga el PDF de 80mm de la Orden de Despacho
 */
export async function downloadDispatchTicketPdf(ticket: SaleRecord, products?: ProductItem[]): Promise<void> {
  const doc = await buildDispatchTicketPdf(ticket, products);
  const filename = `Orden-Despacho-${ticket.saleNumber || ticket.id}.pdf`;
  doc.save(filename);
}

/**
 * Abre el PDF de 80mm de la Orden de Despacho en una nueva pestaña
 */
export async function openDispatchTicketPdf(ticket: SaleRecord, products?: ProductItem[]): Promise<void> {
  const doc = await buildDispatchTicketPdf(ticket, products);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

/**
 * Envía a imprimir directamente el PDF de 80mm de la Orden de Despacho para la ticketera térmica
 */
export async function printDispatchTicketPdf(ticket: SaleRecord, products?: ProductItem[]): Promise<void> {
  try {
    const doc = await buildDispatchTicketPdf(ticket, products);
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

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
    console.error('Error generando o imprimiendo orden de despacho térmica PDF:', err);
    await openDispatchTicketPdf(ticket, products);
  }
}

function parseSaleTicketDate(sale: SaleRecord): Date {
  const raw = sale.invoicedAt || sale.dteInfo?.fhProcesamiento || sale.createdAt;
  if (!raw) return new Date();
  const svMatch = String(raw).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
  if (svMatch) {
    const [, dd, mm, yyyy, t] = svMatch;
    const d = new Date(`${yyyy}-${mm}-${dd}T${t || '00:00:00'}-06:00`);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(raw);
  return !isNaN(d.getTime()) ? d : new Date();
}

function renderDailyCashSalesToDoc(
  doc: any,
  cashSales: SaleRecord[],
  options?: { dateLabel?: string; cashier?: string }
): number {
  const leftM = 3;
  const rightM = 68;
  const centerX = 35.5;
  let y = 42;

  const drawDashedDivider = (currentY: number) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text('------------------------------------------', centerX, currentY, { align: 'center' });
  };

  const drawSolidDivider = (currentY: number, width = 0.25) => {
    doc.setLineWidth(width);
    doc.setDrawColor(0, 0, 0);
    doc.line(leftM, currentY, rightM, currentY);
  };

  const now = new Date();
  const dateLabel =
    options?.dateLabel ||
    now.toLocaleDateString('es-SV', {
      timeZone: 'America/El_Salvador',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  const timeLabel = now
    .toLocaleTimeString('es-SV', {
      timeZone: 'America/El_Salvador',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();

  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('AROMANIAK SV', centerX, y, { align: 'center' });
  y += 3.8;

  doc.setFontSize(8.5);
  doc.text('VENTAS EN EFECTIVO DE HOY', centerX, y, { align: 'center' });
  y += 3.4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('REPORTE DE ARQUEO DE EFECTIVO (80MM)', centerX, y, { align: 'center' });
  y += 3.2;

  drawSolidDivider(y, 0.35);
  y += 3.5;

  doc.setFontSize(7.2);
  doc.text(`Fecha Corte: ${cleanPdfText(dateLabel)}`, leftM, y);
  doc.text(`Hora: ${cleanPdfText(timeLabel)}`, rightM, y, { align: 'right' });
  y += 3.2;

  doc.text(`Cajero/Resp: ${cleanPdfText((options?.cashier || 'Caja Principal').slice(0, 22))}`, leftM, y);
  y += 3.2;

  doc.setFont('courier', 'bold');
  doc.text(`Facturas en Efectivo: ${cashSales.length}`, leftM, y);
  y += 3.4;

  drawDashedDivider(y);
  y += 3.5;

  // Cabecera de tabla
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.8);
  doc.text('HORA', leftM, y);
  doc.text('DOC / CLIENTE', leftM + 12, y);
  doc.text('MONTO', rightM, y, { align: 'right' });
  y += 2.2;

  drawSolidDivider(y);
  y += 3.2;

  let totalCash = 0;
  let totalSubtotal = 0;
  let totalIva = 0;
  let countFC = 0;
  let totalFC = 0;
  let countCCF = 0;
  let totalCCF = 0;
  let countTicket = 0;
  let totalTicket = 0;

  for (const s of cashSales) {
    const dt = parseSaleTicketDate(s);
    const hr = dt
      .toLocaleTimeString('es-SV', {
        timeZone: 'America/El_Salvador',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .slice(0, 5);
    const tipoStr = s.tipoComprobante === '03' ? 'CCF' : s.tipoComprobante === '01' ? 'FC' : 'TK';
    const refNum = s.dteInfo?.numeroControl
      ? s.dteInfo.numeroControl.slice(-8)
      : `#${s.saleNumber || s.id.slice(-5)}`;
    const clientName = cleanPdfText(s.cliente?.nombre || 'Consumidor Final').toUpperCase();
    const amount = Number(s.total || 0);
    const sub = Number(s.subtotal || amount / 1.13);
    const iva = Number(s.ivaTotal != null ? s.ivaTotal : amount - sub);

    totalCash += amount;
    totalSubtotal += sub;
    totalIva += iva;

    if (s.tipoComprobante === '03') {
      countCCF += 1;
      totalCCF += amount;
    } else if (s.tipoComprobante === '01') {
      countFC += 1;
      totalFC += amount;
    } else {
      countTicket += 1;
      totalTicket += amount;
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.8);
    doc.text(hr, leftM, y);
    doc.text(`${tipoStr} ${cleanPdfText(refNum)}`, leftM + 12, y);
    doc.text(`$${amount.toFixed(2)}`, rightM, y, { align: 'right' });
    y += 2.9;

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    const splitClient = doc.splitTextToSize(clientName, 44);
    doc.text(splitClient[0] || 'CONSUMIDOR FINAL', leftM + 12, y);
    y += 2.9;

    if (s.items && s.items.length > 0) {
      const itemsSummary = s.items
        .map((it) => `${it.quantity}x ${cleanPdfText(it.name).slice(0, 16)}`)
        .join(', ');
      const splitItems = doc.splitTextToSize(itemsSummary, 44);
      doc.setFontSize(6.0);
      doc.text(splitItems[0], leftM + 12, y);
      y += 2.8;
    }

    y += 0.6;
  }

  drawDashedDivider(y);
  y += 3.5;

  // Desglose por tipo de comprobante en efectivo
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.text('DESGLOSE DE EFECTIVO POR DOCUMENTO:', leftM, y);
  y += 3.1;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text(`Facturas (01) [${countFC}]:`, leftM, y);
  doc.text(`$${totalFC.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 3.0;

  doc.text(`Credito Fiscal (03) [${countCCF}]:`, leftM, y);
  doc.text(`$${totalCCF.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 3.0;

  if (countTicket > 0) {
    doc.text(`Tickets Internos [${countTicket}]:`, leftM, y);
    doc.text(`$${totalTicket.toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.0;
  }

  y += 0.5;
  drawSolidDivider(y, 0.3);
  y += 3.4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text('SUBTOTAL NETO EFECTIVO:', leftM, y);
  doc.text(`$${totalSubtotal.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 3.0;

  doc.text('IVA (13%) EFECTIVO:', leftM, y);
  doc.text(`$${totalIva.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 3.6;

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.2);
  doc.text('EFECTIVO DE HOY (+CAJA):', leftM, y);
  doc.text(`$${totalCash.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 4.2;

  drawSolidDivider(y, 0.35);
  y += 3.8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.6);
  doc.text('Monto exacto ingresado en efectivo por ventas', centerX, y, { align: 'center' });
  y += 2.8;
  doc.text('facturadas hoy que debe sumarse al fondo de caja.', centerX, y, { align: 'center' });
  y += 6.0;

  doc.text('Firma Cajero: ________________________', leftM, y);
  y += 4;

  return Math.ceil(y + 6);
}

function renderDailySummaryByPaymentToDoc(
  doc: any,
  dailySales: SaleRecord[],
  options?: { dateLabel?: string; cashier?: string }
): number {
  const leftM = 3;
  const rightM = 68;
  const centerX = 35.5;
  let y = 42;

  const drawDashedDivider = (currentY: number) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text('------------------------------------------', centerX, currentY, { align: 'center' });
  };

  const drawSolidDivider = (currentY: number, width = 0.25) => {
    doc.setLineWidth(width);
    doc.setDrawColor(0, 0, 0);
    doc.line(leftM, currentY, rightM, currentY);
  };

  const now = new Date();
  const dateLabel =
    options?.dateLabel ||
    now.toLocaleDateString('es-SV', {
      timeZone: 'America/El_Salvador',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  const timeLabel = now
    .toLocaleTimeString('es-SV', {
      timeZone: 'America/El_Salvador',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();

  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('AROMANIAK SV', centerX, y, { align: 'center' });
  y += 3.8;

  doc.setFontSize(8.5);
  doc.text('VENTA DEL DIA RESUMIDA', centerX, y, { align: 'center' });
  y += 3.4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('DESGLOSE POR FORMA DE PAGO Y COMPROBANTE', centerX, y, { align: 'center' });
  y += 3.2;

  drawSolidDivider(y, 0.35);
  y += 3.5;

  doc.setFontSize(7.2);
  doc.text(`Fecha: ${cleanPdfText(dateLabel)}`, leftM, y);
  doc.text(`Hora: ${cleanPdfText(timeLabel)}`, rightM, y, { align: 'right' });
  y += 3.2;

  doc.text(`Cajero/Resp: ${cleanPdfText((options?.cashier || 'Caja Principal').slice(0, 22))}`, leftM, y);
  y += 3.2;

  doc.setFont('courier', 'bold');
  doc.text(`Total Facturaciones Hoy: ${dailySales.length}`, leftM, y);
  y += 3.4;

  drawDashedDivider(y);
  y += 3.5;

  // Cálculos por forma de pago (separando Tarjeta POS Mostrador vs Wompi / Ecommerce)
  const byMethod = {
    CASH: { label: 'EFECTIVO', count: 0, total: 0 },
    CARD: { label: 'TARJETA POS (MOSTRADOR)', count: 0, total: 0 },
    TRANSFER: { label: 'TRANSFERENCIA BANCARIA', count: 0, total: 0 },
    WOMPI: { label: 'WOMPI / ECOMMERCE', count: 0, total: 0 },
    CONTRA_ENTREGA: { label: 'CONTRA ENTREGA', count: 0, total: 0 },
    BITCOIN: { label: 'BITCOIN / CRIPTO', count: 0, total: 0 },
  };

  const byDoc = {
    '01': { label: 'FACTURA CONSUMIDOR FINAL (01)', count: 0, total: 0 },
    '03': { label: 'CREDITO FISCAL - CCF (03)', count: 0, total: 0 },
    TICKET: { label: 'TICKET DE VENTA', count: 0, total: 0 },
  };

  let grandTotal = 0;
  let grandSubtotal = 0;
  let grandIva = 0;

  const isWompiOrEcomCard = (s: SaleRecord) => {
    if (s.paymentMethod === 'WOMPI') return true;
    const isOnline =
      s.channel === 'ONLINE' || String(s.saleNumber || '').toUpperCase().startsWith('WEB-');
    return isOnline && s.paymentMethod === 'CARD';
  };

  for (const s of dailySales) {
    const amt = Number(s.total || 0);
    const sub = Number(s.subtotal || amt / 1.13);
    const iva = Number(s.ivaTotal != null ? s.ivaTotal : amt - sub);

    grandTotal += amt;
    grandSubtotal += sub;
    grandIva += iva;

    const mKey = (isWompiOrEcomCard(s) ? 'WOMPI' : s.paymentMethod || 'CASH') as keyof typeof byMethod;
    if (byMethod[mKey]) {
      byMethod[mKey].count += 1;
      byMethod[mKey].total += amt;
    } else {
      byMethod.CASH.count += 1;
      byMethod.CASH.total += amt;
    }

    const dKey = (s.tipoComprobante || '01') as keyof typeof byDoc;
    if (byDoc[dKey]) {
      byDoc[dKey].count += 1;
      byDoc[dKey].total += amt;
    } else {
      byDoc['01'].count += 1;
      byDoc['01'].total += amt;
    }
  }

  // SECCIÓN 1: MONTO POR FORMA DE PAGO
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.6);
  doc.text('1. MONTO POR FORMA DE PAGO:', leftM, y);
  y += 2.5;
  drawSolidDivider(y);
  y += 3.3;

  for (const key of ['CASH', 'CARD', 'TRANSFER', 'WOMPI', 'CONTRA_ENTREGA', 'BITCOIN'] as const) {
    const row = byMethod[key];
    if (key === 'BITCOIN' && row.count === 0) continue;
    doc.setFont('courier', key === 'CASH' ? 'bold' : 'normal');
    doc.setFontSize(7.1);
    doc.text(`${row.label} (${row.count}):`, leftM, y);
    doc.text(`$${row.total.toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.2;
  }

  y += 0.8;
  drawDashedDivider(y);
  y += 3.5;

  // SECCIÓN 2: MONTO POR TIPO DE COMPROBANTE
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.6);
  doc.text('2. MONTO POR TIPO DE DOCUMENTO:', leftM, y);
  y += 2.5;
  drawSolidDivider(y);
  y += 3.3;

  for (const key of ['01', '03', 'TICKET'] as const) {
    const row = byDoc[key];
    if (key === 'TICKET' && row.count === 0) continue;
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.0);
    doc.text(`${row.label} (${row.count}):`, leftM, y);
    doc.text(`$${row.total.toFixed(2)}`, rightM, y, { align: 'right' });
    y += 3.2;
  }

  y += 0.8;
  drawDashedDivider(y);
  y += 3.5;

  // SECCIÓN 3: DETALLE RESUMIDO DE OPERACIONES DEL DÍA
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  doc.text('3. DETALLE DE FACTURACIONES DE HOY:', leftM, y);
  y += 2.4;
  drawSolidDivider(y);
  y += 3.2;

  doc.setFontSize(6.6);
  doc.text('HORA', leftM, y);
  doc.text('CLIENTE', leftM + 10, y);
  doc.text('PAGO', rightM - 15, y, { align: 'right' });
  doc.text('TOTAL', rightM, y, { align: 'right' });
  y += 2.8;

  for (const s of dailySales) {
    const dt = parseSaleTicketDate(s);
    const hr = dt
      .toLocaleTimeString('es-SV', {
        timeZone: 'America/El_Salvador',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .slice(0, 5);
    const cli = cleanPdfText(s.cliente?.nombre || 'Consumidor Final')
      .toUpperCase()
      .slice(0, 17);
    const mShort =
      s.paymentMethod === 'CASH'
        ? 'EFEC'
        : isWompiOrEcomCard(s)
        ? 'WOMP'
        : s.paymentMethod === 'CARD'
        ? 'TPOS'
        : s.paymentMethod === 'TRANSFER'
        ? 'TRAN'
        : s.paymentMethod === 'CONTRA_ENTREGA'
        ? 'C.EN'
        : 'BTC';
    const amt = Number(s.total || 0);

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.text(hr, leftM, y);
    doc.text(cli, leftM + 10, y);
    doc.text(mShort, rightM - 15, y, { align: 'right' });
    doc.text(`$${amt.toFixed(2)}`, rightM, y, { align: 'right' });
    y += 2.9;
  }

  y += 0.8;
  drawSolidDivider(y, 0.35);
  y += 3.5;

  // TOTALES GENERALES DEL DÍA
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.2);
  doc.text('SUBTOTAL NETO DEL DIA:', leftM, y);
  doc.text(`$${grandSubtotal.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 3.0;

  doc.text('IVA (13%) DEL DIA:', leftM, y);
  doc.text(`$${grandIva.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 3.5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.2);
  doc.text('EFECTIVO EN CAJA HOY:', leftM, y);
  doc.text(`$${byMethod.CASH.total.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 3.6;

  doc.setFontSize(9.5);
  doc.text('VENTA TOTAL DEL DIA:', leftM, y);
  doc.text(`$${grandTotal.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 4.5;

  drawSolidDivider(y, 0.35);
  y += 5.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.0);
  doc.text('Firma Responsable: _____________________', leftM, y);
  y += 4;

  return Math.ceil(y + 6);
}

async function print80mmDocHelper(doc: any): Promise<void> {
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

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
}

export async function printDailyCashSalesTicketPdf(
  cashSales: SaleRecord[],
  options?: { dateLabel?: string; cashier?: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const measureDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, 400],
  });
  const exactHeight = Math.max(95, renderDailyCashSalesToDoc(measureDoc, cashSales, options));
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, exactHeight],
  });
  renderDailyCashSalesToDoc(doc, cashSales, options);
  await print80mmDocHelper(doc);
}

export async function printDailySummaryByPaymentTicketPdf(
  dailySales: SaleRecord[],
  options?: { dateLabel?: string; cashier?: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const measureDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, 400],
  });
  const exactHeight = Math.max(95, renderDailySummaryByPaymentToDoc(measureDoc, dailySales, options));
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, exactHeight],
  });
  renderDailySummaryByPaymentToDoc(doc, dailySales, options);
  await print80mmDocHelper(doc);
}

function renderDailyCardSalesToDoc(
  doc: any,
  cardSales: SaleRecord[],
  options?: { dateLabel?: string; cashier?: string }
): number {
  const leftM = 3;
  const rightM = 68;
  const centerX = 35.5;
  let y = 42;

  const drawDashedDivider = (currentY: number) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text('------------------------------------------', centerX, currentY, { align: 'center' });
  };

  const drawSolidDivider = (currentY: number, width = 0.25) => {
    doc.setLineWidth(width);
    doc.setDrawColor(0, 0, 0);
    doc.line(leftM, currentY, rightM, currentY);
  };

  const now = new Date();
  const dateLabel =
    options?.dateLabel ||
    now.toLocaleDateString('es-SV', {
      timeZone: 'America/El_Salvador',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  const timeLabel = now
    .toLocaleTimeString('es-SV', {
      timeZone: 'America/El_Salvador',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();

  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('AROMANIAK SV', centerX, y, { align: 'center' });
  y += 3.8;

  doc.setFontSize(8.5);
  doc.text('CORTE DE TRANSACCIONES EN TARJETA', centerX, y, { align: 'center' });
  y += 3.4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text(`Fecha: ${cleanPdfText(dateLabel)}`, leftM, y);
  doc.text(`Hora: ${cleanPdfText(timeLabel)}`, rightM, y, { align: 'right' });
  y += 3.2;

  doc.text(`Cajero/Resp: ${cleanPdfText((options?.cashier || 'Caja Principal').slice(0, 22))}`, leftM, y);
  y += 3.2;

  doc.setFont('courier', 'bold');
  doc.text(`Transacciones en Tarjeta: ${cardSales.length}`, leftM, y);
  y += 3.4;

  drawDashedDivider(y);
  y += 3.5;

  // Encabezado de tabla: HORA | CLIENTE | MONTO
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.0);
  doc.text('HORA', leftM, y);
  doc.text('CLIENTE', leftM + 12, y);
  doc.text('MONTO', rightM, y, { align: 'right' });
  y += 2.6;
  drawSolidDivider(y);
  y += 3.4;

  let totalCard = 0;

  if (cardSales.length === 0) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('Sin transacciones en tarjeta registradas hoy.', centerX, y, { align: 'center' });
    y += 4.5;
  } else {
    for (const s of cardSales) {
      const dt = parseSaleTicketDate(s);
      const hr = dt
        .toLocaleTimeString('es-SV', {
          timeZone: 'America/El_Salvador',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        .slice(0, 5);

      const clientName = cleanPdfText(s.cliente?.nombre || 'Consumidor Final').toUpperCase();
      const amount = Number(s.total || 0);
      totalCard += amount;

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.0);
      doc.text(hr, leftM, y);
      doc.text(`$${amount.toFixed(2)}`, rightM, y, { align: 'right' });

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.8);
      const splitClient = doc.splitTextToSize(clientName, 40);
      doc.text(splitClient[0] || 'CONSUMIDOR FINAL', leftM + 12, y);
      y += 3.2;
      if (splitClient.length > 1) {
        doc.text(splitClient[1], leftM + 12, y);
        y += 2.9;
      }
    }
  }

  y += 0.8;
  drawSolidDivider(y, 0.35);
  y += 3.8;

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.0);
  doc.text('TOTAL TARJETA HOY:', leftM, y);
  doc.text(`$${totalCard.toFixed(2)}`, rightM, y, { align: 'right' });
  y += 4.5;

  drawDashedDivider(y);
  y += 5.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.6);
  doc.text('Firma Cajero: ________________________', leftM, y);
  y += 4;

  return Math.ceil(y + 6);
}

export async function printDailyCardSalesTicketPdf(
  cardSales: SaleRecord[],
  options?: { dateLabel?: string; cashier?: string }
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const measureDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, 400],
  });
  const exactHeight = Math.max(85, renderDailyCardSalesToDoc(measureDoc, cardSales, options));
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [72, exactHeight],
  });
  renderDailyCardSalesToDoc(doc, cardSales, options);
  await print80mmDocHelper(doc);
}


