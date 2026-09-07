'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

export default function EcommerceHomePage() {
  const [products, setProducts] = useState<ProductItem[]>(() => INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'Todos' | 'Caballero' | 'Dama' | 'Unisex'>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Esencias para Perfume');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'Todos' | 'Disponibles' | 'Agotados'>('Todos');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 36;

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
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;

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
      const matchesSearch = 
        !q ||
        skuStr === q ||
        nameStr.includes(q) ||
        officialStr.includes(q) ||
        brandStr.includes(q) ||
        barcodeStr.includes(q);

      return matchesCategory && matchesGender && matchesStock && matchesSearch;
    });
  }, [products, searchQuery, selectedGender, selectedCategory, selectedStockFilter]);

  // Lista de botes disponibles para preparar perfumes
  const availableBottles = useMemo(() => {
    const list = products.filter(p => p.category === 'Botes' || p.category === 'Botes & Envases');
    if (list.length > 0) return list;
    return INITIAL_PRODUCTS.filter(p => p.category === 'Botes');
  }, [products]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      
      {/* ================= BARRA DE BÚSQUEDA REACTIVA (ARRIBA DEL BANNER) ================= */}
      <section className="pt-0.5">
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
      </section>

      {/* ================= CARRUSEL PROMOCIONAL FORMATO VIDEO ================= */}
      <section className="pt-0">
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

        {/* Tira compacta de beneficios clave */}
        <div className="grid grid-cols-3 gap-2 mt-2.5 sm:mt-3 text-center">
          <div className="clay-card flex items-center justify-center gap-1.5 py-2 px-2 text-[9px] sm:text-xs text-slate-700 font-bold border border-white/80">
            <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Envíos Todo El Salvador</span>
          </div>
          <div className="clay-card flex items-center justify-center gap-1.5 py-2 px-2 text-[9px] sm:text-xs text-slate-700 font-bold border border-white/80">
            <Droplets className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span className="truncate">Concentración 33%</span>
          </div>
          <div className="clay-card flex items-center justify-center gap-1.5 py-2 px-2 text-[9px] sm:text-xs text-slate-700 font-bold border border-white/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Pago Contra Entrega</span>
          </div>
        </div>
      </section>

      {/* ================= CATÁLOGO DE PRODUCTOS ================= */}
      <section id="catalogo" className="space-y-3.5 scroll-mt-20">
        
        {/* Encabezado limpio del catálogo */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              {selectedCategory === 'Todos' ? 'Catálogo Completo' : selectedCategory}
              {selectedCategory === 'Esencias para Perfume' && selectedGender !== 'Todos' && (
                <span className="text-indigo-600 font-black ml-1.5">
                  • {selectedGender === 'Caballero' ? '🧔 Caballero' : selectedGender === 'Dama' ? '👩 Dama' : '⚧ Unisex'}
                </span>
              )}
            </h2>
            <span className="clay-badge text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg font-black">
              {filteredProducts.length}
            </span>
          </div>

          {isLoadingCatalog && (
            <span className="text-[10px] sm:text-xs font-bold text-indigo-500 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              Sincronizando existencias...
            </span>
          )}
        </div>

        {/* ================= REJILLA DE PRODUCTOS ================= */}
        {paginatedProducts.length === 0 ? (
          <div className="clay-card p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-800 text-base">No encontramos resultados para tu búsqueda</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta buscar por la marca inspirada (ej. Chanel, Paco Rabanne), o limpia los filtros de búsqueda.
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
            {paginatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} availableBottles={availableBottles} />
            ))}
          </div>
        )}

        {/* ================= PAGINACIÓN ================= */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold">
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredProducts.length} productos en total)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Anterior
              </button>

              {/* Páginas numéricas */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(totalPages - 4 + i, currentPage - 2 + i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                      currentPage === pageNum
                        ? 'clay-btn-primary text-white shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

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
            <h4 className="font-extrabold text-xs text-slate-900">Elige tu fragancia</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Selecciona tu contratipo favorito y el tamaño deseado: 30ml, 50ml, 100ml o por onzas puras.
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
            <h4 className="font-extrabold text-xs text-slate-900">Recibe y paga</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              El mensajero te entrega tu pedido y pagas en efectivo o mediante transferencia bancaria.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
