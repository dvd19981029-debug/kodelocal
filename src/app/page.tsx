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

export default function EcommerceHomePage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'Todos' | 'Caballero' | 'Dama' | 'Unisex'>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Esencias para Perfume');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 36;

  useEffect(() => {
    // Cargar productos del catálogo inicial / almacenado
    const loaded = getStoredProducts();
    setProducts(loaded && loaded.length > 0 ? loaded : INITIAL_PRODUCTS);
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

      // Filtro de búsqueda
      const matchesSearch = 
        !q ||
        p.sku.toLowerCase() === q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.barcode.includes(q);

      return matchesCategory && matchesGender && matchesSearch;
    });
  }, [products, searchQuery, selectedGender, selectedCategory]);

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
    <div className="space-y-12 pb-16">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden rounded-3xl clay-card p-6 sm:p-10 lg:p-12 border border-white/80 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/40">
        
        {/* Glow decorativo de fondo */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-5">
          
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-indigo-100 shadow-sm text-xs font-black text-indigo-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Aromaniak El Salvador • Fragancias Finas</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Tus Fragancias Favoritas Inspiradas en las{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mejores Marcas
            </span>
          </h1>

          {/* Descripción */}
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Más de 600 contratipos finos con fijación de 8 a 12 horas. Elige tu perfume preparado en frasco de lujo con atomizador o adquiere onzas puras para tu negocio o rellenado.
          </p>

          {/* Píldoras de beneficios */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-white text-slate-700 text-xs font-bold shadow-2xs">
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Envíos a Todo El Salvador</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-white text-slate-700 text-xs font-bold shadow-2xs">
              <Droplets className="w-3.5 h-3.5 text-pink-600" />
              <span>Concentración Premium 33%</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-white text-slate-700 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pago Contra Entrega</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <a 
              href="#catalogo" 
              className="clay-btn clay-btn-primary px-7 py-3 text-sm font-black rounded-2xl flex items-center gap-2 !shadow-[3px_5px_15px_rgba(99,102,241,0.4)] w-full sm:w-auto justify-center"
            >
              <span>Explorar Catálogo ({products.length > 0 ? products.length : '640+'})</span>
              <ArrowDown className="w-4 h-4" />
            </a>
            <a 
              href="https://wa.me/50370000000?text=Hola%20Aromaniak,%20deseo%20asesoria%20para%20elegir%20un%20perfume" 
              target="_blank" 
              rel="noopener noreferrer"
              className="clay-btn px-6 py-3 text-sm font-black rounded-2xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 w-full sm:w-auto justify-center"
            >
              Pedir Asesoría por WhatsApp
            </a>
          </div>

        </div>
      </section>

      {/* ================= BARRA DE BÚSQUEDA Y FILTROS ================= */}
      <section id="catalogo" className="space-y-5 scroll-mt-20">
        
        {/* Encabezado del catálogo */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Catálogo de Fragancias & Productos</span>
              <span className="clay-badge text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg font-black">
                {filteredProducts.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Escribe el nombre de tu perfume favorito, la casa diseñadora o el código
            </p>
          </div>
        </div>

        {/* Caja de Búsqueda Grande Claymorphism */}
        <div className="clay-card p-3 sm:p-4 space-y-3">
          
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Buscar perfume: Sauvage, 212, Baccarat, One Million, Carolina Herrera, #100..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="clay-input has-icon w-full pr-10 py-3 text-sm sm:text-base font-bold text-slate-800 placeholder-slate-400 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros de Categorías & Género */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            
            {/* Categorías */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'Esencias para Perfume', label: '🌸 Esencias de Perfume' },
                { id: 'Botes', label: '🧴 Botes & Envases' },
                { id: 'Empaque', label: '🎁 Cajas & Bolsas' },
                { id: 'Insumos y Materia Prima', label: '🧪 Alcohol & Fijador' },
                { id: 'Todos', label: 'Ver Todo' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    selectedCategory === cat.id
                      ? 'clay-btn-primary text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Género (solo si son esencias) */}
            {selectedCategory === 'Esencias para Perfume' && (
              <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2">Género:</span>
                {(['Todos', 'Caballero', 'Dama', 'Unisex'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedGender(g);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedGender === g
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {g === 'Todos' ? 'Todos' : g === 'Caballero' ? '🧔 Hombre' : g === 'Dama' ? '👩 Mujer' : '⚧ Unisex'}
                  </button>
                ))}
              </div>
            )}

          </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {paginatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
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
