const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const namesFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'perfumeNames.ts'), 'utf8');
const mapMatch = namesFile.match(/export const ORIGINAL_PERFUME_MAP: Record<string, string> = \{([\s\S]*?)\};/);
const originalMap = eval('({' + mapMatch[1] + '})');

const storeFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'store.ts'), 'utf8');
const prodsMatch = storeFile.match(/INITIAL_PRODUCTS: ProductItem\[\] = \[([\s\S]*?)\];/);
const items = eval('[' + prodsMatch[1] + ']').filter(p => p.category === 'Esencias para Perfume');

function escapeXml(unsafe) {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '\"': return '&quot;';
      default: return c;
    }
  });
}

function createBottleLabelSvg(contratipo, originalPerfume, genderCode, size = '1 OZ') {
  const labelW = 304;
  const labelH = 368;
  const cleanContra = escapeXml((contratipo || 'ESENCIA').toUpperCase());
  const cleanOrig = escapeXml((originalPerfume || '').toUpperCase());
  const genderTag = genderCode ? ' • (' + genderCode + ')' : '';
  const sideText = cleanOrig ? cleanOrig + genderTag : '';

  let contraFontSize = 24;
  let underlineW = 100;
  if (cleanContra.length > 12) {
    contraFontSize = 17;
    underlineW = 140;
  } else if (cleanContra.length > 8) {
    contraFontSize = 20;
    underlineW = 120;
  }

  let sideFontSize = 14;
  if (sideText.length > 22) {
    sideFontSize = 10.5;
  } else if (sideText.length > 15) {
    sideFontSize = 12;
  }

  return `
  <svg width="${labelW}" height="${labelH}" viewBox="0 0 ${labelW} ${labelH}" xmlns="http://www.w3.org/2000/svg">
    <path d="M 0,0 L ${labelW},0 L ${labelW},${labelH - 8} Q ${labelW / 2},${labelH + 6} 0,${labelH - 8} Z" fill="#ffffff" />
    <line x1="0" y1="6" x2="${labelW}" y2="6" stroke="#111111" stroke-width="3.5" />
    <line x1="0" y1="14" x2="${labelW}" y2="14" stroke="#111111" stroke-width="1.8" />
    <path d="M 0,${labelH - 18} Q ${labelW / 2},${labelH - 4} ${labelW},${labelH - 18}" fill="none" stroke="#111111" stroke-width="1.8" />
    <path d="M 0,${labelH - 10} Q ${labelW / 2},${labelH + 4} ${labelW},${labelH - 10}" fill="none" stroke="#111111" stroke-width="3.5" />
    <line x1="244" y1="14" x2="244" y2="${labelH - 18}" stroke="#111111" stroke-width="1.8" />
    <g transform="translate(260, 42) rotate(90)">
      <text x="0" y="0" font-family="Arial, Helvetica, sans-serif" font-size="8.5" font-weight="800" fill="#111111" letter-spacing="1.2">INSPIRADO EN:</text>
    </g>
    <g transform="translate(283, 42) rotate(90)">
      <text x="0" y="0" font-family="Arial, Helvetica, sans-serif" font-size="${sideFontSize}" font-weight="900" fill="#111111" letter-spacing="0.6">${sideText}</text>
    </g>
    <text x="122" y="96" font-family="Arial, Helvetica, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle" fill="#111111" letter-spacing="1.2">— ESENCIA CALIDAD AAA+ —</text>
    <text x="122" y="150" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-weight="800" text-anchor="middle" fill="#111111" letter-spacing="1.8">INSPIRACIÓN</text>
    <text x="122" y="196" font-family="Arial, Helvetica, sans-serif" font-size="${contraFontSize}" font-weight="900" text-anchor="middle" fill="#111111" letter-spacing="0.8">${cleanContra}</text>
    <rect x="${122 - (underlineW / 2)}" y="208" width="${underlineW}" height="2.5" fill="#111111" />
    <line x1="16" y1="258" x2="228" y2="258" stroke="#111111" stroke-width="1" />
    <text x="122" y="278" font-family="Arial, Helvetica, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle" fill="#111111" letter-spacing="0.5">ESENCIA DE PERFUMERÍA FINA EUROPEA</text>
    <text x="122" y="326" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="900" text-anchor="middle" fill="#111111" letter-spacing="1">${size}</text>
  </svg>
  `;
}

async function run() {
  const logoBuf = await sharp(path.join(__dirname, '..', 'public', 'images', 'aromaniak_black_logo.png'))
    .resize(140)
    .toBuffer();

  const outDir = path.join(__dirname, '..', 'public', 'images', 'esencias');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const blankBottlePath = path.join(__dirname, '..', 'public', 'images', 'essence_bottle_blank.webp');

  console.log('Regenerating ' + items.length + ' official essence bottle images without lote number...');
  for (const p of items) {
    const genderCode = p.gender === 'Caballero' ? 'H' : p.gender === 'Dama' ? 'M' : 'U';
    const original = originalMap[p.sku] || '';
    const contratipo = p.name || 'Esencia Pura';

    const svgStr = createBottleLabelSvg(contratipo, original, genderCode);
    const labelImg = await sharp(Buffer.from(svgStr))
      .composite([{ input: logoBuf, top: 26, left: Math.round((244 - 140) / 2) }])
      .png()
      .toBuffer();

    const finalBuffer = await sharp(blankBottlePath)
      .composite([{ input: labelImg, top: 412, left: 232 }])
      .webp({ quality: 90 })
      .toBuffer();

    fs.writeFileSync(path.join(outDir, 'esencia_' + p.sku + '.webp'), finalBuffer);
    fs.writeFileSync(path.join(outDir, p.id + '.webp'), finalBuffer);
  }
  console.log('Done! All 48 images updated successfully without lote.');
}
run();
