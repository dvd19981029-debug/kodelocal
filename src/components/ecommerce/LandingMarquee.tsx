'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Beaker, Sparkles, Box, Droplet, Star } from 'lucide-react';

export default function LandingMarquee() {
  const itemsTop = [
    { text: "Esencias Puras AAA+", icon: <Droplet className="w-5 h-5 text-indigo-500" /> },
    { text: "Frascos de Lujo", icon: <Box className="w-5 h-5 text-emerald-500" /> },
    { text: "Contratipos de Diseñador", icon: <Star className="w-5 h-5 text-amber-500" /> },
    { text: "Alcohol Perfumista", icon: <Beaker className="w-5 h-5 text-blue-500" /> },
    { text: "Calidad Europea", icon: <Sparkles className="w-5 h-5 text-purple-500" /> },
  ];

  const itemsBottom = [
    { text: "Más de 500 Aromas", icon: <Droplet className="w-5 h-5 text-pink-500" /> },
    { text: "Envíos a todo El Salvador", icon: <TruckIcon className="w-5 h-5 text-sky-500" /> },
    { text: "Precios Mayoristas", icon: <BadgePercent className="w-5 h-5 text-green-500" /> },
    { text: "Atomizadores Premium", icon: <Box className="w-5 h-5 text-rose-500" /> },
    { text: "Asesoría Personalizada", icon: <Star className="w-5 h-5 text-orange-500" /> },
  ];

  // Helper para duplicar el arreglo y hacer el efecto infinito
  const renderMarqueeItems = (items: typeof itemsTop) => {
    return [...items, ...items, ...items].map((item, idx) => (
      <div key={idx} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-slate-100 shadow-sm px-6 py-3 rounded-2xl whitespace-nowrap shrink-0">
        {item.icon}
        <span className="font-bold text-slate-700">{item.text}</span>
      </div>
    ));
  };

  return (
    <div className="w-full mt-10">
      {/* Botón principal que lleva a la Home */}
      <Link 
        href="/"
        className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:scale-105 hover:bg-indigo-700 transition-all active:scale-95 text-lg mb-16"
      >
        Ver Catálogo de Productos
        <ArrowRight className="w-6 h-6" />
      </Link>

      {/* CSS para la animación infinita si Tailwind no lo tiene por defecto */}
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
          width: 200%;
          animation: marquee-left 30s linear infinite;
        }
        .animate-marquee-right {
          display: flex;
          width: 200%;
          animation: marquee-right 30s linear infinite;
        }
        .animate-marquee-left:hover, .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}} />

      {/* Carruseles Infinitos de Variedad */}
      <div className="relative w-full overflow-hidden flex flex-col gap-4 py-4 mask-edges">
        {/* Degradados laterales para suavizar la entrada y salida */}
        <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

        {/* Fila 1 moviéndose a la izquierda */}
        <div className="animate-marquee-left gap-4">
          {renderMarqueeItems(itemsTop)}
        </div>

        {/* Fila 2 moviéndose a la derecha */}
        <div className="animate-marquee-right gap-4">
          {renderMarqueeItems(itemsBottom)}
        </div>
      </div>
    </div>
  );
}

// Iconos adicionales locales para no engordar la importación principal
function TruckIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
}
function BadgePercent(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m15 9-6 6"/><path d="M9 9h.01"/><path d="M15 15h.01"/></svg>;
}
