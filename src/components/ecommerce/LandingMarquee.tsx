'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Beaker, Sparkles, Box, Droplet, Star } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { getProductImage } from '@/lib/perfumeImages';

export default function LandingMarquee() {
  const [productImages, setProductImages] = useState<string[]>([]);
  const [bottleImages, setBottleImages] = useState<string[]>([]);

  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          // Extraer esencias
          const esencias = data.products
            .filter((p: ProductItem) => p.category === 'Esencias para Perfume')
            .map((p: ProductItem) => getProductImage(p))
            .filter(Boolean);
            
          // Extraer botes
          const botes = data.products
            .filter((p: ProductItem) => p.category === 'Botes' || p.category === 'Botes & Envases')
            .map((p: ProductItem) => getProductImage(p))
            .filter(Boolean);

          setProductImages([...new Set(esencias)].slice(0, 8)); // 8 imagenes únicas
          setBottleImages([...new Set(botes)].slice(0, 8));     // 8 imagenes únicas
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
    { text: "Contratipos de Diseñador", icon: <Star className="w-5 h-5 text-amber-500" /> },
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

  const renderTextMarquee = (items: typeof itemsTop) => {
    return [...items, ...items, ...items].map((item, idx) => (
      <div key={idx} className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-slate-200 shadow-xs px-6 py-3 rounded-2xl whitespace-nowrap shrink-0">
        {item.icon}
        <span className="font-bold text-slate-700">{item.text}</span>
      </div>
    ));
  };

  const renderImageMarquee = (images: string[]) => {
    // Si no hay imágenes todavía, mostramos unos placeholders
    const items = images.length > 0 ? images : Array(8).fill('/images/essence_bottle_blank.webp');
    return [...items, ...items, ...items].map((src, idx) => (
      <div key={idx} className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden p-2">
        <img src={src} alt="Producto Aromaniak" className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" />
      </div>
    ));
  };

  return (
    <div className="w-full mt-10">
      {/* CSS Animaciones */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          display: flex;
          width: max-content;
          animation: marquee-left 40s linear infinite;
        }
        .animate-marquee-right {
          display: flex;
          width: max-content;
          animation: marquee-right 45s linear infinite;
        }
        
      `}} />

      {/* Botón principal */}
      <Link 
        href="/"
        className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:scale-105 hover:bg-indigo-700 transition-all active:scale-95 text-lg mb-16"
      >
        Ver Catálogo de Productos
        <ArrowRight className="w-6 h-6" />
      </Link>

      {/* Contenedor Global de Carruseles */}
      <div className="relative w-full overflow-hidden flex flex-col gap-6 py-4">
        {/* Degradados laterales */}
        <div className="absolute top-0 left-0 w-16 md:w-40 h-full bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 md:w-40 h-full bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

        {/* 1. Carrusel de Texto Izquierda */}
        <div className="animate-marquee-left gap-4">
          {renderTextMarquee(itemsTop)}
        </div>

        {/* 2. Carrusel de Botellas (Fotos) Derecha */}
        <div className="animate-marquee-right gap-4 mt-4">
          {renderImageMarquee(bottleImages.length > 0 ? bottleImages : ['/images/essence_bottle_blank.webp'])}
        </div>

        {/* 3. Carrusel de Esencias (Fotos) Izquierda */}
        <div className="animate-marquee-left gap-4" style={{ animationDirection: 'reverse' }}>
          {renderImageMarquee(productImages.length > 0 ? productImages : ['/images/essence_bottle_blank.webp'])}
        </div>

        {/* 4. Carrusel de Texto Derecha */}
        <div className="animate-marquee-right gap-4 mt-4">
          {renderTextMarquee(itemsBottom)}
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
