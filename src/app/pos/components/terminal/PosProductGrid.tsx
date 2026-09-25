import React from 'react';
import { Search, Barcode, Sparkles, Edit3, Plus } from 'lucide-react';
import { ProductItem, CartItem } from '@/lib/store';

export interface PosProductGridProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  barcodeInput: string;
  setBarcodeInput: (sku: string) => void;
  handleBarcodeSubmit: (e: React.FormEvent) => void;
  categories: readonly string[] | string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedGender: string;
  setSelectedGender: (gender: string) => void;
  displayedProducts: ProductItem[];
  filteredProductsCount: number;
  activeEssencePrice: number;
  activeEssenceHalfPrice: number;
  cart: CartItem[];
  onAddToCart: (product: ProductItem, presentation?: 'ONZA_COMPLETA' | 'MEDIA_ONZA') => void;
  onOpenEditProduct: (e: React.MouseEvent, product: ProductItem) => void;
}

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  searchQuery,
  setSearchQuery,
  barcodeInput,
  setBarcodeInput,
  handleBarcodeSubmit,
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedGender,
  setSelectedGender,
  displayedProducts,
  filteredProductsCount,
  activeEssencePrice,
  activeEssenceHalfPrice,
  cart,
  onAddToCart,
  onOpenEditProduct,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-5 min-w-0">
      {/* Barra superior de Búsqueda y Cotizador Rápido */}
      <div className="clay-card p-4 sm:p-5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
          <input
            type="search"
            name="search-fragrance"
            id="search-fragrance"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Buscar por código (100), contratipo (Sauvage), marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input has-icon w-full pr-4 py-2.5 text-sm font-bold"
          />
        </div>

        <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-60" autoComplete="off">
          <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none z-10" />
          <input
            type="text"
            name="quick-sku"
            id="quick-sku"
            autoComplete="off"
            placeholder="Código o SKU..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            className="clay-input has-icon w-full pr-4 py-2.5 text-sm font-mono font-bold border-indigo-200"
          />
        </form>
      </div>

      {/* Filtro de Categorías */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['Todos', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`clay-btn px-4 py-2 text-xs rounded-full whitespace-nowrap transition-all font-bold ${
              selectedCategory === cat ? 'clay-btn-primary' : 'clay-btn-light'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filtro de Género (para esencias) */}
      {selectedCategory === 'Esencias para Perfume' && (
        <div className="clay-card p-2 px-4 flex items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Género:
          </span>
          <div className="flex items-center gap-1">
            {['Todos', 'Caballero', 'Dama', 'Unisex'].map((gender) => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender)}
                className={`px-3 py-1 rounded-full text-xs transition-all font-bold ${
                  selectedGender === gender
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {gender === 'Caballero' ? '🧔 Caballero' : gender === 'Dama' ? '👩 Dama' : gender === 'Unisex' ? '⚧ Unisex' : 'Todos'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conteo de Resultados y Precio Base */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span>Mostrando <strong>{displayedProducts.length}</strong> de {filteredProductsCount} productos</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
            Precio Esencia 1 Oz: ${activeEssencePrice.toFixed(2)}
          </span>
          <span className="font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
            ½ Oz: ${activeEssenceHalfPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Rejilla de Productos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
        {displayedProducts.map((product) => {
          const cartOzForProduct = cart
            .filter((i) => i.product.id === product.id)
            .reduce((sum, i) => sum + (i.presentation === 'MEDIA_ONZA' ? i.quantity * 0.5 : i.quantity), 0);
          const isOutOfStock = product.stock <= 0;
          const isLowStock = product.stock > 0 && product.stock <= product.minStock;
          const availableRemaining = Math.max(0, product.stock - cartOzForProduct);
          const isEssence = product.category === 'Esencias para Perfume' || product.unit === 'Onza';
          const halfPrice = product.priceHalfOunce != null 
            ? Number(product.priceHalfOunce) 
            : Number((product.price / 2).toFixed(2));

          return (
            <div 
              key={product.id}
              onClick={() => !isOutOfStock && availableRemaining > 0 && onAddToCart(product, 'ONZA_COMPLETA')}
              className={`clay-card p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.015] ${
                isOutOfStock 
                  ? 'opacity-55 cursor-not-allowed bg-slate-50/70' 
                  : 'hover:shadow-[3px_5px_12px_rgba(99,102,241,0.18)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1">
                    <span className="clay-badge text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-1.5 py-0.5 rounded-md">
                      #{product.sku}
                    </span>
                    {product.puesto && (
                      <span className="clay-badge text-[8.5px] font-mono font-bold bg-amber-100 text-amber-900 px-1 py-0.5 border border-amber-200" title={`Puesto: ${product.puesto}`}>
                        📍{product.puesto}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className={`clay-badge text-[9px] font-bold py-0.5 px-1.5 rounded-md ${
                      isOutOfStock 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : isLowStock 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isOutOfStock ? 'Agotado' : `${availableRemaining} ${product.unit === 'Onza' ? 'Oz' : 'Un.'}`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => onOpenEditProduct(e, product)}
                      className="w-5 h-5 rounded-md bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors shadow-2xs"
                      title="Editar nombre, inspiración y precios del producto"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {product.brand && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500/90 block truncate">
                    {product.brand}
                  </span>
                )}

                {product.officialName ? (
                  <div className="min-h-[30px] mt-0.5">
                    <h3 className="font-black text-[12px] text-slate-900 line-clamp-1 leading-snug">
                      {product.officialName}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium block truncate">
                      Inspirado en {product.name}
                    </span>
                  </div>
                ) : (
                  <h3 className="font-bold text-[11.5px] text-slate-800 line-clamp-2 leading-snug min-h-[28px] mt-0.5">
                    {product.name}
                  </h3>
                )}
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 gap-1">
                <div>
                  {isEssence ? (
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black font-mono text-indigo-600">
                        1 Oz: ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-violet-600">
                        ½ Oz: ${halfPrice.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[8.5px] text-slate-400 block font-semibold uppercase tracking-wider">
                        Por {product.unit}
                      </span>
                      <span className="text-xs sm:text-[13px] font-black font-mono text-indigo-600">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {isEssence ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isOutOfStock || availableRemaining <= 0}
                      onClick={() => onAddToCart(product, 'ONZA_COMPLETA')}
                      className="px-1.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded border border-indigo-200 transition-all shadow-2xs disabled:opacity-50"
                      title="Agregar 1 Onza al pedido"
                    >
                      +1 Oz
                    </button>
                    <button
                      type="button"
                      disabled={isOutOfStock || availableRemaining <= 0}
                      onClick={() => onAddToCart(product, 'MEDIA_ONZA')}
                      className="px-1.5 py-1 text-[10px] font-bold bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white rounded border border-violet-200 transition-all shadow-2xs disabled:opacity-50"
                      title="Agregar ½ Onza al pedido"
                    >
                      +½ Oz
                    </button>
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold transition-all ${
                    isOutOfStock || availableRemaining <= 0
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'
                  }`}>
                    <Plus className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
