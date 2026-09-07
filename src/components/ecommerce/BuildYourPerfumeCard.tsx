'use client';

import React from 'react';
import { Sparkles, Wand2, ArrowRight, Droplets, Clock } from 'lucide-react';

interface BuildYourPerfumeCardProps {
  onOpenBuilder: () => void;
}

export default function BuildYourPerfumeCard({ onOpenBuilder }: BuildYourPerfumeCardProps) {
  return (
    <div
      onClick={onOpenBuilder}
      className="col-span-2 group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
    >
      {/* Marco Exterior de Oro Real Líquido / Bisel Dorado Metálico */}
      <div className="p-[3.5px] rounded-[1.85rem] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.45),0_12px_28px_rgba(217,119,6,0.3)] group-hover:shadow-[0_0_42px_rgba(245,158,11,0.65),0_14px_32px_rgba(217,119,6,0.4)] transition-shadow duration-300">
        
        {/* Cuerpo Interior Claymorphic 100% auténtico */}
        <div className="clay-card bg-white w-full h-full rounded-[1.65rem] p-5 sm:p-6 md:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5 border border-amber-200/90 min-h-[230px] sm:min-h-[260px]">
          
          {/* Resplandor áureo ambiental en esquinas */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-300/25 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-yellow-200/30 blur-2xl pointer-events-none" />

          {/* Lado Izquierdo: Información de Alto Impacto para Venta */}
          <div className="relative z-10 flex-1 flex flex-col justify-between space-y-3 w-full">
            
            {/* Badges superiores Clay con destello dorado */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="clay-badge bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider py-1 px-3 shadow-md">
                <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Servicio Estrella</span>
              </span>

              <span className="clay-badge bg-amber-50 text-amber-950 border border-amber-300/80 text-xs sm:text-sm font-black font-mono py-1 px-3 shadow-2xs">
                $15.00 Fijo
              </span>
            </div>

            {/* Título Principal Atractivo y Grande */}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                Arma tu propio perfume
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1 leading-relaxed max-w-lg">
                Te lo preparamos al momento con <strong>1 onza de contratipo puro</strong>, <strong>frasco de vidrio de 100ml</strong> a tu elección y <strong>alcohol con fijador</strong> (8 a 12 horas).
              </p>
            </div>

            {/* Pills de características clave (100% Unisex y estilo Clay) */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-xs font-bold text-slate-700">
              <div className="clay-badge bg-slate-50 text-slate-800 border border-slate-200/80 py-1 px-2.5">
                <Droplets className="w-3.5 h-3.5 text-indigo-600" />
                <span>1 Oz Esencia Pura</span>
              </div>
              <div className="clay-badge bg-slate-50 text-slate-800 border border-slate-200/80 py-1 px-2.5">
                <span className="text-xs">🧴</span>
                <span>Frasco 100ml Incluido</span>
              </div>
              <div className="clay-badge bg-slate-50 text-slate-800 border border-slate-200/80 py-1 px-2.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fijación 8-12h</span>
              </div>
            </div>

            {/* Botón Clay 3D de Acción Inmediata */}
            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBuilder();
                }}
                className="clay-btn clay-btn-primary px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-black rounded-2xl text-white flex items-center gap-2.5 shadow-[0_6px_20px_rgba(79,70,229,0.35)] group-hover:scale-105 active:scale-95 transition-all cursor-pointer w-fit"
              >
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>Personalizar mi perfume ($15)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>

          {/* Lado Derecho: Vitrina Visual con Frasco de Vidrio de 100ml */}
          <div className="relative z-10 shrink-0 flex items-center justify-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-50 border-2 border-amber-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.1),0_8px_16px_rgba(245,158,11,0.2)] flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&q=85"
                alt="Frasco de perfume 100ml de vidrio"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-2 bg-slate-950/75 backdrop-blur-xs text-[10px] sm:text-xs font-black text-amber-300 px-2.5 py-1 rounded-full border border-amber-400/40 shadow-md">
                100 ml Vidrio
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
