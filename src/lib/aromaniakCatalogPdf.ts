// src/lib/aromaniakCatalogPdf.ts
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts } from './store';
import {
  getInspiracionPerfumeName,
  INSPIRACION_BRAND_MAP,
  OFFICIAL_TO_ORIGINAL_MAP,
  isNewEssence,
} from './perfumeNames';
import { getFragranceProfile } from './fragranceProfiles';
import { getFragranceDescription } from './fragranceDescriptions';

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

async function loadImageAsDataUrl(
  src: string,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  bgWhite = true
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const targetW = img.naturalWidth || 400;
        const targetH = img.naturalHeight || 400;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        if (bgWhite) {
          ctx.fillStyle = '#faf5ff';
          ctx.fillRect(0, 0, targetW, targetH);
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL(mimeType, 0.88);
        resolve({ dataUrl, width: targetW, height: targetH });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
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

  const essences = products.filter(
    (p) => p.category === 'Esencias para Perfume' && p.isAvailableOnline !== false
  );

  // Ordenar por:
  // 1) Género: Hombre (0) -> Mujer (1) -> Unisex (2)
  // 2) Disponibilidad: Con existencias primero -> En camino después
  // 3) Código SKU numérico ascendente
  essences.sort((a, b) => {
    const rankA = getEssenceGenderOrderRank(a.gender);
    const rankB = getEssenceGenderOrderRank(b.gender);
    if (rankA !== rankB) return rankA - rankB;

    const availA = (Number(a.stock || 0) > 0 || Number(a.stockHalf || 0) > 0) ? 0 : 1;
    const availB = (Number(b.stock || 0) > 0 || Number(b.stockHalf || 0) > 0) ? 0 : 1;
    if (availA !== availB) return availA - availB;

    return Number(a.sku || 0) - Number(b.sku || 0);
  });

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const { upperLabel, fileSlug } = getCurrentCatalogMonthYear(new Date());

  // Cargar logo y botella base una sola vez
  const [logoImg, bottleImg] = await Promise.all([
    loadImageAsDataUrl('/images/aromaniak_black_logo.png', 'image/png', false),
    loadImageAsDataUrl('/images/essence_bottle_blank.webp', 'image/jpeg', true),
  ]);

  const items = essences.map((p) => {
    const rawSku = String(p.sku || '').trim();
    const prof = getFragranceProfile(p);
    const desc = getFragranceDescription(p, prof);

    let cleanOriginal = getInspiracionPerfumeName(p)
      .replace(/(?:\s+[HFMUD])+$/i, '')
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

    const brandName = INSPIRACION_BRAND_MAP[rawSku] || p.brand || '';

    let family = prof?.family || 'Fragancia Fina';
    family = family
      .replace(/CUERO/gi, 'Cuero')
      .replace(/AMADERADO/gi, 'Amaderado')
      .replace(/AMADERADA/gi, 'Amaderada')
      .replace(/CÍTRICO/gi, 'Cítrico')
      .replace(/CÍTRICA/gi, 'Cítrica')
      .replace(/FLORAL/gi, 'Floral')
      .replace(/ÁMBAR/gi, 'Ámbar')
      .replace(/CHIPRE/gi, 'Chipre')
      .replace(/AROMÁTICO/gi, 'Aromático')
      .replace(/AROMÁTICA/gi, 'Aromática');

    const cleanDesc = desc
      .replace(/\s+[HFMU]\./g, '.')
      .replace(/\s+[HFMU]\s+/g, ' ')
      .replace(/La Bomba M F/g, 'La Bomba')
      .replace(/La Bomba M/g, 'La Bomba')
      .replace(/Good Girl M F/g, 'Good Girl')
      .replace(/Good Girl M/g, 'Good Girl')
      .replace(/Baccarat Rouge 540 U/g, 'Baccarat Rouge 540');

    const hasStock = Number(p.stock || 0) > 0 || Number(p.stockHalf || 0) > 0;

    return {
      rawSku,
      skuCode: `AR-${rawSku.padStart(3, '0')}`,
      contratipo: cleanContratipo,
      originalName: cleanOriginal,
      brand: brandName,
      genderLabel: getEssenceGenderDisplayLabel(p.gender),
      family: family.toUpperCase(),
      topNotes: prof?.topNotes || [],
      heartNotes: prof?.heartNotes || [],
      baseNotes: prof?.baseNotes || [],
      description: cleanDesc,
      hasStock,
      isNew: isNewEssence(p),
    };
  });

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  const marginX = 14;
  const usableW = 210 - marginX * 2; // 182mm
  const colGap = 3.5;
  const rowGap = 3.2;
  const cardW = (usableW - colGap) / 2; // 89.25mm
  const gridTop = 24.5;
  const gridBottom = 281;
  const cardH = (gridBottom - gridTop - rowGap * 3) / 4; // ~61.7mm

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    const pageNum = pageIdx + 1;
    const pageItems = items.slice(pageIdx * ITEMS_PER_PAGE, (pageIdx + 1) * ITEMS_PER_PAGE);

    // ================= HEADER =================
    let brandTextX = marginX;
    if (logoImg) {
      const logoH = 7.2;
      const logoW = (logoImg.width / logoImg.height) * logoH;
      doc.addImage(logoImg.dataUrl, 'PNG', marginX, 11, logoW, logoH, 'aromaniak_logo', 'FAST');
      brandTextX = marginX + logoW + 3.2;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(59, 7, 100); // #3b0764
    doc.text('AROMANIAK SV', brandTextX, 15.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(126, 34, 206); // #7e22ce
    doc.text('ESENCIAS CALIDAD AAA+ • PERFUMERÍA FINA', brandTextX, 18.6);

    // Badge derecho con Fecha (Mes y Año) y Orden
    const badgeW = 62;
    const badgeH = 9.2;
    const badgeX = 210 - marginX - badgeW;
    const badgeY = 10.5;
    doc.setFillColor(88, 28, 135); // #581c87
    doc.setDrawColor(59, 7, 100);
    doc.setLineWidth(0.25);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.text(`CATÁLOGO • ${upperLabel}`, badgeX + badgeW - 2.5, badgeY + 4.2, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.4);
    doc.setTextColor(233, 213, 255); // #e9d5ff
    doc.text('ORDEN: HOMBRE • MUJER • UNISEX', badgeX + badgeW - 2.5, badgeY + 7.5, { align: 'right' });

    // Línea divisoria del header
    doc.setDrawColor(88, 28, 135);
    doc.setLineWidth(0.65);
    doc.line(marginX, 21.8, 210 - marginX, 21.8);

    // ================= TARJETAS DE PRODUCTO =================
    pageItems.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = marginX + col * (cardW + colGap);
      const y = gridTop + row * (cardH + rowGap);

      // Marco de tarjeta
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(88, 28, 135);
      doc.setLineWidth(0.35);
      doc.roundedRect(x, y, cardW, cardH, 1.4, 1.4, 'FD');

      // Columna de botella
      const bottleBoxX = x + 2.6;
      const bottleBoxY = y + 2.6;
      const bottleBoxW = 16.5;
      const bottleBoxH = cardH - 5.2;
      doc.setFillColor(250, 245, 255); // #faf5ff
      doc.setDrawColor(243, 232, 255); // #f3e8ff
      doc.setLineWidth(0.25);
      doc.roundedRect(bottleBoxX, bottleBoxY, bottleBoxW, bottleBoxH, 1.1, 1.1, 'FD');

      if (bottleImg) {
        const bW = 14.5;
        const bH = (bottleImg.height / bottleImg.width) * bW;
        const bX = bottleBoxX + (bottleBoxW - bW) / 2;
        const bY = bottleBoxY + (bottleBoxH - bH) / 2;
        doc.addImage(
          bottleImg.dataUrl,
          'JPEG',
          bX,
          bY,
          bW,
          bH,
          'aromaniak_bottle_blank',
          'FAST'
        );

        // Nombre impreso sobre la etiqueta del frasco
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(2.6);
        doc.setTextColor(17, 17, 17);
        const labelCenterX = bX + bW / 2;
        const labelCenterY = bY + bH * 0.635;
        const shortLabel = item.contratipo.length > 13 ? item.contratipo.slice(0, 12) : item.contratipo;
        doc.text(shortLabel, labelCenterX, labelCenterY, { align: 'center' });
        doc.setDrawColor(17, 17, 17);
        doc.setLineWidth(0.12);
        doc.line(labelCenterX - 1.5, labelCenterY + 0.55, labelCenterX + 1.5, labelCenterY + 0.55);
      }

      // Columna de información
      const infoX = bottleBoxX + bottleBoxW + 2.8;
      const infoRightX = x + cardW - 2.8;
      const infoW = infoRightX - infoX;

      // 1. Fila superior: Código AR-XXX a la izquierda, Badges a la derecha
      const topRowY = y + 3.2;
      const skuBadgeW = 12.2;
      const skuBadgeH = 4.2;
      doc.setFillColor(88, 28, 135);
      doc.roundedRect(infoX, topRowY, skuBadgeW, skuBadgeH, 0.8, 0.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(255, 255, 255);
      doc.text(item.skuCode, infoX + skuBadgeW / 2, topRowY + 2.95, { align: 'center' });

      // Badges a la derecha (Género + Estado + Nuevo)
      let cursorRightX = infoRightX;

      // Badge Género
      const genderText = item.genderLabel;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      const gW = doc.getTextWidth(genderText) + 3.2;
      const gX = cursorRightX - gW;
      if (genderText === 'HOMBRE') {
        doc.setFillColor(239, 246, 255); // #eff6ff
        doc.setDrawColor(30, 58, 138); // #1e3a8a
        doc.setTextColor(30, 58, 138);
      } else if (genderText === 'MUJER') {
        doc.setFillColor(253, 244, 255); // #fdf4ff
        doc.setDrawColor(112, 26, 117); // #701a75
        doc.setTextColor(112, 26, 117);
      } else {
        doc.setFillColor(250, 245, 255); // #faf5ff
        doc.setDrawColor(88, 28, 135); // #581c87
        doc.setTextColor(88, 28, 135);
      }
      doc.setLineWidth(0.2);
      doc.roundedRect(gX, topRowY, gW, skuBadgeH, 0.8, 0.8, 'FD');
      doc.text(genderText, gX + gW / 2, topRowY + 2.95, { align: 'center' });
      cursorRightX = gX - 1.2;

      // Badge Disponibilidad (según existencias actuales)
      const statusText = item.hasStock ? 'DISPONIBLE' : 'EN CAMINO';
      doc.setFontSize(5.3);
      const sW = doc.getTextWidth(statusText) + 2.8;
      const sX = cursorRightX - sW;
      if (item.hasStock) {
        doc.setFillColor(236, 253, 245); // #ecfdf5
        doc.setDrawColor(5, 150, 105); // #059669
        doc.setTextColor(4, 120, 87); // #047857
        doc.setLineWidth(0.2);
        doc.roundedRect(sX, topRowY, sW, skuBadgeH, 0.8, 0.8, 'FD');
      } else {
        doc.setFillColor(245, 158, 11); // #f59e0b
        doc.roundedRect(sX, topRowY, sW, skuBadgeH, 0.8, 0.8, 'F');
        doc.setTextColor(255, 255, 255);
      }
      doc.text(statusText, sX + sW / 2, topRowY + 2.95, { align: 'center' });
      cursorRightX = sX - 1.2;

      // Badge NUEVO (Ticket Dorado) si es esencia nueva
      if (item.isNew) {
        const newText = 'NUEVO';
        doc.setFontSize(5.3);
        const nW = doc.getTextWidth(newText) + 2.8;
        const nX = cursorRightX - nW;
        doc.setFillColor(254, 240, 138); // #fef08a
        doc.setDrawColor(217, 119, 6); // #d97706
        doc.setLineWidth(0.22);
        doc.roundedRect(nX, topRowY, nW, skuBadgeH, 0.8, 0.8, 'FD');
        doc.setTextColor(69, 26, 3); // #451a03
        doc.text(newText, nX + nW / 2, topRowY + 2.95, { align: 'center' });
      }

      // 2. Nombre Contratipo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(59, 7, 100); // #3b0764
      const contratipoFit = doc.splitTextToSize(item.contratipo, infoW)[0] || item.contratipo;
      doc.text(contratipoFit, infoX, y + 11.4);

      // 3. Línea de Inspiración
      const inspY = y + 15.2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(126, 34, 206); // #7e22ce
      const tagStr = 'INSPIRACIÓN: ';
      doc.text(tagStr, infoX, inspY);
      const tagW = doc.getTextWidth(tagStr);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(15, 23, 42); // #0f172a
      const origStr = item.originalName;
      doc.text(origStr, infoX + tagW, inspY);
      const origW = doc.getTextWidth(origStr);

      if (item.brand) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.9);
        doc.setTextColor(100, 116, 139); // #64748b
        const brandStr = ` (${item.brand})`;
        if (tagW + origW + doc.getTextWidth(brandStr) <= infoW) {
          doc.text(brandStr, infoX + tagW + origW, inspY);
        }
      }

      // 4. Familia Olfativa
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.6);
      doc.setTextColor(107, 33, 168); // #6b21a8
      doc.text(item.family, infoX, y + 18.8);

      // 5. Notas Olfativas (con barra lateral morada)
      const notesParts: string[] = [];
      if (item.topNotes.length > 0) {
        notesParts.push(`Salida: ${item.topNotes.slice(0, 3).join(', ')}`);
      }
      if (item.heartNotes.length > 0) {
        notesParts.push(`Corazón: ${item.heartNotes.slice(0, 3).join(', ')}`);
      } else if (item.baseNotes.length > 0) {
        notesParts.push(`Fondo: ${item.baseNotes.slice(0, 3).join(', ')}`);
      }

      let descStartY = y + 23.5;
      if (notesParts.length > 0) {
        const notesStr = notesParts.join(' • ');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(51, 65, 85); // #334155
        const noteLines: string[] = doc.splitTextToSize(notesStr, infoW - 2.5).slice(0, 3);
        const notesBlockH = noteLines.length * 2.75 + 0.6;

        doc.setFillColor(126, 34, 206); // #7e22ce
        doc.rect(infoX, y + 21.2, 0.65, notesBlockH, 'F');

        noteLines.forEach((line, lIdx) => {
          doc.text(line, infoX + 2.0, y + 23.3 + lIdx * 2.75);
        });

        descStartY = y + 23.3 + noteLines.length * 2.75 + 2.6;
      }

      // 6. Descripción Olfativa
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.75);
      doc.setTextColor(82, 82, 91); // #52525b
      const maxDescLines = Math.max(2, Math.floor((y + cardH - 3.2 - descStartY) / 2.7));
      const descLines: string[] = doc
        .splitTextToSize(item.description, infoW)
        .slice(0, maxDescLines);
      descLines.forEach((line, lIdx) => {
        doc.text(line, infoX, descStartY + lIdx * 2.7);
      });
    });

    // Tarjeta de cierre en la última página si quedan espacios libres
    if (pageIdx === totalPages - 1 && pageItems.length < ITEMS_PER_PAGE) {
      const idx = pageItems.length;
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = marginX + col * (cardW + colGap);
      const y = gridTop + row * (cardH + rowGap);

      doc.setFillColor(250, 245, 255); // #faf5ff
      doc.setDrawColor(126, 34, 206); // #7e22ce
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, cardW, cardH, 1.4, 1.4, 'FD');

      const centerX = x + cardW / 2;
      const centerY = y + cardH / 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(59, 7, 100);
      doc.text('AROMANIAK SV', centerX, centerY - 6, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(76, 29, 149);
      const closeDesc = doc.splitTextToSize(
        'Esencias 100% puras de perfumería fina europea formuladas con aceites de grado AAA+. Máxima estela, fijación y rendimiento prolongado.',
        cardW - 14
      );
      closeDesc.forEach((line: string, i: number) => {
        doc.text(line, centerX, centerY - 1 + i * 3, { align: 'center' });
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(126, 34, 206);
      doc.text(`CATÁLOGO ACTUALIZADO • ${upperLabel} • WWW.AROMANIAKSV.COM`, centerX, centerY + 10, {
        align: 'center',
      });
    }

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
      footerLineY + 4
    );

    doc.setTextColor(100, 116, 139);
    doc.text(`PÁGINA ${pageNum} DE ${totalPages}`, 210 - marginX, footerLineY + 4, {
      align: 'right',
    });
  }

  doc.save(`Catalogo-Aromaniak-${fileSlug}.pdf`);
}
