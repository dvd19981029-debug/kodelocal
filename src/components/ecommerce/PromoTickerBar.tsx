'use client';

import React from 'react';
import { Sparkles, MapPin, Wand2, Droplets } from 'lucide-react';

interface TickerItem {
  id: string;
  content: React.ReactNode;
}

const TICKER_ITEMS: TickerItem[] = [
  {
    id: 'c807',
    content: (
      <div className="inline-flex items-center gap-2 text-xs font-black text-white shrink-0">
        {/* Mini Camioncito 2D Estilo Claymorphic */}
        <div className="relative inline-flex items-center justify-center drop-shadow-xs transform hover:scale-110 transition-transform">
          <svg 
            className="w-7 h-5 animate-pulse" 
            viewBox="0 0 48 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="24" cy="30" rx="20" ry="2" fill="rgba(0,0,0,0.3)" />
            <rect x="2" y="6" width="30" height="19" rx="4" fill="#8b5cf6" />
            <path d="M30 11H40C42.2091 11 44 12.7909 44 15V25H30V11Z" fill="#7c3aed" />
            <path d="M32 13H39C40.1046 13 41 13.8954 41 15V18H32V13Z" fill="#ede9fe" />
            <circle cx="11" cy="25" r="4.5" fill="#1e1b4b" />
            <circle cx="11" cy="25" r="2" fill="#ede9fe" />
            <circle cx="35" cy="25" r="4.5" fill="#1e1b4b" />
            <circle cx="35" cy="25" r="2" fill="#ede9fe" />
            <rect x="42" y="19" width="3" height="3" rx="1.5" fill="#fde047" />
            <rect x="8" y="10" width="16" height="7" rx="2" fill="#ffffff" />
            <text x="10" y="15.5" fill="#6d28d9" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">C807</text>
          </svg>
        </div>
        
        <span className="bg-white text-[#7c3aed] text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
          C807
        </span>
        <span>Entregas a todo El Salvador con <strong className="text-purple-100 font-black">C807</strong> <span className="text-purple-200 font-semibold">(en serio, a todo el país)</span></span>
      </div>
    ),
  },
  {
    id: 'esencias',
    content: (
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white shrink-0">
        <Droplets className="w-3.5 h-3.5 text-purple-200" />
        <span>Esencias <strong className="text-purple-100 font-black">100% Puras</strong> de Máxima Calidad y Concentración</span>
      </div>
    ),
  },
  {
    id: 'arma-perfume',
    content: (
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white shrink-0">
        <Wand2 className="w-3.5 h-3.5 text-amber-300" />
        <span>Arma tu propio perfume con frasco de 100ml por solo <strong className="text-amber-300 font-black">$15.00</strong></span>
      </div>
    ),
  },
  {
    id: 'cobertura',
    content: (
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white shrink-0">
        <MapPin className="w-3.5 h-3.5 text-rose-300" />
        <span>Llegamos a los 14 departamentos de El Salvador</span>
      </div>
    ),
  },
];

export default function PromoTickerBar() {
  return (
    <div className="w-full bg-[#7c3aed] border-b border-purple-600 shadow-sm overflow-hidden relative py-1.5 select-none">
      
      {/* Contenedor del Ticker: Inicia desde la derecha de la pantalla y se desplaza de continuo */}
      <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
        {/* Set 1 */}
        {TICKER_ITEMS.map((item) => (
          <React.Fragment key={`first-${item.id}`}>
            {item.content}
            <span className="text-purple-200 font-bold">•</span>
          </React.Fragment>
        ))}
        {/* Set 2 */}
        {TICKER_ITEMS.map((item) => (
          <React.Fragment key={`second-${item.id}`}>
            {item.content}
            <span className="text-purple-400/80 font-bold">•</span>
          </React.Fragment>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 28s linear infinite;
          will-change: transform;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
