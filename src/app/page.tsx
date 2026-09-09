'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  Droplets, 
  HeartHandshake, 
  ChevronRight,
  ArrowDown,
  Flame,
  X
} from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts } from '@/lib/store';
import ProductCard from '@/components/ecommerce/ProductCard';
import PromoBannerCarousel from '@/components/ecommerce/PromoBannerCarousel';
import ReactiveSearchBar from '@/components/ecommerce/ReactiveSearchBar';
import BuildYourPerfumeCard from '@/components/ecommerce/BuildYourPerfumeCard';
import PerfumeKitBuilderModal from '@/components/ecommerce/PerfumeKitBuilderModal';
import { getOriginalPerfumeName } from '@/lib/perfumeNames';

export default function EcommerceHomePage() {
  const [products, setProducts] = useState<ProductItem[]>(() => INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'Todos' | 'Caballero' | 'Dama' | 'Unisex'>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Esencias para Perfume');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'Todos' | 'Disponibles' | 'Agotados'>('Todos');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  // Columnas dinámicas según el tamaño de pantalla para calcular exactamente 7 filas
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1280) {
        setColumns(4);
      } else if (window.innerWidth >= 768) {
        setColumns(3);
      } else {
        setColumns(2);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    // 1. Cargar catálogo desde /api/products con existencias reales de Supabase
    const loadCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
          return;
        }
      } catch (err) {
        console.error('Error conectando a /api/products, usando fallback:', err);
      } finally {
        setIsLoadingCatalog(false);
      }

      // Fallback local
      const loaded = getStoredProducts();
      setProducts(loaded && loaded.length > 0 ? loaded : INITIAL_PRODUCTS);
    };

    loadCatalog();
  }, []);

  // Filtrado reactivo de productos
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      // Filtro de categoría
      let matchesCategory = true;
      if (selectedCategory === 'Alcohol y Materiales') {
        matchesCategory = p.category === 'Insumos y Materia Prima' || p.category === 'Empaque';
      } else if (selectedCategory !== 'Todos') {
        matchesCategory = p.category === selectedCategory;
      }

      // Filtro de género (solo si es categoría de esencias)
      let matchesGender = true;
      if (selectedCategory === 'Esencias para Perfume' && selectedGender !== 'Todos') {
        matchesGender = p.gender ? p.gender.toLowerCase().includes(selectedGender.toLowerCase()) : false;
      }

      // Filtro de disponibilidad / existencias
      let matchesStock = true;
      if (selectedStockFilter === 'Disponibles') {
        matchesStock = p.stock > 0;
      } else if (selectedStockFilter === 'Agotados') {
        matchesStock = !p.stock || p.stock <= 0;
      }

      // Filtro de búsqueda seguro
      const skuStr = String(p.sku || '').toLowerCase();
      const nameStr = String(p.name || '').toLowerCase();
      const brandStr = String(p.brand || '').toLowerCase();
      const barcodeStr = String(p.barcode || '');
      const officialStr = (p.officialName || '').toLowerCase();
      const descStr = String(p.description || '').toLowerCase();
      const origPerfumeStr = getOriginalPerfumeName(p).toLowerCase();
      const normDesc = descStr.replace(/acqua/g, 'aqua');
      const normOrig = origPerfumeStr.replace(/acqua/g, 'aqua');

      // Normalización inteligente (ej. acqua / aqua)
      const normQ = q.replace(/acqua/g, 'aqua');
      const normName = nameStr.replace(/acqua/g, 'aqua');

      const matchesSearch = 
        !q ||
        skuStr === q ||
        nameStr.includes(q) ||
        normName.includes(normQ) ||
        officialStr.includes(q) ||
        brandStr.includes(q) ||
        barcodeStr.includes(q) ||
        descStr.includes(q) ||
        normDesc.includes(normQ) ||
        origPerfumeStr.includes(q) ||
        normOrig.includes(normQ);

      return matchesCategory && matchesGender && matchesStock && matchesSearch;
    });
  }, [products, searchQuery, selectedGender, selectedCategory, selectedStockFilter]);

  // Lista de botes disponibles para preparar perfumes
  const availableBottles = useMemo(() => {
    const list = products.filter(p => p.category === 'Botes' || p.category === 'Botes & Envases');
    if (list.length > 0) return list;
    return INITIAL_PRODUCTS.filter(p => p.category === 'Botes');
  }, [products]);

  // Lista de esencias disponibles para el Kit
  const availableEssences = useMemo(() => {
    return products.filter(p => p.category === 'Esencias para Perfume');
  }, [products]);

  // Paginación: Exactamente 7 filas por página según el número de columnas del dispositivo
  const targetRows = 7;
  const pageSize = targetRows * columns;

  const totalPages = useMemo(() => {
    if (filteredProducts.length === 0) return 1;
    return Math.ceil(filteredProducts.length / pageSize);
  }, [filteredProducts.length, pageSize]);

  // Si se filtran productos y la página actual excede el nuevo total, reajustar a la última válida
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Generador de paginación inteligente: Siempre muestra la página 1, la última página y las páginas vecinas
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: (number | string)[] = [];

    // Siempre página 1
    items.push(1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    if (start > 2) {
      items.push('ellipsis-start');
    }

    for (let p = start; p <= end; p++) {
      items.push(p);
    }

    if (end < totalPages - 1) {
      items.push('ellipsis-end');
    }

    // Siempre última página
    items.push(totalPages);

    return items;
  }, [totalPages, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl) {
      const offset = 75;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = catalogEl.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  // Al buscar en modo sticky, llevar al usuario a ver los resultados desde la primera línea
  const prevQueryRef = useRef(searchQuery);
  useEffect(() => {
    const trimmed = searchQuery.trim();
    const prevTrimmed = prevQueryRef.current.trim();
    if (trimmed.length > 0 && trimmed !== prevTrimmed) {
      const catalogEl = document.getElementById('catalogo');
      if (catalogEl && window.scrollY > 100) {
        const offset = 70;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = catalogEl.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }
    }
    prevQueryRef.current = searchQuery;
  }, [searchQuery]);

  const renderPagination = (position: 'top' | 'bottom') => {
    if (totalPages <= 1) return null;
    if (position === 'top' && currentPage === 1) return null;

    return (
      <div
        className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${
          position === 'top'
            ? 'pb-4 pt-1 border-b border-slate-200/80'
            : 'pt-6 border-t border-slate-200/80'
        }`}
      >
        <span className="text-xs text-slate-500 font-semibold">
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredProducts.length} productos en total)
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Anterior
          </button>

          {/* Páginas numéricas con página 1 y última siempre fijas para saltar fácilmente */}
          {paginationItems.map((item, idx) => {
            if (typeof item === 'string') {
              return (
                <span key={`ellipsis-${position}-${idx}`} className="w-5 text-center text-xs font-bold text-slate-400 select-none">
                  ...
                </span>
              );
            }

            return (
              <button
                key={`${position}-${item}`}
                onClick={() => handlePageChange(item)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentPage === item
                    ? 'clay-btn-primary text-white shadow-xs scale-105'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
                }`}
              >
                {item}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      
      {/* ================= BARRA DE BÚSQUEDA REACTIVA PERMANENTEMENTE STICKY ================= */}
      <ReactiveSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedGender={selectedGender}
        setSelectedGender={setSelectedGender}
        selectedStockFilter={selectedStockFilter}
        setSelectedStockFilter={setSelectedStockFilter}
        totalProducts={products.length}
        inStockCount={products.filter(p => p.stock > 0).length}
        outOfStockCount={products.filter(p => p.stock <= 0).length}
        setCurrentPage={setCurrentPage}
      />

      {/* ================= CARRUSEL PROMOCIONAL Y BANNER DEL KIT (SE OCULTA AUTOMÁTICAMENTE AL BUSCAR) ================= */}
      {!isSearching && (
        <section className="pt-0 animate-in fade-in duration-300 space-y-3 sm:space-y-3.5">
          <PromoBannerCarousel 
            onOpenKitBuilder={() => setIsKitModalOpen(true)}
            onExploreCatalog={() => {
              const el = document.getElementById('catalogo');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onFilterCategory={(cat) => {
              setSelectedCategory(cat);
              const el = document.getElementById('catalogo');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </section>
      )}

      {/* ================= CATÁLOGO DE PRODUCTOS ================= */}
      <section id="catalogo" className="space-y-4 scroll-mt-20">
        
        {/* Selector de Sección Claymorfista Responsivo y Discreto con Animación de Estiramiento */}
        <div className="w-full">
          <div className="clay-tabs-track max-w-xl mx-auto">
            
            {/* Pestaña: Esencias */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Esencias para Perfume');
                setCurrentPage(1);
              }}
              className={`clay-tab-item py-2 sm:py-2.5 px-3 sm:px-5 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                selectedCategory === 'Esencias para Perfume'
                  ? 'clay-tab-active flex-[1.4] sm:flex-[1.5]'
                  : 'clay-tab-inactive flex-1'
              }`}
            >
              <span>Esencias</span>
            </button>

            {/* Pestaña: Botes */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Botes');
                setSelectedGender('Todos');
                setCurrentPage(1);
              }}
              className={`clay-tab-item py-2 sm:py-2.5 px-3 sm:px-5 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                selectedCategory === 'Botes'
                  ? 'clay-tab-active flex-[1.4] sm:flex-[1.5]'
                  : 'clay-tab-inactive flex-1'
              }`}
            >
              <span>Botes</span>
            </button>

            {/* Pestaña: Alcohol y Materiales */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Alcohol y Materiales');
                setSelectedGender('Todos');
                setCurrentPage(1);
              }}
              className={`clay-tab-item py-2 sm:py-2.5 px-3 sm:px-5 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                selectedCategory === 'Alcohol y Materiales'
                  ? 'clay-tab-active flex-[1.5] sm:flex-[1.6]'
                  : 'clay-tab-inactive flex-1'
              }`}
            >
              <span className="truncate">Alcohol y Materiales</span>
            </button>

          </div>
        </div>

        {/* Encabezado informativo del catálogo */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              {selectedCategory === 'Esencias para Perfume' 
                ? (selectedGender === 'Todos' ? 'Esencias de Perfume' : `Esencias • ${selectedGender === 'Caballero' ? 'Hombre' : selectedGender}`) 
                : selectedCategory === 'Botes' 
                  ? 'Botes y Frascos' 
                  : selectedCategory === 'Alcohol y Materiales'
                    ? 'Alcohol, Fijador y Materiales'
                    : selectedCategory}
            </h2>
            <span className="clay-badge text-[10px] sm:text-xs bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-lg font-black">
              {filteredProducts.length} disponibles
            </span>
          </div>
        </div>

        {/* ================= TARJETA DESTACADA: ARMA TU PROPIO PERFUME (SOLO ARRIBA SI NO SE ESTÁ BUSCANDO) ================= */}
        {!isSearching && (
          <BuildYourPerfumeCard onOpenBuilder={() => setIsKitModalOpen(true)} />
        )}

        {/* ================= PAGINACIÓN SUPERIOR ================= */}
        {renderPagination('top')}

        {/* ================= REJILLA DE PRODUCTOS (EXACTAMENTE 7 FILAS POR PÁGINA) ================= */}
        {paginatedProducts.length === 0 ? (
          <div className="clay-card p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-800 text-base">No encontramos resultados para tu búsqueda</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta buscar por el nombre del perfume o limpia los filtros de búsqueda.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGender('Todos');
                setSelectedCategory('Esencias para Perfume');
              }}
              className="clay-btn clay-btn-primary px-4 py-2 text-xs rounded-xl font-bold mt-2"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-4 md:gap-x-5 gap-y-7 sm:gap-y-9">
            {isSearching ? (
              <>
                {paginatedProducts.slice(0, 4).map((prod, idx) => (
                  <ProductCard key={prod.id} product={prod} priority={idx < 4} />
                ))}
                {currentPage === 1 && (
                  <div className="col-span-full">
                    <BuildYourPerfumeCard onOpenBuilder={() => setIsKitModalOpen(true)} />
                  </div>
                )}
                {paginatedProducts.slice(4).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </>
            ) : (
              paginatedProducts.map((prod, idx) => (
                <ProductCard key={prod.id} product={prod} priority={currentPage === 1 && idx < 4} />
              ))
            )}
          </div>
        )}

        {/* ================= PAGINACIÓN INFERIOR ================= */}
        {renderPagination('bottom')}

      </section>

      {/* ================= SECCIÓN EDUCATIVA: CÓMO PEDIR ================= */}
      <section className="clay-card p-6 sm:p-10 border border-white/90 bg-white/60 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
            Proceso Fácil
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            ¿Cómo pedir tu fragancia en Aromaniak?
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Entregas directas a tu casa u oficina en todo El Salvador
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="clay-card p-4 space-y-2 bg-white/90">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">
              1
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Elige tu fragancia o Kit</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Selecciona tu contratipo favorito por onzas puras o arma tu kit completo preparado por $15.
            </p>
          </div>

          <div className="clay-card p-4 space-y-2 bg-white/90">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center">
              2
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Ingresa tu dirección</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Ve a tu carrito y coloca tu nombre, teléfono y dirección exacta en cualquier parte del país.
            </p>
          </div>

          <div className="clay-card p-4 space-y-2 bg-white/90">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-black text-sm flex items-center justify-center">
              3
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Bodega lo prepara</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Nuestro laboratorio macera y envasa tu perfume con atomizador de alta difusión y sellado hermético.
            </p>
          </div>

          <div className="clay-card p-4 space-y-2 bg-white/90">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center">
              4
            </div>
            <h4 className="font-extrabold text-xs text-slate-900">Recibe con C807</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              El mensajero de C807 te entrega tu pedido directamente en tus manos en cualquier departamento.
            </p>
          </div>

        </div>
      </section>

      {/* ================= MODAL DEL CONFIGURADOR DEL KIT DE PERFUME ($15 / $18 PLUS) ================= */}
      <PerfumeKitBuilderModal
        isOpen={isKitModalOpen}
        onClose={() => setIsKitModalOpen(false)}
        availableEssences={availableEssences}
        availableBottles={availableBottles}
      />

    </div>
  );
}
