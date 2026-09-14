'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingBag } from 'lucide-react';
import { useScrolled } from '@/hooks/useScrolled';
import { useEcommerceCart } from '@/context/EcommerceCartContext';

interface ReactiveSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedGender: 'Todos' | 'Caballero' | 'Dama' | 'Unisex';
  setSelectedGender: (gender: 'Todos' | 'Caballero' | 'Dama' | 'Unisex') => void;
  selectedStockFilter: 'Todos' | 'Disponibles' | 'Agotados';
  setSelectedStockFilter: (stock: 'Todos' | 'Disponibles' | 'Agotados') => void;
  totalProducts: number;
  inStockCount: number;
  outOfStockCount: number;
  setCurrentPage: (page: number) => void;
}

export default function ReactiveSearchBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedGender,
  setSelectedGender,
  selectedStockFilter,
  setSelectedStockFilter,
  totalProducts,
  inStockCount,
  outOfStockCount,
  setCurrentPage,
}: ReactiveSearchBarProps) {
  const isScrolled = useScrolled(75);
  const { totalItems, subtotal, setIsCartOpen, isCartPulsing } = useEcommerceCart();
  const inputRef = useRef<HTMLInputElement>(null);

  // Detección de dirección de scroll: ocultar barra de búsqueda hacia arriba al hacer scroll down (arrastrar hacia arriba),
  // y reaparecer al hacer scroll up (arrastrar hacia abajo)
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScrollDirection = () => {
      const currentScrollY = window.scrollY;
      
      // Siempre visible cerca de la parte superior de la página
      if (currentScrollY <= 90) {
        setIsSearchBarVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Umbral mínimo de scroll para evitar cambios accidentales
      const diff = currentScrollY - lastScrollY.current;
      if (Math.abs(diff) > 8) {
        if (diff > 0) {
          // Usuario hace scroll hacia abajo (arrastra hacia arriba): esconder barra de búsqueda
          setIsSearchBarVisible(false);
        } else {
          // Usuario hace scroll hacia arriba (arrastra hacia abajo): mostrar barra de búsqueda
          setIsSearchBarVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScrollDirection, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollDirection);
  }, []);

  const handleSelectFilter = (type: 'all' | 'stock' | 'cat' | 'gender', value?: string) => {
    setCurrentPage(1);

    if (type === 'all') {
      setSelectedCategory('Esencias para Perfume');
      setSelectedGender('Todos');
      setSelectedStockFilter('Todos');
    } else if (type === 'stock') {
      const val = value as 'Todos' | 'Disponibles' | 'Agotados';
      setSelectedStockFilter(selectedStockFilter === val ? 'Todos' : val);
    } else if (type === 'cat') {
      setSelectedCategory(value || 'Esencias para Perfume');
      setSelectedGender('Todos');
    } else if (type === 'gender') {
      setSelectedCategory('Esencias para Perfume');
      setSelectedGender(value as any);
    }

    const catalogEl = document.getElementById('catalogo');
    if (catalogEl && window.scrollY > 200) {
      const offset = 75;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = catalogEl.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* ================= BARRA DE BÚSQUEDA STICKY CON ANIMACIÓN HACIA ARRIBA ================= */}
      <div
        className="sticky top-2 sm:top-2.5 z-40 w-full pointer-events-none"
      >
        <div className="w-full px-1 sm:px-2">
          {/* Fila: Cápsula de Búsqueda (animada hacia arriba) + Botón del Carrito (permanece visible) */}
          <div className="flex items-center w-full gap-2">
            
            {/* Cápsula de Búsqueda: Se desliza hacia arriba y se desvanece al arrastrar hacia arriba */}
            <div
              className={`flex-1 min-w-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
                isSearchBarVisible
                  ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
                  : '-translate-y-14 opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div
                className={`h-11 sm:h-12 clay-card bg-[#f8fafc]/95 backdrop-blur-md rounded-2xl px-3 flex items-center gap-2.5 transition-all duration-300 ${
                  isScrolled
                    ? 'border-[3px] border-slate-800/60 shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                    : 'border border-white/90 shadow-sm'
                }`}
              >
                {/* Ícono de Búsqueda Permanente */}
                <div className="flex items-center justify-center shrink-0 text-slate-400">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                </div>

                {/* Input de Búsqueda y Botón Limpiar */}
                <div className="flex items-center flex-1 min-w-0">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar perfume: Nombre del perfume..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-1 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 bg-transparent outline-none truncate"
                  />

                  {/* Botón para Limpiar Búsqueda */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery('');
                        setCurrentPage(1);
                        inputRef.current?.focus();
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0 transition-colors"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Botón del Carrito Flotante: Visible permanentemente cuando se hace scroll o cuando la barra se oculta */}
            <div
              className={`transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0 flex items-center ${
                isScrolled || !isSearchBarVisible
                  ? 'w-auto opacity-100 scale-100 translate-x-0 pointer-events-auto overflow-visible'
                  : 'w-0 opacity-0 scale-75 translate-x-4 pointer-events-none overflow-hidden'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                style={{ boxShadow: 'none' }}
                className={`clay-btn clay-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 relative transition-all duration-300 cursor-pointer !shadow-none !ring-0 ${
                  isCartPulsing
                    ? 'scale-105 brightness-105'
                    : 'active:scale-95'
                }`}
              >
                <ShoppingBag className={`w-4 h-4 text-white transition-transform duration-300 ${isCartPulsing ? '-translate-y-0.5 scale-110' : ''}`} />
                <span className="text-xs font-black hidden sm:inline text-white">Carrito</span>
                {totalItems > 0 && (
                  <span className={`px-2 h-5 rounded-full bg-purple-950/85 text-white text-[10px] sm:text-[11px] font-black flex items-center justify-center transition-all duration-300 ${
                    isCartPulsing ? 'scale-115' : ''
                  }`}>
                    ${subtotal.toFixed(2)}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
