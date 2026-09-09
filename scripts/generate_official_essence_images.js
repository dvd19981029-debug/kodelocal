const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function createTextOverlay(contratipo) {
  const clean = escapeXml((contratipo || 'ESENCIA').toUpperCase().trim());

  let fontSize = 28;
  let underlineW = 140;

  if (clean.length > 13) {
    fontSize = 24;
    underlineW = 165;
  } else if (clean.length > 9) {
    fontSize = 26;
    underlineW = 150;
  } else if (clean.length <= 6) {
    fontSize = 32;
    underlineW = 110;
  } else {
    fontSize = 28;
    underlineW = 135;
  }

  const svg = `
  <svg width="768" height="1024" xmlns="http://www.w3.org/2000/svg">
    <text x="384" y="612" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${fontSize}" 
          font-weight="900" 
          text-anchor="middle" 
          fill="#111111" 
          letter-spacing="0.8">
      ${clean}
    </text>
    <rect x="${384 - (underlineW / 2)}" y="625" width="${underlineW}" height="3" fill="#111111" />
  </svg>
  `;
  return Buffer.from(svg);
}

async function run() {
  const outDir = path.join(__dirname, '..', 'public', 'images', 'esencias');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const blankBottlePath = path.join(__dirname, '..', 'public', 'images', 'essence_bottle_blank.webp');
  const blankBuffer = fs.readFileSync(blankBottlePath);

  console.log(`Regenerating ${items.length} official essence bottle images with the real white-cap bottle photo...`);
  
  for (const p of items) {
    const contratipo = p.name || p.officialName || 'Esencia Pura';
    const overlayBuffer = createTextOverlay(contratipo);

    const finalBuffer = await sharp(blankBuffer)
      .composite([{ input: overlayBuffer, top: 0, left: 0 }])
      .webp({ quality: 92 })
      .toBuffer();

    const skuPath = path.join(outDir, `esencia_${p.sku}.webp`);
    const idPath = path.join(outDir, `${p.id}.webp`);

    fs.writeFileSync(skuPath, finalBuffer);
    fs.writeFileSync(idPath, finalBuffer);
    console.log(`Generated: ${p.sku} -> ${contratipo}`);
  }

  console.log('Done! All official essence bottle images generated successfully.');
}

run().catch(console.error);

