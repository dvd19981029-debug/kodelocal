'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Droplets, Truck, ShoppingBag, ArrowRight } from 'lucide-react';

interface PromoSlide {
  id: string;
  badge: string;
  badgeIcon: React.ReactNode;
  badgeColor: string;
  title: string;
  highlightText: string;
  subtitle: string;
  ctaText: string;
  ctaAction?: () => void;
  bgGradient: string;
  imageUrl: string;
}

interface PromoBannerCarouselProps {
  onExploreCatalog?: () => void;
  onFilterCategory?: (category: string) => void;
}

export default function PromoBannerCarousel({ onExploreCatalog, onFilterCategory }: PromoBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const slides: PromoSlide[] = [
    {
      id: 'promo-preparado',
      badge: 'Promoción Exclusiva',
      badgeIcon: <Sparkles className="w-3 h-3 text-amber-300" />,
      badgeColor: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
      title: 'Perfume Preparado Listo',
      highlightText: 'por solo $15.00',
      subtitle: 'Elige tu fragancia y tu frasco de vidrio de lujo con atomizador',
      ctaText: 'Ver Perfumes',
      ctaAction: () => {
        if (onFilterCategory) onFilterCategory('Esencias para Perfume');
        if (onExploreCatalog) onExploreCatalog();
      },
      bgGradient: 'from-slate-950 via-slate-900 to-indigo-950',
      imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200&q=80',
    },
    {
      id: 'promo-esencias',
      badge: 'Calidad Premium 33%',
      badgeIcon: <Droplets className="w-3 h-3 text-cyan-300" />,
      badgeColor: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
      title: 'Esencias Puras por Onza',
      highlightText: 'desde $3.25',
      subtitle: 'Más de 600 contratipos finos con fijación de 8 a 12 horas',
      ctaText: 'Explorar Esencias',
      ctaAction: () => {
        if (onFilterCategory) onFilterCategory('Esencias para Perfume');
        if (onExploreCatalog) onExploreCatalog();
      },
      bgGradient: 'from-indigo-950 via-purple-950 to-slate-950',
      imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1200&q=80',
    },
    {
      id: 'promo-envios',
      badge: 'Todo El Salvador',
      badgeIcon: <Truck className="w-3 h-3 text-emerald-300" />,
      badgeColor: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      title: 'Pago Contra Entrega',
      highlightText: 'Rápido y Seguro',
      subtitle: 'Envíos a domicilio en los 14 departamentos del país',
      ctaText: 'Hacer Pedido',
      ctaAction: () => {
        if (onExploreCatalog) onExploreCatalog();
      },
      bgGradient: 'from-emerald-950 via-slate-900 to-slate-950',
      imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=1200&q=80',
    },
    {
      id: 'promo-envases',
      badge: 'Botes & Atomizadores',
      badgeIcon: <ShoppingBag className="w-3 h-3 text-rose-300" />,
      badgeColor: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
      title: 'Frascos de Vidrio y Atomizadores',
      highlightText: 'para tu Perfume',
      subtitle: 'Diseños cuadrados, cilindro y luxury en 30ml, 50ml y 100ml',
      ctaText: 'Ver Botes',
      ctaAction: () => {
        if (onFilterCategory) onFilterCategory('Botes');
        if (onExploreCatalog) onExploreCatalog();
      },
      bgGradient: 'from-slate-950 via-neutral-900 to-amber-950',
      imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200&q=80',
    },
  ];

  // Auto-slide cada 5 segundos
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
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
    if (diff > 45) {
      // Deslizar a la izquierda -> siguiente
      handleNext();
    } else if (diff < -45) {
      // Deslizar a la derecha -> anterior
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div 
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-white/20 select-none bg-slate-950 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        // Formato compacto tipo video 16:9 / 21:9 que no ocupa la pantalla entera
        aspectRatio: '16 / 7.5',
        minHeight: '165px',
        maxHeight: '260px'
      }}
    >
      {/* Diapositivas */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Imagen de fondo con overlay degradado */}
            <div className="absolute inset-0">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-105"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-75 mix-blend-multiply`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Contenido textual compacto de la diapositiva */}
            <div className="relative z-20 h-full flex flex-col justify-center px-4 sm:px-8 max-w-xl text-white">
              {/* Badge promocional */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-black backdrop-blur-md border border-white/10 w-fit mb-1.5 sm:mb-2 shadow-xs bg-black/40">
                {slide.badgeIcon}
                <span className="tracking-wide uppercase text-[8.5px] sm:text-[10px]">{slide.badge}</span>
              </div>

              {/* Título de la promoción */}
              <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-md">
                <span>{slide.title} </span>
                <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent block sm:inline">
                  {slide.highlightText}
                </span>
              </h2>

              {/* Subtítulo breve */}
              <p className="text-[10.5px] sm:text-xs text-slate-200/90 font-medium line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 drop-shadow-xs max-w-md">
                {slide.subtitle}
              </p>

              {/* Botón CTA compacto */}
              <div className="mt-2 sm:mt-3">
                <button
                  onClick={slide.ctaAction}
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black rounded-xl bg-white text-slate-950 hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Flechas de Navegación Lateral (visibles en desktop al pasar el mouse o discretas) */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md transition-all opacity-70 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Anterior"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md transition-all opacity-70 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Siguiente"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Indicadores / Puntos Inferiores */}
      <div className="absolute bottom-2.5 right-4 z-20 flex items-center gap-1.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-5 sm:w-6 h-1.5 bg-white shadow-xs'
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
            title={`Diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
