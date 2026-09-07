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
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  // Detección reactiva de scroll para encoger a bolita o volver a expandir
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Si baja más de 90px y el usuario está haciendo scroll hacia abajo -> encoger a bolita
      if (currentScrollY > 100 && currentScrollY > lastScrollY.current + 8) {
        setIsCollapsed(true);
      } 
      // Si el usuario arrastra para subir o regresa a la parte superior -> expandir normalmente
      else if (currentScrollY < lastScrollY.current - 12 || currentScrollY <= 60) {
        setIsCollapsed(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleExpandAndFocus = () => {
    setIsCollapsed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 280);
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
    <>
      {/* ================= CONTENEDOR PRINCIPAL REACTIVO (ARRIBA DEL BANNER) ================= */}
      <div 
        className={`w-full transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? 'opacity-0 -translate-y-6 pointer-events-none h-0 overflow-hidden mb-0' 
            : 'opacity-100 translate-y-0 h-auto mb-3'
        }`}
      >
        <div className="space-y-2">
          
          {/* Campo de Búsqueda Compacto Claymorphism */}
          <div className="relative w-full">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar perfume: Sauvage, 212, Baccarat, One Million, Carolina Herrera..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="clay-input has-icon w-full pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 bg-white shadow-sm rounded-2xl transition-all focus:ring-2 focus:ring-indigo-500/20"
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
      </div>

      {/* ================= BOLITA FLOTANTE REACTIVA (CUANDO SE HACE SCROLL DOWN) ================= */}
      <button
        onClick={handleExpandAndFocus}
        className={`fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full clay-card bg-white/95 border border-white text-indigo-600 flex items-center justify-center shadow-[4px_6px_20px_rgba(99,102,241,0.35)] transition-all duration-300 cursor-pointer active:scale-90 hover:scale-105 ${
          isCollapsed 
            ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto' 
            : 'scale-50 opacity-0 translate-y-8 pointer-events-none'
        }`}
        title="Buscar fragancias (subir)"
        aria-label="Abrir barra de búsqueda"
      >
        <Search className="w-5 h-5 text-indigo-600" />
        
        {/* Indicador de búsqueda o filtros activos */}
        {hasActiveFilters && (
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-pink-500 ring-2 ring-white animate-pulse" />
        )}
      </button>
    </>
  );
}
