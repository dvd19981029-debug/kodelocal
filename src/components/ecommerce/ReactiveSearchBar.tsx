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
  const lastScrollY = useRef(0);

  // Detección reactiva de scroll
  useEffect(() => {
    const handleScroll = () => {
      // Si el input está enfocado o el usuario está escribiendo, no colapsar para no interrumpir
      if (isInputFocused) return;

      const currentScrollY = window.scrollY;

      // Al desplazarse hacia abajo más de 70px -> activar animación de encogimiento a botoncito en esquina superior derecha
      if (currentScrollY > 75 && currentScrollY > lastScrollY.current + 5) {
        setIsCollapsed(true);
      } 
      // Al arrastrar hacia arriba -> expandir suavemente a barra normal completa
      else if (currentScrollY < lastScrollY.current - 6 || currentScrollY <= 40) {
        setIsCollapsed(false);
      }

      lastScrollY.current = currentScrollY;
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

  const hasActiveFilters = 
    Boolean(searchQuery) || 
    selectedCategory !== 'Todos' || 
    selectedGender !== 'Todos' || 
    selectedStockFilter !== 'Todos';

  return (
    <div className="sticky top-[54px] sm:top-[62px] z-30 transition-all duration-300 pointer-events-auto py-1">
      
      {/* Contenedor reactivo animado: morphing de barra completa a botoncito en esquina superior derecha */}
      <div className={`transition-all duration-400 ease-out ${
        isCollapsed 
          ? 'flex justify-end' 
          : 'w-full'
      }`}>
        
        {isCollapsed ? (
          /* ================= BOTONCITO EN ESQUINA SUPERIOR DERECHA (ANIMADO) ================= */
          <button
            onClick={handleExpandAndFocus}
            className="w-11 h-11 rounded-full clay-card bg-white/95 border-2 border-white text-indigo-600 flex items-center justify-center shadow-[3px_5px_18px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95 transition-all cursor-pointer relative animate-in zoom-in-75 duration-200"
            title="Abrir buscador"
            aria-label="Buscar fragancias"
          >
            <Search className="w-5 h-5 text-indigo-600" />
            {hasActiveFilters && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-pink-500 ring-2 ring-white animate-pulse" />
            )}
          </button>
        ) : (
          /* ================= BARRA DE BÚSQUEDA NORMAL COMPLETA ================= */
          <div className="w-full space-y-2 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Input de Búsqueda Claymorphic */}
            <div className="relative w-full">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
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
                className="clay-input has-icon w-full pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 bg-white/95 shadow-sm rounded-2xl transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Línea Única Delgada de Opciones con Arrastre Horizontal */}
            <div className="relative">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 touch-pan-x select-none">
                
                {/* Opción: Ver Todo */}
                <button
                  onClick={() => handleSelectFilter('all')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedCategory === 'Todos' && selectedGender === 'Todos' && selectedStockFilter === 'Todos'
                      ? 'clay-btn-primary text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <span>✨ Todo</span>
                  <span className="text-[9.5px] opacity-80">({totalProducts})</span>
                </button>

                {/* Opción: En Existencia */}
                <button
                  onClick={() => handleSelectFilter('stock', 'Disponibles')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedStockFilter === 'Disponibles'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-emerald-800 border border-emerald-200/80 shadow-2xs'
                  }`}
                >
                  <span>✅ En Existencia</span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 font-extrabold">
                    {inStockCount}
                  </span>
                </button>

                {/* Opción: Esencias */}
                <button
                  onClick={() => handleSelectFilter('cat', 'Esencias para Perfume')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'Esencias para Perfume' && selectedGender === 'Todos'
                      ? 'clay-btn-primary text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  🌸 Esencias
                </button>

                {/* Opción: Hombres */}
                <button
                  onClick={() => handleSelectFilter('gender', 'Caballero')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'Esencias para Perfume' && selectedGender === 'Caballero'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  🧔 Hombres
                </button>

                {/* Opción: Mujeres */}
                <button
                  onClick={() => handleSelectFilter('gender', 'Dama')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'Esencias para Perfume' && selectedGender === 'Dama'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  👩 Mujeres
                </button>

                {/* Opción: Unisex */}
                <button
                  onClick={() => handleSelectFilter('gender', 'Unisex')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'Esencias para Perfume' && selectedGender === 'Unisex'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  ⚧ Unisex
                </button>

                {/* Opción: Botes & Envases */}
                <button
                  onClick={() => handleSelectFilter('cat', 'Botes')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'Botes'
                      ? 'clay-btn-primary text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  🧴 Botes & Envases
                </button>

                {/* Opción: Cajas & Bolsas */}
                <button
                  onClick={() => handleSelectFilter('cat', 'Empaque')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'Empaque'
                      ? 'clay-btn-primary text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  🎁 Cajas & Bolsas
                </button>

                {/* Opción: Alcohol & Fijador */}
                <button
                  onClick={() => handleSelectFilter('cat', 'Insumos y Materia Prima')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === 'Insumos y Materia Prima'
                      ? 'clay-btn-primary text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  🧪 Alcohol & Fijador
                </button>

                {/* Opción: Agotados */}
                <button
                  onClick={() => handleSelectFilter('stock', 'Agotados')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedStockFilter === 'Agotados'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white/90 hover:bg-white text-rose-800 border border-rose-200/80 shadow-2xs'
                  }`}
                >
                  <span>❌ Agotados</span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-900 font-extrabold">
                    {outOfStockCount}
                  </span>
                </button>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
