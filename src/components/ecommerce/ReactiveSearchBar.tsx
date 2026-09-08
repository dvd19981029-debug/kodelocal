'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Detección reactiva de scroll: se oculta al bajar y reaparece DE INMEDIATO al subir
  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      // Si el input está enfocado para escribir, mantener expandido para no interrumpir
      if (isInputFocused) return;

      const currentY = window.scrollY;
      const diff = currentY - lastY;

      // 1. Cerca de la parte superior de la página, siempre completamente abierta
      if (currentY <= 60) {
        setIsCollapsed(false);
      } 
      // 2. Desplazamiento hacia abajo intencional y habiendo pasado la cabecera: colapsar a burbuja
      else if (diff > 6 && currentY > 100) {
        setIsCollapsed(true);
      } 
      // 3. Desplazamiento hacia arriba: reabrir DE INMEDIATO la barra al menor movimiento hacia arriba
      else if (diff < -4) {
        setIsCollapsed(false);
      }

      lastY = Math.max(0, currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInputFocused]);

  const handleExpandAndFocus = () => {
    setIsCollapsed(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
  };

  const handleSelectFilter = (type: 'all' | 'stock' | 'cat' | 'gender', value?: string) => {
    setCurrentPage(1);

    if (type === 'all') {
      setSelectedCategory('Todos');
      setSelectedGender('Todos');
      setSelectedStockFilter('Todos');
    } else if (type === 'stock') {
      const val = value as 'Todos' | 'Disponibles' | 'Agotados';
      setSelectedStockFilter(selectedStockFilter === val ? 'Todos' : val);
    } else if (type === 'cat') {
      setSelectedCategory(value || 'Todos');
      setSelectedGender('Todos');
    } else if (type === 'gender') {
      setSelectedCategory('Esencias para Perfume');
      setSelectedGender(value as any);
    }
  };

  return (
    <div className="w-full">
      {/* ================= BARRA DE BÚSQUEDA STICKY DIRECTAMENTE DEBAJO DEL HEADER ================= */}
      <div className="sticky top-[61px] sm:top-[77px] md:top-[85px] z-30 pointer-events-none transition-all">
        <div className="flex justify-end w-full px-1 sm:px-3">
          
          {/* Contenedor Unificado: Morphing puramente horizontal (altura fija estable h-11 sm:h-12) */}
          <div
            onClick={isCollapsed ? handleExpandAndFocus : undefined}
            className={`pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative flex items-center select-none overflow-hidden ${
              isCollapsed
                ? 'w-11 h-11 sm:w-12 sm:h-12 rounded-full clay-card bg-white/95 border-2 border-white shadow-[0_8px_24px_rgba(99,102,241,0.35)] cursor-pointer hover:scale-105 active:scale-95 justify-center mt-2 sm:mt-2.5 mr-1'
                : 'w-full h-11 sm:h-12 clay-card bg-[#f8fafc]/95 backdrop-blur-md border border-white/90 shadow-sm rounded-2xl px-3 gap-2.5 mt-0'
            }`}
          >
            {/* Ícono de Búsqueda Permanente (nunca desaparece; en colapso se centra en la burbuja) */}
            <div className={`flex items-center justify-center shrink-0 transition-colors duration-300 ${
              isCollapsed ? 'w-full h-full text-indigo-600' : 'text-slate-400'
            }`}>
              <Search className={`transition-all duration-300 ${
                isCollapsed ? 'w-5 h-5 text-indigo-600 drop-shadow-xs' : 'w-4 h-4 sm:w-5 sm:h-5 text-slate-400'
              }`} />
            </div>

            {/* Input de Búsqueda y Botón Limpiar (desvanecimiento suave de opacidad sin colapso vertical) */}
            <div className={`flex items-center flex-1 min-w-0 transition-all duration-300 ${
              isCollapsed ? 'opacity-0 w-0 pointer-events-none invisible' : 'opacity-100 w-full visible'
            }`}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar perfume: Sauvage, 212, Baccarat, One Million, Carolina Herrera..."
                value={searchQuery}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
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
      </div>

      {/* ================= LÍNEA DE FILTROS LIMPIA SIN EMOJIS ================= */}
      <div className="w-full mt-2 sm:mt-2.5 px-0.5 sm:px-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 touch-pan-x select-none">
          
          {/* Opción: Más Vendidas (Por defecto) */}
          <button
            onClick={() => handleSelectFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedGender === 'Todos'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            Más Vendidas
          </button>

          {/* Opción: Caballero */}
          <button
            onClick={() => handleSelectFilter('gender', 'Caballero')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedGender === 'Caballero'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            Caballero
          </button>

          {/* Opción: Dama */}
          <button
            onClick={() => handleSelectFilter('gender', 'Dama')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedGender === 'Dama'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            Dama
          </button>

          {/* Opción: Unisex */}
          <button
            onClick={() => handleSelectFilter('gender', 'Unisex')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedGender === 'Unisex'
                ? 'bg-[#7c3aed] text-white shadow-sm'
                : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            Unisex
          </button>

        </div>
      </div>
    </div>
  );
}
