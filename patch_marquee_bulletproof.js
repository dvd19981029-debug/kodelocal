const fs = require('fs');
const path = 'src/components/ecommerce/LandingMarquee.tsx';
let code = fs.readFileSync(path, 'utf8');

// We need to rewrite the marquee structure
const newContent = `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Beaker, Sparkles, Box, Droplet, Star } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { getProductImage } from '@/lib/perfumeImages';

type MarqueeProduct = { name: string, image: string };

export default function LandingMarquee() {
  const [productImages, setProductImages] = useState<MarqueeProduct[]>([]);
  const [bottleImages, setBottleImages] = useState<MarqueeProduct[]>([]);

  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          const esencias = data.products
            .filter((p: ProductItem) => p.category === 'Esencias para Perfume')
            .map((p: ProductItem) => ({ name: p.name, image: getProductImage(p) }))
            .filter((p: MarqueeProduct) => p.image);
            
          const botes = data.products
            .filter((p: ProductItem) => p.category === 'Botes' || p.category === 'Botes & Envases')
            .map((p: ProductItem) => ({ name: p.name, image: getProductImage(p) }))
            .filter((p: MarqueeProduct) => p.image);

          const uniqueEsencias = esencias.filter((v: MarqueeProduct, i: number, a: MarqueeProduct[]) => a.findIndex(t => (t.name === v.name)) === i);
          const uniqueBotes = botes.filter((v: MarqueeProduct, i: number, a: MarqueeProduct[]) => a.findIndex(t => (t.name === v.name)) === i);

          setProductImages(uniqueEsencias.slice(0, 10)); 
          setBottleImages(uniqueBotes.slice(0, 10));     
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadImages();
  }, []);

  const itemsTop = [
    { text: "Esencias Puras AAA+", icon: <Droplet className="w-5 h-5 text-indigo-500" /> },
    { text: "Frascos de Lujo", icon: <Box className="w-5 h-5 text-emerald-500" /> },
    { text: "Inspiraciones de Diseñador", icon: <Star className="w-5 h-5 text-amber-500" /> },
    { text: "Alcohol Perfumista", icon: <Beaker className="w-5 h-5 text-blue-500" /> },
    { text: "Calidad Europea", icon: <Sparkles className="w-5 h-5 text-purple-500" /> },
  ];

  const itemsBottom = [
    { text: "Extenso Catálogo de Aromas", icon: <Droplet className="w-5 h-5 text-pink-500" /> },
    { text: "Envíos a todo El Salvador", icon: <TruckIcon className="w-5 h-5 text-sky-500" /> },
    { text: "Precios Mayoristas", icon: <BadgePercent className="w-5 h-5 text-green-500" /> },
    { text: "Atomizadores Premium", icon: <Box className="w-5 h-5 text-rose-500" /> },
    { text: "Asesoría Personalizada", icon: <Star className="w-5 h-5 text-orange-500" /> },
  ];

  const renderTextItems = (items: typeof itemsTop) => {
    return items.map((item, idx) => (
      <div key={idx} className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-slate-200 shadow-xs px-5 py-2.5 rounded-2xl whitespace-nowrap shrink-0">
        {item.icon}
        <span className="font-bold text-slate-700 text-sm sm:text-base">{item.text}</span>
      </div>
    ));
  };

  const renderImageItems = (products: MarqueeProduct[]) => {
    const safeProducts = products.length > 0 ? products : Array(10).fill({ name: "Cargando...", image: '/images/essence_bottle_blank.webp' });
    return safeProducts.map((prod, idx) => (
      <div key={idx} className="w-32 h-36 sm:w-40 sm:h-44 shrink-0 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-between overflow-hidden p-3 gap-2">
        <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
          <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
        </div>
        <span className="text-xs sm:text-sm font-bold text-slate-600 text-center w-full truncate px-1">
          {prod.name}
        </span>
      </div>
    ));
  };

  return (
    <div className="w-full mt-10">
      <style dangerouslySetInnerHTML={{__html: \`
        @keyframes scrollX {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100% - 1rem)); } /* 1rem is the gap-4 */
        }
        .animate-marquee {
          animation: scrollX 25s linear infinite;
        }
        .scroll-reverse {
          animation-direction: reverse;
        }
      \`}} />

      <Link 
        href="/"
        className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-black shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:scale-105 hover:bg-indigo-700 transition-all active:scale-95 text-base sm:text-lg mb-12"
      >
        Ver Catálogo de Productos
        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </Link>

      <div className="relative w-full overflow-hidden flex flex-col gap-4 py-4">
        <div className="absolute top-0 left-0 w-24 sm:w-40 h-full bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-24 sm:w-40 h-full bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

        {/* 1. Texto hacia la Izquierda */}
        <div className="flex overflow-hidden gap-4">
          <div className="flex animate-marquee shrink-0 gap-4">
            {renderTextItems([...itemsTop, ...itemsTop])}
          </div>
          <div aria-hidden="true" className="flex animate-marquee shrink-0 gap-4">
            {renderTextItems([...itemsTop, ...itemsTop])}
          </div>
        </div>

        {/* 2. Botellas hacia la Derecha (Intercalado) */}
        <div className="flex overflow-hidden gap-4">
          <div className="flex animate-marquee scroll-reverse shrink-0 gap-4">
            {renderImageItems([...bottleImages, ...bottleImages])}
          </div>
          <div aria-hidden="true" className="flex animate-marquee scroll-reverse shrink-0 gap-4">
            {renderImageItems([...bottleImages, ...bottleImages])}
          </div>
        </div>

        {/* 3. Esencias hacia la Izquierda (Intercalado) */}
        <div className="flex overflow-hidden gap-4">
          <div className="flex animate-marquee shrink-0 gap-4">
            {renderImageItems([...productImages, ...productImages])}
          </div>
          <div aria-hidden="true" className="flex animate-marquee shrink-0 gap-4">
            {renderImageItems([...productImages, ...productImages])}
          </div>
        </div>

        {/* 4. Texto hacia la Derecha (Intercalado) */}
        <div className="flex overflow-hidden gap-4">
          <div className="flex animate-marquee scroll-reverse shrink-0 gap-4">
            {renderTextItems([...itemsBottom, ...itemsBottom])}
          </div>
          <div aria-hidden="true" className="flex animate-marquee scroll-reverse shrink-0 gap-4">
            {renderTextItems([...itemsBottom, ...itemsBottom])}
          </div>
        </div>
      </div>
    </div>
  );
}

function TruckIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
}
function BadgePercent(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m15 9-6 6"/><path d="M9 9h.01"/><path d="M15 15h.01"/></svg>;
}
`;

fs.writeFileSync(path, newContent);
