'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PromoSlide {
  id: string;
  imageUrl: string;
  imageAlt: string;
  action: 'aromas' | 'arma-tu-perfume' | 'botes';
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

  const handleSlideClick = (action: 'aromas' | 'arma-tu-perfume' | 'botes') => {
    if (action === 'arma-tu-perfume') {
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
      {/* Diapositivas de imágenes promocionales puras */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.id}
            onClick={() => {
              if (touchStartX.current !== null && touchEndX.current !== null && Math.abs(touchStartX.current - touchEndX.current) > 15) {
                return;
              }
              handleSlideClick(slide.action);
            }}
            className={`absolute inset-0 cursor-pointer transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.imageUrl}
              alt={slide.imageAlt}
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
              loading="eager"
            />
          </div>
        );
      })}

      {/* Indicadores / Puntos Inferiores estilo Clay */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-6 h-1.5 bg-white shadow-xs'
                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
