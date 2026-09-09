'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PromoSlide {
  id: string;
  imageUrl: string;
  imageAlt: string;
  action: 'emprendedor' | 'aromas' | 'arma-tu-perfume' | 'botes';
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

  // Auto-slide cada 5.5 segundos
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, slides.length]);

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

  const handleSlideClick = (action: 'emprendedor' | 'aromas' | 'arma-tu-perfume' | 'botes') => {
    if (action === 'emprendedor') {
      window.open(
        'https://wa.me/50370000000?text=' +
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
    <div 
      className="clay-card relative w-full overflow-hidden p-0 border border-white/90 select-none group bg-slate-900 shadow-lg rounded-3xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        aspectRatio: '16 / 7',
        minHeight: '160px',
        maxHeight: '260px'
      }}
    >
      {/* Carril deslizante horizontal continuo con aceleración y desaceleración suave */}
      <div 
        className="flex w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => {
          return (
            <div
              key={slide.id}
              onClick={() => {
                if (touchStartX.current !== null && touchEndX.current !== null && Math.abs(touchStartX.current - touchEndX.current) > 15) {
                  return;
                }
                handleSlideClick(slide.action);
              }}
              className="min-w-full w-full h-full shrink-0 relative cursor-pointer overflow-hidden"
            >
              <img
                src={slide.imageUrl}
                alt={slide.imageAlt}
                className="w-full h-full object-cover object-center transform group-hover:scale-[1.015] transition-transform duration-700"
                loading="eager"
              />
            </div>
          );
        })}
      </div>

      {/* Indicadores centrados estilo Clay suave */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`transition-all duration-400 rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-7 h-2 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-xs'
                : 'w-2 h-2 bg-slate-300/80 hover:bg-slate-400'
            }`}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
