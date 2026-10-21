import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/store';

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

    // Si existe imagen estática pre-generada y el nombre no fue modificado respecto al catálogo base, servir de inmediato
    if (fs.existsSync(staticMetaPath)) {
      const dbName = (dbProduct?.officialName || dbProduct?.name || '').trim();
      const initName = (initProduct?.officialName || initProduct?.name || '').trim();

      if (!dbProduct || dbName === initName) {
        const fileBuf = fs.readFileSync(staticMetaPath);
        return new NextResponse(fileBuf, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        });
      }
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

    // 2. Si es una Esencia (nueva o con nombre actualizado en POS), estampar dinámicamente la etiqueta sobre el frasco oficial
    if (isEssence) {
      const blankBottlePath = path.join(process.cwd(), 'public', 'images', 'essence_bottle_blank.webp');
      const labelTitle = dbProduct?.officialName || dbProduct?.name || initProduct?.officialName || initProduct?.name || 'AROMANIAK';
      const svgOverlay = createBottleLabelSvg(labelTitle);

      const labeledBottle = await sharp(blankBottlePath)
        .composite([{ input: svgOverlay, top: 0, left: 0 }])
        .toBuffer();

      const squareJpg = await sharp(labeledBottle)
        .resize(1000, 1000, { fit: 'contain', background: { r: 254, g: 254, b: 254 } })
        .jpeg({ quality: 88, mozjpeg: true })
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
