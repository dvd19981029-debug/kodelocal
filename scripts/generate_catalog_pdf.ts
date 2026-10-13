import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { INITIAL_PRODUCTS } from '../src/lib/store';
import { getInspiracionPerfumeName, formatPerfumeDisplayName } from '../src/lib/perfumeNames';
import { getFragranceProfile } from '../src/lib/fragranceProfiles';
import { getFragranceDescription } from '../src/lib/fragranceDescriptions';

async function generateCatalogPdf() {
  const sorted = [...INITIAL_PRODUCTS.filter(p => p.category === 'Esencias para Perfume')].sort(
    (a, b) => parseInt(a.sku, 10) - parseInt(b.sku, 10)
  );

  const items = sorted.map(p => {
    const prof = getFragranceProfile(p);
    let desc = getFragranceDescription(p, prof);
    let insp = getInspiracionPerfumeName(p);
    let disp = formatPerfumeDisplayName(p);

    if (p.sku === '57') {
      disp = 'Sweet Bomb F';
      insp = 'La Bomba (Carolina Herrera) F';
      desc = desc.replace(/La Bomba M F/g, 'La Bomba (Carolina Herrera) F');
    } else if (p.sku === '58') {
      disp = 'Femme Fatale F';
      insp = 'Good Girl (Carolina Herrera) F';
      desc = desc.replace(/Good Girl M F/g, 'Good Girl (Carolina Herrera) F');
    }

    return {
      sku: p.sku.padStart(2, '0'),
      rawSku: p.sku,
      kodigo: disp,
      original: insp,
      gender: p.gender || 'Unisex',
      family: prof?.family || 'Fragancia Fina',
      topNotes: prof?.topNotes || [],
      heartNotes: prof?.heartNotes || [],
      baseNotes: prof?.baseNotes || [],
      description: desc
    };
  });

  // Dividir exactamente en 10 páginas de 6 ítems cada una
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const pages: (typeof items)[] = [];

  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>KODE - Catálogo Oficial de Fragancias</title>
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      font-size: 10.5px;
      line-height: 1.4;
    }

    .catalog-page {
      width: 210mm;
      height: 297mm;
      padding: 12mm 14mm 10mm 14mm;
      position: relative;
      page-break-after: always;
      break-after: page;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Banner de Página 1 */
    .header-banner {
      background: linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #31104b 100%);
      color: #ffffff;
      border-radius: 10px;
      padding: 14px 20px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #334155;
    }

    .header-titles h1 {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-titles h1 span.highlight {
      color: #818cf8;
    }

    .header-titles h2 {
      font-size: 11px;
      font-weight: 500;
      color: #c7d2fe;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    .header-badge {
      text-align: right;
      border-left: 2px solid rgba(255,255,255,0.25);
      padding-left: 16px;
    }

    .header-badge .edition {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #94a3b8;
      font-weight: 700;
    }

    .header-badge .count {
      font-size: 16px;
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: 0.5px;
    }

    /* Mini header para páginas 2 a 10 */
    .page-mini-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      margin-bottom: 10px;
      border-bottom: 1.5px solid #e2e8f0;
    }

    .mini-brand {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 1.5px;
      color: #1e1b4b;
      text-transform: uppercase;
    }

    .mini-brand span {
      color: #6366f1;
    }

    .mini-subtitle {
      font-size: 9.5px;
      color: #64748b;
      font-weight: 500;
    }

    /* Grid de tarjetas (exactamente 3 filas x 2 columnas) */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 10px;
      flex: 1;
    }

    .card {
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      padding: 10px 12px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }

    .kodigo-box {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .kodigo-number {
      background: #0f172a;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      padding: 2px 5px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .kodigo-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.2px;
    }

    .gender-pill {
      font-size: 8px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gender-caballero {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .gender-dama {
      background: #fdf2f8;
      color: #be185d;
      border: 1px solid #fbcfe8;
    }

    .gender-unisex {
      background: #fefce8;
      color: #854d0e;
      border: 1px solid #fef08a;
    }

    .inspiration-container {
      margin-bottom: 5px;
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 6px;
      border-left: 3px solid #6366f1;
    }

    .inspiration-label {
      font-size: 8px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .inspiration-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #4338ca;
    }

    .family-badge {
      font-size: 8.5px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 5px;
      display: inline-block;
    }

    .family-badge strong {
      color: #1e293b;
    }

    .notes-box {
      margin-bottom: 6px;
      font-size: 8.5px;
      line-height: 1.35;
      background: #f8fafc;
      padding: 5px 7px;
      border-radius: 5px;
      border: 1px solid #edf2f7;
    }

    .notes-line {
      margin-bottom: 1.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notes-line:last-child {
      margin-bottom: 0;
    }

    .notes-tag {
      font-weight: 800;
      color: #334155;
    }

    .notes-val {
      color: #64748b;
    }

    .description-box {
      font-size: 8.8px;
      color: #334155;
      line-height: 1.38;
      text-align: justify;
      background: #ffffff;
      border-top: 1px dashed #e2e8f0;
      padding-top: 5px;
      margin-top: 2px;
    }

    /* Footer de cada página */
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      margin-top: 8px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .footer-left {
      font-weight: 600;
      color: #64748b;
    }

    .footer-right {
      font-weight: 800;
      color: #475569;
    }
  </style>
</head>
<body>

  ${pages.map((pageItems, pageIndex) => {
    const currentPageNum = pageIndex + 1;
    const isFirstPage = currentPageNum === 1;

    return `
    <div class="catalog-page">
      <div>
        ${isFirstPage ? `
          <div class="header-banner">
            <div class="header-titles">
              <h1>KODE <span class="highlight">PARFUM</span></h1>
              <h2>Catálogo Oficial de Fragancias & Guía de Contratipos</h2>
            </div>
            <div class="header-badge">
              <div class="edition">Catálogo Completo</div>
              <div class="count">${items.length} Fragancias</div>
            </div>
          </div>
        ` : `
          <div class="page-mini-header">
            <div class="mini-brand">KODE <span>PARFUM</span></div>
            <div class="mini-subtitle">Catálogo Oficial de Fragancias de Inspiración</div>
          </div>
        `}

        <div class="grid">
          ${pageItems.map(item => {
            let genderClass = 'gender-unisex';
            const g = (item.gender || '').toLowerCase();
            if (g.includes('caballero') || g.includes('hombre')) {
              genderClass = 'gender-caballero';
            } else if (g.includes('dama') || g.includes('mujer')) {
              genderClass = 'gender-dama';
            }

            const topStr = item.topNotes.length ? item.topNotes.slice(0, 4).join(', ') : 'Cítricos y notas frescas';
            const heartStr = item.heartNotes.length ? item.heartNotes.slice(0, 4).join(', ') : 'Acordes florales y especias';
            const baseStr = item.baseNotes.length ? item.baseNotes.slice(0, 4).join(', ') : 'Maderas nobles y ámbar';

            return `
            <div class="card">
              <div>
                <div class="card-header">
                  <div class="kodigo-box">
                    <span class="kodigo-number">#${item.rawSku}</span>
                    <span class="kodigo-title">${item.kodigo}</span>
                  </div>
                  <span class="gender-pill ${genderClass}">${item.gender}</span>
                </div>

                <div class="inspiration-container">
                  <div class="inspiration-label">Inspiración Olfativa</div>
                  <div class="inspiration-title">${item.original}</div>
                </div>

                <div class="family-badge">
                  <strong>Familia:</strong> ${item.family}
                </div>

                <div class="notes-box">
                  <div class="notes-line"><span class="notes-tag">Salida:</span> <span class="notes-val">${topStr}</span></div>
                  <div class="notes-line"><span class="notes-tag">Corazón:</span> <span class="notes-val">${heartStr}</span></div>
                  <div class="notes-line"><span class="notes-tag">Fondo:</span> <span class="notes-val">${baseStr}</span></div>
                </div>
              </div>

              <div class="description-box">
                ${item.description}
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="page-footer">
        <div class="footer-left">KODE • Perfumería Fina de Alta Fijación • Sitio Web Oficial</div>
        <div class="footer-right">Página ${currentPageNum} de ${totalPages}</div>
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

  // Generar PDF usando headless Chrome sin encabezados predeterminados del navegador
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  console.log('Running Chrome to generate PDF...');
  execSync(cmd, { stdio: 'inherit' });

  const stats = fs.statSync(pdfPath);
  const sizeMb = stats.size / (1024 * 1024);
  console.log(`PDF successfully created at: ${pdfPath}`);
  console.log(`File size: ${sizeMb.toFixed(2)} MB (${stats.size} bytes)`);

  // Limpiar HTML temporal
  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }
}

generateCatalogPdf().catch(console.error);
