import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { getInspiracionPerfumeName } from '../src/lib/perfumeNames';
import { getFragranceProfile } from '../src/lib/fragranceProfiles';
import { getFragranceDescription } from '../src/lib/fragranceDescriptions';

const prisma = new PrismaClient();

async function generateMinimalistCatalog() {
  const allFragrances = await prisma.product.findMany({
    where: {
      category: { name: 'Esencias para Perfume' }
    }
  });

  const BEST_SELLER_ORDER = [
    '49', // Sauvage Elixir (Primero)
    '1',  // Sauvage
    '2',  // Bleu
    '3',  // Acqua Di Gio
    '4',  // Club De Nuit Intense
    '5',  // Aventus
    '6',  // La Vie Est Belle
    '8',  // Eros
    '10', // Santal 33
    '60', // Baccarat Rouge 540
    '58', // Good Girl
    '12', // Erba Pura
    '13', // Coco Mademoiselle
    '43', // Black Opium
    '20', // One Million
    '16', // Invictus
    '23', // 9PM
    '28', // Bad Boy
    '52', // Le Male Elixir
    '11', // Born in Roma Intense
    '32', // Born In Roma Donna
    '50', // Born in Roma Uomo
    '53', // Stronger With You
    '61', // Fahrenheit
    '18', // 212 VIP Rosé
    '34', // 212 VIP
    '54', // 212 Men
    '7',  // Odyssey Mandarin Sky
    '9',  // L'Eau d'Issey
    '14', // Light Blue
    '15', // Boss Bottled
    '17', // Burberry Her
    '19', // Polo Blue
    '21', // Coco
    '22', // Chance
    '24', // Le Male
    '25', // J'adore
    '26', // Tommy
    '27', // Chanel N° 5
    '29', // Be Delicious
    '30', // Lost Cherry
    '31', // Scandal
    '33', // L'Immensité
    '35', // Swiss Army
    '36', // Blanc L.12.12
    '37', // Acqua Di Gio F
    '38', // Polo Black
    '39', // Ralph
    '40', // Yara
    '41', // Yara Tous
    '42', // Flowerbomb
    '44', // Homme Sport
    '45', // CK One
    '46', // 360 Red
    '47', // Green Tea
    '48', // Vera Wang Princess
    '51', // Acqua Di Gio Profondo
    '55', // Man In Black
    '56', // Acqua Di Gio Profumo
    '57', // La Bomba
    '59'  // Toy Boy
  ];

  allFragrances.sort((a, b) => {
    const idxA = BEST_SELLER_ORDER.indexOf(a.sku);
    const idxB = BEST_SELLER_ORDER.indexOf(b.sku);
    const orderA = idxA === -1 ? 999 : idxA;
    const orderB = idxB === -1 ? 999 : idxB;
    return orderA - orderB;
  });

  const items = allFragrances.map(p => {
    const prof = getFragranceProfile(p as any);
    const desc = getFragranceDescription(p as any, prof);
    let insp = getInspiracionPerfumeName(p);

    let cleanOriginal = insp.replace(/\s+[HFMU]$/, '').trim();
    if (cleanOriginal.toLowerCase() === 'la vida es bella') cleanOriginal = 'La Vie Est Belle';
    if (cleanOriginal === 'CHNL° 5' || cleanOriginal === 'N° 5') cleanOriginal = 'Chanel N° 5';
    if (cleanOriginal === 'Donna') cleanOriginal = 'Born In Roma Donna';
    if (cleanOriginal.includes('La Bomba')) cleanOriginal = 'La Bomba (Carolina Herrera)';
    if (cleanOriginal === 'Princess') cleanOriginal = 'Vera Wang Princess';
    if (cleanOriginal === 'Good Girl M' || cleanOriginal === 'Good Girl') cleanOriginal = 'Good Girl';

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

    return {
      rawSku: p.sku,
      sku: p.sku.padStart(2, '0'),
      originalName: cleanOriginal,
      gender: p.gender || 'Unisex',
      family: family,
      topNotes: prof?.topNotes || [],
      heartNotes: prof?.heartNotes || [],
      baseNotes: prof?.baseNotes || [],
      description: cleanDesc
    };
  });

  console.log(`Total fragrances to render: ${items.length}`);

  // Base64 de la botella KODE
  const bottlePath = path.join(__dirname, '../public/images/kode_bottle_card.jpg');
  const bottleBase64 = fs.readFileSync(bottlePath).toString('base64');
  const bottleUri = `data:image/jpeg;base64,${bottleBase64}`;

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
  <title>KÖDE • Catálogo Oficial de Fragancias</title>
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

    /* Grid de tarjetas para páginas 1 a 7 */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 8px;
      flex: 1;
    }

    /* Grid de la última página (3 filas exactas y balanceadas) */
    .grid-last {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: calc((297mm - 21mm - 55px) / 4);
      gap: 8px;
    }

    /* Tarjeta de Producto */
    .product-card {
      border: 1px solid #000000;
      padding: 7px 9px;
      display: flex;
      gap: 9px;
      background-color: #ffffff;
      align-items: stretch;
      min-height: 0;
    }

    .bottle-col {
      width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #fafafa;
      border: 1px solid #f4f4f5;
    }

    .bottle-img {
      max-width: 42px;
      max-height: 85px;
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

    .kodigo-badge {
      background-color: #000000;
      color: #ffffff;
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 1.2px;
      padding: 1.5px 6px;
      text-transform: uppercase;
    }

    .gender-tag {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #000000;
      border: 1px solid #000000;
      padding: 1px 5px;
    }

    .perfume-name {
      font-size: 10.5px;
      font-weight: 900;
      color: #000000;
      letter-spacing: -0.2px;
      line-height: 1.15;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inspiration-prefix {
      font-size: 8.5px;
      font-weight: 700;
      color: #52525b;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      margin-right: 3px;
    }

    .family-tag {
      font-size: 7.5px;
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

    /* Caja especial de cierre para el 6to espacio de la página 8 */
    .brand-closing-card {
      border: 1px dashed #000000;
      padding: 12px;
      background: #fafafa;
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
      letter-spacing: 4px;
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
      font-size: 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #000000;
      font-weight: 700;
    }
  </style>
</head>
<body>

  ${pages.map((pageItems, pageIdx) => {
    const pageNum = pageIdx + 1;
    const isLastPage = pageNum === pages.length;

    return `
    <div class="catalog-page">
      <div>
        <div class="page-header">
          <div class="brand-section">
            <span class="brand-logo">K O D E</span>
            <span class="brand-tagline">Colección Oficial de Fragancias</span>
          </div>
          <div class="header-status">61 Fragancias Oficiales</div>
        </div>

        <div class="${isLastPage ? 'grid-last' : 'grid'}">
          ${pageItems.map(item => {
            const hasNotes = item.topNotes.length > 0 || item.heartNotes.length > 0 || item.baseNotes.length > 0;
            return `
            <div class="product-card">
              <div class="bottle-col">
                <img src="${bottleUri}" class="bottle-img" alt="KÖDE" />
              </div>
              <div class="info-col">
                <div>
                  <div class="card-top">
                    <span class="kodigo-badge">KÓDIGO #${item.rawSku}</span>
                    <span class="gender-tag">${item.gender}</span>
                  </div>
                  <div class="perfume-name"><span class="inspiration-prefix">Inspiración:</span>${item.originalName}</div>
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

          ${isLastPage ? `
            <div class="brand-closing-card">
              <div class="title">K O D E</div>
              <div class="desc">
                Concentrado de perfumería fina europea. Formulación de alta fijación y proyección duradera.
              </div>
              <div style="font-size: 8px; font-weight: 800; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase;">
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

  // Copiar a Downloads y a artifact
  const downloadsPath = '/Users/luis/Downloads/catalogo-kode.pdf';
  fs.copyFileSync(pdfPath, downloadsPath);
  console.log('Copied to', downloadsPath);

  const artifactPath = '/Users/luis/.gemini/antigravity/brain/df42a998-2501-42cc-9c0f-81717543349b/catalogo-kode.pdf';
  fs.copyFileSync(pdfPath, artifactPath);

  await prisma.$disconnect();
}

generateMinimalistCatalog().catch(console.error);
