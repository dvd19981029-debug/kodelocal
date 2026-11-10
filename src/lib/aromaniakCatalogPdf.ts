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

export function getEssenceGenderDisplayLabel(gender?: string | null): 'HOMBRE' | 'MUJER' | 'UNISEX' {
  const rank = getEssenceGenderOrderRank(gender);
  if (rank === 0) return 'HOMBRE';
  if (rank === 1) return 'MUJER';
  return 'UNISEX';
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
  skuCode: string;
  contratipo: string;
  originalName: string;
  brand: string;
  genderRank: number;
  genderLabel: 'HOMBRE' | 'MUJER' | 'UNISEX';
  family: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  hasStock: boolean;
  isNew: boolean;
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
        // Recorte exacto a los píxeles visibles del logo (/logo.png 1024x409 -> x:12..1006, y:108..284)
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
 * Carga la imagen de la botella de esencia recortando los márgenes blancos excesivos
 * (de 768x1024 al encuadre real del frasco ~360x756, proporción 1:2.1) para que luzca
 * grande, nítida y con proporciones reales dentro de cada tarjeta del catálogo.
 */
async function loadCroppedBottleAsDataUrl(src: string): Promise<CatalogImageAsset | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const natW = img.naturalWidth || 768;
        const natH = img.naturalHeight || 1024;
        // Encuadre exacto del frasco (centrado horizontalmente en 50%)
        const sx = Math.round(natW * 0.2656);
        const sy = Math.round(natH * 0.1504);
        const sw = Math.round(natW * 0.4688);
        const sh = Math.round(natH * 0.7383);

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#faf5ff';
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.9),
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

    // Limpiar nombre de inspiración sin letra de género ni marca pegada
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

    const cleanContratipo = (
      SKU_TO_CONTRATIPO_MAP[rawSku] ||
      (p.officialName || '').replace(/(?:\s+[HFMUD])+$/i, '').trim() ||
      cleanOriginal
    ).toUpperCase();

    const brandName = (INSPIRACION_BRAND_MAP[rawSku] || p.brand || '').trim();

    const family = (prof?.family || 'Fragancia Fina').toUpperCase();
    const hasStock = Number(p.stock || 0) > 0 || Number(p.stockHalf || 0) > 0;
    const genderRank = getEssenceGenderOrderRank(p.gender);
    const genderLabel = getEssenceGenderDisplayLabel(p.gender);

    return {
      rawSku,
      skuNum,
      skuCode: `AR-${rawSku.padStart(3, '0')}`,
      contratipo: cleanContratipo,
      originalName: cleanOriginal,
      brand: brandName,
      genderRank,
      genderLabel,
      family,
      topNotes: prof?.topNotes || [],
      heartNotes: prof?.heartNotes || [],
      baseNotes: prof?.baseNotes || [],
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

function drawCoverPage(
  doc: any,
  logoImg: CatalogImageAsset | null,
  upperLabel: string
) {
  // Fondo blanco puro minimalista
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  // Logo central de Aromaniak en alta resolución
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
    doc.setTextColor(30, 27, 75);
    doc.text('Aromaniak', 105, 130, { align: 'center' });
  }

  // Línea minimalista sutil
  doc.setDrawColor(203, 213, 225); // #cbd5e1
  doc.setLineWidth(0.35);
  doc.line(91, 146, 119, 146);

  // Catálogo del Mes y Año (limpio y directo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 27, 75); // #1e1b4b
  doc.text(`CATÁLOGO ${upperLabel}`, 105, 156.5, { align: 'center' });
}

function drawIncomingDividerPage(
  doc: any,
  logoImg: CatalogImageAsset | null,
  upperLabel: string
) {
  // Fondo blanco puro minimalista
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

  // Línea minimalista sutil
  doc.setDrawColor(203, 213, 225); // #cbd5e1
  doc.setLineWidth(0.35);
  doc.line(91, 144, 119, 144);

  // Título limpio de la sección divisoria
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 27, 75); // #1e1b4b
  doc.text('PRÓXIMOS INGRESOS', 105, 154.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(upperLabel, 105, 162.5, { align: 'center' });
}

function drawCatalogGridPage(
  doc: any,
  pageItems: CatalogEssenceItem[],
  logoImg: CatalogImageAsset | null,
  bottleImg: CatalogImageAsset | null,
  upperLabel: string,
  sectionMode: 'AVAILABLE' | 'INCOMING',
  pageNum: number,
  totalPages: number
) {
  const marginX = 13.5;
  const usableW = 210 - marginX * 2; // 183mm
  const colGap = 5.0;
  const rowGap = 4.2;
  const cardW = (usableW - colGap) / 2; // 89.0mm
  const gridTop = 25.0;
  const gridBottom = 279.8;
  const cardH = (gridBottom - gridTop - rowGap * 3) / 4; // 60.55mm

  // ================= HEADER =================
  let brandTextX = marginX;
  if (logoImg) {
    const logoH = 7.0;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    doc.addImage(logoImg.dataUrl, 'PNG', marginX, 10.8, logoW, logoH, 'aromaniak_logo', 'FAST');
    brandTextX = marginX + logoW + 3.0;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(59, 7, 100); // #3b0764
  doc.text('AROMANIAK SV', brandTextX, 14.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(126, 34, 206); // #7e22ce
  doc.text('CATÁLOGO DE ESENCIAS GRADO AAA+', brandTextX, 18.2);

  // Géneros presentes en esta página
  const uniqueGenders = Array.from(new Set(pageItems.map((i) => i.genderLabel)));
  const genderSummary = uniqueGenders.join(' / ');

  // Badge derecho con Fecha y Sección
  const badgeW = 68;
  const badgeH = 9.2;
  const badgeX = 210 - marginX - badgeW;
  const badgeY = 10.2;
  if (sectionMode === 'INCOMING') {
    doc.setFillColor(180, 83, 9); // #b45309
    doc.setDrawColor(146, 64, 14);
  } else {
    doc.setFillColor(88, 28, 135); // #581c87
    doc.setDrawColor(59, 7, 100);
  }
  doc.setLineWidth(0.25);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(255, 255, 255);
  const badgeTitle =
    sectionMode === 'INCOMING'
      ? `PRÓXIMOS INGRESOS • ${upperLabel}`
      : `DISPONIBLES • ${upperLabel}`;
  doc.text(badgeTitle, badgeX + badgeW - 2.8, badgeY + 4.1, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(243, 232, 255);
  doc.text(`SECCIÓN: ${genderSummary}`, badgeX + badgeW - 2.8, badgeY + 7.5, { align: 'right' });

  // Línea divisoria del header
  doc.setDrawColor(88, 28, 135);
  doc.setLineWidth(0.55);
  doc.line(marginX, 21.5, 210 - marginX, 21.5);

  // ================= 8 TARJETAS DE PERFUME (2x4) =================
  pageItems.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = marginX + col * (cardW + colGap);
    const y = gridTop + row * (cardH + rowGap);

    // Marco exterior limpio con esquinas redondeadas
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(192, 132, 252); // #c084fc
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, cardW, cardH, 2.0, 2.0, 'FD');

    // Pedestal izquierdo para la botella (proporciones reales y amplias)
    const bottleBoxX = x + 2.8;
    const bottleBoxY = y + 2.8;
    const bottleBoxW = 24.0;
    const bottleBoxH = cardH - 5.6; // 54.95mm
    doc.setFillColor(250, 245, 255); // #faf5ff
    doc.setDrawColor(233, 213, 255); // #e9d5ff
    doc.setLineWidth(0.25);
    doc.roundedRect(bottleBoxX, bottleBoxY, bottleBoxW, bottleBoxH, 1.5, 1.5, 'FD');

    if (bottleImg) {
      // Con el recorte exacto (proporción ~1:2.1), bW=20.2mm da bH=~42.4mm
      let bW = 20.2;
      let bH = (bottleImg.height / bottleImg.width) * bW;
      if (bH > bottleBoxH - 3.0) {
        bH = bottleBoxH - 3.0;
        bW = (bottleImg.width / bottleImg.height) * bH;
      }
      const bX = bottleBoxX + (bottleBoxW - bW) / 2;
      const bY = bottleBoxY + (bottleBoxH - bH) / 2;
      doc.addImage(
        bottleImg.dataUrl,
        'JPEG',
        bX,
        bY,
        bW,
        bH,
        'aromaniak_bottle_crop',
        'FAST'
      );

      // Nombre contratipo impreso con precisión en la etiqueta blanca del frasco
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(3.1);
      doc.setTextColor(24, 24, 27);
      const labelCenterX = bX + bW * 0.5;
      const labelCenterY = bY + bH * 0.604;
      const shortLabel =
        item.contratipo.length > 13 ? item.contratipo.slice(0, 12) : item.contratipo;
      doc.text(shortLabel, labelCenterX, labelCenterY, { align: 'center' });
    }

    // Columna derecha de información (ordenada, aireada y sin texto recargado)
    const infoX = bottleBoxX + bottleBoxW + 3.2; // x + 30.0mm
    const infoRightX = x + cardW - 3.0;
    const infoW = infoRightX - infoX; // ~56.0mm

    // 1. Fila Superior: Código AR-XXX (+ NUEVO / EN CAMINO) a la izquierda, Género a la derecha
    const topRowY = y + 3.4;
    const badgeHSmall = 4.5;
    const skuBadgeW = 13.0;

    doc.setFillColor(76, 29, 149); // #4c1d95
    doc.roundedRect(infoX, topRowY, skuBadgeW, badgeHSmall, 0.9, 0.9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.setTextColor(255, 255, 255);
    doc.text(item.skuCode, infoX + skuBadgeW / 2, topRowY + 3.1, { align: 'center' });

    let leftCursorX = infoX + skuBadgeW + 1.5;

    // Si es esencia nueva, badge dorado limpio
    if (item.isNew) {
      const newText = 'NUEVO';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.4);
      const nW = doc.getTextWidth(newText) + 3.0;
      doc.setFillColor(254, 240, 138); // #fef08a
      doc.setDrawColor(217, 119, 6); // #d97706
      doc.setLineWidth(0.22);
      doc.roundedRect(leftCursorX, topRowY, nW, badgeHSmall, 0.9, 0.9, 'FD');
      doc.setTextColor(113, 63, 18); // #713f12
      doc.text(newText, leftCursorX + nW / 2, topRowY + 3.1, { align: 'center' });
      leftCursorX += nW + 1.4;
    }

    // Si es próximo ingreso, badge ámbar limpio
    if (!item.hasStock) {
      const incText = 'EN CAMINO';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.2);
      const sW = doc.getTextWidth(incText) + 2.8;
      doc.setFillColor(255, 251, 235); // #fffbeb
      doc.setDrawColor(217, 119, 6); // #d97706
      doc.setLineWidth(0.22);
      doc.roundedRect(leftCursorX, topRowY, sW, badgeHSmall, 0.9, 0.9, 'FD');
      doc.setTextColor(180, 83, 9); // #b45309
      doc.text(incText, leftCursorX + sW / 2, topRowY + 3.1, { align: 'center' });
    }

    // Pill de Género a la derecha
    const genderText = item.genderLabel;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.7);
    const gW = doc.getTextWidth(genderText) + 3.6;
    const gX = infoRightX - gW;
    if (genderText === 'HOMBRE') {
      doc.setFillColor(239, 246, 255); // #eff6ff
      doc.setDrawColor(59, 130, 246); // #3b82f6
      doc.setTextColor(29, 78, 216); // #1d4ed8
    } else if (genderText === 'MUJER') {
      doc.setFillColor(253, 242, 248); // #fdf2f8
      doc.setDrawColor(236, 72, 153); // #ec4899
      doc.setTextColor(190, 24, 93); // #be185d
    } else {
      doc.setFillColor(243, 232, 255); // #f3e8ff
      doc.setDrawColor(168, 85, 247); // #a855f7
      doc.setTextColor(109, 40, 217); // #6d28d9
    }
    doc.setLineWidth(0.22);
    doc.roundedRect(gX, topRowY, gW, badgeHSmall, 0.9, 0.9, 'FD');
    doc.text(genderText, gX + gW / 2, topRowY + 3.1, { align: 'center' });

    // 2. Nombre Contratipo Oficial (grande y protagonista)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.6);
    doc.setTextColor(46, 16, 101); // #2e1065
    const contratipoLine = fitTextSingleLine(doc, item.contratipo, infoW);
    doc.text(contratipoLine, infoX, y + 13.0);

    // 3. Recuadro destacado de Inspiración y Casa Perfumera
    const inspBoxY = y + 15.2;
    const inspBoxH = 11.4;
    doc.setFillColor(250, 245, 255); // #faf5ff
    doc.setDrawColor(233, 213, 255); // #e9d5ff
    doc.setLineWidth(0.25);
    doc.roundedRect(infoX, inspBoxY, infoW, inspBoxH, 1.2, 1.2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.3);
    doc.setTextColor(126, 34, 206); // #7e22ce
    doc.text('INSPIRADO EN:', infoX + 2.2, inspBoxY + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(15, 23, 42); // #0f172a
    const fullInspStr = item.brand
      ? `${item.originalName}  •  ${item.brand}`
      : item.originalName;
    const fittedInsp = fitTextSingleLine(doc, fullInspStr, infoW - 4.4);
    doc.text(fittedInsp, infoX + 2.2, inspBoxY + 8.8);

    // 4. Familia Olfativa
    const famY = y + 31.4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.6);
    doc.setTextColor(100, 116, 139); // #64748b
    const famLabel = 'FAMILIA: ';
    doc.text(famLabel, infoX, famY);
    const famLabelW = doc.getTextWidth(famLabel);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.1);
    doc.setTextColor(88, 28, 135); // #581c87
    const fittedFam = fitTextSingleLine(doc, item.family, infoW - famLabelW);
    doc.text(fittedFam, infoX + famLabelW, famY);

    // 5. Línea divisoria sutil + Pirámide Olfativa estructurada en 3 niveles limpios
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(0.25);
    doc.line(infoX, y + 34.0, infoRightX, y + 34.0);

    const pyramidRows = [
      {
        label: 'Salida:',
        notes: item.topNotes.length > 0 ? item.topNotes.slice(0, 3).join(', ') : 'Acordes frescos',
        rowY: y + 39.2,
      },
      {
        label: 'Corazón:',
        notes:
          item.heartNotes.length > 0 ? item.heartNotes.slice(0, 3).join(', ') : 'Notas aromáticas',
        rowY: y + 46.2,
      },
      {
        label: 'Fondo:',
        notes:
          item.baseNotes.length > 0 ? item.baseNotes.slice(0, 3).join(', ') : 'Maderas y almizcle',
        rowY: y + 53.2,
      },
    ];

    pyramidRows.forEach((pRow) => {
      // Viñeta circular morada
      doc.setFillColor(126, 34, 206);
      doc.circle(infoX + 1.0, pRow.rowY - 0.9, 0.65, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(59, 7, 100);
      doc.text(pRow.label, infoX + 2.8, pRow.rowY);
      const lblW = doc.getTextWidth(pRow.label);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(51, 65, 85); // #334155
      const noteTextX = infoX + 2.8 + lblW + 1.2;
      const maxNoteW = infoRightX - noteTextX;
      const fittedNotes = fitTextSingleLine(doc, pRow.notes, maxNoteW);
      doc.text(fittedNotes, noteTextX, pRow.rowY);
    });
  });

  // ================= FOOTER =================
  const footerLineY = 283.5;
  doc.setDrawColor(88, 28, 135);
  doc.setLineWidth(0.4);
  doc.line(marginX, footerLineY, 210 - marginX, footerLineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(88, 28, 135);
  doc.text(
    `AROMANIAK SV • CATÁLOGO ACTUALIZADO: ${upperLabel} • WWW.AROMANIAKSV.COM`,
    marginX,
    footerLineY + 4.0
  );

  doc.setTextColor(100, 116, 139);
  doc.text(`PÁGINA ${pageNum} DE ${totalPages}`, 210 - marginX, footerLineY + 4.0, {
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
  const { upperLabel, fileSlug } = getCurrentCatalogMonthYear(date);
  const { availableItems, incomingItems } = prepareCatalogEssenceItems(products);

  const ITEMS_PER_PAGE = 8;
  const availPagesCount = Math.ceil(availableItems.length / ITEMS_PER_PAGE);
  const hasIncoming = incomingItems.length > 0;
  const incomingPagesCount = hasIncoming ? Math.ceil(incomingItems.length / ITEMS_PER_PAGE) : 0;

  // Total de páginas:
  // 1 (Portada) + availPagesCount + (hasIncoming ? 1 (Portada Próximos Ingresos) + incomingPagesCount : 0)
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
      upperLabel,
      'AVAILABLE',
      currentPageNum,
      totalPages
    );
  }

  // 3. SECCIÓN PRÓXIMOS INGRESOS (SOLO SI HAY FRAGANCIAS EN CAMINO EN TIEMPO REAL)
  if (hasIncoming) {
    // Página divisoria antes de los próximos ingresos
    doc.addPage('a4', 'portrait');
    currentPageNum++;
    drawIncomingDividerPage(doc, logoImg, upperLabel);

    // Páginas de perfumes en camino (Hombre -> Mujer -> Unisex, 8 por página)
    for (let i = 0; i < incomingPagesCount; i++) {
      doc.addPage('a4', 'portrait');
      currentPageNum++;
      const pageItems = incomingItems.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE);
      drawCatalogGridPage(
        doc,
        pageItems,
        logoImg,
        bottleImg,
        upperLabel,
        'INCOMING',
        currentPageNum,
        totalPages
      );
    }
  }

  return { fileSlug, totalPages };
}

export async function downloadLiveAromaniakCatalogPdf(): Promise<void> {
  // 1. Obtener siempre el catálogo más actualizado en tiempo real desde la API
  let products: ProductItem[] = [];
  try {
    const res = await fetch(`/api/products?fresh=true&_t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
      products = data.products;
    }
  } catch {
    // Fallback local si no hay red momentáneamente
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
    loadCroppedBottleAsDataUrl('/images/essence_bottle_blank.webp'),
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
