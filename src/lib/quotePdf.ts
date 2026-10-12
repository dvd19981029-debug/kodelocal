// Generación del PDF de cotizaciones de Aromaniak (descarga directa, sin diálogo de impresión)

export interface QuotePdfItem {
  quantity: number;
  unit?: string | null;
  name: string;
  price: number;
  total: number;
  puesto?: string | null;
}

export interface QuotePriceChange {
  productId: string;
  name: string;
  quotedListPrice: number;
  currentListPrice: number;
}

export interface QuotePromotion {
  code: string;
  description?: string | null;
  discountType?: string;
  discountValue: number;
  minPurchase?: number | null;
  endDate?: string | Date | null;
}

export interface QuotePdfData {
  quoteNumber: string;
  createdAt: string | Date;
  validUntil?: string | Date | null;
  customer: {
    nombre: string;
    numDocumento?: string | null;
    nrc?: string | null;
    correo?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  };
  vendedor?: string | null;
  items: QuotePdfItem[];
  subtotal: number;
  ivaTotal: number;
  total: number;
  priceChanges?: QuotePriceChange[];
  promotions?: QuotePromotion[];
  isExpired?: boolean;
}

const INK: [number, number, number] = [24, 24, 32];
const GOLD: [number, number, number] = [176, 138, 70];
const MUTED: [number, number, number] = [110, 114, 125];
const SOFT: [number, number, number] = [246, 244, 239];
const LINE: [number, number, number] = [225, 222, 214];

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Quita emojis y símbolos que la fuente estándar del PDF no puede dibujar
const clean = (s: string) =>
  String(s || '')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

async function loadImage(url: string): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims: { w: number; h: number } = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, ...dims };
  } catch {
    return null;
  }
}

export async function downloadQuotePdf(data: QuotePdfData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  const lastY = () => (doc as any).lastAutoTable.finalY as number;

  // ---------- Encabezado ----------
  const logo = await loadImage('/images/aromaniak_black_logo.png');
  if (logo) {
    const lw = 52;
    const lh = (lw * logo.h) / logo.w;
    doc.addImage(logo.dataUrl, 'PNG', M, 12, lw, lh);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...INK);
    doc.text('AROMANIAK', M, 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.text('COTIZACIÓN', pageW - M, 19, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text(`N° ${data.quoteNumber}`, pageW - M, 25, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`Fecha: ${fmtDate(data.createdAt)}`, pageW - M, 30, { align: 'right' });
  if (data.validUntil) {
    doc.text(`Válida hasta: ${fmtDate(data.validUntil)}`, pageW - M, 34, { align: 'right' });
  }

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(M, 38, pageW - M, 38);

  // ---------- Empresa y cliente ----------
  const boxY = 43;
  const boxH = 36;
  const colW = (pageW - M * 2 - 6) / 2;

  doc.setFillColor(...SOFT);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, boxY, colW, boxH, 2, 2, 'FD');
  doc.roundedRect(M + colW + 6, boxY, colW, boxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD);
  doc.text('EMITIDA POR', M + 4, boxY + 6);
  doc.text('COTIZADO A', M + colW + 10, boxY + 6);

  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text('Aromaniak SV', M + 4, boxY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const companyLines = doc.splitTextToSize(
    'Distribuidora de esencias de perfumería fina\nCentro Comercial El Rosal, Calle El Progreso\nSan Salvador, El Salvador\nNIT: 0614-120590-101-2 · NRC: 245678-9\nTel: +503 2245-8800 · aromaniaksv.com',
    colW - 8
  );
  doc.text(companyLines, M + 4, boxY + 17);

  const cx = M + colW + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  const nameLines = doc.splitTextToSize(clean(data.customer.nombre) || 'Consumidor Final', colW - 8);
  doc.text(nameLines.slice(0, 2), cx, boxY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const clientInfo: string[] = [];
  if (data.customer.numDocumento) clientInfo.push(`Documento: ${data.customer.numDocumento}`);
  if (data.customer.nrc) clientInfo.push(`NRC: ${data.customer.nrc}`);
  if (data.customer.telefono) clientInfo.push(`Tel: ${data.customer.telefono}`);
  if (data.customer.correo) clientInfo.push(`Correo: ${data.customer.correo}`);
  if (data.customer.direccion) clientInfo.push(`Dirección: ${clean(data.customer.direccion)}`);
  if (data.vendedor) clientInfo.push(`Atendido por: ${clean(data.vendedor)}`);
  const clientLines = doc.splitTextToSize(clientInfo.join('\n'), colW - 8).slice(0, 6);
  doc.text(clientLines, cx, boxY + (nameLines.length > 1 ? 21 : 17));

  let y = boxY + boxH + 6;

  // ---------- Avisos: vencimiento, cambios de precio y promociones ----------
  const hasChanges = !!data.priceChanges && data.priceChanges.length > 0;
  const hasPromos = !!data.promotions && data.promotions.length > 0;

  if (data.isExpired || hasChanges || hasPromos) {
    const rows: string[][] = [];
    if (data.isExpired && data.validUntil) {
      rows.push([`Esta cotización venció el ${fmtDate(data.validUntil)}. Solicite una cotización actualizada.`, '', '']);
    }
    if (hasChanges) {
      rows.push(['Los precios de lista de estos productos cambiaron desde que se emitió esta cotización:', '', '']);
      data.priceChanges!.forEach((c) => {
        const diff = c.currentListPrice - c.quotedListPrice;
        rows.push([
          clean(c.name),
          `Cotizado: ${money(c.quotedListPrice)}`,
          `Actual: ${money(c.currentListPrice)} (${diff >= 0 ? '+' : '-'}${money(Math.abs(diff))})`,
        ]);
      });
    }
    if (hasPromos) {
      rows.push(['Promociones vigentes actualmente:', '', '']);
      data.promotions!.forEach((p) => {
        const value = p.discountType === 'PERCENTAGE' ? `${p.discountValue}% de descuento` : `${money(p.discountValue)} de descuento`;
        const extras = [
          p.minPurchase ? `compra mínima ${money(p.minPurchase)}` : null,
          p.endDate ? `hasta ${fmtDate(p.endDate)}` : null,
        ].filter(Boolean).join(' · ');
        rows.push([
          `${p.code}${p.description ? ' - ' + clean(p.description) : ''}`,
          value,
          extras,
        ]);
      });
    }

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [[{ content: 'AVISO DE ACTUALIZACIÓN', colSpan: 3, styles: { halign: 'left' } }]],
      body: rows,
      theme: 'plain',
      headStyles: { fillColor: GOLD, textColor: 255, fontStyle: 'bold', fontSize: 8, cellPadding: 2 },
      bodyStyles: { fillColor: [253, 247, 233], textColor: INK, fontSize: 8, cellPadding: 1.8 },
      didParseCell: (hook: any) => {
        if (hook.section === 'body' && hook.row.raw[1] === '' && hook.row.raw[2] === '') {
          hook.cell.colSpan = 3;
          hook.cell.styles.fontStyle = 'bold';
        }
      },
      columnStyles: { 0: { cellWidth: 92 }, 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } },
    });
    y = lastY() + 6;
  }

  // ---------- Detalle de productos ----------
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, bottom: 24 },
    head: [['Cant.', 'Unidad', 'Descripción', 'Precio unit.', 'Subtotal']],
    body: data.items.map((it) => [
      String(it.quantity),
      clean(it.unit || 'Oz'),
      clean(it.name),
      money(it.price),
      money(it.total),
    ]),
    theme: 'striped',
    headStyles: { fillColor: INK, textColor: 255, fontSize: 8.5, fontStyle: 'bold', cellPadding: 2.6 },
    bodyStyles: { fontSize: 8.5, textColor: INK, cellPadding: 2.4 },
    alternateRowStyles: { fillColor: SOFT },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 20, textColor: MUTED },
      2: { cellWidth: 'auto' },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
    },
  });
  y = lastY() + 8;

  // ---------- Totales y condiciones ----------
  if (y + 46 > pageH - 20) {
    doc.addPage();
    y = 20;
  }

  const totW = 70;
  const totX = pageW - M - totW;
  doc.setFillColor(...SOFT);
  doc.setDrawColor(...LINE);
  doc.roundedRect(totX, y, totW, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('Subtotal (neto)', totX + 4, y + 7);
  doc.text(money(data.subtotal), totX + totW - 4, y + 7, { align: 'right' });
  doc.text('IVA (13%)', totX + 4, y + 13);
  doc.text(money(data.ivaTotal), totX + totW - 4, y + 13, { align: 'right' });
  doc.setDrawColor(...GOLD);
  doc.line(totX + 4, y + 17, totX + totW - 4, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text('TOTAL', totX + 4, y + 25);
  doc.setTextColor(...GOLD);
  doc.text(money(data.total), totX + totW - 4, y + 25, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text('Términos y condiciones', M, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  const terms = doc.splitTextToSize(
    '• Los precios incluyen el Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios (IVA 13%).\n' +
      '• Precios sujetos a cambio sin previo aviso; la cotización es válida hasta la fecha indicada.\n' +
      '• Esta cotización no es un documento tributario (DTE). Al momento del pago se emitirá su Factura o Crédito Fiscal electrónico con sello de Hacienda.',
    totX - M - 6
  );
  doc.text(terms, M, y + 10);

  // ---------- Pie de página ----------
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(M, pageH - 14, pageW - M, pageH - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Aromaniak SV · Gracias por su preferencia', M, pageH - 9);
    doc.text(`Página ${i} de ${pages}`, pageW - M, pageH - 9, { align: 'right' });
  }

  doc.save(`Cotizacion-${data.quoteNumber}.pdf`);
}
