import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '../src/lib/prisma';
import { INITIAL_PRODUCTS, ProductItem } from '../src/lib/store';
import { getInspiracionPerfumeName } from '../src/lib/perfumeNames';
import { isHalloweenPromoProduct, HALLOWEEN_PROMO_PRICE_1OZ } from '../src/lib/halloweenPromo';

const OUT_DIR = path.join(process.cwd(), 'public', 'images', 'meta');

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function createStarburstPoints(
  cx: number,
  cy: number,
  numPoints: number,
  outerR: number,
  innerR: number
): string {
  const pts: string[] = [];
  const totalVertices = numPoints * 2;
  for (let i = 0; i < totalVertices; i++) {
    const angle = (Math.PI * 2 * i) / totalVertices - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function layoutLabelText(name: string) {
  const clean = escapeXml(
    (name || 'ESENCIA')
      .replace(/\s+[HFMU]$/i, '')
      .toUpperCase()
      .trim()
  );
  const words = clean.split(/\s+/);

  let lines = [clean];
  if (words.length >= 2 && clean.length > 10) {
    if (words.length === 2) {
      lines = [words[0], words[1]];
    } else {
      let bestDiff = Infinity;
      let bestIdx = 1;
      for (let i = 1; i < words.length; i++) {
        const l1 = words.slice(0, i).join(' ');
        const l2 = words.slice(i).join(' ');
        const diff = Math.abs(l1.length - l2.length);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i;
        }
      }
      lines = [words.slice(0, bestIdx).join(' '), words.slice(bestIdx).join(' ')];
    }
  }

  const maxLineLen = Math.max(...lines.map((l) => l.length));
  let fontSize = 29;
  let underlineW = 105;

  if (lines.length === 1) {
    if (maxLineLen > 13) fontSize = 21;
    else if (maxLineLen > 10) fontSize = 23.5;
    else if (maxLineLen > 7) fontSize = 26.5;
    else fontSize = 30;
    underlineW = Math.min(182, Math.max(82, Math.round(maxLineLen * (fontSize * 0.56))));
  } else {
    if (maxLineLen > 12) fontSize = 20;
    else if (maxLineLen > 9) fontSize = 22.5;
    else fontSize = 24.5;
    underlineW = Math.min(182, Math.max(85, Math.round(maxLineLen * (fontSize * 0.52))));
  }

  return { lines, fontSize, underlineW };
}

export function createBottleLabelSvg(contratipo: string): Buffer {
  const { lines, fontSize, underlineW } = layoutLabelText(contratipo);

  let textSvg = '';
  let underlineY = 627;

  if (lines.length === 1) {
    textSvg = `<text x="384" y="613" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="middle" fill="#0F0F12" letter-spacing="0.8">${lines[0]}</text>`;
    underlineY = 627;
  } else {
    textSvg = `
      <text x="384" y="596" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="middle" fill="#0F0F12" letter-spacing="0.8">${lines[0]}</text>
      <text x="384" y="623" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" text-anchor="middle" fill="#0F0F12" letter-spacing="0.8">${lines[1]}</text>
    `;
    underlineY = 635;
  }

  return Buffer.from(`
    <svg width="768" height="1024" xmlns="http://www.w3.org/2000/svg">
      ${textSvg}
      <rect x="${384 - underlineW / 2}" y="${underlineY}" width="${underlineW}" height="3" fill="#0F0F12" />
    </svg>
  `);
}

export function resolveCleanOriginalPerfumeName(p: {
  sku?: string;
  name?: string;
  officialName?: string;
}): string {
  const skuStr = String(p.sku || '').trim();
  const customOverrides: Record<string, string> = {
    '2': 'BLEU DE CHANEL',
    '3': 'ACQUA DI GIÒ',
    '6': 'LA VIDA ES BELLA',
    '9': "L'EAU D'ISSEY",
    '15': 'HUGO BOSS BOTTLED',
    '19': 'POLO BLUE',
    '21': 'COCO CHANEL',
    '22': 'CHANEL CHANCE',
    '26': 'TOMMY HILFIGER',
    '27': 'CHANEL N° 5',
    '32': 'BORN IN ROMA DONNA',
    '37': 'ACQUA DI GIÒ DAMA',
    '38': 'POLO BLACK',
    '39': 'RALPH LAUREN',
    '44': 'DIOR HOMME SPORT',
    '48': 'VERA WANG PRINCESS',
    '51': 'ACQUA DI GIÒ PROFONDO',
    '56': 'ACQUA DI GIÒ PROFUMO',
    '57': 'LA BOMBA',
    '58': 'GOOD GIRL',
    '68': 'TOMMY GIRL',
    '75': "L'EAU SUPER MAJEURE",
    '76': 'MONTBLANC LEGEND',
    '79': 'POLO SPORT',
  };

  if (customOverrides[skuStr]) {
    return customOverrides[skuStr];
  }

  const raw = getInspiracionPerfumeName(p as any) || p.name || '';
  return raw
    .replace(/\s+[HFMU]$/i, '')
    .replace(/\s+M\s+F$/i, '')
    .replace(/\bCHNL°\s*5\b/gi, 'CHANEL N° 5')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toUpperCase();
}

export function createCatalogOverlaySvg(opts: {
  priceStr: string;
  unitLabel: string;
  ribbonSmall: string;
  ribbonLarge: string;
}): Buffer {
  const cx = 842;
  const cy = 152;
  const outerStar = createStarburstPoints(cx, cy, 20, 114, 94);
  const innerStar = createStarburstPoints(cx, cy, 20, 106, 87);

  const cleanLarge = escapeXml(opts.ribbonLarge.toUpperCase().trim());
  const cleanSmall = escapeXml(opts.ribbonSmall.toUpperCase().trim());
  const len = cleanLarge.length;

  let largeFontSize = 54;
  if (len > 26) largeFontSize = 33;
  else if (len > 22) largeFontSize = 38;
  else if (len > 18) largeFontSize = 43;
  else if (len > 14) largeFontSize = 48;

  const priceFontSize = opts.priceStr.length >= 6 ? 38 : 44;

  return Buffer.from(`
    <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6D28D9" />
          <stop offset="50%" stop-color="#5B21B6" />
          <stop offset="100%" stop-color="#4C1D95" />
        </linearGradient>
        <linearGradient id="greenStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#22C55E" />
          <stop offset="100%" stop-color="#15803D" />
        </linearGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.24" />
        </filter>
      </defs>

      <!-- Pelotita estrellada verde de precio en esquina superior derecha -->
      <g filter="url(#dropShadow)">
        <polygon points="${outerStar}" fill="#FFFFFF" />
        <polygon points="${innerStar}" fill="url(#greenStarGrad)" />
      </g>
      <text x="${cx}" y="${cy + 5}" font-family="Arial, Helvetica, sans-serif" font-size="${priceFontSize}" font-weight="900" text-anchor="middle" fill="#FFFFFF" letter-spacing="-0.5">${escapeXml(opts.priceStr)}</text>
      <text x="${cx}" y="${cy + 34}" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="800" text-anchor="middle" fill="#DCFCE7" letter-spacing="1.5">${escapeXml(opts.unitLabel)}</text>

      <!-- Cinta morada inferior -->
      <rect x="0" y="842" width="1000" height="158" fill="url(#purpleGrad)" />
      <rect x="0" y="842" width="1000" height="5" fill="#A78BFA" />
      <text x="500" y="888" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" text-anchor="middle" fill="#DDD6FE" letter-spacing="4">${cleanSmall}</text>
      <text x="500" y="954" font-family="Arial, Helvetica, sans-serif" font-size="${largeFontSize}" font-weight="900" text-anchor="middle" fill="#FFFFFF" letter-spacing="1.2">${cleanLarge}</text>
    </svg>
  `);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const dbProducts = await prisma.product.findMany({
    include: { category: true },
  });
  const initMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));

  const allProducts: ProductItem[] =
    dbProducts.length > 0
      ? dbProducts
          .filter(
            (p) =>
              p.id !== 'ENVIO-DOM' &&
              p.id !== 'cmvfrqz7v0003jp08y8bmrnpz' &&
              String(p.name || '').trim().toLowerCase() !== '$1 alcohol'
          )
          .map((p) => {
            const init = initMap.get(p.id);
            return {
              id: p.id,
              sku: p.sku || init?.sku || '',
              barcode: p.barcode || init?.barcode || '',
              name: p.name,
              officialName: p.officialName || init?.officialName || '',
              brand: p.brand || init?.brand || '',
              gender: (p.gender as any) || init?.gender || 'Unisex',
              category: p.category?.name || init?.category || 'Esencias para Perfume',
              unit: p.unit || init?.unit || 'Onza',
              cost: Number(p.cost || 0),
              price: Number(p.price ?? init?.price ?? 3.75),
              priceHalfOunce:
                p.priceHalfOunce != null ? Number(p.priceHalfOunce) : init?.priceHalfOunce,
              stock: Number(p.stock ?? 0),
              stockHalf: Number(p.stockHalf ?? 0),
              minStock: Number(p.minStock ?? 15),
              imageUrl: p.imageUrl || init?.imageUrl || '',
              description: p.description || init?.description || '',
              isAvailableOnline: p.isAvailableOnline !== false,
            };
          })
      : INITIAL_PRODUCTS.filter((p) => p.id !== 'ENVIO-DOM');

  const blankBottlePath = path.join(
    process.cwd(),
    'public',
    'images',
    'essence_bottle_blank.webp'
  );

  // 1. Renderizar "arma-tu-perfume-100ml.jpg"
  {
    const heroBottleSrc = path.join(
      process.cwd(),
      'public',
      'images',
      'botes',
      'bote_100ml_degrade_azul_noche.jpg'
    );
    const fallbackSrc = fs.existsSync(heroBottleSrc)
      ? heroBottleSrc
      : path.join(process.cwd(), 'public', 'images', 'botes', 'bote_100ml_rey_luis.jpg');
    const resizedProd = await sharp(fallbackSrc)
      .resize(740, 810, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .toBuffer();

    const overlaySvg = createCatalogOverlaySvg({
      priceStr: '$11.00',
      unitLabel: '100 ML',
      ribbonSmall: 'ARMA TU PERFUME 100ML',
      ribbonLarge: '+80 AROMAS A ELEGIR',
    });

    await sharp({
      create: {
        width: 1000,
        height: 1000,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        { input: resizedProd, top: 18, left: 130 },
        { input: overlaySvg, top: 0, left: 0 },
      ])
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(path.join(OUT_DIR, 'arma-tu-perfume-100ml.jpg'));
  }

  let count = 1;
  for (const p of allProducts) {
    const isEssence = p.category === 'Esencias para Perfume';
    const isBottle = p.category === 'Botes' || p.category === 'Botes & Envases';
    const outPath = path.join(OUT_DIR, `${p.id}.jpg`);

    if (isEssence) {
      const labelTitle = p.officialName || p.name || 'AROMANIAK';
      const labelSvg = createBottleLabelSvg(labelTitle);
      const labeledBottle = await sharp(blankBottlePath)
        .composite([{ input: labelSvg, top: 0, left: 0 }])
        .toBuffer();

      const croppedBottle = await sharp(labeledBottle)
        .extract({ left: 0, top: 60, width: 768, height: 910 })
        .resize(710, 842, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
        .toBuffer();

      const isPromo = isHalloweenPromoProduct(p);
      const activePrice = isPromo ? HALLOWEEN_PROMO_PRICE_1OZ : Number(p.price || 3.75);
      const originalPerfume = resolveCleanOriginalPerfumeName(p);

      const overlaySvg = createCatalogOverlaySvg({
        priceStr: `$${activePrice.toFixed(2)}`,
        unitLabel: '1 ONZA',
        ribbonSmall: 'INSPIRADO EN',
        ribbonLarge: originalPerfume,
      });

      await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite([
          { input: croppedBottle, top: 0, left: 145 },
          { input: overlaySvg, top: 0, left: 0 },
        ])
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(outPath);
    } else if (isBottle) {
      const init = initMap.get(p.id);
      const rawImgPath = (p.imageUrl || init?.imageUrl || '/images/botes/bote_100ml_degrade_azul_noche.jpg')
        .split('?')[0]
        .replace(/^\//, '');
      const fullImgPath = path.join(process.cwd(), 'public', rawImgPath);
      const srcPath = fs.existsSync(fullImgPath)
        ? fullImgPath
        : path.join(process.cwd(), 'public', 'images', 'botes', 'bote_100ml_degrade_azul_noche.jpg');

      const resizedBottle = await sharp(srcPath)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .resize(740, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
        .toBuffer();

      const rawBottleName = (p.officialName || p.name || 'Frasco 100ml')
        .replace(/\b100\s*m(l)?\b/gi, '')
        .replace(/\bRosca\b/gi, '')
        .replace(/\bBote\s+de\s+Vidrio\b/gi, 'Bote')
        .replace(/\s{2,}/g, ' ')
        .trim();
      const bottleDisplay = rawBottleName.toUpperCase().startsWith('BOTE')
        ? rawBottleName.toUpperCase()
        : `BOTE ${rawBottleName.toUpperCase()}`;

      const overlaySvg = createCatalogOverlaySvg({
        priceStr: `$${Number(p.price || 1.45).toFixed(2)}`,
        unitLabel: 'UNIDAD',
        ribbonSmall: 'FRASCO DE CRISTAL 100ML',
        ribbonLarge: bottleDisplay,
      });

      await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite([
          { input: resizedBottle, top: 20, left: 130 },
          { input: overlaySvg, top: 0, left: 0 },
        ])
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(outPath);
    } else {
      const init = initMap.get(p.id);
      const rawImgPath = (p.imageUrl || init?.imageUrl || '/images/logo.png')
        .split('?')[0]
        .replace(/^\//, '');
      const fullImgPath = path.join(process.cwd(), 'public', rawImgPath);
      const srcPath = fs.existsSync(fullImgPath)
        ? fullImgPath
        : path.join(process.cwd(), 'public', 'logo.png');

      const resizedSupply = await sharp(srcPath)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .resize(720, 780, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
        .toBuffer();

      const unitLabel =
        p.id === 'alcohol-perfumero-fijador-1l'
          ? '1 LITRO'
          : p.id === 'alcohol-perfumero-fijador-medio-litro'
          ? '½ LITRO'
          : 'UNIDAD';

      const supplyTitle =
        p.id === 'alcohol-perfumero-fijador-1l'
          ? 'ALCOHOL CON FIJADOR 1L'
          : p.id === 'alcohol-perfumero-fijador-medio-litro'
          ? 'ALCOHOL CON FIJADOR ½L'
          : (p.officialName || p.name).toUpperCase();

      const overlaySvg = createCatalogOverlaySvg({
        priceStr: `$${Number(p.price || 1.0).toFixed(2)}`,
        unitLabel,
        ribbonSmall: 'INSUMO DE PERFUMERÍA',
        ribbonLarge: supplyTitle,
      });

      await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite([
          { input: resizedSupply, top: 30, left: 140 },
          { input: overlaySvg, top: 0, left: 0 },
        ])
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(outPath);
    }

    count++;
  }

  console.log(`Successfully rendered ${count} Meta Catalog 1000x1000 images!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
