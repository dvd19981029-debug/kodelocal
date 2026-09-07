'use client';

import React from 'react';
import { Sparkles, PackageCheck, Droplets, ShieldCheck, ArrowRight } from 'lucide-react';

interface PerfumeKitBannerProps {
  onOpenKitBuilder: () => void;
}

export default function PerfumeKitBanner({ onOpenKitBuilder }: PerfumeKitBannerProps) {
  return (
    <section className="w-full clay-card p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-50/95 via-purple-50/90 to-pink-50/80 border border-white/95 shadow-md relative overflow-hidden group">
      {/* Glow decorativo sutil en esquina */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-gradient-to-br from-pink-400/20 via-purple-400/20 to-indigo-400/20 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        
        {/* Contenido izquierdo */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-white/95 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
              ✨ Kit Completo · $15.00 Precio Fijo
            </span>
            <span className="text-[10.5px] font-extrabold text-amber-700 bg-amber-100/70 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Listo para usar</span>
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
            ¿Quieres tu perfume ya preparado por solo <span className="text-indigo-600">$15.00</span>?
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Te lo preparamos con <strong>1 onza de tu esencia favorita</strong>, <strong>alcohol con fijador de alta duración (8 a 12 horas)</strong>, el <strong>frasco que tú elijas</strong> y <strong>etiqueta opcional sin costo</strong>. ¿Quieres más potencia? Hazlo versión <strong>PLUS</strong> por solo <strong>+$3.00</strong> (+½ onza extra).
          </p>

          {/* Badges de beneficios del kit */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1 text-[10.5px] sm:text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
              🌸 1 Onza Pura
            </span>
            <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
              🧴 Frasco a Elegir
            </span>
            <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
              🧪 Fijador Incluido
            </span>
            <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
              🏷️ Etiqueta Gratis
            </span>
            <span className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-1 rounded-xl border border-amber-200/70 shadow-2xs font-black">
              💎 PLUS: +½ oz extra (+$3)
            </span>
          </div>
        </div>

        {/* Botón de Acción a la derecha */}
        <div className="shrink-0 flex items-center pt-2 md:pt-0">
          <button
            type="button"
            onClick={onOpenKitBuilder}
            className="w-full md:w-auto clay-btn clay-btn-primary px-6 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(99,102,241,0.35)] group-hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Armar y Comprar Kit ($15)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
}
