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
  X,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  Clock,
  MapPin,
  Wand2
} from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS, getStoredProducts, saveStoredProducts } from '@/lib/store';
import ProductCard from '@/components/ecommerce/ProductCard';
import PromoBannerCarousel from '@/components/ecommerce/PromoBannerCarousel';
import ReactiveSearchBar from '@/components/ecommerce/ReactiveSearchBar';
import PerfumeKitBuilderModal from '@/components/ecommerce/PerfumeKitBuilderModal';
import { getOriginalPerfumeName } from '@/lib/perfumeNames';

export default function EcommerceHomePage() {
  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'Todos' | 'Caballero' | 'Dama' | 'Unisex'>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Esencias para Perfume');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'Todos' | 'Disponibles' | 'Agotados'>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  // Columnas dinámicas según el tamaño de pantalla para calcular exactamente 7 filas
  const [columns, setColumns] = useState(2);

  const availableEssences = useMemo(() => {
    return products.filter((p) => p.category === 'Esencias para Perfume');
  }, [products]);

  const availableBottles = useMemo(() => {
    return products.filter((p) => p.category === 'Botes');
  }, [products]);

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
    // Sincronizar con catálogo de Supabase manteniendo coherencia sin parpadeos
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          saveStoredProducts(data.products);
        }
      } catch (err) {
        console.error('Error conectando a /api/products, manteniendo catálogo local:', err);
      }
    };

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrado reactivo de productos
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      // Filtro de categoría
      let matchesCategory = true;
      if (selectedCategory === 'Insumos' || selectedCategory === 'Alcohol y Materiales') {
        matchesCategory = p.category === 'Insumos y Materia Prima' || p.category === 'Empaque' || p.category === 'Insumos';
      } else if (selectedCategory === 'Arma tu perfume') {
        matchesCategory = p.category === 'Botes' || p.category === 'Esencias para Perfume';
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
        
        {/* Selector de Sección Claymorfista Responsivo con Pestañas: Esencias, Botes, Insumos y Arma tu perfume */}
        <div className="w-full">
          <div className="clay-tabs-track max-w-2xl mx-auto flex items-stretch gap-1">
            
            {/* Pestaña: Esencias */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Esencias para Perfume');
                setCurrentPage(1);
              }}
              className={`clay-tab-item py-2 sm:py-2.5 px-2.5 sm:px-4 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                selectedCategory === 'Esencias para Perfume'
                  ? 'clay-tab-active flex-[1.3] sm:flex-[1.4]'
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
              className={`clay-tab-item py-2 sm:py-2.5 px-2.5 sm:px-4 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                selectedCategory === 'Botes'
                  ? 'clay-tab-active flex-[1.1] sm:flex-[1.2]'
                  : 'clay-tab-inactive flex-1'
              }`}
            >
              <span>Botes</span>
            </button>

            {/* Pestaña: Insumos (antes Alcohol y Materiales) */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Insumos');
                setSelectedGender('Todos');
                setCurrentPage(1);
              }}
              className={`clay-tab-item py-2 sm:py-2.5 px-2.5 sm:px-4 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                selectedCategory === 'Insumos' || selectedCategory === 'Alcohol y Materiales'
                  ? 'clay-tab-active flex-[1.1] sm:flex-[1.2]'
                  : 'clay-tab-inactive flex-1'
              }`}
            >
              <span className="truncate">Insumos</span>
            </button>

            {/* Pestaña: Arma tu perfume */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Arma tu perfume');
                setSelectedGender('Todos');
                setCurrentPage(1);
                setTimeout(() => {
                  const el = document.getElementById('seccion-arma-tu-perfume');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 60);
              }}
              className={`clay-tab-item py-2 sm:py-2.5 px-2.5 sm:px-4 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                selectedCategory === 'Arma tu perfume'
                  ? 'clay-tab-active flex-[1.5] sm:flex-[1.6] !bg-gradient-to-r !from-amber-500 !to-purple-600 !text-white !shadow-[0_4px_16px_rgba(245,158,11,0.35)]'
                  : 'clay-tab-inactive flex-1 text-amber-700 hover:text-amber-800'
              }`}
            >
              <span className="truncate flex items-center justify-center gap-1">
                <Wand2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Arma tu perfume</span>
              </span>
            </button>

          </div>
        </div>

        {/* ================= VISTA CONDICIONAL: ARMA TU PERFUME (INLINE) O CATÁLOGO ================= */}
        {selectedCategory === 'Arma tu perfume' ? (
          <section id="seccion-arma-tu-perfume" className="scroll-mt-24 space-y-4 pt-1">
            <PerfumeKitBuilderModal
              inline={true}
              isOpen={true}
              onClose={() => setSelectedCategory('Esencias para Perfume')}
              availableEssences={availableEssences}
              availableBottles={availableBottles}
            />
          </section>
        ) : (
          <>
            {/* Encabezado informativo del catálogo */}
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                  {selectedCategory === 'Esencias para Perfume' 
                    ? (selectedGender === 'Todos' ? 'Esencias de Perfume' : `Esencias • ${selectedGender === 'Caballero' ? 'Hombre' : selectedGender}`) 
                    : selectedCategory === 'Botes' 
                      ? 'Botes y Frascos' 
                      : selectedCategory === 'Insumos' || selectedCategory === 'Alcohol y Materiales'
                        ? 'Insumos y Materiales'
                        : selectedCategory}
                </h2>
                <span className="clay-badge text-[10px] sm:text-xs bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-lg font-black">
                  {filteredProducts.length} disponibles
                </span>
              </div>
            </div>

            {/* ================= FILTRO CLAYMÓRFICO: MÁS VENDIDAS / HOMBRE / DAMA / UNISEX ================= */}
            {selectedCategory === 'Esencias para Perfume' && (
              <div className="w-full">
                <div className="clay-tabs-track max-w-xl mx-auto">
                  {/* Pestaña: Más Vendidas */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGender('Todos');
                      setCurrentPage(1);
                    }}
                    className={`clay-tab-item py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                      selectedGender === 'Todos'
                        ? 'clay-tab-active flex-[1.4] sm:flex-[1.5]'
                        : 'clay-tab-inactive flex-1'
                    }`}
                  >
                    <span className="truncate">Más Vendidas</span>
                  </button>

                  {/* Pestaña: Hombre */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGender('Caballero');
                      setCurrentPage(1);
                    }}
                    className={`clay-tab-item py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                      selectedGender === 'Caballero'
                        ? 'clay-tab-active flex-[1.4] sm:flex-[1.5]'
                        : 'clay-tab-inactive flex-1'
                    }`}
                  >
                    <span>Hombre</span>
                  </button>

                  {/* Pestaña: Dama */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGender('Dama');
                      setCurrentPage(1);
                    }}
                    className={`clay-tab-item py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                      selectedGender === 'Dama'
                        ? 'clay-tab-active flex-[1.4] sm:flex-[1.5]'
                        : 'clay-tab-inactive flex-1'
                    }`}
                  >
                    <span>Dama</span>
                  </button>

                  {/* Pestaña: Unisex */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGender('Unisex');
                      setCurrentPage(1);
                    }}
                    className={`clay-tab-item py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm tracking-tight cursor-pointer transition-all duration-300 ${
                      selectedGender === 'Unisex'
                        ? 'clay-tab-active flex-[1.4] sm:flex-[1.5]'
                        : 'clay-tab-inactive flex-1'
                    }`}
                  >
                    <span>Unisex</span>
                  </button>
                </div>
              </div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-4 md:gap-x-5 gap-y-10 sm:gap-y-12">
                {paginatedProducts.map((prod, idx) => (
                  <ProductCard key={prod.id} product={prod} priority={currentPage === 1 && idx < 4} />
                ))}
              </div>
            )}

            {/* ================= PAGINACIÓN INFERIOR ================= */}
            {renderPagination('bottom')}
          </>
        )}

      </section>

      {/* ================= SECCIÓN EDUCATIVA: CÓMO PEDIR ================= */}
      <section className="clay-card p-5 sm:p-8 md:p-10 border border-white/90 bg-white/70 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
            Proceso de Compra
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            ¿Cómo pedir tu fragancia en Aromaniak?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Entregamos a <strong className="text-indigo-700 font-bold">absolutamente todas partes de El Salvador</strong> o puedes retirar en nuestro local.
          </p>
        </div>

        {/* 4 Pasos del Flujo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Paso 1 */}
          <div className="clay-card p-4 space-y-2.5 bg-white/95">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center shadow-xs">
              1
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Elige tu fragancia e insumos</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
              Selecciona tu fragancia favorita en 1 onza o media onza (½ oz), y agrega a tu pedido los frascos vacíos e insumos que necesites.
            </p>
          </div>

          {/* Paso 2 */}
          <div className="clay-card p-4 space-y-2.5 bg-white/95">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shadow-xs">
              2
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Envío o Retiro en Local</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
              Elige entre <strong className="text-slate-800">pasar a retirar a nuestro local en San Salvador</strong> o solicitar <strong className="text-slate-800">envío a domicilio</strong>. Envíos y cobertura de <strong className="text-indigo-700">24 a 48 horas para todo el país</strong> (normalmente en 24 horas).
            </p>
          </div>

          {/* Paso 3 */}
          <div className="clay-card p-4 space-y-2.5 bg-white/95">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shadow-xs">
              3
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Pago Seguro</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
              Aceptamos <strong className="text-slate-800">Tarjeta de Crédito / Débito</strong> o <strong className="text-slate-800">Transferencia Bancaria</strong> (Agrícola, BAC, Cuscatlán).
            </p>
          </div>

          {/* Paso 4 */}
          <div className="clay-card p-4 space-y-2.5 bg-white/95">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-black text-sm flex items-center justify-center shadow-xs">
              4
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Entrega Rápida</h4>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
              Despacho inmediato en días hábiles. Cobertura en los 14 departamentos de <strong className="text-slate-800">24 a 48 horas para todo el país</strong>.
            </p>
          </div>

        </div>

        {/* Banner Oficial de Advertencias de Seguridad Médica y Uso Responsable */}
        <div className="clay-card p-4 sm:p-5 bg-amber-50/90 border border-amber-300/80 text-amber-950 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Aviso Importante de Salud y Seguridad: Uso Responsable</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-[11px] sm:text-xs text-amber-900/90 font-medium leading-relaxed">
            <li>
              <strong>No usar directamente sobre la piel:</strong> Las esencias son concentrados puros y <strong>tienen que ser mezcladas sí o sí con alcohol especial de perfumería</strong> antes de cualquier aplicación.
            </li>
            <li>
              <strong>Bajo ningún motivo deben ser ingeridas, inhaladas directamente ni tener contacto con los ojos.</strong> En caso de contacto accidental con los ojos, enjuagar con abundante agua y consultar a un médico.
            </li>
            <li>
              <strong>Uso restringido ante alergias:</strong> No deben ser usadas por personas con alergias o antecedentes/experiencias previas de alergia a los perfumes, al alcohol o a cualquiera de sus componentes químicos. Mantener fuera del alcance de niños y mascotas.
            </li>
          </ul>
        </div>
      </section>

    </div>
  );
}
