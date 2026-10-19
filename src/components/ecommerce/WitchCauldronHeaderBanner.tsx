'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ChevronRight } from 'lucide-react';
import { HALLOWEEN_PROMO_ACTIVE } from '@/lib/halloweenPromo';

/**
 * Ilustración animada 100% SVG + CSS GPU-accelerated (solo transform y opacity)
 * Ultra ligera: 0 videos, 0 loops JS, 0 filtros pesados para fluidez total en celulares y PCs lentas.
 */
export function AnimatedWitchCauldronSVG({ className = 'w-20 h-20 sm:w-24 sm:h-24' }: { className?: string }) {
  return (
    <div className={`relative select-none shrink-0 ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 160 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Resplandor mágico estático detrás del caldero (sin blur dinámico para cuidar GPU) */}
        <circle cx="80" cy="84" r="56" fill="url(#witchGlowGrad)" opacity="0.55" />

        {/* ================= BRUJA AROMANIAKA (DETRÁS DEL CALDERO) ================= */}
        <g className="hw-witch-bob">
          {/* Cabello morado nocturno */}
          <path
            d="M52 52 C40 62, 38 82, 46 92 C50 84, 54 74, 58 66 Z"
            fill="#3b0764"
          />
          <path
            d="M108 52 C120 62, 122 82, 114 92 C110 84, 106 74, 102 66 Z"
            fill="#3b0764"
          />

          {/* Túnica de la bruja */}
          <path
            d="M50 88 C54 70, 106 70, 110 88 L116 105 L44 105 Z"
            fill="#4c1d95"
            stroke="#fb923c"
            strokeWidth="1.5"
          />

          {/* Rostro simpático de la Bruja Aromaniaka */}
          <ellipse cx="80" cy="57" rx="19" ry="17" fill="#fde68a" stroke="#78350f" strokeWidth="1.4" />
          {/* Mejillas mágicas */}
          <circle cx="67" cy="60" r="3" fill="#fb7185" opacity="0.65" />
          <circle cx="93" cy="60" r="3" fill="#fb7185" opacity="0.65" />
          {/* Ojos brillantes */}
          <circle cx="72" cy="55" r="2.6" fill="#1e1b4b" />
          <circle cx="88" cy="55" r="2.6" fill="#1e1b4b" />
          <circle cx="73" cy="54" r="0.9" fill="#ffffff" />
          <circle cx="89" cy="54" r="0.9" fill="#ffffff" />
          {/* Sonrisa pícara */}
          <path d="M74 63 Q80 68 86 63" stroke="#581c87" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Sombrero clásico de bruja */}
          <path
            d="M42 44 Q80 53 118 44 Q100 38 96 36 L83 6 C80 2, 74 5, 71 12 L64 36 Q55 39 42 44 Z"
            fill="#1e1b4b"
            stroke="#f97316"
            strokeWidth="1.6"
          />
          {/* Cinta naranja y hebilla dorada del sombrero */}
          <path d="M62 37 Q80 43 98 37 L96 31 Q80 37 64 31 Z" fill="#ea580c" />
          <rect x="75" y="31" width="10" height="8" rx="1.5" fill="#facc15" stroke="#78350f" strokeWidth="1" />
          <rect x="78" y="33" width="4" height="4" rx="0.5" fill="#1e1b4b" />
        </g>

        {/* ================= CUCHARÓN MÁGICO REVOLVIENDO LA POCIÓN ================= */}
        <g className="hw-ladle-stir">
          {/* Mango del cucharón + mano */}
          <line x1="94" y1="68" x2="72" y2="104" stroke="#92400e" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="94" y1="68" x2="72" y2="104" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="94" cy="69" r="5" fill="#fde68a" stroke="#78350f" strokeWidth="1.3" />
          {/* Destello en la punta del cucharón */}
          <circle cx="96" cy="64" r="2.2" fill="#a855f7" />
        </g>

        {/* ================= BURBUJAS DE POCIÓN SUBIENDO (SOLO TRANSFORM/OPACITY) ================= */}
        <g className="hw-bubble-1">
          <circle cx="64" cy="92" r="5" fill="#4ade80" stroke="#bbf7d0" strokeWidth="1.2" />
        </g>
        <g className="hw-bubble-2">
          <circle cx="82" cy="90" r="6.5" fill="#fb923c" stroke="#fed7aa" strokeWidth="1.2" />
          <text x="82" y="93" textAnchor="middle" fontSize="8" fill="#fff">💘</text>
        </g>
        <g className="hw-bubble-3">
          <circle cx="96" cy="93" r="4.8" fill="#c084fc" stroke="#f3e8ff" strokeWidth="1.2" />
        </g>
        <g className="hw-bubble-4">
          <circle cx="73" cy="86" r="4" fill="#facc15" stroke="#fef08a" strokeWidth="1" />
        </g>

        {/* ================= CALDERO DE HIERRO Y POCIÓN BRILLANTE ================= */}
        {/* Fuego mágico debajo del caldero */}
        <g className="hw-flame-flicker">
          <path d="M52 142 Q60 126 68 138 Q80 120 92 138 Q100 126 108 142 Z" fill="#ea580c" />
          <path d="M60 142 Q70 130 80 138 Q90 130 100 142 Z" fill="#facc15" />
        </g>

        {/* Patitas del caldero */}
        <path d="M54 132 L47 143" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
        <path d="M106 132 L113 143" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />

        {/* Cuerpo del caldero */}
        <path
          d="M42 96 C34 118, 48 138, 80 138 C112 138, 126 118, 118 96 Z"
          fill="url(#cauldronBodyGrad)"
          stroke="#475569"
          strokeWidth="2"
        />

        {/* Argollas laterales del caldero */}
        <circle cx="40" cy="108" r="5" stroke="#f59e0b" strokeWidth="2.2" fill="none" />
        <circle cx="120" cy="108" r="5" stroke="#f59e0b" strokeWidth="2.2" fill="none" />

        {/* Borde superior del caldero */}
        <rect x="38" y="90" width="84" height="9" rx="4.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />

        {/* Superficie líquida burbujeante de la poción */}
        <ellipse cx="80" cy="94" rx="37" ry="4.5" fill="url(#potionLiquidGrad)" />

        {/* Etiqueta frontal del caldero */}
        <rect x="59" y="110" width="42" height="15" rx="5" fill="#1e1b4b" stroke="#f97316" strokeWidth="1.2" />
        <text x="80" y="120" textAnchor="middle" fill="#fed7aa" fontSize="7.5" fontWeight="900" letterSpacing="0.5">
          $3.30 / OZ
        </text>

        <defs>
          <radialGradient id="witchGlowGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 84) scale(56)">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.65" />
            <stop offset="60%" stopColor="#9333ea" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cauldronBodyGrad" x1="40" y1="94" x2="120" y2="138" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="potionLiquidGrad" x1="43" y1="94" x2="117" y2="94" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function WitchCauldronHeaderBanner() {
  const pathname = usePathname();

  if (!HALLOWEEN_PROMO_ACTIVE) return null;
  // Si ya estamos dentro de la página especial de pociones, mostramos una versión compacta o la ocultamos en el header para no duplicar el hero
  if (pathname === '/pociones-halloween') return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#1a0b2e] via-[#3b0764] to-[#c2410c] border-b-2 border-orange-400/80 relative overflow-hidden z-35">
      <style>{`
        @keyframes hwWitchBob {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -3px, 0); }
        }
        @keyframes hwLadleStir {
          0%, 100% { transform: translate3d(-4px, 0, 0) rotate(-6deg); transform-origin: 80px 95px; }
          50% { transform: translate3d(5px, -1px, 0) rotate(8deg); transform-origin: 80px 95px; }
        }
        @keyframes hwBubbleRise1 {
          0% { transform: translate3d(0, 4px, 0) scale(0.6); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate3d(-8px, -28px, 0) scale(1.1); opacity: 0; }
        }
        @keyframes hwBubbleRise2 {
          0% { transform: translate3d(0, 4px, 0) scale(0.65); opacity: 0; }
          35% { opacity: 1; }
          100% { transform: translate3d(4px, -34px, 0) scale(1.15); opacity: 0; }
        }
        @keyframes hwBubbleRise3 {
          0% { transform: translate3d(0, 4px, 0) scale(0.6); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate3d(9px, -26px, 0) scale(1.05); opacity: 0; }
        }
        @keyframes hwFlameFlicker {
          0%, 100% { transform: scaleY(1) translate3d(0, 0, 0); transform-origin: 80px 142px; }
          50% { transform: scaleY(1.12) translate3d(0, -1px, 0); transform-origin: 80px 142px; }
        }
        .hw-witch-bob { animation: hwWitchBob 2.8s ease-in-out infinite; will-change: transform; }
        .hw-ladle-stir { animation: hwLadleStir 1.8s ease-in-out infinite; will-change: transform; }
        .hw-bubble-1 { animation: hwBubbleRise1 2.2s ease-out infinite; will-change: transform, opacity; }
        .hw-bubble-2 { animation: hwBubbleRise2 2.6s ease-out 0.6s infinite; will-change: transform, opacity; }
        .hw-bubble-3 { animation: hwBubbleRise3 2.4s ease-out 1.2s infinite; will-change: transform, opacity; }
        .hw-bubble-4 { animation: hwBubbleRise1 2.0s ease-out 1.6s infinite; will-change: transform, opacity; }
        .hw-flame-flicker { animation: hwFlameFlicker 1.2s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .hw-witch-bob, .hw-ladle-stir, .hw-bubble-1, .hw-bubble-2, .hw-bubble-3, .hw-bubble-4, .hw-flame-flicker {
            animation: none !important;
          }
        }
      `}</style>

      <Link
        href="/pociones-halloween"
        className="max-w-7xl mx-auto px-2.5 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 group cursor-pointer"
        title="Haz clic para abrir el caldero de las 10 pociones a $3.30 la onza"
      >
        {/* Izquierda / Centro: La Bruja Aromaniaka en su caldero + Mensaje */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <AnimatedWitchCauldronSVG className="w-14 h-14 sm:w-16 sm:h-16 -my-1" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/90 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs">
                <span>🧪 CALDERO ACTIVO</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-200">
                <span>💘 Poción de Amor</span>
                <span>•</span>
                <span>🔥 Poción de Atracción</span>
                <span>•</span>
                <span>⚡ Poción de Energía</span>
              </span>
            </div>

            <p className="text-xs sm:text-base md:text-lg font-black text-white leading-tight tracking-tight truncate sm:whitespace-normal">
              ¡La bruja Aromaniaka trajo pociones para ti!{' '}
              <span className="text-amber-300 underline decoration-amber-400/80">
                10 Esencias a $3.30 / Oz
              </span>
            </p>
          </div>
        </div>

        {/* Derecha: Botón estilo evento Temu para ir a la lista de Pociones */}
        <div className="shrink-0 flex items-center">
          <span className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 font-black text-[10.5px] sm:text-xs flex items-center gap-1 shadow-[0_3px_14px_rgba(250,204,21,0.4)] border border-yellow-200 group-hover:scale-105 active:scale-95 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span className="hidden xs:inline">Ver Pociones</span>
            <span className="xs:hidden">Pociones</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        </div>
      </Link>
    </div>
  );
}
