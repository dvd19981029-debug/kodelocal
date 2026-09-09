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

function cleanContratipoName(raw: string): string {
  return (raw || '')
    .replace(/\s+[HFMU]\b/gi, '')
    .trim()
    .toUpperCase();
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

function generateSvgOverlay(name: string): Buffer {
  const cleanName = cleanContratipoName(name) || 'ESENCIA PURA';
  
  let lines: string[] = [];
  let fontSize = 32;
  let lineHeight = 38;

  if (cleanName.length <= 14) {
    lines = [cleanName];
    fontSize = cleanName.length > 10 ? 28 : 32;
  } else if (cleanName.length <= 26) {
    const words = cleanName.split(' ');
    let line1 = '', line2 = '';
    for (const w of words) {
      if ((line1 + ' ' + w).trim().length <= 14) {
        line1 = (line1 + ' ' + w).trim();
      } else {
        line2 = (line2 + ' ' + w).trim();
      }
    }
    if (!line2) {
      lines = [cleanName];
      fontSize = 22;
    } else {
      lines = [line1, line2];
      fontSize = 24;
      lineHeight = 28;
    }
  } else {
    const words = cleanName.split(' ');
    let line1 = '', line2 = '';
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
    lines = [line1, line2];
    fontSize = 20;
    lineHeight = 24;
  }

  const centerY = 614;
  const startY = lines.length === 1 ? centerY : centerY - (lineHeight / 2) + 4;

  const textTags = lines.map((l, i) => `
    <text x="384" y="${startY + (i * lineHeight)}" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${fontSize}" 
          font-weight="900" 
          text-anchor="middle" 
          fill="#111827" 
          letter-spacing="0.5">
      ${escapeXml(l)}
    </text>
  `).join('');

  const lineY = startY + (lines.length - 1) * lineHeight + 14;

  const svgStr = `
    <svg width="768" height="1024" xmlns="http://www.w3.org/2000/svg">
      ${textTags}
      <rect x="354" y="${lineY}" width="60" height="2.5" fill="#111827" rx="1" opacity="0.9" />
    </svg>
  `;

  return Buffer.from(svgStr);
}

const imageCache = new Map<string, Buffer>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = (searchParams.get('name') || 'ESENCIA').trim();

    if (imageCache.has(name)) {
      return new Response(imageCache.get(name) as any, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const baseBuffer = getBaseBuffer();
    const svgOverlay = generateSvgOverlay(name);

    const compositedBuffer = await sharp(baseBuffer)
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .webp({ quality: 85 })
      .toBuffer();

    imageCache.set(name, compositedBuffer);

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
