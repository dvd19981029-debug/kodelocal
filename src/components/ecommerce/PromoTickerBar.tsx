'use client';

import React from 'react';
import { Truck, Droplets, Sparkles, ShieldCheck } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';

interface TickerMessage {
  id: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  highlight?: string;
}

const TICKER_MESSAGES: TickerMessage[] = [
  {
    id: 'envios',
    badge: 'ENVÍOS',
    icon: Truck,
    text: 'Entregas a domicilio en los 14 departamentos de El Salvador o retiro en tienda',
  },
  {
    id: 'calidad',
    icon: Droplets,
    text: 'Esencias concentradas de perfumería fina',
    highlight: 'Venta por onza y media onza',
  },
  {
    id: 'insumos',
    icon: Sparkles,
    text: 'Envases de vidrio, atomizadores y materias primas',
    highlight: 'Venta al por mayor y detalle',
  },
  {
    id: 'seguridad',
    icon: ShieldCheck,
    text: 'Compra 100% protegida y pago seguro con tarjeta o transferencia bancaria',
  },
];

export default function PromoTickerBar() {
  const { isArmaTuPerfumeActive } = useEcommerceCart();

  // Se oculta única y exclusivamente en la sección Arma tu propio perfume
  if (isArmaTuPerfumeActive) {
    return null;
  }

  return (
    <aside
      aria-label="Avisos y Beneficios de Aromaniak SV"
      className="w-full bg-[#4338ca] text-white border-b border-indigo-500/25 overflow-hidden relative select-none pointer-events-none sm:pointer-events-auto z-30 pt-[env(safe-area-inset-top,0px)]"
    >
      <div className="relative py-2 sm:py-2.5 overflow-hidden flex items-center">
        {/* Pista continua con animación infinita sin cortes ni espacios en blanco */}
        <div className="ticker-track flex items-center whitespace-nowrap hover:[animation-play-state:paused]">
          {/* Primer bloque */}
          <div className="flex items-center gap-8 px-4 shrink-0">
            {TICKER_MESSAGES.map((msg) => {
              const Icon = msg.icon;
              return (
                <div key={`track1-${msg.id}`} className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-tight text-white/95">
                  <Icon className="w-3.5 h-3.5 text-indigo-200 shrink-0 stroke-[2.2]" />
                  {msg.badge && (
                    <span className="bg-white/15 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase border border-white/20">
                      {msg.badge}
                    </span>
                  )}
                  <span>
                    {msg.text}
                    {msg.highlight && (
                      <>
                        {' • '}
                        <strong className="font-extrabold text-white">{msg.highlight}</strong>
                      </>
                    )}
                  </span>
                  <span className="text-indigo-300/40 text-xs ml-6" aria-hidden="true">✦</span>
                </div>
              );
            })}
          </div>

          {/* Bloque duplicado idéntico para efecto infinito 100% continuo */}
          <div className="flex items-center gap-8 px-4 shrink-0" aria-hidden="true">
            {TICKER_MESSAGES.map((msg) => {
              const Icon = msg.icon;
              return (
                <div key={`track2-${msg.id}`} className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-tight text-white/95">
                  <Icon className="w-3.5 h-3.5 text-indigo-200 shrink-0 stroke-[2.2]" />
                  {msg.badge && (
                    <span className="bg-white/15 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase border border-white/20">
                      {msg.badge}
                    </span>
                  )}
                  <span>
                    {msg.text}
                    {msg.highlight && (
                      <>
                        {' • '}
                        <strong className="font-extrabold text-white">{msg.highlight}</strong>
                      </>
                    )}
                  </span>
                  <span className="text-indigo-300/40 text-xs ml-6" aria-hidden="true">✦</span>
                </div>
              );
            })}
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
