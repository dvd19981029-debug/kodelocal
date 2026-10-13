import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { getInspiracionPerfumeName } from '../src/lib/perfumeNames';
import { getFragranceProfile } from '../src/lib/fragranceProfiles';
import { getFragranceDescription } from '../src/lib/fragranceDescriptions';

const prisma = new PrismaClient();

async function generateMinimalistCatalog() {
  const inStock = await prisma.product.findMany({
    where: {
      isActive: true,
      isAvailableOnline: true,
      stock: { gt: 0 },
      category: { name: 'Esencias para Perfume' }
    }
  });

  inStock.sort((a, b) => parseInt(a.sku, 10) - parseInt(b.sku, 10));

  const items = inStock.map(p => {
    const prof = getFragranceProfile(p as any);
    const desc = getFragranceDescription(p as any, prof);
    let insp = getInspiracionPerfumeName(p);

    let cleanOriginal = insp.replace(/\s+H$/, '').replace(/\s+F$/, '').trim();
    if (cleanOriginal.toLowerCase() === 'la vida es bella') cleanOriginal = 'La Vie Est Belle';

    return {
      rawSku: p.sku,
      sku: p.sku.padStart(2, '0'),
      originalName: cleanOriginal,
      gender: p.gender || 'Unisex',
      family: prof?.family || 'Fragancia Fina',
      topNotes: prof?.topNotes || [],
      heartNotes: prof?.heartNotes || [],
      baseNotes: prof?.baseNotes || [],
      description: desc
    };
  });

  console.log(`Total in-stock products to render: ${items.length}`);

  // Base64 de la botella KODE
  const bottlePath = path.join(__dirname, '../public/images/kode_bottle_card.jpg');
  const bottleBase64 = fs.readFileSync(bottlePath).toString('base64');
  const bottleUri = `data:image/jpeg;base64,${bottleBase64}`;

  // Distribuir en 4 páginas perfectas: 8, 8, 8, 7
  const pages = [
    items.slice(0, 8),
    items.slice(8, 16),
    items.slice(16, 24),
    items.slice(24, 31)
  ];

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>KÖDE • Catálogo de Disponibilidad Inmediata</title>
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
      color: #000000;
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

    /* Header Todo Negro Minimalista */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 6px;
      border-bottom: 2px solid #000000;
      margin-bottom: 8px;
    }

    .brand-section {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .brand-logo {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 5px;
      text-transform: uppercase;
      color: #000000;
    }

    .brand-tagline {
      font-size: 8.5px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #71717a;
      font-weight: 600;
    }

    .header-status {
      text-align: right;
      font-size: 8.5px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 800;
      color: #000000;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .header-status::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #000000;
    }

    /* Grid de tarjetas (4 filas x 2 columnas = 8 tarjetas por página) */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 8px;
      flex: 1;
    }

    .product-card {
      border: 1px solid #000000;
      padding: 8px 10px;
      background: #ffffff;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .bottle-box {
      width: 44px;
      height: 68px;
      position: relative;
      flex-shrink: 0;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .bottle-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
      height: 100%;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }

    .kodigo-badge {
      background: #000000;
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 900;
      padding: 1.5px 6px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .gender-tag {
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #000000;
      border: 1px solid #000000;
      padding: 1px 5px;
    }

    .inspiration-title {
      font-size: 12.5px;
      font-weight: 900;
      color: #000000;
      letter-spacing: -0.2px;
      line-height: 1.2;
      margin-bottom: 1.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .family-line {
      font-size: 7.8px;
      font-weight: 700;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .notes-box {
      font-size: 7.8px;
      color: #27272a;
      line-height: 1.3;
      margin-bottom: 2px;
      border-left: 1.5px solid #000000;
      padding-left: 5px;
    }

    .notes-box strong {
      font-weight: 800;
      color: #000000;
    }

    .description-text {
      font-size: 7.8px;
      color: #52525b;
      line-height: 1.32;
    }

    /* Caja especial de cierre para el 8vo espacio de la página 4 */
    .brand-closing-card {
      border: 1px dashed #000000;
      padding: 12px;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 4px;
    }

    .brand-closing-card .title {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #000000;
    }

    .brand-closing-card .desc {
      font-size: 8px;
      color: #52525b;
      line-height: 1.4;
      max-width: 85%;
    }

    /* Footer Todo Negro Minimalista */
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 6px;
      border-top: 1px solid #000000;
      color: #000000;
      font-size: 8px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 700;
    }
  </style>
</head>
<body>

  ${pages.map((pageItems, pageIdx) => {
    const pageNum = pageIdx + 1;
    const isLastPage = pageNum === 4;

    return `
    <div class="catalog-page">
      <div>
        <div class="page-header">
          <div class="brand-section">
            <div class="brand-logo">K O D E</div>
            <div class="brand-tagline">Disponibilidad Inmediata • Stock en Ecommerce</div>
          </div>
          <div class="header-status">
            ${items.length} Fragancias Disponibles
          </div>
        </div>

        <div class="grid">
          ${pageItems.map(item => {
            const topStr = item.topNotes.length ? item.topNotes.slice(0, 3).join(', ') : '';
            const heartStr = item.heartNotes.length ? item.heartNotes.slice(0, 3).join(', ') : '';
            const baseStr = item.baseNotes.length ? item.baseNotes.slice(0, 3).join(', ') : '';

            let notesHtml = '';
            if (topStr && heartStr) {
              notesHtml = `<strong>Salida:</strong> ${topStr} • <strong>Corazón:</strong> ${heartStr}`;
            } else if (topStr && baseStr) {
              notesHtml = `<strong>Salida:</strong> ${topStr} • <strong>Fondo:</strong> ${baseStr}`;
            }

            return `
            <div class="product-card">
              <div class="bottle-box">
                <img src="${bottleUri}" alt="KODE ${item.sku}" class="bottle-img" />
              </div>

              <div class="product-info">
                <div>
                  <div class="card-top">
                    <span class="kodigo-badge">KÓDIGO #${item.rawSku}</span>
                    <span class="gender-tag">${item.gender}</span>
                  </div>

                  <div class="inspiration-title" title="${item.originalName}">
                    ${item.originalName}
                  </div>

                  <div class="family-line">
                    ${item.family}
                  </div>
                </div>

                <div>
                  ${notesHtml ? `<div class="notes-box">${notesHtml}</div>` : ''}
                  <div class="description-text">
                    ${item.description}
                  </div>
                </div>
              </div>
            </div>
            `;
          }).join('')}

          ${isLastPage ? `
            <div class="brand-closing-card">
              <div class="title">K O D E</div>
              <div class="desc">
                Concentrado de perfumería fina europea. Formulación de alta fijación y proyección duradera.
              </div>
              <div style="font-size: 7.5px; font-weight: 800; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase;">
                Eau de Parfum • 100ml / 3.33 fl. oz.
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="page-footer">
        <div>KODE • Perfumería Fina de Inspiración • Sitio Web Oficial</div>
        <div>Página ${pageNum} de ${pages.length}</div>
      </div>
    </div>
    `;
  }).join('')}

</body>
</html>`;

  const htmlPath = path.join(__dirname, '../public/catalogo_temp.html');
  const pdfPath = path.join(__dirname, '../public/catalogo-kode.pdf');

  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log('Saved HTML to', htmlPath);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  console.log('Generating minimalist PDF with Chrome...');
  execSync(cmd, { stdio: 'inherit' });

  const stats = fs.statSync(pdfPath);
  const sizeMb = stats.size / (1024 * 1024);
  console.log(`PDF successfully created at: ${pdfPath}`);
  console.log(`File size: ${sizeMb.toFixed(2)} MB (${stats.size} bytes)`);

  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }

  // Copiar a Downloads y otras rutas
  const downloadsPath = '/Users/luis/Downloads/catalogo-kode.pdf';
  fs.copyFileSync(pdfPath, downloadsPath);
  console.log('Copied to', downloadsPath);

  await prisma.$disconnect();
}

generateMinimalistCatalog().catch(console.error);
