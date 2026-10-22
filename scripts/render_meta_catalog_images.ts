import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '../src/lib/prisma';
import { INITIAL_PRODUCTS, ProductItem } from '../src/lib/store';
import { getInspiracionPerfumeName } from '../src/lib/perfumeNames';

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

/**
 * Genera un sello/escarapela estrellado suave y moderno (ondas redondeadas con curvas Bézier,
 * sin picos dentados bruscos) para el badge de precio en la esquina superior derecha.
 */
function createSmoothScallopSealPath(
  cx: number,
  cy: number,
  lobes: number,
  innerR: number,
  outerR: number
): string {
  const step = (Math.PI * 2) / lobes;
  let d = '';
  for (let i = 0; i < lobes; i++) {
    const a1 = i * step - Math.PI / 2;
    const aMid = (i + 0.5) * step - Math.PI / 2;
    const a2 = (i + 1) * step - Math.PI / 2;

    const x1 = cx + innerR * Math.cos(a1);
    const y1 = cy + innerR * Math.sin(a1);
    const xCtrl = cx + outerR * Math.cos(aMid);
    const yCtrl = cy + outerR * Math.sin(aMid);
    const x2 = cx + innerR * Math.cos(a2);
    const y2 = cy + innerR * Math.sin(a2);

    if (i === 0) {
      d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    }
    d += `Q ${xCtrl.toFixed(2)} ${yCtrl.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} `;
  }
  d += 'Z';
  return d;
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

const EXACT_ORIGINAL_WITH_BRAND: Record<string, string> = {
  '1': 'SAUVAGE DIOR',
  '2': 'BLEU DE CHANEL',
  '3': 'ACQUA DI GIÒ GIORGIO ARMANI',
  '4': 'CLUB DE NUIT INTENSE ARMAF',
  '5': 'AVENTUS CREED',
  '6': 'LA VIDA ES BELLA LANCÔME',
  '7': 'ODYSSEY MANDARIN SKY ARMAF',
  '8': 'EROS VERSACE',
  '9': "L'EAU D'ISSEY ISSEY MIYAKE",
  '10': 'SANTAL 33 LE LABO',
  '11': 'BORN IN ROMA INTENSE VALENTINO',
  '12': 'ERBA PURA XERJOFF',
  '13': 'COCO MADEMOISELLE CHANEL',
  '14': 'LIGHT BLUE DOLCE & GABBANA',
  '15': 'BOSS BOTTLED HUGO BOSS',
  '16': 'INVICTUS PACO RABANNE',
  '17': 'BURBERRY HER',
  '18': '212 VIP ROSÉ CAROLINA HERRERA',
  '19': 'POLO BLUE RALPH LAUREN',
  '20': 'ONE MILLION PACO RABANNE',
  '21': 'COCO CHANEL',
  '22': 'CHANCE CHANEL',
  '23': '9PM AFNAN',
  '24': 'LE MALE JEAN PAUL GAULTIER',
  '25': "J'ADORE DIOR",
  '26': 'TOMMY HILFIGER',
  '27': 'CHANEL N° 5',
  '28': 'BAD BOY CAROLINA HERRERA',
  '29': 'BE DELICIOUS DKNY',
  '30': 'LOST CHERRY TOM FORD',
  '31': 'SCANDAL JEAN PAUL GAULTIER',
  '32': 'BORN IN ROMA DONNA VALENTINO',
  '33': "L'IMMENSITÉ LOUIS VUITTON",
  '34': '212 VIP CAROLINA HERRERA',
  '35': 'SWISS ARMY VICTORINOX',
  '36': 'BLANC L.12.12 LACOSTE',
  '37': 'ACQUA DI GIÒ GIORGIO ARMANI',
  '38': 'POLO BLACK RALPH LAUREN',
  '39': 'RALPH LAUREN',
  '40': 'YARA LATTAFA',
  '41': 'YARA TOUS LATTAFA',
  '42': 'FLOWERBOMB VIKTOR & ROLF',
  '43': 'BLACK OPIUM YVES SAINT LAURENT',
  '44': 'DIOR HOMME SPORT',
  '45': 'CK ONE CALVIN KLEIN',
  '46': '360 RED PERRY ELLIS',
  '47': 'GREEN TEA ELIZABETH ARDEN',
  '48': 'PRINCESS VERA WANG',
  '49': 'SAUVAGE ELIXIR DIOR',
  '50': 'BORN IN ROMA UOMO VALENTINO',
  '51': 'ACQUA DI GIÒ PROFONDO ARMANI',
  '52': 'LE MALE ELIXIR JEAN PAUL GAULTIER',
  '53': 'STRONGER WITH YOU ARMANI',
  '54': '212 MEN CAROLINA HERRERA',
  '55': 'MAN IN BLACK BVLGARI',
  '56': 'ACQUA DI GIÒ PROFUMO ARMANI',
  '57': 'LA BOMBA CAROLINA HERRERA',
  '58': 'GOOD GIRL CAROLINA HERRERA',
  '59': 'TOY BOY MOSCHINO',
  '60': 'BACCARAT ROUGE 540 MFK',
  '61': 'FAHRENHEIT DIOR',
  '62': 'AMARIGE GIVENCHY',
  '63': 'ANGEL THIERRY MUGLER',
  '64': 'EILISH BILLIE EILISH',
  '65': 'HALLOWEEN MAN JESÚS DEL POZO',
  '66': 'LAVANDE 31 LE LABO',
  '67': 'PARADOXE PRADA',
  '68': 'TOMMY GIRL TOMMY HILFIGER',
  '69': 'EAU DE RHUBARBE ÉCARLATE HERMÈS',
  '70': 'ENDLESS EUPHORIA CALVIN KLEIN',
  '71': 'BHARARA CHOCOLATE',
  '72': 'COOL WATER DAVIDOFF',
  '73': 'DRAKKAR NOIR GUY LAROCHE',
  '74': 'ETERNITY CALVIN KLEIN',
  '75': "L'EAU SUPER MAJEURE D'ISSEY MIYAKE",
  '76': 'LEGEND MONTBLANC',
  '77': 'OUD FOR GLORY LATTAFA',
  '78': 'PHANTOM PARFUM PACO RABANNE',
  '79': 'POLO SPORT RALPH LAUREN',
  '80': 'SILVER MOUNTAIN WATER CREED',
  '81': 'TUSCAN LEATHER TOM FORD',
  '82': 'BORN IN ROMA CORAL FANTASY VALENTINO',
};

export function resolveCleanOriginalPerfumeWithBrand(p: {
  sku?: string;
  name?: string;
  brand?: string;
}): string {
  const skuStr = String(p.sku || '').trim();
  if (EXACT_ORIGINAL_WITH_BRAND[skuStr]) {
    return EXACT_ORIGINAL_WITH_BRAND[skuStr];
  }

  const rawName = (getInspiracionPerfumeName(p as any) || p.name || '')
    .replace(/\s+[HFMU]$/i, '')
    .replace(/\s+M\s+F$/i, '')
    .trim();
  const brand = (p.brand || '').trim();
  if (brand && !rawName.toLowerCase().includes(brand.toLowerCase())) {
    return `${rawName} ${brand}`.toUpperCase();
  }
  return rawName.toUpperCase();
}

export function createCatalogOverlaySvg(opts: {
  priceStr: string;
  unitLabel: string;
  ribbonSmall: string;
  ribbonLarge: string;
}): Buffer {
  // Badge compacto y no invasivo debajo de la cinta morada superior (lado derecho)
  const cx = 876;
  const cy = 262;
  const outerSeal = createSmoothScallopSealPath(cx, cy, 14, 64, 76);
  const innerSeal = createSmoothScallopSealPath(cx, cy, 14, 59, 71);

  const cleanLarge = escapeXml(opts.ribbonLarge.toUpperCase().trim());
  const cleanSmall = escapeXml(opts.ribbonSmall.toUpperCase().trim());
  const len = cleanLarge.length;

  let largeFontSize = 50;
  if (len > 33) largeFontSize = 27;
  else if (len > 29) largeFontSize = 31;
  else if (len > 25) largeFontSize = 35;
  else if (len > 21) largeFontSize = 39;
  else if (len > 17) largeFontSize = 44;

  const priceFontSize = opts.priceStr.length >= 6 ? 26 : 30;

  return Buffer.from(`
    <svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6D28D9" />
          <stop offset="50%" stop-color="#5B21B6" />
          <stop offset="100%" stop-color="#4C1D95" />
        </linearGradient>
        <linearGradient id="greenSealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10B981" />
          <stop offset="100%" stop-color="#059669" />
        </linearGradient>
        <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#064E3B" flood-opacity="0.18" />
        </filter>
      </defs>

      <!-- Cinta morada superior con raya morada abajo -->
      <rect x="0" y="0" width="1000" height="158" fill="url(#purpleGrad)" />
      <rect x="0" y="153" width="1000" height="5" fill="#A78BFA" />
      <text x="500" y="48" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="800" text-anchor="middle" fill="#DDD6FE" letter-spacing="4">${cleanSmall}</text>
      <text x="500" y="114" font-family="Arial, Helvetica, sans-serif" font-size="${largeFontSize}" font-weight="900" text-anchor="middle" fill="#FFFFFF" letter-spacing="1">${cleanLarge}</text>

      <!-- Sello verde discreto debajo de la cinta morada (derecha) -->
      <g filter="url(#badgeShadow)">
        <path d="${outerSeal}" fill="#FFFFFF" />
        <path d="${innerSeal}" fill="url(#greenSealGrad)" />
        <circle cx="${cx}" cy="${cy}" r="53" fill="none" stroke="#6EE7B7" stroke-width="1.5" stroke-opacity="0.6" />
      </g>
      <text x="${cx}" y="${cy + 2}" font-family="Arial, Helvetica, sans-serif" font-size="${priceFontSize}" font-weight="900" text-anchor="middle" fill="#FFFFFF" letter-spacing="-0.5">${escapeXml(opts.priceStr)}</text>
      <text x="${cx}" y="${cy + 23}" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="800" text-anchor="middle" fill="#D1FAE5" letter-spacing="1.1">${escapeXml(opts.unitLabel)}</text>
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
        { input: resizedProd, top: 174, left: 130 },
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

      const unitPrice = Number(p.price || 3.75);
      const originalPerfumeWithBrand = resolveCleanOriginalPerfumeWithBrand(p);

      const overlaySvg = createCatalogOverlaySvg({
        priceStr: `$${unitPrice.toFixed(2)}`,
        unitLabel: '1 ONZA',
        ribbonSmall: 'INSPIRADO EN',
        ribbonLarge: originalPerfumeWithBrand,
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
          { input: croppedBottle, top: 158, left: 145 },
          { input: overlaySvg, top: 0, left: 0 },
        ])
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(outPath);
    } else if (isBottle) {
      const init = initMap.get(p.id);
      const rawImgPath = (
        p.imageUrl ||
        init?.imageUrl ||
        '/images/botes/bote_100ml_degrade_azul_noche.jpg'
      )
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
          { input: resizedBottle, top: 178, left: 130 },
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
          ? 'ALCOHOL PERFUMERO CON FIJADOR 1L'
          : p.id === 'alcohol-perfumero-fijador-medio-litro'
          ? 'ALCOHOL PERFUMERO CON FIJADOR ½L'
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
          { input: resizedSupply, top: 188, left: 140 },
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
