import os
import sys
import json
import base64
import threading
import subprocess
import http.server
import socketserver

CRICUT_CATALOG_PATH = "/Users/luis/.gemini/antigravity/scratch/sistema-etiquetas-cricut/catalog_cricut.json"
OUTPUT_DIR = "/Users/luis/.gemini/antigravity/scratch/kodelocal/public/images/stickers"
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(CRICUT_CATALOG_PATH, "r", encoding="utf-8") as f:
    catalog = json.load(f)

HTML_PAGE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div style="font-family: 'IBM Plex Sans'; font-weight: 500;"> preload </div>
  <div style="font-family: 'Courier Prime'; font-weight: 400;"> preload </div>
  <div style="font-family: 'Courier Prime'; font-weight: 700;"> preload </div>
  <script>
    const CATALOG = __CATALOG_JSON__;

    const RICH_BLACK_HEX = '#020618';
    const RICH_BLACK_R = 2;
    const RICH_BLACK_G = 6;
    const RICH_BLACK_B = 24;

    function drawTrackedText(ctx, text, x, y, trackingPx, extraBoldStrokePx = 0) {
      const str = String(text || '');
      if (!str) return 0;
      const strokePx = extraBoldStrokePx > 0 ? extraBoldStrokePx : 0.28;
      let curX = x;
      ctx.save();
      ctx.fillStyle = RICH_BLACK_HEX;
      ctx.strokeStyle = RICH_BLACK_HEX;
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        ctx.fillText(ch, curX, y);
        ctx.fillText(ch, curX, y);
        if (strokePx > 0) {
          ctx.lineWidth = strokePx;
          ctx.lineJoin = 'round';
          ctx.strokeText(ch, curX, y);
        }
        curX += ctx.measureText(ch).width + trackingPx;
      }
      ctx.restore();
      return curX - x;
    }

    function measureTrackedTextWidth(ctx, text, trackingPx) {
      const str = String(text || '');
      if (!str) return 0;
      let total = 0;
      for (let i = 0; i < str.length; i++) {
        total += ctx.measureText(str[i]).width;
        if (i < str.length - 1) total += trackingPx;
      }
      return total;
    }

    function wrapNotesLines(ctx, text, maxWidthPx) {
      const parts = String(text || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const clean = parts.join(', ');
      if (!clean) return [''];
      if (ctx.measureText(clean).width <= maxWidthPx) {
        return [clean];
      }
      if (parts.length > 1) {
        let countLine1 = 1;
        for (let i = 1; i <= parts.length; i++) {
          const sub = parts.slice(0, i).join(', ') + (i < parts.length ? ',' : '');
          if (ctx.measureText(sub).width <= maxWidthPx) {
            countLine1 = i;
          } else {
            break;
          }
        }
        const line1 = parts.slice(0, countLine1).join(', ') + (countLine1 < parts.length ? ',' : '');
        const line2 = parts.slice(countLine1).join(', ');
        return line2 ? [line1, line2] : [line1];
      }
      return [clean];
    }

    function traceRoundedRect(ctx, x, y, w, h, r) {
      const radius = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function drawCrispTypewriterText(ctx, text, x, y, extraStrokePx = 0) {
      const strokePx = Math.max(0.32, extraStrokePx || 0);
      ctx.save();
      ctx.fillStyle = RICH_BLACK_HEX;
      ctx.strokeStyle = RICH_BLACK_HEX;
      ctx.fillText(text, x, y);
      ctx.fillText(text, x, y);
      ctx.lineWidth = strokePx;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, x, y);
      ctx.restore();
    }

    function deepenBlackInkOnRegion(ctx, x, y, w, h, coreThreshold = 115) {
      const ix = Math.max(0, Math.floor(x));
      const iy = Math.max(0, Math.floor(y));
      const iw = Math.min(ctx.canvas.width - ix, Math.ceil(w));
      const ih = Math.min(ctx.canvas.height - iy, Math.ceil(h));
      if (iw <= 0 || ih <= 0) return;
      const imgData = ctx.getImageData(ix, iy, iw, ih);
      const d = imgData.data;
      const span = Math.max(1, 250 - coreThreshold);
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        if (a === 0) continue;
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (lum < 250) {
          if (lum <= coreThreshold) {
            d[i] = RICH_BLACK_R;
            d[i + 1] = RICH_BLACK_G;
            d[i + 2] = RICH_BLACK_B;
          } else {
            const t = ((lum - coreThreshold) / span) * 0.84;
            d[i] = Math.round(RICH_BLACK_R + t * (255 - RICH_BLACK_R));
            d[i + 1] = Math.round(RICH_BLACK_G + t * (255 - RICH_BLACK_G));
            d[i + 2] = Math.round(RICH_BLACK_B + t * (255 - RICH_BLACK_B));
          }
        }
      }
      ctx.putImageData(imgData, ix, iy);
    }

    function drawPerfumeLabel(ctx, x0, y0, W, H, data, opts = {}) {
      const showCutBorder = opts.showCutBorder !== undefined ? opts.showCutBorder : true;
      ctx.save();

      const cornerRadiusPx = Math.round(W * 0.042);

      ctx.fillStyle = '#FFFFFF';
      traceRoundedRect(ctx, x0, y0, W, H, cornerRadiusPx);
      ctx.fill();

      if (showCutBorder) {
        ctx.strokeStyle = RICH_BLACK_HEX;
        const bw = Math.max(2, Math.round(W * 0.0038));
        const whiteMarginPx = Math.round(W * 0.015);
        ctx.lineWidth = bw;
        traceRoundedRect(
          ctx,
          x0 + whiteMarginPx + bw / 2,
          y0 + whiteMarginPx + bw / 2,
          W - 2 * whiteMarginPx - bw,
          H - 2 * whiteMarginPx - bw,
          cornerRadiusPx
        );
        ctx.stroke();
        ctx.stroke();
      }

      const ink = RICH_BLACK_HEX;
      ctx.fillStyle = ink;
      ctx.strokeStyle = ink;

      const padX = W * 0.050;
      const leftX = x0 + padX;
      const rightX = x0 + W - padX;

      const line1Y = y0 + H * 0.304;
      const line2Y = y0 + H * 0.805;
      const ruleWidth = Math.max(1.5, H * 0.0044);

      ctx.lineWidth = ruleWidth;
      ctx.beginPath();
      ctx.moveTo(leftX, line1Y);
      ctx.lineTo(rightX, line1Y);
      ctx.moveTo(leftX, line2Y);
      ctx.lineTo(rightX, line2Y);
      ctx.stroke();
      ctx.stroke();

      const topRegularText = (data.prefix || 'INSPIRADO EN').trim().toUpperCase();
      const mainPerfumeText = (data.perfumeName || '').trim().toUpperCase();
      const houseYearText = (data.houseYear || 'Dior · 2015').trim();
      ctx.textBaseline = 'alphabetic';

      const divTopX = x0 + W * 0.630;
      const topSectionH = line1Y - y0;
      const topBarCenterY = y0 + topSectionH * 0.56;
      const topBarHalfH = topSectionH * 0.27;

      ctx.lineWidth = ruleWidth;
      ctx.beginPath();
      ctx.moveTo(divTopX, topBarCenterY - topBarHalfH);
      ctx.lineTo(divTopX, topBarCenterY + topBarHalfH);
      ctx.stroke();

      const topRightX = divTopX + W * 0.025;
      const topRightMaxW = rightX - topRightX;

      let houseLabelFontPx = H * 0.026;
      let houseLabelTracking = houseLabelFontPx * 0.09;
      while (houseLabelFontPx > H * 0.021) {
        ctx.font = `500 ${houseLabelFontPx.toFixed(1)}px "IBM Plex Sans", sans-serif`;
        houseLabelTracking = houseLabelFontPx * 0.09;
        if (measureTrackedTextWidth(ctx, 'CASA INSPIRADA:', houseLabelTracking) <= topRightMaxW) break;
        houseLabelFontPx -= 0.2;
      }

      let houseValFontPx = H * 0.0335;
      ctx.font = `400 ${houseValFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
      while (houseValFontPx > H * 0.023) {
        ctx.font = `400 ${houseValFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
        if (ctx.measureText(houseYearText).width <= topRightMaxW) break;
        houseValFontPx -= 0.3;
      }

      ctx.font = `500 ${houseLabelFontPx.toFixed(1)}px "IBM Plex Sans", sans-serif`;
      drawTrackedText(ctx, 'CASA INSPIRADA:', topRightX, topBarCenterY - houseLabelFontPx * 0.38, houseLabelTracking);
      ctx.font = `400 ${houseValFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
      drawCrispTypewriterText(ctx, houseYearText, topRightX, topBarCenterY + houseValFontPx * 1.02, houseValFontPx * 0.012);

      const maxTitleW = (divTopX - W * 0.025) - leftX;
      let titleFontPx = H * 0.088;
      const minSingleLineFontPx = H * 0.052;
      let titleTracking = titleFontPx * 0.042;
      let fitsSingleLine = false;

      while (titleFontPx >= minSingleLineFontPx) {
        ctx.font = `700 ${titleFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
        titleTracking = titleFontPx * 0.042;
        const measured = measureTrackedTextWidth(ctx, mainPerfumeText, titleTracking);
        if (measured <= maxTitleW) {
          fitsSingleLine = true;
          break;
        }
        titleFontPx -= 0.5;
      }

      const wordsTitle = mainPerfumeText.split(/\\s+/).filter(Boolean);
      if (fitsSingleLine || wordsTitle.length <= 1) {
        if (!fitsSingleLine) {
          while (titleFontPx > H * 0.036) {
            ctx.font = `700 ${titleFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
            titleTracking = titleFontPx * 0.042;
            if (measureTrackedTextWidth(ctx, mainPerfumeText, titleTracking) <= maxTitleW) break;
            titleFontPx -= 0.5;
          }
        }
        const subFontPx = H * 0.035;
        const subTracking = subFontPx * 0.22;
        ctx.font = `500 ${subFontPx.toFixed(1)}px "IBM Plex Sans", sans-serif`;
        drawTrackedText(ctx, topRegularText, leftX, y0 + H * 0.114, subTracking);

        ctx.font = `700 ${titleFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
        const titleHeavyStroke = titleFontPx * 0.032;
        drawTrackedText(ctx, mainPerfumeText, leftX, y0 + H * 0.236, titleTracking, titleHeavyStroke);
      } else {
        let bestSplit = [mainPerfumeText, ''];
        let bestDiff = 9999;
        for (let i = 1; i < wordsTitle.length; i++) {
          const l1 = wordsTitle.slice(0, i).join(' ');
          const l2 = wordsTitle.slice(i).join(' ');
          const diff = Math.abs(l1.length - l2.length);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestSplit = [l1, l2];
          }
        }

        const subFontPx = H * 0.032;
        const subTracking = subFontPx * 0.20;
        ctx.font = `500 ${subFontPx.toFixed(1)}px "IBM Plex Sans", sans-serif`;
        drawTrackedText(ctx, topRegularText, leftX, y0 + H * 0.090, subTracking);

        let twoLineFontPx = H * 0.056;
        let twoLineTracking = twoLineFontPx * 0.038;
        while (twoLineFontPx > H * 0.036) {
          ctx.font = `700 ${twoLineFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
          twoLineTracking = twoLineFontPx * 0.038;
          const w1 = measureTrackedTextWidth(ctx, bestSplit[0], twoLineTracking);
          const w2 = measureTrackedTextWidth(ctx, bestSplit[1], twoLineTracking);
          if (Math.max(w1, w2) <= maxTitleW) break;
          twoLineFontPx -= 0.4;
        }

        const heavyStroke2 = twoLineFontPx * 0.030;
        drawTrackedText(ctx, bestSplit[0], leftX, y0 + H * 0.172, twoLineTracking, heavyStroke2);
        drawTrackedText(ctx, bestSplit[1], leftX, y0 + H * 0.250, twoLineTracking, heavyStroke2);
      }

      const midTopY = line1Y + H * 0.038;
      const midBotY = line2Y - H * 0.038;
      const midAvailH = midBotY - midTopY;

      const divMidX = x0 + W * 0.362;
      const leftColMaxW = (divMidX - W * 0.020) - leftX;
      const notesStartX = divMidX + W * 0.028;
      const notesMaxW = rightX - notesStartX;

      let labelFontPx = H * 0.0345;
      let labelTracking = labelFontPx * 0.08;
      while (labelFontPx > H * 0.026) {
        ctx.font = `500 ${labelFontPx.toFixed(1)}px "IBM Plex Sans", sans-serif`;
        labelTracking = labelFontPx * 0.08;
        if (measureTrackedTextWidth(ctx, 'NOTAS DE CORAZÓN', labelTracking) <= leftColMaxW) break;
        labelFontPx -= 0.2;
      }

      let noteFontPx = H * 0.0435;
      let noteLineHeight = noteFontPx * 1.24;
      let topLines = [];
      let heartLines = [];
      let baseLines = [];

      while (noteFontPx >= H * 0.032) {
        ctx.font = `400 ${noteFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
        noteLineHeight = noteFontPx * 1.24;
        topLines = wrapNotesLines(ctx, data.topNotes, notesMaxW);
        heartLines = wrapNotesLines(ctx, data.heartNotes, notesMaxW);
        baseLines = wrapNotesLines(ctx, data.baseNotes, notesMaxW);
        const allLines = [...topLines, ...heartLines, ...baseLines];
        const maxLineW = Math.max(...allLines.map(l => ctx.measureText(l).width));
        const totalLinesCount = topLines.length + heartLines.length + baseLines.length;
        const neededH = totalLinesCount * noteLineHeight + 2 * (H * 0.020);
        if (maxLineW <= notesMaxW && neededH <= midAvailH) break;
        noteFontPx -= 0.3;
      }

      const rowsData = [
        { label: 'NOTAS DE SALIDA', lines: topLines },
        { label: 'NOTAS DE CORAZÓN', lines: heartLines },
        { label: 'NOTAS DE FONDO', lines: baseLines }
      ];

      const rowHeights = rowsData.map(r => Math.max(1, r.lines.length) * noteLineHeight);
      const totalRowsH = rowHeights.reduce((a, b) => a + b, 0);
      const rowGap = Math.max(H * 0.020, (midAvailH - totalRowsH) / 2);
      const actualBlockH = totalRowsH + 2 * rowGap;
      let curRowTopY = line1Y + ((line2Y - line1Y) - actualBlockH) / 2;
      const noteInkStroke = noteFontPx * 0.012;

      for (let i = 0; i < rowsData.length; i++) {
        const r = rowsData[i];
        const rH = rowHeights[i];
        const firstLineBaselineY = curRowTopY + noteFontPx * 0.84;

        ctx.font = `500 ${labelFontPx.toFixed(1)}px "IBM Plex Sans", sans-serif`;
        drawTrackedText(ctx, r.label, leftX, firstLineBaselineY, labelTracking);

        const barTopY = curRowTopY + noteFontPx * 0.06;
        const barBotY = curRowTopY + rH - noteFontPx * 0.06;
        ctx.lineWidth = ruleWidth;
        ctx.beginPath();
        ctx.moveTo(divMidX, barTopY);
        ctx.lineTo(divMidX, barBotY);
        ctx.stroke();

        ctx.font = `400 ${noteFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
        for (let ln = 0; ln < r.lines.length; ln++) {
          drawCrispTypewriterText(ctx, r.lines[ln], notesStartX, firstLineBaselineY + ln * noteLineHeight, noteInkStroke);
        }

        curRowTopY += rH + rowGap;
      }

      const footerTopY = line2Y;
      const footerH = (y0 + H) - footerTopY;
      const footerCenterY = footerTopY + footerH * 0.52;

      const divBotX = x0 + W * 0.630;
      const botBarHalfH = footerH * 0.30;

      ctx.lineWidth = ruleWidth;
      ctx.beginPath();
      ctx.moveTo(divBotX, footerCenterY - botBarHalfH);
      ctx.lineTo(divBotX, footerCenterY + botBarHalfH);
      ctx.stroke();

      const rawLeftText = String(data.footerLeft || 'Fresco y especiado sobre un fondo amaderado intenso.').trim();
      let leftLines = [];
      if (rawLeftText.includes('/')) {
        leftLines = rawLeftText.split('/').map(s => s.trim()).filter(Boolean);
      } else {
        const words = rawLeftText.split(/\\s+/).filter(Boolean);
        if (rawLeftText.length <= 28 || words.length <= 3) {
          leftLines = [rawLeftText];
        } else {
          let bestSplit = [rawLeftText, ''];
          let bestDiff = 9999;
          for (let i = 1; i < words.length; i++) {
            const l1 = words.slice(0, i).join(' ');
            const l2 = words.slice(i).join(' ');
            const diff = Math.abs(l1.length - l2.length);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestSplit = [l1, l2];
            }
          }
          leftLines = bestSplit.filter(Boolean);
        }
      }

      const footLeftMaxW = (divBotX - W * 0.025) - leftX;
      let footLeftFontPx = leftLines.length > 1 ? H * 0.0355 : H * 0.0375;

      ctx.font = `400 ${footLeftFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
      while (footLeftFontPx > H * 0.024) {
        ctx.font = `400 ${footLeftFontPx.toFixed(1)}px "Courier Prime", "Courier New", monospace`;
        const maxLineW = Math.max(...leftLines.map(ln => ctx.measureText(ln).width));
        if (maxLineW <= footLeftMaxW) break;
        footLeftFontPx -= 0.3;
      }

      const footLeftStroke = footLeftFontPx * 0.012;
      if (leftLines.length >= 2) {
        const leftLineStep = footLeftFontPx * 1.28;
        drawCrispTypewriterText(ctx, leftLines[0], leftX, footerCenterY - leftLineStep * 0.18, footLeftStroke);
        drawCrispTypewriterText(ctx, leftLines[1], leftX, footerCenterY + leftLineStep * 0.82, footLeftStroke);
      } else if (leftLines.length === 1) {
        drawCrispTypewriterText(ctx, leftLines[0], leftX, footerCenterY + footLeftFontPx * 0.34, footLeftStroke);
      }

      const poeticParts = String(data.footerRight || 'PARA HOMBRE / ESENCIA DE AUTOR')
        .split('/')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
      const pLine1 = poeticParts[0] || 'PARA HOMBRE';
      const pLine2 = poeticParts[1] || '';

      const footRightX = divBotX + W * 0.025;
      const footRightMaxW = rightX - footRightX;
      let footRightFontPx = H * 0.0295;
      let footRightTracking = footRightFontPx * 0.11;

      ctx.font = `500 ${footRightFontPx.toFixed(1)}px "IBM Plex Sans", sans-serif`;
      while (footRightFontPx > H * 0.021) {
        ctx.font = `500 ${footRightFontPx.toFixed(1)}px "IBM Plex Sans", sans-serif`;
        footRightTracking = footRightFontPx * 0.11;
        const w1 = measureTrackedTextWidth(ctx, pLine1, footRightTracking);
        const w2 = measureTrackedTextWidth(ctx, pLine2, footRightTracking);
        if (Math.max(w1, w2) <= footRightMaxW) break;
        footRightFontPx -= 0.3;
      }

      if (pLine2) {
        const lineStep = footRightFontPx * 1.45;
        drawTrackedText(ctx, pLine1, footRightX, footerCenterY - lineStep * 0.22, footRightTracking);
        drawTrackedText(ctx, pLine2, footRightX, footerCenterY + lineStep * 0.78, footRightTracking);
      } else {
        drawTrackedText(ctx, pLine1, footRightX, footerCenterY + footRightFontPx * 0.35, footRightTracking);
      }

      deepenBlackInkOnRegion(ctx, x0, y0, W, H);
      ctx.restore();
    }

    function getGenderFooterLabel(genero) {
      if (genero === 'H') return 'PARA HOMBRE / ESENCIA DE AUTOR';
      if (genero === 'F') return 'PARA MUJER / ESENCIA DE AUTOR';
      return 'UNISEX / ESENCIA DE AUTOR';
    }

    function renderStickerOnStudioBackground(item) {
      const CW = 880;
      const CH = 880;
      const canvas = document.createElement('canvas');
      canvas.width = CW;
      canvas.height = CH;
      const ctx = canvas.getContext('2d');

      // 1. Studio background (warm alabaster / architectural stone surface)
      const bgGrad = ctx.createRadialGradient(CW * 0.5, CH * 0.45, 40, CW * 0.5, CH * 0.5, CW * 0.72);
      bgGrad.addColorStop(0, '#f8f6f2');
      bgGrad.addColorStop(0.65, '#eeeae2');
      bgGrad.addColorStop(1, '#e2ddd3');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CW, CH);

      // Subtle paper/stone grain texture on background only
      const bgImg = ctx.getImageData(0, 0, CW, CH);
      const bd = bgImg.data;
      let seed = parseInt(item.sku, 10) || 1;
      for (let i = 0; i < bd.length; i += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const noise = ((seed & 0xff) / 255 - 0.5) * 3.2;
        bd[i] = Math.min(255, Math.max(0, bd[i] + noise));
        bd[i + 1] = Math.min(255, Math.max(0, bd[i + 1] + noise));
        bd[i + 2] = Math.min(255, Math.max(0, bd[i + 2] + noise));
      }
      ctx.putImageData(bgImg, 0, 0);

      // 2. Render exact 636x600 (53x50mm @ 12px/mm) Cricut sticker on offscreen canvas
      const SW = 636;
      const SH = 600;
      const off = document.createElement('canvas');
      off.width = SW;
      off.height = SH;
      const offCtx = off.getContext('2d');

      const data = {
        prefix: 'INSPIRADO EN',
        perfumeName: item.nombre.toUpperCase(),
        houseYear: `${item.marca || 'Autor'} · ${item.anio || '2020'}`,
        topNotes: (item.topNotes || []).join(', '),
        heartNotes: (item.heartNotes || []).join(', '),
        baseNotes: (item.baseNotes || []).join(', '),
        footerLeft: item.fraseOlfativa || 'Esencia limpia y atemporal sobre la piel.',
        footerRight: getGenderFooterLabel(item.genero)
      };

      drawPerfumeLabel(offCtx, 0, 0, SW, SH, data, { showCutBorder: true });

      // Clip offscreen canvas to exact rounded rectangle die-cut contour
      const clipped = document.createElement('canvas');
      clipped.width = SW;
      clipped.height = SH;
      const cCtx = clipped.getContext('2d');
      const cornerRadiusPx = Math.round(SW * 0.042);
      traceRoundedRect(cCtx, 0, 0, SW, SH, cornerRadiusPx);
      cCtx.clip();
      cCtx.drawImage(off, 0, 0);

      // 3. Draw realistic physical sticker shadow on studio background
      const sx = Math.round((CW - SW) / 2);
      const sy = Math.round((CH - SH) / 2);

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#FFFFFF';
      traceRoundedRect(ctx, sx, sy, SW, SH, cornerRadiusPx);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#FFFFFF';
      traceRoundedRect(ctx, sx, sy, SW, SH, cornerRadiusPx);
      ctx.fill();
      ctx.restore();

      // 4. Composite the exact Cricut sticker onto the background
      ctx.drawImage(clipped, sx, sy);

      // Subtle die-cut edge border so the white sticker edge is crisp against the studio surface
      ctx.save();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.lineWidth = 1.2;
      traceRoundedRect(ctx, sx, sy, SW, SH, cornerRadiusPx);
      ctx.stroke();
      ctx.restore();

      return canvas.toDataURL('image/webp', 0.94);
    }

    window.addEventListener('load', async () => {
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 300));
      for (const item of CATALOG) {
        const dataUrl = renderStickerOnStudioBackground(item);
        await fetch('/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku: String(item.sku), dataUrl })
        });
      }
      await fetch('/done', { method: 'POST' });
    });
  </script>
</body>
</html>
""".replace("__CATALOG_JSON__", json.dumps(catalog, ensure_ascii=False))

done_event = threading.Event()
saved_count = 0

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(HTML_PAGE.encode("utf-8"))

    def do_POST(self):
        global saved_count
        if self.path == "/save":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            sku = body["sku"]
            data_url = body["dataUrl"]
            b64 = data_url.split(",", 1)[1]
            raw = base64.b64decode(b64)
            out_path = os.path.join(OUTPUT_DIR, f"sticker_{sku}.webp")
            with open(out_path, "wb") as f:
                f.write(raw)
            saved_count += 1
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        elif self.path == "/done":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"DONE")
            done_event.set()

with socketserver.TCPServer(("127.0.0.1", 0), Handler) as httpd:
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    url = f"http://127.0.0.1:{port}/"
    print(f"Rendering 82 stickers via Chrome at {url} ...")
    proc = subprocess.Popen([
        CHROME_BIN,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=1024,1024",
        url
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    done_event.wait(timeout=60)
    proc.terminate()
    httpd.shutdown()

print(f"Successfully rendered {saved_count} sticker images into {OUTPUT_DIR}")
