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
      className="w-full clay-card bg-white rounded-2xl sm:rounded-3xl border-2 border-amber-400 ring-2 ring-amber-300/40 shadow-[0_4px_24px_rgba(245,158,11,0.22)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.35)] p-4 sm:p-5 relative overflow-hidden group cursor-pointer hover:scale-[1.005] hover:border-amber-500 transition-all duration-300 flex items-center justify-between gap-4 sm:gap-6 min-h-[160px] sm:min-h-[175px]"
    >
      {/* Resplandor áureo sutil de fondo */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-amber-100/30 blur-xl pointer-events-none" />

      {/* Contenido textual a la izquierda */}
      <div className="relative z-10 flex-1 flex flex-col justify-center space-y-2 min-w-0">
        
        {/* Título y Precio 'por solo $15' fuera del botón */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              Arma tu propio perfume
            </h2>
            <span className="text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-300/80 px-2.5 py-0.5 rounded-full shadow-2xs">
              por solo $15
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1 leading-snug max-w-md">
            1 oz pura de tu contratipo favorito, frasco de 100ml a elegir y alcohol con fijador.
          </p>
        </div>

        {/* Botón de acción limpio y estilizado (sin precio adentro) */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBuilder();
            }}
            className="clay-btn clay-btn-primary px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-black text-white flex items-center gap-2 shadow-md group-hover:scale-105 active:scale-95 transition-all cursor-pointer w-fit"
          >
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>Armar mi propio perfume</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* Vitrina dual: Bote Contratipo + Frasco Atomizador 100ml */}
      <div className="relative z-10 shrink-0 flex items-center justify-center">
        <div className="relative flex items-center group-hover:scale-105 transition-transform duration-300">
          
          {/* 1. Bote Contratipo (Esencia pura concentrada) */}
          <div className="relative z-10 -mr-2 sm:-mr-3 w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-2xl overflow-hidden bg-white border-2 border-amber-300 shadow-md flex items-center justify-center">
            <img
              src="/images/esencias/esencia_1.webp"
              alt="Bote Contratipo Esencia"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = '/images/essence_bottle_blank.webp';
              }}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute bottom-1 bg-slate-950/80 backdrop-blur-xs text-[7.5px] sm:text-[8.5px] font-black text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/40 tracking-tight">
              Contratipo
            </div>
          </div>

          {/* Símbolo "+" conector dorado */}
          <div className="relative z-30 -mx-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs flex items-center justify-center shadow-md border-2 border-white">
            +
          </div>

          {/* 2. Frasco Atomizador de 100ml */}
          <div className="relative z-20 -ml-2 sm:-ml-3 w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-2xl overflow-hidden bg-white border-2 border-amber-300 shadow-md flex items-center justify-center">
            <img
              src="/images/botes/bote_100ml_sauvage_degrade_negro.jpg"
              alt="Frasco de perfume 100ml"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = '/images/botes/bote_100ml_sauvage_degrade_negro.jpg';
              }}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute bottom-1 bg-slate-950/80 backdrop-blur-xs text-[7.5px] sm:text-[8.5px] font-black text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/40 tracking-tight">
              100 ml
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
