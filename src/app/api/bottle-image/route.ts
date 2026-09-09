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

let cachedLogoBuffer: Buffer | null = null;

function getLogoBuffer(): Buffer {
  if (!cachedLogoBuffer) {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'aromaniak_black_logo.png');
    cachedLogoBuffer = fs.readFileSync(logoPath);
  }
  return cachedLogoBuffer;
}

function createBottleLabelSvg(contratipo: string, originalPerfume?: string, genderCode?: string, size = '1 OZ') {
  const labelW = 304;
  const labelH = 368;
  const cleanContra = escapeXml((contratipo || 'ESENCIA').toUpperCase());
  const cleanOrig = escapeXml((originalPerfume || '').toUpperCase());
  const genderTag = genderCode ? ` • (${genderCode})` : '';
  const sideText = cleanOrig ? `${cleanOrig}${genderTag}` : 'INSPIRACIÓN FINA';

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

const imageCache = new Map<string, Buffer>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = (searchParams.get('name') || 'ESENCIA').trim();
    const original = (searchParams.get('original') || '').trim();
    const gender = (searchParams.get('gender') || '').trim();
    const cacheKey = `${name}_${original}_${gender}`;

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
    const logoBuffer = getLogoBuffer();
    const resizedLogo = await sharp(logoBuffer).resize(140).toBuffer();

    const svgStr = createBottleLabelSvg(name, original, gender);
    const labelImg = await sharp(Buffer.from(svgStr))
      .composite([{ input: resizedLogo, top: 26, left: Math.round((244 - 140) / 2) }])
      .png()
      .toBuffer();

    const compositedBuffer = await sharp(baseBuffer)
      .composite([{ input: labelImg, top: 412, left: 232 }])
      .webp({ quality: 90 })
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
