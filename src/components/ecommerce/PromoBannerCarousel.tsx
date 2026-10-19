'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { isHalloweenSeasonActive } from '@/lib/halloweenPromo';
import { AnimatedWitchCauldronSVG } from '@/components/ecommerce/WitchCauldronHeaderBanner';
import { CobwebCornerSVG, BatIllustrationSVG } from '@/components/ecommerce/HalloweenDecorations';

interface PromoSlide {
  id: string;
  imageUrl?: string;
  imageAlt: string;
  action: 'bruja-halloween' | 'emprendedor' | 'aromas' | 'arma-tu-perfume' | 'botes';
  customRender?: boolean;
}

interface PromoBannerCarouselProps {
  onExploreCatalog?: () => void;
  onFilterCategory?: (category: string) => void;
}

export default function PromoBannerCarousel({ onExploreCatalog, onFilterCategory }: PromoBannerCarouselProps) {
  // Inicializa en 1 porque el índice 0 es el clon del último slide (bucle infinito sin rebobinado)
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const halloweenActive = isHalloweenSeasonActive();

  const baseSlides: PromoSlide[] = [
    {
      id: 'promo-emprendedor',
      imageUrl: '/images/promo/banner_emprendedor.webp',
      imageAlt: '¿Eres emprendedor? Opciones mayoristas para tu negocio - Aromaniak',
      action: 'emprendedor',
    },
    {
      id: 'promo-aromas',
      imageUrl: '/images/promo/banner_aromas.webp',
      imageAlt: 'Grandes fragancias, más cerca de ti - Explora nuestros aromas',
      action: 'aromas',
    },
    {
      id: 'promo-arma-tu-perfume',
      imageUrl: '/images/promo/banner_arma_tu_perfume.webp',
      imageAlt: 'Arma tu propio perfume - Crea tu fragancia',
      action: 'arma-tu-perfume',
    },
    {
      id: 'promo-botes',
      imageUrl: '/images/promo/banner_botes.webp',
      imageAlt: 'Botes premium para tus esencias',
      action: 'botes',
    },
  ];

  const slides: PromoSlide[] = halloweenActive
    ? [
        {
          id: 'promo-bruja-halloween',
          imageAlt: '¡La bruja Aromaniaka trajo pociones para ti! 10 Esencias a $3.30 la onza y $1.85 la media onza',
          action: 'bruja-halloween',
          customRender: true,
        },
        ...baseSlides,
      ]
    : baseSlides;

  // Diapositivas extendidas con clones en ambos extremos para bucle infinito 100% continuo
  const extendedSlides = [
    { ...slides[slides.length - 1], id: `${slides[slides.length - 1].id}-clone-start` },
    ...slides,
    { ...slides[0], id: `${slides[0].id}-clone-end` },
  ];

  // Índice real del punto indicador activo
  const activeDotIndex = (currentIndex - 1 + slides.length) % slides.length;

  // Auto-slide: el slide de la Bruja dura 10 segundos siempre (10000ms), los demás 5.5 segundos (5500ms)
  useEffect(() => {
    if (isPaused) return;
    const activeSlide = slides[activeDotIndex];
    const durationMs = activeSlide?.action === 'bruja-halloween' ? 10000 : 5500;
    const timer = setTimeout(() => {
      handleNext();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [isPaused, activeDotIndex, slides.length, halloweenActive]);

  // Al llegar al clon del extremo, resetear la posición instantáneamente sin animación
  const handleTransitionEnd = () => {
    if (currentIndex >= slides.length + 1) {
      setIsTransitionEnabled(false);
      setCurrentIndex(1);
    } else if (currentIndex <= 0) {
      setIsTransitionEnabled(false);
      setCurrentIndex(slides.length);
    }
  };

  // Re-habilitar la transición suave en el siguiente frame tras el reset instantáneo
  useEffect(() => {
    if (!isTransitionEnabled) {
      const frame = requestAnimationFrame(() => {
        setIsTransitionEnabled(true);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isTransitionEnabled]);

  const handlePrev = () => {
    setIsTransitionEnabled(true);
    setCurrentIndex((prev) => (prev <= 0 ? prev : prev - 1));
  };

  const handleNext = () => {
    setIsTransitionEnabled(true);
    setCurrentIndex((prev) => (prev >= slides.length + 1 ? 2 : prev + 1));
  };

  const goToSlide = (slideIndex: number) => {
    setIsTransitionEnabled(true);
    setCurrentIndex(slideIndex + 1);
  };

  // Manejo de Swipe táctil en teléfonos
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleSlideClick = (action: PromoSlide['action']) => {
    if (action === 'bruja-halloween') {
      if (onFilterCategory) {
        onFilterCategory('Pociones de la Bruja');
      } else {
        window.location.href = '/pociones-halloween';
      }
    } else if (action === 'emprendedor') {
      window.open(
        'https://wa.me/50360437496?text=' +
          encodeURIComponent('¡Hola Aromaniak! Soy emprendedor y me gustaría recibir información sobre las opciones y precios mayoristas para mi negocio.'),
        '_blank'
      );
    } else if (action === 'arma-tu-perfume') {
      if (onFilterCategory) {
        onFilterCategory('Arma tu perfume');
      }
    } else if (action === 'botes') {
      if (onFilterCategory) {
        onFilterCategory('Botes');
      }
    } else if (action === 'aromas') {
      if (onExploreCatalog) {
        onExploreCatalog();
      } else if (onFilterCategory) {
        onFilterCategory('Esencias para Perfume');
      }
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div 
        className="clay-card relative w-full max-w-4xl overflow-hidden p-0 border border-white/90 select-none group bg-slate-900 shadow-md sm:shadow-xl rounded-2xl sm:rounded-3xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          aspectRatio: '1024 / 571',
          width: '100%',
        }}
      >
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
        `}</style>

        {/* Carril deslizante horizontal infinito: siempre avanza hacia adelante de manera continua */}
        <div 
          className="flex w-full h-full will-change-transform"
          onTransitionEnd={handleTransitionEnd}
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isTransitionEnabled 
              ? 'transform 700ms cubic-bezier(0.25, 1, 0.5, 1)' 
              : 'none'
          }}
        >
          {extendedSlides.map((slide, index) => {
            const isInitialVisible = index === 1;
            return (
              <div
                key={`${slide.id}-${index}`}
                onClick={() => {
                  if (touchStartX.current !== null && touchEndX.current !== null && Math.abs(touchStartX.current - touchEndX.current) > 15) {
                    return;
                  }
                  handleSlideClick(slide.action);
                }}
                className="min-w-full w-full h-full shrink-0 relative cursor-pointer overflow-hidden flex items-center justify-center bg-slate-900"
              >
                {slide.customRender ? (
                  <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#120722] via-[#3b0764] to-[#c2410c] flex items-center justify-between px-3.5 sm:px-8 md:px-11 py-3 sm:py-6 text-white">
                    {/* Telarañas en esquinas del slide */}
                    <div className="absolute top-0 left-0 w-20 h-20 sm:w-36 sm:h-36 text-orange-400/35 pointer-events-none">
                      <CobwebCornerSVG className="w-full h-full" />
                    </div>
                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-36 sm:h-36 text-orange-400/35 pointer-events-none">
                      <CobwebCornerSVG className="w-full h-full" flipX />
                    </div>
                    <div className="hidden sm:block absolute top-4 left-[42%] text-amber-300/60 pointer-events-none">
                      <BatIllustrationSVG className="w-11 h-6" />
                    </div>

                    {/* Columna Izquierda: Textos de la Bruja Aromaniaka */}
                    <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4 space-y-1.5 sm:space-y-3">
                      <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-orange-500/30 border border-amber-300/60 text-amber-200 text-[8.5px] sm:text-xs font-black uppercase tracking-wider">
                        <span>🧪 EVENTO HALLOWEEN • HASTA EL 31 DE OCTUBRE</span>
                      </div>

                      <h2 className="text-sm sm:text-2xl md:text-3xl font-black leading-[1.12] tracking-tight text-white drop-shadow-sm">
                        ¡La bruja Aromaniaka trajo{' '}
                        <span className="text-amber-300 underline decoration-orange-400/80">
                          pociones para ti!
                        </span>
                      </h2>

                      <div className="hidden xs:flex flex-wrap items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-extrabold text-orange-100/95">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-950/45 border border-white/15">💘 Poción de Amor</span>
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-950/45 border border-white/15">🔥 Poción de Atracción</span>
                        <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-slate-950/45 border border-white/15">⚡ Poción de Energía</span>
                      </div>

                      {/* Precios de las Pociones: 1 Oz $3.30 y 1/2 Oz $1.85 */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 pt-0.5">
                        <div className="bg-slate-950/65 border border-amber-400/80 rounded-xl px-2 sm:px-3.5 py-1 sm:py-1.5 flex items-center gap-2 sm:gap-3 shadow-md">
                          <div>
                            <span className="text-[8px] sm:text-[10px] font-bold text-rose-300 line-through block leading-none">
                              1 Oz Antes $3.75
                            </span>
                            <span className="text-xs sm:text-lg font-black text-amber-300 leading-tight">
                              1 Oz: $3.30
                            </span>
                          </div>
                          <div className="w-[1px] h-5 sm:h-7 bg-orange-400/40" />
                          <div>
                            <span className="text-[8px] sm:text-[10px] font-bold text-rose-300 line-through block leading-none">
                              ½ Oz Antes $1.90
                            </span>
                            <span className="text-xs sm:text-lg font-black text-orange-200 leading-tight">
                              ½ Oz: $1.85
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ea580c] text-slate-950 font-black text-[9.5px] sm:text-xs inline-flex items-center gap-1 shadow-[0_4px_16px_rgba(250,204,21,0.45)] border border-yellow-200 group-hover:scale-105 transition-transform">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-slate-950 shrink-0" />
                          <span>Ver las 10 Pociones →</span>
                        </span>
                      </div>
                    </div>

                    {/* Columna Derecha: Bruja Aromaniaka preparando pociones en su caldero (100% SVG/CSS) */}
                    <div className="relative z-10 shrink-0 flex flex-col items-center justify-center">
                      <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full bg-gradient-to-b from-orange-500/25 via-purple-600/20 to-transparent border border-orange-300/40 flex items-center justify-center shadow-inner">
                        <AnimatedWitchCauldronSVG className="w-24 h-24 xs:w-28 xs:h-28 sm:w-44 sm:h-44 md:w-52 md:h-52" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={slide.imageUrl}
                    alt={slide.imageAlt}
                    className="w-full h-full object-fill transform group-hover:scale-[1.01] transition-transform duration-700"
                    loading={isInitialVisible ? 'eager' : 'lazy'}
                    fetchPriority={isInitialVisible ? 'high' : 'low'}
                    decoding={isInitialVisible ? 'sync' : 'async'}
                  />
                )}
              </div>
            );
          })}
        </div>

      {/* Flechas de Navegación Lateral en Computadora */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-purple-700 shadow-md backdrop-blur-md items-center justify-center border border-white/90 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Banner anterior"
      >
        <ChevronLeft className="w-5 h-5 -ml-0.5" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-purple-700 shadow-md backdrop-blur-md items-center justify-center border border-white/90 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Siguiente banner"
      >
        <ChevronRight className="w-5 h-5 -mr-0.5" />
      </button>

      {/* Indicadores inferiores estilo Frosted Glass blanco con tonos púrpura de la marca */}
      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-white/85 backdrop-blur-md px-3 py-1 sm:py-1.5 rounded-full border border-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.14)]">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(idx);
            }}
            className={`transition-all duration-300 rounded-full cursor-pointer p-0 border-0 block ${
              idx === activeDotIndex
                ? 'w-4 sm:w-6 h-1.5 sm:h-2 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xs'
                : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-300/90 hover:bg-purple-300'
            }`}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  </div>
  );
}
