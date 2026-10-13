import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { getInspiracionPerfumeName } from '../src/lib/perfumeNames';
import { getFragranceProfile } from '../src/lib/fragranceProfiles';
import { getFragranceDescription } from '../src/lib/fragranceDescriptions';

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

  const BEST_SELLER_ORDER = [
    '49', // Sauvage Elixir (FIERA ELIXIR)
    '1',  // Sauvage (FIERA)
    '2',  // Bleu (MARINO)
    '3',  // Acqua Di Gio (DAVID OCEAN)
    '4',  // Club De Nuit Intense (VIDEOCLUB)
    '5',  // Aventus (EXPLORADOR)
    '6',  // La Vie Est Belle (ELLA ES LINDA)
    '8',  // Eros (ATREVIDO)
    '10', // Santal 33 (NICHO Y PAPIRO)
    '60', // Baccarat Rouge 540 (CRISTAL ROUGE)
    '58', // Good Girl (FEMME FATALE)
    '12', // Erba Pura (HIEDRAFRAIS)
    '13', // Coco Mademoiselle (PINK LADY)
    '43', // Black Opium (AROMA ADDICT)
    '20', // One Million (RICHRICH)
    '16', // Invictus (KICKBOX)
    '23', // 9PM (HABIBI)
    '28', // Bad Boy (IRRESISTIBLE)
    '52', // Le Male Elixir (THE MAN ELIXIR)
    '11', // Born in Roma Intense (EUROBOY INTENSE)
    '32', // Born In Roma Donna (EURO GIRL)
    '50', // Born in Roma Uomo (EUROBOY)
    '53', // Stronger With You (ALWAYS WITH YOU)
    '61', // Fahrenheit (KELVIN)
    '18', // 212 VIP Rosé (MANEATER)
    '34', // 212 VIP (WIFE MATERIAL)
    '54', // 212 Men (MANHATTAN)
    '7',  // Odyssey Mandarin Sky (CITRIC HEAVEN)
    '9',  // L'Eau d'Issey (NIPPON)
    '14', // Light Blue (OCEAN LORD)
    '15', // Boss Bottled (WALLSTREET WOLF)
    '17', // Burberry Her (EURO HEIRESS)
    '19', // Polo Blue (ELITE)
    '21', // Coco (LADY MONEY)
    '22', // Chance (NEW YORK LADY)
    '24', // Le Male (THE MAN)
    '25', // J'adore (MAGNOLIA)
    '26', // Tommy (AMERICAN BOY)
    '27', // Chanel N° 5 (OBERLIN)
    '29', // Be Delicious (CHARLI APPLE)
    '30', // Lost Cherry (MON CHERRY)
    '31', // Scandal (PARTYBOY)
    '33', // L'Immensité (KING LUIS)
    '35', // Swiss Army (EURO SAMURAI)
    '36', // Blanc L.12.12 (BASIC WHITE)
    '37', // Acqua Di Gio F (GEORGIA ICON)
    '38', // Polo Black (NIGHT SKY)
    '39', // Ralph (COWBOY GIRL)
    '40', // Yara (DUBAI)
    '41', // Yara Tous (BURJ KHALIFA)
    '42', // Flowerbomb (ATOMIC FLOWER)
    '44', // Homme Sport (EMPERADOR)
    '45', // CK One (CLASSIC MAN)
    '46', // 360 Red (ENGLAND PHONE)
    '47', // Green Tea (ENGLAND FOREST)
    '48', // Vera Wang Princess (ROMANOV)
    '51', // Acqua Di Gio Profondo (DEEP OCEAN)
    '55', // Man In Black (BLACK VOLCANO)
    '56', // Acqua Di Gio Profumo (BLACK OCEAN)
    '57', // La Bomba (SWEET BOMB)
    '59'  // Toy Boy (BLACK BEAR)
  ];

  allFragrances.sort((a, b) => {
    const idxA = BEST_SELLER_ORDER.indexOf(a.sku);
    const idxB = BEST_SELLER_ORDER.indexOf(b.sku);
    const orderA = idxA === -1 ? 999 : idxA;
    const orderB = idxB === -1 ? 999 : idxB;
    return orderA - orderB;
  });

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
    const ap = apaesaMap[p.sku] || {} as any;
    const prof = getFragranceProfile(p as any);
    const desc = getFragranceDescription(p as any, prof);
    let insp = getInspiracionPerfumeName(p);

    let cleanOriginal = insp.replace(/\s+[HFMU]$/, '').trim();
    if (cleanOriginal.toLowerCase() === 'la vida es bella') cleanOriginal = 'La Vie Est Belle';
    if (cleanOriginal === 'CHNL° 5' || cleanOriginal === 'N° 5') cleanOriginal = 'Chanel N° 5';
    if (cleanOriginal === 'Donna') cleanOriginal = 'Born In Roma Donna';
    if (cleanOriginal.includes('La Bomba')) cleanOriginal = 'La Bomba';
    if (cleanOriginal === 'Princess') cleanOriginal = 'Vera Wang Princess';
    if (cleanOriginal === 'Good Girl M' || cleanOriginal === 'Good Girl') cleanOriginal = 'Good Girl';

    const contratipoName = ap.contratipo || p.officialName?.replace(/\s+[HFMU]$/, '') || cleanOriginal;
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

    // Convertir y cachear thumbnail JPEG optimizado (350px alto, ~10KB)
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
      gender: p.gender || 'Unisex',
      family: family,
      topNotes: prof?.topNotes || [],
      heartNotes: prof?.heartNotes || [],
      baseNotes: prof?.baseNotes || [],
      description: cleanDesc,
      bottleUri
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
      color: #0f172a;
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

    /* Header Temática Aromaniak (Lujo Ámbar / Oro / Carbón) */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 2px solid #d97706;
      margin-bottom: 8px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-img {
      height: 28px;
      object-fit: contain;
    }

    .brand-taglines {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #0f172a;
    }

    .brand-sub {
      font-size: 7.5px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #b45309;
      font-weight: 700;
    }

    .header-status-badge {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #d97706;
      padding: 4px 10px;
      border-radius: 6px;
      text-align: right;
    }

    .header-status-title {
      font-size: 8.5px;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 900;
      color: #92400e;
    }

    .header-status-sub {
      font-size: 7px;
      color: #78350f;
      font-weight: 600;
      letter-spacing: 0.5px;
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
      grid-auto-rows: calc((297mm - 21mm - 60px) / 4);
      gap: 8px;
    }

    /* Tarjeta de Producto Aromaniak */
    .product-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 9px;
      display: flex;
      gap: 9px;
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      align-items: stretch;
      min-height: 0;
      position: relative;
    }

    .product-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 3px;
      height: 100%;
      background: linear-gradient(180deg, #d97706 0%, #b45309 100%);
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
    }

    .bottle-col {
      width: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #fafafa;
      border-radius: 4px;
      border: 1px solid #f1f5f9;
      padding: 2px;
    }

    .bottle-img {
      max-width: 48px;
      max-height: 88px;
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
      background-color: #0f172a;
      color: #fef3c7;
      font-size: 7.8px;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 1.5px 6px;
      border-radius: 3px;
      border: 1px solid #d97706;
      text-transform: uppercase;
    }

    .gender-tag {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 3px;
    }

    .gender-caballero {
      color: #1e3a8a;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .gender-dama {
      color: #831843;
      background: #fdf2f8;
      border: 1px solid #fbcfe8;
    }

    .gender-unisex {
      color: #78350f;
      background: #fef3c7;
      border: 1px solid #fde68a;
    }

    .contratipo-name {
      font-size: 11.5px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.2px;
      line-height: 1.15;
      margin-bottom: 1px;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inspiration-line {
      font-size: 8px;
      color: #475569;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inspiration-line strong {
      color: #b45309;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 7.5px;
      letter-spacing: 0.5px;
    }

    .family-tag {
      font-size: 7.2px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .notes-box {
      font-size: 7.6px;
      color: #334155;
      line-height: 1.28;
      margin-bottom: 2px;
      border-left: 2px solid #d97706;
      padding-left: 5px;
    }

    .notes-box strong {
      font-weight: 800;
      color: #0f172a;
    }

    .description-text {
      font-size: 7.6px;
      color: #64748b;
      line-height: 1.3;
    }

    /* Caja especial de cierre Aromaniak */
    .brand-closing-card {
      border: 1.5px dashed #d97706;
      border-radius: 6px;
      padding: 12px;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 5px;
    }

    .brand-closing-card .title {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #92400e;
    }

    .brand-closing-card .desc {
      font-size: 8px;
      color: #78350f;
      line-height: 1.4;
      max-width: 90%;
      font-weight: 500;
    }

    .brand-closing-card .contact-info {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 1px;
      margin-top: 3px;
      text-transform: uppercase;
      color: #b45309;
    }

    /* Footer Temático Aromaniak */
    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      font-size: 7.8px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }

    .page-footer strong {
      color: #b45309;
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
            <img src="${logoUri}" class="brand-logo-img" alt="Aromaniak" />
            <div class="brand-taglines">
              <span class="brand-title">AROMANIAK SV</span>
              <span class="brand-sub">Esencias Calidad AAA+ • Perfumería Fina</span>
            </div>
          </div>
          <div class="header-status-badge">
            <div class="header-status-title">61 Contratipos Oficiales</div>
            <div class="header-status-sub">Disponibilidad Inmediata en Tienda</div>
          </div>
        </div>

        <div class="${isLastPage ? 'grid-last' : 'grid'}">
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
                    <span class="gender-tag ${genderClass}">${item.gender}</span>
                  </div>
                  <div class="contratipo-name">${item.contratipo}</div>
                  <div class="inspiration-line">
                    <strong>Inspiración:</strong> ${item.originalName} ${item.brand ? `• ${item.brand}` : ''}
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

          ${isLastPage ? `
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
        <div><strong>AROMANIAK SV</strong> • Perfumería Fina & Esencias de Alta Gama • www.aromaniaksv.com</div>
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

  const artifactPath = '/Users/luis/.gemini/antigravity/brain/df42a998-2501-42cc-9c0f-81717543349b/catalogo-aromaniak.pdf';
  fs.copyFileSync(pdfPath, artifactPath);

  await prisma.$disconnect();
}

generateAromaniakCatalog().catch(console.error);
