import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { getInspiracionPerfumeName, isNewEssence } from '../src/lib/perfumeNames';
import { getFragranceProfile } from '../src/lib/fragranceProfiles';
import { getFragranceDescription } from '../src/lib/fragranceDescriptions';
import { getCurrentCatalogMonthYear, getEssenceGenderOrderRank, getEssenceGenderDisplayLabel } from '../src/lib/aromaniakCatalogPdf';

const prisma = new PrismaClient();

const apaesaCatalogPath = path.join(__dirname, '../../sistema-etiquetas-esencias/apaesa_catalog.json');
const apaesaCatalog: Array<{
  sku: string;
  contratipo: string;
  inspirado: string;
  original: string;
  marca: string;
  genero: string;
}> = JSON.parse(fs.readFileSync(apaesaCatalogPath, 'utf8'));

const apaesaMap: Record<string, typeof apaesaCatalog[0]> = {};
apaesaCatalog.forEach(c => {
  apaesaMap[c.sku] = c;
});

async function generateAromaniakCatalog() {
  const allFragrances = await prisma.product.findMany({
    where: {
      category: { name: 'Esencias para Perfume' }
    }
  });

  allFragrances.sort((a, b) => {
    const rankA = getEssenceGenderOrderRank(a.gender);
    const rankB = getEssenceGenderOrderRank(b.gender);
    if (rankA !== rankB) return rankA - rankB;

    const availA = (Number(a.stock || 0) > 0 || Number((a as any).stockHalf || 0) > 0) ? 0 : 1;
    const availB = (Number(b.stock || 0) > 0 || Number((b as any).stockHalf || 0) > 0) ? 0 : 1;
    if (availA !== availB) return availA - availB;

    return Number(a.sku || 0) - Number(b.sku || 0);
  });

  const { upperLabel } = getCurrentCatalogMonthYear(new Date());

  // Base64 del logo de Aromaniak
  const logoPath = path.join(__dirname, '../public/images/aromaniak_black_logo.png');
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  const logoUri = `data:image/png;base64,${logoBase64}`;

  // Directorio de imágenes de botellas con etiqueta Aromaniak optimizadas
  const esenciasDir = path.join(__dirname, '../public/images/esencias');
  const thumbsDir = '/tmp/aromaniak_thumbs';
  if (!fs.existsSync(thumbsDir)) {
    fs.mkdirSync(thumbsDir, { recursive: true });
  }

  const items = allFragrances.map(p => {
    const ap = apaesaMap[p.sku || ''] || {} as any;
    const prof = getFragranceProfile(p as any);
    const desc = getFragranceDescription(p as any, prof);
    let cleanOriginal = (p.name || '').replace(/(?:\s+[HFMUD])+$/i, '').trim();
    if (cleanOriginal.toLowerCase() === 'la vida es bella') cleanOriginal = 'La Vie Est Belle';
    if (cleanOriginal === 'CHNL° 5' || cleanOriginal === 'N° 5') cleanOriginal = 'Chanel N° 5';
    if (cleanOriginal === 'Donna') cleanOriginal = 'Born In Roma Donna';
    if (cleanOriginal.includes('La Bomba')) cleanOriginal = 'La Bomba';
    if (cleanOriginal === 'Princess') cleanOriginal = 'Vera Wang Princess';
    if (cleanOriginal === 'Good Girl M' || cleanOriginal === 'Good Girl') cleanOriginal = 'Good Girl';

    const contratipoName = ap.contratipo || p.officialName?.replace(/(?:\s+[HFMUD])+$/i, '') || cleanOriginal;
    const brandName = ap.marca || p.brand || '';

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

    let cleanDesc = desc
      .replace(/\s+[HFMU]\./g, '.')
      .replace(/\s+[HFMU]\s+/g, ' ')
      .replace(/La Bomba M F/g, 'La Bomba')
      .replace(/La Bomba M/g, 'La Bomba')
      .replace(/Good Girl M F/g, 'Good Girl')
      .replace(/Good Girl M/g, 'Good Girl')
      .replace(/Baccarat Rouge 540 U/g, 'Baccarat Rouge 540');

    // Convertir y cachear thumbnail JPEG optimizado (320px alto, ~10KB)
    const bottleFileName = `esencia-apae-${String(p.sku).padStart(3, '0')}.webp`;
    const bottleFileFullPath = path.join(esenciasDir, bottleFileName);
    const thumbPath = path.join(thumbsDir, `thumb_${p.sku}.jpg`);

    let bottleUri = '';
    if (fs.existsSync(bottleFileFullPath)) {
      if (!fs.existsSync(thumbPath)) {
        try {
          execSync(`sips -s format jpeg -s formatOptions 82 --resampleHeight 320 "${bottleFileFullPath}" --out "${thumbPath}"`, { stdio: 'ignore' });
        } catch (e) {
          // fallback
        }
      }
      const pathToRead = fs.existsSync(thumbPath) ? thumbPath : bottleFileFullPath;
      const b64 = fs.readFileSync(pathToRead).toString('base64');
      const mime = pathToRead.endsWith('.jpg') ? 'image/jpeg' : 'image/webp';
      bottleUri = `data:${mime};base64,${b64}`;
    }

    return {
      rawSku: p.sku,
      skuCode: `AR-${String(p.sku).padStart(3, '0')}`,
      contratipo: contratipoName,
      originalName: cleanOriginal,
      brand: brandName,
      gender: getEssenceGenderDisplayLabel(p.gender),
      family: family,
      topNotes: prof?.topNotes || [],
      heartNotes: prof?.heartNotes || [],
      baseNotes: prof?.baseNotes || [],
      description: cleanDesc,
      bottleUri,
      isIncoming: Number(p.stock || 0) <= 0 && Number((p as any).stockHalf || 0) <= 0,
      isNew: isNewEssence(p as any)
    };
  });

  console.log(`Total Aromaniak fragrances to render: ${items.length}`);

  // Distribuir en páginas de 8 ítems cada una
  const ITEMS_PER_PAGE = 8;
  const pages: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>AROMANIAK • Catálogo Oficial de Contratipos y Esencias</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e1b4b;
      background-color: #ffffff;
      font-size: 8.5px;
      line-height: 1.35;
      -webkit-font-smoothing: antialiased;
    }

    .catalog-page {
      width: 210mm;
      height: 297mm;
      padding: 11mm 14mm 10mm 14mm;
      page-break-after: always;
      break-after: page;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Header Temática Aromaniak - Royal Morado Elegante */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 7px;
      border-bottom: 2.5px solid #581c87;
      margin-bottom: 8px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-img {
      height: 26px;
      object-fit: contain;
    }

    .brand-taglines {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 13.5px;
      font-weight: 900;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #3b0764;
    }

    .brand-sub {
      font-size: 7.5px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #7e22ce;
      font-weight: 700;
    }

    .header-status-badge {
      background: #581c87;
      border: 1px solid #3b0764;
      padding: 4px 10px;
      border-radius: 4px;
      text-align: right;
      color: #ffffff;
    }

    .header-status-title {
      font-size: 8px;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      font-weight: 900;
      color: #ffffff;
    }

    .header-status-sub {
      font-size: 6.8px;
      color: #e9d5ff;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    /* Grid de tarjetas (4 filas que abarcan toda la página) */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 9px;
      flex: 1;
      min-height: 0;
    }

    /* Tarjeta de Producto Aromaniak - Diseño Limpio y Sofisticado */
    .product-card {
      border: 1.2px solid #581c87;
      border-radius: 4px;
      padding: 9px 11px;
      display: flex;
      gap: 10px;
      background-color: #ffffff;
      align-items: stretch;
      min-height: 0;
    }

    .bottle-col {
      width: 58px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #faf5ff;
      border-radius: 3px;
      border: 1px solid #f3e8ff;
      padding: 4px;
    }

    .bottle-img {
      max-width: 50px;
      max-height: 112px;
      object-fit: contain;
    }

    .info-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }

    .code-badge {
      background-color: #581c87;
      color: #ffffff;
      font-size: 7.8px;
      font-weight: 900;
      letter-spacing: 1px;
      padding: 1.5px 6px;
      border-radius: 2px;
      text-transform: uppercase;
    }

    .gender-tag {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 2px;
      border: 1px solid currentColor;
    }

    .gender-caballero {
      color: #1e3a8a;
      background: #eff6ff;
    }

    .gender-dama {
      color: #701a75;
      background: #fdf4ff;
    }

    .gender-unisex {
      color: #581c87;
      background: #faf5ff;
    }

    .contratipo-name {
      font-size: 12px;
      font-weight: 900;
      color: #3b0764;
      letter-spacing: 0.2px;
      line-height: 1.15;
      margin-bottom: 1.5px;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inspiration-line {
      font-size: 8.2px;
      color: #334155;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inspiration-line .insp-tag {
      color: #7e22ce;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 7.5px;
      letter-spacing: 0.4px;
    }

    .inspiration-line .insp-name {
      font-weight: 800;
      color: #0f172a;
    }

    .inspiration-line .insp-brand {
      color: #64748b;
      font-weight: 600;
    }

    .family-tag {
      font-size: 7.2px;
      font-weight: 700;
      color: #6b21a8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .notes-box {
      font-size: 7.6px;
      color: #334155;
      line-height: 1.28;
      margin-bottom: 2px;
      border-left: 2px solid #7e22ce;
      padding-left: 5px;
    }

    .notes-box strong {
      font-weight: 800;
      color: #3b0764;
    }

    .description-text {
      font-size: 7.6px;
      color: #52525b;
      line-height: 1.3;
    }

    /* Caja especial de cierre Aromaniak en Morado */
    .brand-closing-card {
      border: 1.5px solid #7e22ce;
      border-radius: 4px;
      padding: 14px;
      background: #faf5ff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 5px;
    }

    .brand-closing-card .title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #3b0764;
    }

    .brand-closing-card .desc {
      font-size: 8px;
      color: #4c1d95;
      line-height: 1.4;
      max-width: 90%;
      font-weight: 500;
    }

    .brand-closing-card .contact-info {
      font-size: 7.5px;
      font-weight: 900;
      letter-spacing: 1.2px;
      margin-top: 3px;
      text-transform: uppercase;
      color: #7e22ce;
    }

    /* Footer Temático Aromaniak */
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 6px;
      border-top: 1.5px solid #581c87;
      font-size: 7.8px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }

    .page-footer strong {
      color: #581c87;
    }
  </style>
</head>
<body>

  ${pages.map((pageItems, pageIdx) => {
    const pageNum = pageIdx + 1;
    const isLastPage = pageNum === pages.length;

    return `
    <div class="catalog-page">
      <div style="display: flex; flex-direction: column; flex: 1; min-height: 0; margin-bottom: 8px;">
        <div class="page-header">
          <div class="brand-section">
            <img src="${logoUri}" class="brand-logo-img" alt="Aromaniak" />
            <div class="brand-taglines">
              <span class="brand-title">AROMANIAK SV</span>
              <span class="brand-sub">Esencias Calidad AAA+ • Perfumería Fina</span>
            </div>
          </div>
          <div class="header-status-badge">
            <div class="header-status-title">CATÁLOGO • ${upperLabel}</div>
            <div class="header-status-sub">ORDEN: HOMBRE • MUJER • UNISEX</div>
          </div>
        </div>

        <div class="grid">
          ${pageItems.map(item => {
            const hasNotes = item.topNotes.length > 0 || item.heartNotes.length > 0 || item.baseNotes.length > 0;
            const genderClass = item.gender.toLowerCase().includes('dama') || item.gender.toLowerCase().includes('mujer')
              ? 'gender-dama'
              : item.gender.toLowerCase().includes('unisex')
              ? 'gender-unisex'
              : 'gender-caballero';

            return `
            <div class="product-card">
              <div class="bottle-col">
                <img src="${item.bottleUri}" class="bottle-img" alt="${item.contratipo}" />
              </div>
              <div class="info-col">
                <div>
                  <div class="card-top">
                    <span class="code-badge">${item.skuCode}</span>
                    <div style="display:flex;gap:4px;align-items:center;">
                      ${item.isNew ? `<span style="background:linear-gradient(135deg,#fef08a,#fbbf24);color:#451a03;border:1px solid #d97706;font-size:6.8px;font-weight:900;padding:1px 5px;border-radius:2px;letter-spacing:0.6px;text-transform:uppercase;">NUEVO</span>` : ''}
                      ${item.isIncoming ? `<span style="background:#f59e0b;color:#fff;font-size:7px;font-weight:900;padding:1px 5px;border-radius:2px;letter-spacing:0.6px;text-transform:uppercase;">EN CAMINO</span>` : `<span style="background:#ecfdf5;color:#047857;border:1px solid #059669;font-size:6.8px;font-weight:900;padding:1px 5px;border-radius:2px;letter-spacing:0.5px;text-transform:uppercase;">DISPONIBLE</span>`}
                      <span class="gender-tag ${genderClass}">${item.gender}</span>
                    </div>
                  </div>
                  <div class="contratipo-name">${item.contratipo}</div>
                  <div class="inspiration-line">
                    <span class="insp-tag">Inspiración:</span> <span class="insp-name">${item.originalName}</span> ${item.brand ? `<span class="insp-brand">(${item.brand})</span>` : ''}
                  </div>
                  <div class="family-tag">${item.family}</div>
                </div>

                ${hasNotes ? `
                <div class="notes-box">
                  ${item.topNotes.length ? `<strong>Salida:</strong> ${item.topNotes.slice(0, 3).join(', ')} • ` : ''}
                  ${item.heartNotes.length ? `<strong>Corazón:</strong> ${item.heartNotes.slice(0, 3).join(', ')}` : ''}
                  ${!item.heartNotes.length && item.baseNotes.length ? `<strong>Fondo:</strong> ${item.baseNotes.slice(0, 3).join(', ')}` : ''}
                </div>
                ` : ''}

                <div class="description-text">
                  ${item.description}
                </div>
              </div>
            </div>
            `;
          }).join('')}

          ${isLastPage && pageItems.length < ITEMS_PER_PAGE ? `
            <div class="brand-closing-card">
              <div class="title">AROMANIAK SV</div>
              <div class="desc">
                Esencias 100% puras de perfumería fina europea formuladas con aceites de grado AAA+. Máxima estela, fijación y rendimiento prolongado.
              </div>
              <div class="contact-info">
                Frascos de 1 Oz & Media Onza • www.aromaniaksv.com
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="page-footer">
        <div><strong>AROMANIAK SV</strong> • Catálogo Actualizado: ${upperLabel} • www.aromaniaksv.com</div>
        <div>Página ${pageNum} de ${pages.length}</div>
      </div>
    </div>
    `;
  }).join('')}

</body>
</html>`;

  const htmlPath = path.join(__dirname, '../public/catalogo_aromaniak_temp.html');
  const pdfPath = path.join(__dirname, '../public/catalogo-aromaniak.pdf');

  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log('Saved HTML to', htmlPath);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  console.log('Generating Aromaniak PDF with Chrome...');
  execSync(cmd, { stdio: 'inherit' });

  const stats = fs.statSync(pdfPath);
  const sizeMb = stats.size / (1024 * 1024);
  console.log(`PDF successfully created at: ${pdfPath}`);
  console.log(`File size: ${sizeMb.toFixed(2)} MB (${stats.size} bytes)`);

  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }

  // Copiar a Downloads y a artifact
  const downloadsPath = '/Users/luis/Downloads/catalogo-aromaniak.pdf';
  fs.copyFileSync(pdfPath, downloadsPath);
  console.log('Copied to', downloadsPath);

  const artifactPath = '/Users/luis/.gemini/antigravity/brain/83c36dfc-5c6a-4bfc-b06a-3fd7c5fac554/catalogo-aromaniak.pdf';
  if (fs.existsSync(path.dirname(artifactPath))) {
    fs.copyFileSync(pdfPath, artifactPath);
  }

  await prisma.$disconnect();
}

generateAromaniakCatalog().catch(console.error);
