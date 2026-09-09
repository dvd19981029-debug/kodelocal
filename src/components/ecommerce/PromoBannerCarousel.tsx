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
  // Inicializa en 1 porque el índice 0 es el clon del último slide (bucle infinito sin rebobinado)
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
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

  // Diapositivas extendidas con clones en ambos extremos para bucle infinito 100% continuo
  const extendedSlides = [
    { ...slides[slides.length - 1], id: `${slides[slides.length - 1].id}-clone-start` },
    ...slides,
    { ...slides[0], id: `${slides[0].id}-clone-end` },
  ];

  // Auto-slide cada 5.5 segundos siempre hacia adelante
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

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
    setCurrentIndex((prev) => (prev >= slides.length + 1 ? prev : prev + 1));
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

  // Índice real del punto indicador activo
  const activeDotIndex = (currentIndex - 1 + slides.length) % slides.length;

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
          return (
            <div
              key={`${slide.id}-${index}`}
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

      {/* Indicadores inferiores ultra compactos y discretos */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/20 backdrop-blur-xs px-1.5 py-0.5 rounded-full shadow-2xs">
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
                ? 'w-3 h-1 bg-white'
                : 'w-1 h-1 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Ir a diapositiva ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
