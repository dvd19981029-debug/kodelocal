import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Cache the base template in memory
let cachedBaseBuffer: Buffer | null = null;

function getBaseBuffer(): Buffer {
  if (!cachedBaseBuffer) {
    const baseImgPath = path.join(process.cwd(), 'public', 'images', 'essence_bottle_blank.webp');
    cachedBaseBuffer = fs.readFileSync(baseImgPath);
  }
  return cachedBaseBuffer;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
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

function layoutText(name: string) {
  const clean = escapeXml((name || 'ESENCIA').toUpperCase().trim());
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

  const maxLineLen = Math.max(...lines.map(l => l.length));
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

function createTextOverlay(contratipo: string): Buffer {
  const { lines, fontSize, underlineW } = layoutText(contratipo);
  const fontWeight = '600'; // Semibold: no en bold pero un poquitito más gruesa

  let textSvg = '';
  let underlineY = 626;

  if (lines.length === 1) {
    textSvg = `<text x="384" y="612" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${fontSize}" 
          font-weight="${fontWeight}" 
          text-anchor="middle" 
          fill="#111111" 
          letter-spacing="0.6">${lines[0]}</text>`;
    underlineY = 626;
  } else {
    textSvg = `
    <text x="384" y="596" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${fontSize}" 
          font-weight="${fontWeight}" 
          text-anchor="middle" 
          fill="#111111" 
          letter-spacing="0.6">${lines[0]}</text>
    <text x="384" y="622" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${fontSize}" 
          font-weight="${fontWeight}" 
          text-anchor="middle" 
          fill="#111111" 
          letter-spacing="0.6">${lines[1]}</text>
    `;
    underlineY = 634;
  }

  const svg = `
  <svg width="768" height="1024" xmlns="http://www.w3.org/2000/svg">
    ${textSvg}
    <rect x="${384 - (underlineW / 2)}" y="${underlineY}" width="${underlineW}" height="2.5" fill="#111111" />
  </svg>
  `;
  return Buffer.from(svg);
}

const imageCache = new Map<string, Buffer>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = (searchParams.get('name') || 'ESENCIA').trim();
    const cacheKey = name;

    if (imageCache.has(cacheKey)) {
      return new Response(imageCache.get(cacheKey) as any, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const baseBuffer = getBaseBuffer();
    const overlayBuffer = createTextOverlay(name);

    const compositedBuffer = await sharp(baseBuffer)
      .composite([{ input: overlayBuffer, top: 0, left: 0 }])
      .webp({ quality: 92 })
      .toBuffer();

    imageCache.set(cacheKey, compositedBuffer);

    return new Response(compositedBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating bottle image:', error);
    return new NextResponse('Error generating bottle image', { status: 500 });
  }
}
