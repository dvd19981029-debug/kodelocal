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

function createTextOverlay(contratipo: string): Buffer {
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
