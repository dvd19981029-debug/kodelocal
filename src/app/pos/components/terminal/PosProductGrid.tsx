import React from 'react';
import { Search, Barcode, Sparkles, Edit3, Plus } from 'lucide-react';
import { ProductItem, CartItem } from '@/lib/store';
import { getProductImage } from '@/lib/perfumeImages';

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
    <div className="flex-1 flex flex-col gap-3.5 sm:gap-5 min-w-0">
      {/* Barra superior de Búsqueda y Cotizador Rápido */}
      <div className="clay-card p-3 sm:p-5 flex flex-col sm:flex-row gap-2 sm:gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none z-10" />
          <input
            type="search"
            name="search-fragrance"
            id="search-fragrance"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Buscar por código (100), contratipo, marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input has-icon w-full pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold"
          />
        </div>

        <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-52" autoComplete="off">
          <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 pointer-events-none z-10" />
          <input
            type="text"
            name="quick-sku"
            id="quick-sku"
            autoComplete="off"
            placeholder="Código o SKU..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            className="clay-input has-icon w-full pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-mono font-bold border-indigo-200"
          />
        </form>
      </div>

      {/* Filtro de Categorías */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none sm:flex-wrap">
        {['Todos', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`clay-btn px-3 sm:px-4 py-1.5 sm:py-2 text-xs rounded-full whitespace-nowrap transition-all font-bold shrink-0 ${
              selectedCategory === cat ? 'clay-btn-primary' : 'clay-btn-light'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filtro de Género (para esencias) */}
      {selectedCategory === 'Esencias para Perfume' && (
        <div className="clay-card p-2 px-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5 font-bold text-slate-700 whitespace-nowrap">
            Género:
          </span>
          <div className="grid grid-cols-4 gap-1 w-full sm:w-auto">
            {['Todos', 'Caballero', 'Dama', 'Unisex'].map((gender) => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender)}
                className={`py-1.5 px-1 rounded-lg text-[11px] sm:text-xs transition-all font-bold text-center truncate ${
                  selectedGender === gender
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conteo de Resultados y Precio Base */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1 text-xs text-slate-500">
        <span className="text-[11px] sm:text-xs">Mostrando <strong>{displayedProducts.length}</strong> de {filteredProductsCount} productos</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 text-[10px] sm:text-xs">
            1 Oz: ${activeEssencePrice.toFixed(2)}
          </span>
          <span className="font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 text-[10px] sm:text-xs">
            ½ Oz: ${activeEssenceHalfPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Rejilla de Productos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
        {displayedProducts.map((product) => {
          const isEssence = product.category === 'Esencias para Perfume' || product.unit === 'Onza';
          const cartFullForProduct = cart
            .filter((i) => i.product.id === product.id && i.presentation !== 'MEDIA_ONZA')
            .reduce((sum, i) => sum + i.quantity, 0);
          const cartHalfForProduct = cart
            .filter((i) => i.product.id === product.id && i.presentation === 'MEDIA_ONZA')
            .reduce((sum, i) => sum + i.quantity, 0);
          const stockHalfBottles = product.stockHalf || 0;
          const fullRemaining = Math.max(0, product.stock - cartFullForProduct);
          const halfRemaining = Math.max(0, stockHalfBottles - cartHalfForProduct);
          const isOutOfStock = isEssence ? (product.stock <= 0 && stockHalfBottles <= 0) : product.stock <= 0;
          const isLowStock = product.stock > 0 && product.stock <= product.minStock;
          const availableRemaining = isEssence ? fullRemaining + halfRemaining : Math.max(0, product.stock - cartFullForProduct);
          const halfPrice = product.priceHalfOunce != null 
            ? Number(product.priceHalfOunce) 
            : Number((product.price / 2).toFixed(2));

          return (
            <div 
              key={product.id}
              onClick={() => !isOutOfStock && (isEssence ? fullRemaining > 0 : availableRemaining > 0) && onAddToCart(product, 'ONZA_COMPLETA')}
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
                      <span className="text-[9px] font-medium text-slate-500" title={`Puesto: ${product.puesto}`}>
                        Estante {product.puesto}
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
                      {isOutOfStock ? 'Agotado' : isEssence ? `${fullRemaining} de 1 Oz · ${halfRemaining} de ½ Oz` : `${availableRemaining} ${product.unit === 'Onza' ? 'Oz' : 'Un.'}`}
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

                <div className="flex items-start gap-2 mt-1">
                  <div className="w-11 h-14 rounded-lg bg-slate-50 border border-slate-100/90 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs">
                    <img
                      src={product.imageUrl || getProductImage(product)}
                      alt={product.officialName || product.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
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
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 flex flex-col gap-1.5">
                {isEssence ? (
                  <>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[11px] font-black text-indigo-600">
                        1 Oz: ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[10.5px] font-bold text-violet-600">
                        ½ Oz: ${halfPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={fullRemaining <= 0}
                        onClick={() => onAddToCart(product, 'ONZA_COMPLETA')}
                        className="w-full py-1.5 px-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 transition-all shadow-2xs disabled:opacity-50 flex items-center justify-center whitespace-nowrap active:scale-95"
                        title="Agregar 1 Onza al pedido"
                      >
                        +1 Oz
                      </button>
                      <button
                        type="button"
                        disabled={halfRemaining <= 0}
                        onClick={() => onAddToCart(product, 'MEDIA_ONZA')}
                        className="w-full py-1.5 px-1 text-[11px] font-bold bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white rounded-lg border border-violet-200 transition-all shadow-2xs disabled:opacity-50 flex items-center justify-center whitespace-nowrap active:scale-95"
                        title="Agregar ½ Onza al pedido"
                      >
                        +½ Oz
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[8.5px] text-slate-400 block font-semibold uppercase tracking-wider">
                        Por {product.unit}
                      </span>
                      <span className="text-xs sm:text-[13px] font-black font-mono text-indigo-600">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isOutOfStock || availableRemaining <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 shadow-2xs flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Agregar</span>
                    </button>
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
