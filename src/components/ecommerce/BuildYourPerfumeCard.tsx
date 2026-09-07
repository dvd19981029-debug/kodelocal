'use client';

import React from 'react';
import { Sparkles, Wand2, ArrowRight } from 'lucide-react';

interface BuildYourPerfumeCardProps {
  onOpenBuilder: () => void;
}

export default function BuildYourPerfumeCard({ onOpenBuilder }: BuildYourPerfumeCardProps) {
  return (
    <div 
      onClick={onOpenBuilder}
      className="col-span-2 clay-card bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-amber-300 ring-2 ring-amber-400/40 shadow-[0_0_22px_rgba(251,191,36,0.32),8px_10px_20px_var(--clay-shadow-dark),-6px_-6px_16px_var(--clay-shadow-light)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5),10px_14px_24px_var(--clay-shadow-dark)] relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-all duration-300 flex items-center justify-between gap-3 sm:gap-5"
    >
      {/* Resplandor dorado suave en las esquinas */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-300/25 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-amber-200/20 blur-xl pointer-events-none" />

      {/* Lado izquierdo: Contenido conciso y directo (sin saturación de texto) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center space-y-1 sm:space-y-1.5 min-w-0">
        
        {/* Badges superiores estilo Clay */}
        <div className="flex items-center gap-1.5">
          <span className="clay-badge bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider py-0.5 px-2">
            <Sparkles className="w-3 h-3 fill-slate-950" />
            <span>Especial</span>
          </span>
          <span className="clay-badge bg-amber-50 text-amber-900 border border-amber-200 text-[10px] sm:text-xs font-black font-mono py-0.5 px-2">
            $15.00
          </span>
        </div>

        {/* Título de la tarjeta */}
        <h3 className="text-sm sm:text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
          <span>Arma tu propio perfume</span>
          <span className="text-amber-500 text-sm sm:text-base">✨</span>
        </h3>

        {/* Texto mínimo y conciso */}
        <p className="text-[10.5px] sm:text-xs text-slate-600 font-semibold leading-snug">
          1 oz de esencia pura + frasco de 100ml + fijador.
        </p>

        {/* Botón de acción estilo Clay */}
        <div className="pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBuilder();
            }}
            className="clay-btn clay-btn-primary px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-black rounded-xl text-white flex items-center gap-1.5 shadow-md group-hover:scale-105 active:scale-95 transition-all cursor-pointer w-fit"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Personalizar ($15)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* Lado derecho: Visual estético de frasco de 100ml */}
      <div className="relative z-10 shrink-0 flex items-center justify-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-slate-50 border border-amber-200/80 shadow-inner flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
          <img
            src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&q=80"
            alt="Frasco 100ml"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute bottom-1 bg-black/60 backdrop-blur-xs text-[8px] sm:text-[9px] font-black text-amber-200 px-1.5 py-0.5 rounded-full">
            100 ml
          </div>
        </div>
      </div>

    </div>
  );
}
