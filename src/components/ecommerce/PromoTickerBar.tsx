'use client';

import React from 'react';
import { Truck, Droplets, Sparkles, ShieldCheck, CalendarOff } from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { isHalloweenSeasonActive } from '@/lib/halloweenPromo';

const ASUETO_2_NOV_END_TIMESTAMP = new Date('2026-11-02T23:59:59.999-06:00').getTime();

function isAsueto2NovActive(nowMs: number = Date.now()): boolean {
  return nowMs <= ASUETO_2_NOV_END_TIMESTAMP;
}

interface TickerMessage {
  id: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  highlight?: string;
  variant?: 'default' | 'asueto';
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
  const asuetoActive = isAsueto2NovActive();

  // Se oculta única y exclusivamente en la sección Arma tu propio perfume
  if (isArmaTuPerfumeActive) {
    return null;
  }

  const asuetoNotice = (idSuffix: string): TickerMessage => ({
    id: `asueto-2-nov-${idSuffix}`,
    badge: '⚠️ AVISO IMPORTANTE',
    icon: CalendarOff,
    text: 'Lunes 2 de Noviembre CERRADO por asueto.',
    variant: 'asueto',
  });

  const baseMessages: TickerMessage[] = halloweenActive
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

  const TICKER_MESSAGES: TickerMessage[] = asuetoActive
    ? [
        asuetoNotice('1'),
        ...baseMessages.slice(0, 2),
        asuetoNotice('2'),
        ...baseMessages.slice(2),
      ]
    : baseMessages;

  const renderTickerItem = (msg: TickerMessage, trackPrefix: string) => {
    if (msg.variant === 'asueto') {
      const Icon = msg.icon;
      return (
        <div
          key={`${trackPrefix}-${msg.id}`}
          className="inline-flex items-center gap-2 bg-slate-950 text-white px-3.5 py-0.5 rounded-full border-2 border-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.55)] text-xs sm:text-[13px] font-black tracking-wide"
        >
          <span className="inline-flex items-center gap-1 bg-yellow-300 text-slate-950 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            <Icon className="w-3 h-3 stroke-[2.75]" />
            {msg.badge}
          </span>
          <span className="text-white font-extrabold">
            Lunes 2 de Noviembre{' '}
            <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider border border-red-400">
              CERRADO
            </span>{' '}
            por asueto.
          </span>
        </div>
      );
    }

    const Icon = msg.icon;
    return (
      <div
        key={`${trackPrefix}-${msg.id}`}
        className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-tight text-white/95"
      >
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
              <strong className="font-extrabold text-white">
                {msg.highlight}
              </strong>
            </>
          )}
        </span>
        <span className="text-indigo-300/40 text-xs ml-6" aria-hidden="true">✦</span>
      </div>
    );
  };

  return (
    <aside
      aria-label="Avisos y Beneficios de Aromaniak SV"
      className="w-full bg-[#4338ca] text-white border-b border-indigo-500/25 overflow-hidden relative select-none pointer-events-none sm:pointer-events-auto z-30"
    >
      <div className="relative py-2 sm:py-2.5 overflow-hidden flex items-center">
        {/* Pista continua con animación infinita sin cortes ni espacios en blanco */}
        <div className="ticker-track flex items-center whitespace-nowrap hover:[animation-play-state:paused]">
          {/* Primer bloque */}
          <div className="flex items-center gap-6 px-4 shrink-0">
            {TICKER_MESSAGES.map((msg) => renderTickerItem(msg, 'track1'))}
          </div>

          {/* Bloque duplicado idéntico para efecto infinito 100% continuo */}
          <div className="flex items-center gap-6 px-4 shrink-0" aria-hidden="true">
            {TICKER_MESSAGES.map((msg) => renderTickerItem(msg, 'track2'))}
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
