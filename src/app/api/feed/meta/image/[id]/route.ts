import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/store';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';

export const dynamic = 'force-dynamic';

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

function createCatalogOverlaySvg(opts: {
  priceStr: string;
  unitLabel: string;
  ribbonSmall: string;
  ribbonLarge: string;
}): Buffer {
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
      <rect x="0" y="0" width="1000" height="158" fill="url(#purpleGrad)" />
      <rect x="0" y="153" width="1000" height="5" fill="#A78BFA" />
      <text x="500" y="48" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="800" text-anchor="middle" fill="#DDD6FE" letter-spacing="4">${cleanSmall}</text>
      <text x="500" y="114" font-family="Arial, Helvetica, sans-serif" font-size="${largeFontSize}" font-weight="900" text-anchor="middle" fill="#FFFFFF" letter-spacing="1">${cleanLarge}</text>
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
  let fontSize = 26;
  let underlineW = 100;

  if (lines.length === 1) {
    if (maxLineLen > 13) fontSize = 20;
    else if (maxLineLen > 10) fontSize = 22;
    else if (maxLineLen > 7) fontSize = 24;
    else fontSize = 26;
    underlineW = Math.min(175, Math.max(75, Math.round(maxLineLen * (fontSize * 0.55))));
  } else {
    if (maxLineLen > 12) fontSize = 19;
    else if (maxLineLen > 9) fontSize = 21;
    else fontSize = 22.5;
    underlineW = Math.min(175, Math.max(80, Math.round(maxLineLen * (fontSize * 0.52))));
  }

  return { lines, fontSize, underlineW };
}

function createBottleLabelSvg(contratipo: string): Buffer {
  const { lines, fontSize, underlineW } = layoutLabelText(contratipo);
  const fontWeight = '600';

  let textSvg = '';
  let underlineY = 626;

  if (lines.length === 1) {
    textSvg = `<text x="384" y="612" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="middle" fill="#111111" letter-spacing="0.6">${lines[0]}</text>`;
    underlineY = 626;
  } else {
    textSvg = `
      <text x="384" y="596" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="middle" fill="#111111" letter-spacing="0.6">${lines[0]}</text>
      <text x="384" y="622" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="middle" fill="#111111" letter-spacing="0.6">${lines[1]}</text>
    `;
    underlineY = 634;
  }

  return Buffer.from(`
    <svg width="768" height="1024" xmlns="http://www.w3.org/2000/svg">
      ${textSvg}
      <rect x="${384 - underlineW / 2}" y="${underlineY}" width="${underlineW}" height="2.5" fill="#111111" />
    </svg>
  `);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawParam } = await context.params;
    const cleanId = decodeURIComponent(rawParam || '').replace(/\.(jpg|jpeg|png|webp)$/i, '');

    const staticMetaPath = path.join(process.cwd(), 'public', 'images', 'meta', `${cleanId}.jpg`);

    // Consultar el producto en base de datos para verificar si es un producto nuevo o si cambió de nombre/imagen
    const dbProduct = await prisma.product
      .findUnique({
        where: { id: cleanId },
        include: { category: true },
      })
      .catch(() => null);

    const initProduct = INITIAL_PRODUCTS.find((p) => p.id === cleanId);

    // Si existe imagen estática pre-generada en public/images/meta/{id}.jpg, servir de inmediato (contiene nombre, precio y cinta morada renderizados)
    if (fs.existsSync(staticMetaPath)) {
      const fileBuf = fs.readFileSync(staticMetaPath);
      return new NextResponse(fileBuf, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

    const catName = dbProduct?.category?.name || initProduct?.category || 'Esencias para Perfume';
    const isEssence = catName === 'Esencias para Perfume' || cleanId.startsWith('esencia');
    const customImg = (dbProduct?.imageUrl || initProduct?.imageUrl || '').trim();

    // 1. Si el producto tiene una imagen propia distinta del frasco en blanco (ej. bote nuevo, insumo o foto subida en Base64/URL)
    if (customImg && customImg !== '/images/essence_bottle_blank.webp') {
      let inputBuf: Buffer | null = null;
      if (customImg.startsWith('data:image/')) {
        const b64 = customImg.split(',')[1];
        if (b64) inputBuf = Buffer.from(b64, 'base64');
      } else if (customImg.startsWith('http://') || customImg.startsWith('https://')) {
        const resp = await fetch(customImg).catch(() => null);
        if (resp && resp.ok) {
          inputBuf = Buffer.from(await resp.arrayBuffer());
        }
      } else {
        const relPath = customImg.split('?')[0].replace(/^\//, '');
        const fullLocal = path.join(process.cwd(), 'public', relPath);
        if (fs.existsSync(fullLocal)) {
          inputBuf = fs.readFileSync(fullLocal);
        }
      }

      if (inputBuf) {
        const jpgBuf = await sharp(inputBuf)
          .resize(1000, 1000, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
          .jpeg({ quality: 88, mozjpeg: true })
          .toBuffer();

        return new NextResponse(new Uint8Array(jpgBuf), {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=600, s-maxage=600',
          },
        });
      }
    }

    // 2. Si es una Esencia nueva agregada desde POS, estampar etiqueta + sello verde + cinta morada
    if (isEssence) {
      const blankBottlePath = path.join(process.cwd(), 'public', 'images', 'essence_bottle_blank.webp');
      const labelTitle = dbProduct?.officialName || dbProduct?.name || initProduct?.officialName || initProduct?.name || 'AROMANIAK';
      const svgOverlay = createBottleLabelSvg(labelTitle);

      const labeledBottle = await sharp(blankBottlePath)
        .composite([{ input: svgOverlay, top: 0, left: 0 }])
        .toBuffer();

      const croppedBottle = await sharp(labeledBottle)
        .extract({ left: 0, top: 60, width: 768, height: 910 })
        .resize(710, 842, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
        .toBuffer();

      const unitPrice = Number(dbProduct?.price ?? initProduct?.price ?? 3.75);
      const rawInsp = (getInspiracionPerfumeName((dbProduct || initProduct) as any) || dbProduct?.name || '')
        .replace(/\s+[HFMU]$/i, '')
        .trim();
      const brand = (dbProduct?.brand || initProduct?.brand || '').trim();
      const ribbonLarge = brand && !rawInsp.toLowerCase().includes(brand.toLowerCase())
        ? `${rawInsp} ${brand}`.toUpperCase()
        : rawInsp.toUpperCase();

      const catalogOverlay = createCatalogOverlaySvg({
        priceStr: `$${unitPrice.toFixed(2)}`,
        unitLabel: '1 ONZA',
        ribbonSmall: 'INSPIRADO EN',
        ribbonLarge: ribbonLarge || labelTitle.toUpperCase(),
      });

      const squareJpg = await sharp({
        create: { width: 1000, height: 1000, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .composite([
          { input: croppedBottle, top: 158, left: 145 },
          { input: catalogOverlay, top: 0, left: 0 },
        ])
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer();

      return new NextResponse(new Uint8Array(squareJpg), {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=600, s-maxage=600',
        },
      });
    }

    // 3. Fallback: frasco de cristal 100ml por defecto
    const fallbackPath = path.join(process.cwd(), 'public', 'images', 'meta', 'arma-tu-perfume-100ml.jpg');
    const fallbackBuf = fs.readFileSync(fallbackPath);
    return new NextResponse(fallbackBuf, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=600, s-maxage=600',
      },
    });
  } catch (err) {
    console.error('[Meta Dynamic Image Error]:', err);
    return new NextResponse('Image error', { status: 500 });
  }
}
