'use client';

import React, { useRef } from 'react';
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
  const { totalItems, setIsCartOpen, isCartPulsing } = useEcommerceCart();
  const inputRef = useRef<HTMLInputElement>(null);

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
    <>
      {/* ================= BARRA DE BÚSQUEDA STICKY CON ANIMACIÓN BUBBLY ================= */}
      <div
        className="sticky top-2 sm:top-2.5 z-40 w-full pointer-events-none transition-all duration-400"
      >
        <div className="w-full px-1 sm:px-2">
          {/* Fila Bubbly: Cápsula de Búsqueda + Botón del Carrito Idéntico al Original */}
          <div className="flex items-center w-full gap-2">
            
            {/* Cápsula de Búsqueda Flotante (se adapta suavemente por la derecha con rebote) */}
            <div
              className={`flex-1 min-w-0 pointer-events-auto h-11 sm:h-12 clay-card bg-[#f8fafc]/95 backdrop-blur-md rounded-2xl px-3 flex items-center gap-2.5 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
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
                  placeholder="Buscar perfume: Sauvage, 212, Baccarat, One Million, Carolina Herrera..."
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

            {/* Botón del Carrito: Sin sombras cuando flota junto a la barra de búsqueda */}
            <div
              className={`transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0 flex items-center ${
                isScrolled
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
                  <span className={`min-w-[20px] h-5 px-1 rounded-full bg-purple-950/80 text-white text-[10px] font-black flex items-center justify-center transition-all duration-300 ${
                    isCartPulsing ? 'scale-115' : ''
                  }`}>
                    {totalItems}
                  </span>
                )}
              </button>
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
    </>
  );
}
