'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Droplets, Truck, ShoppingBag, ArrowRight } from 'lucide-react';

interface PromoSlide {
  id: string;
  badge: string;
  badgeIcon: React.ReactNode;
  badgeStyle: string;
  title: string;
  highlightText: string;
  highlightGradient: string;
  subtitle: string;
  ctaText: string;
  ctaAction?: () => void;
  ctaBtnClass: string;
  pastelBg: string;
  imageUrl: string;
  imageAlt: string;
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
      badgeIcon: <Sparkles className="w-3.5 h-3.5 text-amber-600" />,
      badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-2xs',
      title: 'Perfume Preparado',
      highlightText: 'por solo $15.00',
      highlightGradient: 'from-indigo-600 via-purple-600 to-pink-600',
      subtitle: 'Tu contratipo favorito (33% concentración) + Frasco de vidrio con atomizador de lujo',
      ctaText: 'Ver Fragancias',
      ctaAction: () => {
        if (onFilterCategory) onFilterCategory('Esencias para Perfume');
        if (onExploreCatalog) onExploreCatalog();
      },
      ctaBtnClass: 'clay-btn clay-btn-primary',
      pastelBg: 'bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-pink-50/30',
      imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=900&q=85',
      imageAlt: 'Perfume preparado con atomizador',
    },
    {
      id: 'promo-esencias',
      badge: 'Fijación 8 a 12 Horas',
      badgeIcon: <Droplets className="w-3.5 h-3.5 text-indigo-600" />,
      badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200/80 shadow-2xs',
      title: 'Esencias Puras por Onza',
      highlightText: 'desde $3.25',
      highlightGradient: 'from-indigo-600 to-cyan-600',
      subtitle: 'Más de 600 contratipos finos franceses para rellenado o tu propio negocio',
      ctaText: 'Explorar Esencias',
      ctaAction: () => {
        if (onFilterCategory) onFilterCategory('Esencias para Perfume');
        if (onExploreCatalog) onExploreCatalog();
      },
      ctaBtnClass: 'clay-btn clay-btn-primary',
      pastelBg: 'bg-gradient-to-r from-cyan-50/90 via-sky-50/50 to-indigo-50/30',
      imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=900&q=85',
      imageAlt: 'Esencias puras de contratipos',
    },
    {
      id: 'promo-envios',
      badge: 'Envíos Nacionales',
      badgeIcon: <Truck className="w-3.5 h-3.5 text-emerald-600" />,
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-2xs',
      title: 'Pago Contra Entrega',
      highlightText: 'en Todo El Salvador',
      highlightGradient: 'from-emerald-600 to-teal-600',
      subtitle: 'Pide con total tranquilidad y paga en efectivo al recibir en tu puerta en los 14 departamentos',
      ctaText: 'Comprar Ahora',
      ctaAction: () => {
        if (onExploreCatalog) onExploreCatalog();
      },
      ctaBtnClass: 'clay-btn clay-btn-success',
      pastelBg: 'bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-slate-50/30',
      imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=900&q=85',
      imageAlt: 'Envíos seguros a domicilio',
    },
    {
      id: 'promo-envases',
      badge: 'Envases & Atomizadores',
      badgeIcon: <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />,
      badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200/80 shadow-2xs',
      title: 'Botes de Vidrio de Lujo',
      highlightText: 'para tu Fragancia',
      highlightGradient: 'from-rose-600 to-amber-600',
      subtitle: 'Modelos cuadrados y cilíndricos en 30ml, 50ml y 100ml con bruma ultrafina',
      ctaText: 'Ver Botes',
      ctaAction: () => {
        if (onFilterCategory) onFilterCategory('Botes');
        if (onExploreCatalog) onExploreCatalog();
      },
      ctaBtnClass: 'clay-btn clay-btn-primary',
      pastelBg: 'bg-gradient-to-r from-rose-50/90 via-amber-50/50 to-orange-50/30',
      imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=900&q=85',
      imageAlt: 'Botes y frascos de lujo con atomizador',
    },
  ];

  // Auto-slide cada 5.5 segundos
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
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
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div 
      className="clay-card relative w-full overflow-hidden p-0 border border-white/90 select-none group bg-white shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        aspectRatio: '16 / 7.2',
        minHeight: '175px',
        maxHeight: '265px'
      }}
    >
      {/* Diapositivas */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-600 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Fondo pastel suave */}
            <div className={`absolute inset-0 ${slide.pastelBg}`} />

            {/* Imagen brillante y nítida a la derecha (SIN oscurecimiento, 100% natural) */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-7/12 h-full overflow-hidden">
              <img
                src={slide.imageUrl}
                alt={slide.imageAlt}
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 brightness-100 contrast-100"
                loading="eager"
              />
              {/* Degradado suave blanco/pastel para fundir suavemente con el texto a la izquierda sin opacar la foto */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 sm:via-white/50 to-transparent pointer-events-none" />
              {/* Leve viñeta clara arriba/abajo para integración estética */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/20 pointer-events-none" />
            </div>

            {/* Columna de contenido textual Claymorphic a la izquierda */}
            <div className="relative z-20 h-full flex flex-col justify-center px-4 sm:px-8 max-w-[65%] sm:max-w-[55%]">
              
              {/* Badge claymorphic luminoso */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-xs font-black border w-fit mb-1.5 sm:mb-2 ${slide.badgeStyle}`}>
                {slide.badgeIcon}
                <span className="tracking-wider uppercase text-[8.5px] sm:text-[10px] font-black">{slide.badge}</span>
              </div>

              {/* Título de la promoción en texto nítido y legible */}
              <h2 className="text-sm sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                <span>{slide.title} </span>
                <span className={`bg-gradient-to-r ${slide.highlightGradient} bg-clip-text text-transparent block sm:inline`}>
                  {slide.highlightText}
                </span>
              </h2>

              {/* Subtítulo breve en tonos slate */}
              <p className="text-[10px] sm:text-xs text-slate-600 font-semibold line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 max-w-sm">
                {slide.subtitle}
              </p>

              {/* Botón CTA Claymorphic en 3D */}
              <div className="mt-2 sm:mt-3">
                <button
                  onClick={slide.ctaAction}
                  className={`${slide.ctaBtnClass} px-3.5 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black rounded-xl text-white flex items-center gap-1.5 cursor-pointer !shadow-[2px_4px_12px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 transition-all`}
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Flechas de Navegación Estilo Botón Clay Claro */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 shadow-md border border-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 active:scale-90 cursor-pointer"
        aria-label="Diapositiva anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 shadow-md border border-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 active:scale-90 cursor-pointer"
        aria-label="Diapositiva siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Indicadores / Puntos Inferiores estilo Clay */}
      <div className="absolute bottom-2.5 right-4 z-20 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-white/80 shadow-2xs">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-5 sm:w-6 h-1.5 bg-indigo-600 shadow-xs'
                : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
