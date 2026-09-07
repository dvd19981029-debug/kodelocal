'use client';

import React from 'react';
import { Sparkles, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function PromoTickerBar() {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 border-b border-white/80 shadow-2xs overflow-hidden relative py-1.5 select-none backdrop-blur-xs">
      
      {/* Contenedor del Ticker Marquee Continuo */}
      <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
        
        {/* Item 1: Camioncito C807 */}
        <div className="inline-flex items-center gap-2 text-xs font-black text-slate-800 shrink-0">
          {/* Mini Camioncito 2D Estilo Claymorphic */}
          <div className="relative inline-flex items-center justify-center drop-shadow-xs transform hover:scale-110 transition-transform">
            <svg 
              className="w-7 h-5 animate-pulse" 
              viewBox="0 0 48 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Sombra suave debajo del camión */}
              <ellipse cx="24" cy="30" rx="20" ry="2" fill="rgba(99,102,241,0.2)" />
              
              {/* Cabina y Carrocería Claymorphic */}
              <rect x="2" y="6" width="30" height="19" rx="4" fill="#6366f1" />
              <path d="M30 11H40C42.2091 11 44 12.7909 44 15V25H30V11Z" fill="#4f46e5" />
              
              {/* Ventana de la cabina */}
              <path d="M32 13H39C40.1046 13 41 13.8954 41 15V18H32V13Z" fill="#c7d2fe" />
              
              {/* Ruedas 2D con relieve */}
              <circle cx="11" cy="25" r="4.5" fill="#1e1b4b" />
              <circle cx="11" cy="25" r="2" fill="#e0e7ff" />
              <circle cx="35" cy="25" r="4.5" fill="#1e1b4b" />
              <circle cx="35" cy="25" r="2" fill="#e0e7ff" />
              
              {/* Faro delantero con brillo */}
              <rect x="42" y="19" width="3" height="3" rx="1.5" fill="#fef08a" />
              
              {/* Rótulo C807 en la caja */}
              <rect x="8" y="10" width="16" height="7" rx="2" fill="#ffffff" />
              <text x="10" y="15.5" fill="#4338ca" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">C807</text>
            </svg>
          </div>
          
          <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
            Express SV
          </span>
          <span>Entregas a todo El Salvador con <strong className="text-indigo-700">C807</strong> <span className="text-slate-500 font-semibold">(en serio, a todo el país)</span></span>
        </div>

        {/* Separador */}
        <span className="text-indigo-300 font-bold">•</span>

        {/* Item 2: Pago Contra Entrega */}
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pago Contra Entrega en efectivo al recibir</span>
        </div>

        {/* Separador */}
        <span className="text-indigo-300 font-bold">•</span>

        {/* Item 3: Calidad 33% */}
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Contratipos Premium Franceses (Fijación 8-12 horas)</span>
        </div>

        {/* Separador */}
        <span className="text-indigo-300 font-bold">•</span>

        {/* Item 4: Perfume Preparado $15 */}
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
          <span className="text-sm">💎</span>
          <span>Perfume Preparado con frasco de lujo por solo <strong className="text-indigo-600 font-black">$15.00</strong></span>
        </div>

        {/* Separador */}
        <span className="text-indigo-300 font-bold">•</span>

        {/* Item 5: Cobertura 14 Departamentos */}
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>Llegamos a los 14 departamentos de El Salvador</span>
        </div>

        {/* Separador */}
        <span className="text-indigo-300 font-bold">•</span>

        {/* Duplicado del Item 1 para que el scroll continuo fluya perfecto */}
        <div className="inline-flex items-center gap-2 text-xs font-black text-slate-800 shrink-0">
          <div className="relative inline-flex items-center justify-center drop-shadow-xs">
            <svg 
              className="w-7 h-5 animate-pulse" 
              viewBox="0 0 48 32" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="24" cy="30" rx="20" ry="2" fill="rgba(99,102,241,0.2)" />
              <rect x="2" y="6" width="30" height="19" rx="4" fill="#6366f1" />
              <path d="M30 11H40C42.2091 11 44 12.7909 44 15V25H30V11Z" fill="#4f46e5" />
              <path d="M32 13H39C40.1046 13 41 13.8954 41 15V18H32V13Z" fill="#c7d2fe" />
              <circle cx="11" cy="25" r="4.5" fill="#1e1b4b" />
              <circle cx="11" cy="25" r="2" fill="#e0e7ff" />
              <circle cx="35" cy="25" r="4.5" fill="#1e1b4b" />
              <circle cx="35" cy="25" r="2" fill="#e0e7ff" />
              <rect x="42" y="19" width="3" height="3" rx="1.5" fill="#fef08a" />
              <rect x="8" y="10" width="16" height="7" rx="2" fill="#ffffff" />
              <text x="10" y="15.5" fill="#4338ca" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">C807</text>
            </svg>
          </div>
          <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
            Express SV
          </span>
          <span>Entregas a todo El Salvador con <strong className="text-indigo-700">C807</strong> <span className="text-slate-500 font-semibold">(en serio, a todo el país)</span></span>
        </div>

      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 28s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
