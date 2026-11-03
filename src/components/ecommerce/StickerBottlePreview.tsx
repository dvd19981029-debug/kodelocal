'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { StickerBottleMockupConfig } from '@/lib/cricutStickers';

interface StickerBottlePreviewProps {
  stickerImageUrl: string;
  bottleConfig: StickerBottleMockupConfig;
  alt?: string;
  className?: string;
}

const imageElementCache = new Map<string, Promise<HTMLImageElement>>();

function loadCachedImage(src: string): Promise<HTMLImageElement> {
  const cleanSrc = src.trim();
  const cached = imageElementCache.get(cleanSrc);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      imageElementCache.delete(cleanSrc);
      reject(err);
    };
    img.src = cleanSrc;
  });

  imageElementCache.set(cleanSrc, promise);
  return promise;
}

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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

export default function StickerBottlePreview({
  stickerImageUrl,
  bottleConfig,
  alt,
  className = '',
}: StickerBottlePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);

    Promise.all([
      loadCachedImage(bottleConfig.bottleImageUrl),
      loadCachedImage(stickerImageUrl),
    ])
      .then(([bottleImg, stickerImg]) => {
        if (cancelled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const CW = 800;
        const CH = 800;
        canvas.width = CW;
        canvas.height = CH;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Draw the studio bottle photograph (800x800)
        ctx.clearRect(0, 0, CW, CH);
        ctx.drawImage(bottleImg, 0, 0, CW, CH);

        // 2. Extract the exact 636x600 die-cut Cricut sticker from the 880x880 studio image
        const SRC_X = 122;
        const SRC_Y = 140;
        const SRC_W = 636;
        const SRC_H = 600;
        const CORNER_R = 27;

        const stickerOff = document.createElement('canvas');
        stickerOff.width = SRC_W;
        stickerOff.height = SRC_H;
        const sCtx = stickerOff.getContext('2d');
        if (!sCtx) return;

        sCtx.imageSmoothingEnabled = true;
        sCtx.imageSmoothingQuality = 'high';
        traceRoundedRect(sCtx, 0, 0, SRC_W, SRC_H, CORNER_R);
        sCtx.clip();
        sCtx.drawImage(stickerImg, SRC_X, SRC_Y, SRC_W, SRC_H, 0, 0, SRC_W, SRC_H);

        // Apply subtle cylindrical surface shading & studio highlight over the sticker
        const shadeGrad = sCtx.createLinearGradient(0, 0, SRC_W, 0);
        shadeGrad.addColorStop(0, 'rgba(15, 23, 42, 0.08)');
        shadeGrad.addColorStop(0.18, 'rgba(15, 23, 42, 0.01)');
        shadeGrad.addColorStop(0.36, 'rgba(255, 255, 255, 0.05)');
        shadeGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.0)');
        shadeGrad.addColorStop(0.84, 'rgba(15, 23, 42, 0.025)');
        shadeGrad.addColorStop(1, 'rgba(15, 23, 42, 0.095)');
        sCtx.fillStyle = shadeGrad;
        sCtx.fillRect(0, 0, SRC_W, SRC_H);

        // 3. Render onto the bottle with smooth sub-pixel cylindrical curvature and paper contact shadow
        const tw = bottleConfig.targetWidth;
        const th = bottleConfig.targetHeight;
        const startX = bottleConfig.cx - tw / 2;
        const startY = bottleConfig.cy - th / 2;
        const sag = bottleConfig.sagitta;
        const slices = 64;
        const sliceSrcW = SRC_W / slices;
        const sliceDstW = tw / slices;

        // Soft paper contact drop shadow behind sticker
        ctx.save();
        ctx.filter = 'blur(2.5px)';
        ctx.globalAlpha = 0.22;
        for (let i = 0; i < slices; i++) {
          const u = ((i + 0.5) / slices) * 2 - 1;
          const dy = sag * (1 - u * u);
          ctx.drawImage(
            stickerOff,
            i * sliceSrcW,
            0,
            sliceSrcW,
            SRC_H,
            startX + i * sliceDstW,
            startY + dy + 2.2,
            sliceDstW + 0.45,
            th
          );
        }
        ctx.restore();

        // Crisp sticker slices with sub-pixel smoothing
        ctx.save();
        for (let i = 0; i < slices; i++) {
          const u = ((i + 0.5) / slices) * 2 - 1;
          const dy = sag * (1 - u * u);
          ctx.drawImage(
            stickerOff,
            i * sliceSrcW,
            0,
            sliceSrcW,
            SRC_H,
            startX + i * sliceDstW,
            startY + dy,
            sliceDstW + 0.35,
            th
          );
        }
        ctx.restore();

        setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [stickerImageUrl, bottleConfig]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-white ${className}`}>
      <canvas
        ref={canvasRef}
        aria-label={alt || `${bottleConfig.name} con etiqueta`}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!isLoaded && (
        <img
          src={bottleConfig.bottleImageUrl}
          alt={alt || bottleConfig.name}
          className="absolute inset-0 w-full h-full object-contain opacity-60"
        />
      )}
    </div>
  );
}
