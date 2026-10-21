'use client';

import React from 'react';
import { Truck, Droplets, Sparkles, ShieldCheck } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { isHalloweenSeasonActive } from '@/lib/halloweenPromo';

interface TickerMessage {
  id: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  highlight?: string;
}

const BASE_TICKER_MESSAGES: TickerMessage[] = [
  {
    id: 'envios',
    badge: 'ENVÍOS $2.90',
    icon: Truck,
    text: '¡ENVÍOS RÁPIDOS A LOS 14 DEPARTAMENTOS DE EL SALVADOR O RETIRO EN TIENDA!',
  },
  {
    id: 'calidad',
    badge: '100% PURAS',
    icon: Droplets,
    text: 'ESENCIAS CONCENTRADAS DE PERFUMERÍA FINA SIN DILUIR',
    highlight: 'VENTA POR ONZA ($3.75) Y MEDIA ONZA ($1.90)',
  },
  {
    id: 'insumos',
    badge: 'MAYOREO Y DETALLE',
    icon: Sparkles,
    text: 'FRASCOS DE CRISTAL, ALCOHOL PERFUMERO CON FIJADOR Y MATERIAS PRIMAS',
    highlight: '¡ARMA TU PERFUME DE 100ML DESDE $11.00!',
  },
  {
    id: 'seguridad',
    badge: 'COMPRA SEGURA',
    icon: ShieldCheck,
    text: 'PAGO 100% PROTEGIDO CON TARJETA, TRANSFERENCIA O EN TIENDA FÍSICA',
  },
];

export default function PromoTickerBar() {
  const { isArmaTuPerfumeActive } = useEcommerceCart();
  const halloweenActive = isHalloweenSeasonActive();

  // Se oculta única y exclusivamente en la sección Arma tu propio perfume
  if (isArmaTuPerfumeActive) {
    return null;
  }

  const TICKER_MESSAGES: TickerMessage[] = halloweenActive
    ? [
        {
          id: 'halloween-promo',
          badge: '🎃 HALLOWEEN',
          icon: Sparkles,
          text: '¡ESPECIAL DE HALLOWEEN! 10 POCIONES SELECCIONADAS EN OFERTA',
          highlight: '1 ONZA A $3.30 Y ½ ONZA A $1.85',
        },
        ...BASE_TICKER_MESSAGES,
      ]
    : BASE_TICKER_MESSAGES;

  return (
    <aside
      aria-label="Avisos y Beneficios de Aromaniak SV"
      className="w-full bg-[#ea580c] text-white border-b border-[#c2410c] shadow-xs overflow-hidden relative select-none pointer-events-none sm:pointer-events-auto z-30"
    >
      <div className="relative py-2 sm:py-2.5 overflow-hidden flex items-center">
        {/* Pista continua con animación infinita sin cortes ni espacios en blanco */}
        <div className="ticker-track flex items-center whitespace-nowrap hover:[animation-play-state:paused]">
          {/* Primer bloque */}
          <div className="flex items-center gap-6 px-4 shrink-0">
            {TICKER_MESSAGES.map((msg) => (
              <div
                key={`track1-${msg.id}`}
                className="inline-flex items-center gap-2.5 text-xs sm:text-[13px] font-black uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
              >
                <span className="text-sm sm:text-base leading-none" aria-hidden="true">🎃</span>
                {msg.badge && (
                  <span className="bg-slate-950/90 text-amber-300 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase border border-amber-300/60 shadow-2xs">
                    {msg.badge}
                  </span>
                )}
                <span>
                  {msg.text}
                  {msg.highlight && (
                    <>
                      {' — '}
                      <strong className="font-black text-yellow-200 underline decoration-yellow-200/80 decoration-2 underline-offset-2">
                        {msg.highlight}
                      </strong>
                    </>
                  )}
                </span>
                <span className="text-sm sm:text-base leading-none" aria-hidden="true">🎃</span>
              </div>
            ))}
          </div>

          {/* Bloque duplicado idéntico para efecto infinito 100% continuo */}
          <div className="flex items-center gap-6 px-4 shrink-0" aria-hidden="true">
            {TICKER_MESSAGES.map((msg) => (
              <div
                key={`track2-${msg.id}`}
                className="inline-flex items-center gap-2.5 text-xs sm:text-[13px] font-black uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
              >
                <span className="text-sm sm:text-base leading-none" aria-hidden="true">🎃</span>
                {msg.badge && (
                  <span className="bg-slate-950/90 text-amber-300 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase border border-amber-300/60 shadow-2xs">
                    {msg.badge}
                  </span>
                )}
                <span>
                  {msg.text}
                  {msg.highlight && (
                    <>
                      {' — '}
                      <strong className="font-black text-yellow-200 underline decoration-yellow-200/80 decoration-2 underline-offset-2">
                        {msg.highlight}
                      </strong>
                    </>
                  )}
                </span>
                <span className="text-sm sm:text-base leading-none" aria-hidden="true">🎃</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .ticker-track {
          display: flex;
          width: max-content;
          animation: seamlessTicker 25s linear infinite;
          will-change: transform;
        }
        @keyframes seamlessTicker {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </aside>
  );
}
