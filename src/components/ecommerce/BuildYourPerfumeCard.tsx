'use client';

import React from 'react';
import { Wand2, ArrowRight } from 'lucide-react';

interface BuildYourPerfumeCardProps {
  onOpenBuilder: () => void;
}

export default function BuildYourPerfumeCard({ onOpenBuilder }: BuildYourPerfumeCardProps) {
  return (
    <div
      onClick={onOpenBuilder}
      className="col-span-2 group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
    >
      {/* Marco con orillas doradas reales */}
      <div className="p-[2.5px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.32)] group-hover:shadow-[0_0_28px_rgba(245,158,11,0.5)] transition-shadow duration-300">
        
        {/* Cuerpo Interior Claymorphic limpio y compacto */}
        <div className="clay-card bg-white w-full h-full rounded-[0.95rem] sm:rounded-[1.4rem] p-3.5 sm:p-4 relative overflow-hidden flex items-center justify-between gap-3 sm:gap-5 border border-amber-200/80">
          
          {/* Brillo sutil en esquina */}
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-300/20 blur-xl pointer-events-none" />

          {/* Información directa y limpia (sin burbujas distractoras) */}
          <div className="relative z-10 flex-1 flex flex-col justify-center space-y-1.5 min-w-0">
            
            {/* Título */}
            <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Arma tu propio perfume
            </h2>

            {/* Descripción concisa (sin afirmaciones de horas de fijación) */}
            <p className="text-[11px] sm:text-xs text-slate-600 font-semibold leading-snug max-w-md">
              1 oz pura de tu contratipo favorito, frasco de 100ml a elegir y alcohol con fijador.
            </p>

            {/* Única burbuja principal: Botón con precio en verdecito */}
            <div className="pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBuilder();
                }}
                className="clay-btn clay-btn-primary px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-black text-white flex items-center gap-2 shadow-md group-hover:scale-105 active:scale-95 transition-all cursor-pointer w-fit"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Armar mi propio perfume</span>
                <span className="bg-emerald-500 text-white font-mono px-2 py-0.5 rounded-full text-[10.5px] sm:text-xs font-black shadow-xs">
                  $15.00
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

          {/* Frasco de vidrio de 100ml compacto y estilizado */}
          <div className="relative z-10 shrink-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-50 border border-amber-300/90 shadow-inner flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&q=80"
                alt="Frasco de vidrio 100ml"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-1 bg-slate-950/70 backdrop-blur-xs text-[8px] sm:text-[9px] font-black text-amber-300 px-1.5 py-0.2 rounded-full">
                100 ml
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
