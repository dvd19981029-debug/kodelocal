// src/lib/aromaniakCatalogPdf.ts
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts } from './store';
import {
  INSPIRACION_PERFUME_MAP,
  INSPIRACION_BRAND_MAP,
  OFFICIAL_TO_ORIGINAL_MAP,
  isNewEssence,
} from './perfumeNames';
import { getFragranceProfile } from './fragranceProfiles';

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function getCurrentCatalogMonthYear(date: Date = new Date()): {
  monthName: string;
  yearNum: number;
  label: string;
  upperLabel: string;
  fileSlug: string;
} {
  const monthName = MONTHS_ES[date.getMonth()] || 'Noviembre';
  const yearNum = date.getFullYear();
  return {
    monthName,
    yearNum,
    label: `${monthName} ${yearNum}`,
    upperLabel: `${monthName.toUpperCase()} ${yearNum}`,
    fileSlug: `${monthName}-${yearNum}`,
  };
}

export function getEssenceGenderOrderRank(gender?: string | null): number {
  const g = String(gender || '').trim().toLowerCase();
  if (g.includes('caballero') || g.includes('hombre') || g === 'h') return 0; // 1. Hombre
  if (g.includes('dama') || g.includes('mujer') || g === 'f') return 1; // 2. Mujer
  return 2; // 3. Unisex
}

export function getEssenceGenderDisplayLabel(gender?: string | null): 'Hombre' | 'Mujer' | 'Unisex' {
  const rank = getEssenceGenderOrderRank(gender);
  if (rank === 0) return 'Hombre';
  if (rank === 1) return 'Mujer';
  return 'Unisex';
}

// Lookup inverso por SKU para encontrar el nombre contratipo oficial limpio
const SKU_TO_CONTRATIPO_MAP: Record<string, string> = {};
Object.entries(OFFICIAL_TO_ORIGINAL_MAP).forEach(([officialKey, val]) => {
  if (!SKU_TO_CONTRATIPO_MAP[val.sku]) {
    SKU_TO_CONTRATIPO_MAP[val.sku] = officialKey;
  }
});

export interface CatalogImageAsset {
  dataUrl: string;
  width: number;
  height: number;
}

export interface CatalogEssenceItem {
  rawSku: string;
  skuNum: number;
  contratipo: string;
  originalName: string;
  brand: string;
  genderRank: number;
  genderLabel: 'Hombre' | 'Mujer' | 'Unisex';
  family: string;
  notesList: string[];
  hasStock: boolean;
  isNew: boolean;
}

function toTitleCaseEs(str: string): string {
  const minorWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'con', 'a']);
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, idx) => {
      if (!word) return '';
      if (idx > 0 && minorWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

async function loadLogoAsDataUrl(src: string): Promise<CatalogImageAsset | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const natW = img.naturalWidth || 1024;
        const natH = img.naturalHeight || 409;
        const isHighResMainLogo = natW >= 800 && natH >= 300;
        const sx = isHighResMainLogo ? Math.round(natW * 0.0117) : 0;
        const sy = isHighResMainLogo ? Math.round(natH * 0.264) : 0;
        const sw = isHighResMainLogo ? Math.round(natW * 0.9707) : natW;
        const sh = isHighResMainLogo ? Math.round(natH * 0.4303) : natH;

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: sw,
          height: sh,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Carga la imagen del frasco manteniendo su proporción nativa exacta 1:1 de píxeles
 * (768x1024 sin deformar ni estirar en ningún eje) sobre fondo blanco puro (#ffffff).
 */
async function loadBottleAsDataUrl(src: string): Promise<CatalogImageAsset | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const natW = img.naturalWidth || 768;
        const natH = img.naturalHeight || 1024;
        // Recorte limpio manteniendo píxeles 1:1 exactos sin deformar (408x760 en 768x1024)
        const sx = Math.round(natW * (180 / 768));
        const sy = Math.round(natH * (148 / 1024));
        const sw = Math.round(natW * (408 / 768));
        const sh = Math.round(natH * (760 / 1024));

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
          width: sw,
          height: sh,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function prepareCatalogEssenceItems(products: ProductItem[]): {
  availableItems: CatalogEssenceItem[];
  incomingItems: CatalogEssenceItem[];
} {
  const essences = products.filter(
    (p) => p.category === 'Esencias para Perfume' && p.isAvailableOnline !== false
  );

  const mapped: CatalogEssenceItem[] = essences.map((p) => {
    const rawSku = String(p.sku || '').trim();
    const skuNum = Number(rawSku || 0);
    const prof = getFragranceProfile(p);

    const rawInsp = INSPIRACION_PERFUME_MAP[rawSku] || p.name || '';
    let cleanOriginal = rawInsp
      .replace(/(?:\s+[HFMUD])+$/i, '')
      .replace(/\s+[HFMUD]\s+/gi, ' ')
      .trim();

    if (cleanOriginal.toLowerCase() === 'la vida es bella') cleanOriginal = 'La Vie Est Belle';
    if (cleanOriginal === 'CHNL° 5' || cleanOriginal === 'N° 5') cleanOriginal = 'Chanel N° 5';
    if (cleanOriginal === 'Donna') cleanOriginal = 'Born In Roma Donna';
    if (cleanOriginal.includes('La Bomba')) cleanOriginal = 'La Bomba';
    if (cleanOriginal === 'Princess') cleanOriginal = 'Vera Wang Princess';
    if (cleanOriginal === 'Good Girl M' || cleanOriginal === 'Good Girl') cleanOriginal = 'Good Girl';

    const rawContratipo =
      SKU_TO_CONTRATIPO_MAP[rawSku] ||
      (p.officialName || '').replace(/(?:\s+[HFMUD])+$/i, '').trim() ||
      cleanOriginal;

    const cleanContratipo = toTitleCaseEs(rawContratipo);
    const brandName = (INSPIRACION_BRAND_MAP[rawSku] || p.brand || '').trim();
    const family = toTitleCaseEs(prof?.family || 'Fragancia Fina');

    // Combinar las notas principales sin sobrecargar (máximo 5 notas clave)
    const combinedNotes = Array.from(
      new Set([
        ...(prof?.topNotes || []).slice(0, 2),
        ...(prof?.heartNotes || []).slice(0, 2),
        ...(prof?.baseNotes || []).slice(0, 2),
      ])
    ).slice(0, 5);

    const hasStock = Number(p.stock || 0) > 0 || Number(p.stockHalf || 0) > 0;
    const genderRank = getEssenceGenderOrderRank(p.gender);
    const genderLabel = getEssenceGenderDisplayLabel(p.gender);

    return {
      rawSku,
      skuNum,
      contratipo: cleanContratipo,
      originalName: cleanOriginal,
      brand: brandName,
      genderRank,
      genderLabel,
      family,
      notesList: combinedNotes,
      hasStock,
      isNew: isNewEssence(p),
    };
  });

  const sortByGenderThenSku = (a: CatalogEssenceItem, b: CatalogEssenceItem) => {
    if (a.genderRank !== b.genderRank) return a.genderRank - b.genderRank;
    return a.skuNum - b.skuNum;
  };

  const availableItems = mapped.filter((i) => i.hasStock).sort(sortByGenderThenSku);
  const incomingItems = mapped.filter((i) => !i.hasStock).sort(sortByGenderThenSku);

  return { availableItems, incomingItems };
}

function fitTextSingleLine(doc: any, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 3 && doc.getTextWidth(trimmed + '...') > maxWidth) {
    trimmed = trimmed.slice(0, -1).trim();
  }
  return trimmed + '...';
}

function drawCoverPage(doc: any, logoImg: CatalogImageAsset | null, upperLabel: string) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  if (logoImg) {
    const logoW = 104;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    doc.addImage(
      logoImg.dataUrl,
      'PNG',
      105 - logoW / 2,
      128 - logoH / 2,
      logoW,
      logoH,
      'aromaniak_logo',
      'FAST'
    );
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    doc.setTextColor(30, 41, 59);
    doc.text('Aromaniak', 105, 130, { align: 'center' });
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(91, 146, 119, 146);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text(`CATÁLOGO ${upperLabel}`, 105, 156.5, { align: 'center' });
}

function drawIncomingDividerPage(doc: any, logoImg: CatalogImageAsset | null, upperLabel: string) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  if (logoImg) {
    const logoW = 74;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    doc.addImage(
      logoImg.dataUrl,
      'PNG',
      105 - logoW / 2,
      128 - logoH / 2,
      logoW,
      logoH,
      'aromaniak_logo',
      'FAST'
    );
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(91, 144, 119, 144);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('PRÓXIMOS INGRESOS', 105, 154.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139);
  doc.text(upperLabel, 105, 162.5, { align: 'center' });
}

function drawCatalogGridPage(
  doc: any,
  pageItems: CatalogEssenceItem[],
  logoImg: CatalogImageAsset | null,
  bottleImg: CatalogImageAsset | null,
  label: string,
  sectionMode: 'AVAILABLE' | 'INCOMING',
  pageNum: number,
  totalPages: number
) {
  // Fondo suave estilo Aromaniak web (#f4f6fb) para que las tarjetas blancas destaquen limpiamente
  doc.setFillColor(244, 246, 251);
  doc.rect(0, 0, 210, 297, 'F');

  const marginX = 14.0;
  const usableW = 210 - marginX * 2; // 182mm
  const colGap = 5.5;
  const rowGap = 4.8;
  const cardW = (usableW - colGap) / 2; // 88.25mm
  const gridTop = 26.5;
  const gridBottom = 278.5;
  const cardH = (gridBottom - gridTop - rowGap * 3) / 4; // 59.4mm

  // ================= HEADER MINIMALISTA AROMANIAK =================
  if (logoImg) {
    const logoH = 7.8;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    doc.addImage(logoImg.dataUrl, 'PNG', marginX, 11.2, logoW, logoH, 'aromaniak_logo', 'FAST');
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Aromaniak', marginX, 16.5);
  }

  const uniqueGenders = Array.from(new Set(pageItems.map((i) => i.genderLabel)));
  const genderSummary = uniqueGenders.join(' • ');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // #1e293b
  const headerRightTitle =
    sectionMode === 'INCOMING' ? `Próximos Ingresos • ${label}` : `Catálogo • ${label}`;
  doc.text(headerRightTitle, 210 - marginX, 14.8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(124, 58, 237); // #7c3aed (Violeta Aromaniak)
  doc.text(genderSummary, 210 - marginX, 18.8, { align: 'right' });

  // Línea divisoria sutil
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.35);
  doc.line(marginX, 22.2, 210 - marginX, 22.2);

  // ================= 8 TARJETAS DE PERFUME (2x4) =================
  pageItems.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = marginX + col * (cardW + colGap);
    const y = gridTop + row * (cardH + rowGap);

    // Sombra suave inferior derecha estilo clay-card
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(x + 0.4, y + 0.5, cardW, cardH, 3.8, 3.8, 'F');

    // Tarjeta blanca limpia con bordes redondeados suaves (sin borde morado chillón)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 3.8, 3.8, 'FD');

    // Área izquierda del frasco: directo sobre el fondo blanco de la tarjeta (SIN pastilla morada)
    const bottleAreaW = 28.0;
    if (bottleImg) {
      // Proporción nativa 1:1 de píxeles sin deformar (408:760 -> bW=22.55mm, bH=42.0mm)
      const bH = 42.0;
      const bW = (bottleImg.width / bottleImg.height) * bH;
      const bX = x + 2.2 + (bottleAreaW - bW) / 2;
      const bY = y + (cardH - bH) / 2;
      doc.addImage(
        bottleImg.dataUrl,
        'JPEG',
        bX,
        bY,
        bW,
        bH,
        'aromaniak_bottle_clean',
        'FAST'
      );

      // Nombre contratipo en la etiqueta del frasco
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(3.1);
      doc.setTextColor(24, 24, 27);
      const labelCenterX = bX + bW * 0.5;
      const labelCenterY = bY + bH * 0.605;
      const upperContratipo = item.contratipo.toUpperCase();
      const shortLabel =
        upperContratipo.length > 13 ? upperContratipo.slice(0, 12) : upperContratipo;
      doc.text(shortLabel, labelCenterX, labelCenterY, { align: 'center' });
    }

    // Separador vertical ultra sutil entre frasco y texto
    const sepX = x + bottleAreaW + 2.2;
    doc.setDrawColor(241, 245, 249); // #f1f5f9
    doc.setLineWidth(0.3);
    doc.line(sepX, y + 6.0, sepX, y + cardH - 6.0);

    // Columna derecha de texto (limpia, aireada y sin saturación)
    const infoX = sepX + 3.5;
    const infoRightX = x + cardW - 4.0;
    const infoW = infoRightX - infoX;

    // 1. Fila superior de etiquetas: Género a la izquierda + Nuevo / En camino a la derecha (SIN AR-XXX)
    const topY = y + 6.2;
    const pillH = 4.6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    const genderText = item.genderLabel;
    const gW = doc.getTextWidth(genderText) + 4.4;

    if (genderText === 'Hombre') {
      doc.setFillColor(239, 246, 255); // #eff6ff
      doc.setTextColor(30, 58, 138); // #1e3a8a
    } else if (genderText === 'Mujer') {
      doc.setFillColor(253, 242, 248); // #fdf2f8
      doc.setTextColor(131, 24, 67); // #831843
    } else {
      doc.setFillColor(243, 232, 255); // #f3e8ff
      doc.setTextColor(88, 28, 135); // #581c87
    }
    doc.roundedRect(infoX, topY, gW, pillH, 1.4, 1.4, 'F');
    doc.text(genderText, infoX + gW / 2, topY + 3.15, { align: 'center' });

    let badgeCursorX = infoX + gW + 1.8;

    if (item.isNew) {
      const newText = 'Nuevo';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.0);
      const nW = doc.getTextWidth(newText) + 4.0;
      doc.setFillColor(254, 243, 199); // #fef3c7
      doc.setTextColor(146, 64, 14); // #92400e
      doc.roundedRect(badgeCursorX, topY, nW, pillH, 1.4, 1.4, 'F');
      doc.text(newText, badgeCursorX + nW / 2, topY + 3.15, { align: 'center' });
      badgeCursorX += nW + 1.8;
    }

    if (!item.hasStock) {
      const incText = 'En camino';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      const sW = doc.getTextWidth(incText) + 4.0;
      doc.setFillColor(241, 245, 249); // #f1f5f9
      doc.setTextColor(71, 85, 105); // #475569
      doc.roundedRect(badgeCursorX, topY, sW, pillH, 1.4, 1.4, 'F');
      doc.text(incText, badgeCursorX + sW / 2, topY + 3.15, { align: 'center' });
    }

    // 2. Nombre del perfume (Contratipo) en slate-900 como en la web de Aromaniak
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.2);
    doc.setTextColor(15, 23, 42); // #0f172a
    const titleStr = fitTextSingleLine(doc, item.contratipo, infoW);
    doc.text(titleStr, infoX, y + 17.8);

    // 3. Inspirado en (nombre del perfume más grande y en negrita destacada)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139); // #64748b
    doc.text('Inspirado en', infoX, y + 23.2);

    doc.setFont('helvetica', 'bold');
    let inspFontSize = 10.4;
    doc.setFontSize(inspFontSize);
    while (inspFontSize > 8.6 && doc.getTextWidth(item.originalName) > infoW) {
      inspFontSize -= 0.4;
      doc.setFontSize(inspFontSize);
    }
    doc.setTextColor(109, 40, 217); // #6d28d9 (Violeta intenso Aromaniak)
    const inspNameStr = fitTextSingleLine(doc, item.originalName, infoW);
    doc.text(inspNameStr, infoX, y + 28.5);
    doc.text(inspNameStr, infoX + 0.08, y + 28.5);

    if (item.brand) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.6);
      doc.setTextColor(71, 85, 105); // #475569
      const brandStr = fitTextSingleLine(doc, item.brand, infoW);
      doc.text(brandStr, infoX, y + 33.2);
    }

    // 4. Familia Olfativa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(30, 41, 59); // #1e293b
    const famStr = fitTextSingleLine(doc, item.family, infoW);
    doc.text(famStr, infoX, y + 40.2);

    // 5. Notas principales (bloque limpio de 2 líneas sin viñetas saturadas)
    if (item.notesList.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139); // #64748b
      const notesSummary = `Notas: ${item.notesList.join(', ')}`;
      const noteLines: string[] = doc.splitTextToSize(notesSummary, infoW).slice(0, 2);
      noteLines.forEach((line, lIdx) => {
        doc.text(line, infoX, y + 45.4 + lIdx * 3.6);
      });
    }
  });

  // ================= FOOTER MINIMALISTA =================
  const footerLineY = 283.5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(marginX, footerLineY, 210 - marginX, footerLineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`www.aromaniaksv.com`, marginX, footerLineY + 4.2);

  doc.text(`Página ${pageNum} de ${totalPages}`, 210 - marginX, footerLineY + 4.2, {
    align: 'right',
  });
}

export function buildAromaniakCatalogJsPdfDocument(
  doc: any,
  products: ProductItem[],
  logoImg: CatalogImageAsset | null,
  bottleImg: CatalogImageAsset | null,
  date: Date = new Date()
): { fileSlug: string; totalPages: number } {
  const { label, upperLabel, fileSlug } = getCurrentCatalogMonthYear(date);
  const { availableItems, incomingItems } = prepareCatalogEssenceItems(products);

  const ITEMS_PER_PAGE = 8;
  const availPagesCount = Math.ceil(availableItems.length / ITEMS_PER_PAGE);
  const hasIncoming = incomingItems.length > 0;
  const incomingPagesCount = hasIncoming ? Math.ceil(incomingItems.length / ITEMS_PER_PAGE) : 0;

  const totalPages = 1 + availPagesCount + (hasIncoming ? 1 + incomingPagesCount : 0);

  // 1. PÁGINA 1: PORTADA OFICIAL
  drawCoverPage(doc, logoImg, upperLabel);

  let currentPageNum = 1;

  // 2. SECCIÓN DISPONIBLES (Hombre -> Mujer -> Unisex, 8 por página)
  for (let i = 0; i < availPagesCount; i++) {
    doc.addPage('a4', 'portrait');
    currentPageNum++;
    const pageItems = availableItems.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE);
    drawCatalogGridPage(
      doc,
      pageItems,
      logoImg,
      bottleImg,
      label,
      'AVAILABLE',
      currentPageNum,
      totalPages
    );
  }

  // 3. SECCIÓN PRÓXIMOS INGRESOS (SOLO SI HAY FRAGANCIAS EN CAMINO EN TIEMPO REAL)
  if (hasIncoming) {
    doc.addPage('a4', 'portrait');
    currentPageNum++;
    drawIncomingDividerPage(doc, logoImg, upperLabel);

    for (let i = 0; i < incomingPagesCount; i++) {
      doc.addPage('a4', 'portrait');
      currentPageNum++;
      const pageItems = incomingItems.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE);
      drawCatalogGridPage(
        doc,
        pageItems,
        logoImg,
        bottleImg,
        label,
        'INCOMING',
        currentPageNum,
        totalPages
      );
    }
  }

  return { fileSlug, totalPages };
}

export async function downloadLiveAromaniakCatalogPdf(): Promise<void> {
  let products: ProductItem[] = [];
  try {
    const res = await fetch(`/api/products?fresh=true&_t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
      products = data.products;
    }
  } catch {
    // Fallback local
  }

  if (products.length === 0) {
    const stored = getStoredProducts();
    products = stored && stored.length > 0 ? stored : INITIAL_PRODUCTS;
  }

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const [logoImg, bottleImg] = await Promise.all([
    loadLogoAsDataUrl('/logo.png'),
    loadBottleAsDataUrl('/images/essence_bottle_blank.webp'),
  ]);

  const { fileSlug } = buildAromaniakCatalogJsPdfDocument(
    doc,
    products,
    logoImg,
    bottleImg,
    new Date()
  );

  doc.save(`Catalogo-Aromaniak-${fileSlug}.pdf`);
}
