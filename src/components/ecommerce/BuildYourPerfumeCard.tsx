'use client';

import React from 'react';
import { Sparkles, PackageCheck, Droplets, ShieldCheck, ArrowRight, Wand2 } from 'lucide-react';

interface BuildYourPerfumeCardProps {
  onOpenBuilder: () => void;
}

export default function BuildYourPerfumeCard({ onOpenBuilder }: BuildYourPerfumeCardProps) {
  return (
    <div 
      onClick={onOpenBuilder}
      className="col-span-2 clay-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50/90 via-purple-50/70 to-indigo-50/90 border-2 border-amber-300/90 shadow-[0_0_22px_rgba(251,191,36,0.35)] ring-2 ring-amber-400/60 relative overflow-hidden group cursor-pointer hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(251,191,36,0.55)] transition-all duration-300 flex flex-col justify-between"
    >
      {/* Resplandor dorado animado en las orillas */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-400/10 via-pink-400/10 to-indigo-400/10 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-amber-300/30 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      
      {/* Contenido superior de la tarjeta */}
      <div className="relative z-10 space-y-2">
        
        {/* Badges superiores con brillo dorado */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Servicio Especial</span>
          </span>

          <span className="text-xs sm:text-sm font-black font-mono bg-white/95 px-2.5 py-0.5 rounded-xl text-indigo-700 border border-amber-300 shadow-2xs">
            $15.00 Fijo
          </span>
        </div>

        {/* Título Oficial */}
        <div>
          <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Arma tu propio perfume</span>
            <span className="text-base sm:text-xl">✨</span>
          </h3>
          <p className="text-[11.5px] sm:text-xs text-slate-600 font-semibold mt-0.5 leading-snug">
            ¿Lo quieres listo para usar? Preparamos tu fragancia personalizada con <strong>1 onza de esencia pura</strong>, <strong>frasco de 100ml</strong> con atomizador y <strong>alcohol con fijador</strong> (8 a 12h).
          </p>
        </div>

        {/* Mini etiquetas de lo que incluye */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[9.5px] sm:text-[10.5px] font-bold text-slate-700">
          <div className="bg-white/90 p-1.5 rounded-xl border border-amber-200/80 shadow-2xs flex items-center gap-1">
            <span>🌸</span>
            <span className="truncate">1 Onza Esencia Pura</span>
          </div>
          <div className="bg-white/90 p-1.5 rounded-xl border border-amber-200/80 shadow-2xs flex items-center gap-1">
            <span>🧴</span>
            <span className="truncate">Frasco 100ml Incluido</span>
          </div>
          <div className="bg-white/90 p-1.5 rounded-xl border border-amber-200/80 shadow-2xs flex items-center gap-1">
            <span>🧪</span>
            <span className="truncate">Fijador 8-12h</span>
          </div>
          <div className="bg-gradient-to-r from-amber-100 to-amber-50 p-1.5 rounded-xl border border-amber-300 text-amber-950 font-black shadow-2xs flex items-center gap-1">
            <span>💎</span>
            <span className="truncate">Opción PLUS (+$3)</span>
          </div>
        </div>

      </div>

      {/* Botón inferior grande de acción */}
      <div className="pt-3 mt-2 border-t border-amber-200/60 relative z-10 flex items-center justify-between gap-3">
        <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">
          Elige contratipo, frasco y etiqueta en 3 pasos sencillos
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenBuilder();
          }}
          className="clay-btn bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 !text-white px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.4)] group-hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Wand2 className="w-4 h-4 text-amber-300" />
          <span>Armar mi perfume ($15)</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
