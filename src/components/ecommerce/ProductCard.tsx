'use client';

import React, { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation } from '@/context/EcommerceCartContext';

interface ProductCardProps {
  product: ProductItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useEcommerceCart();
  const presentations = getPresentationsForProduct(product);
  
  // Presentación por defecto (50ml para esencias, o UNIDAD para suministros)
  const defaultPres = product.category === 'Esencias para Perfume' 
    ? (presentations.find(p => p.id === 'PERFUME_50ML')?.id || presentations[0].id)
    : 'UNIDAD';

  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>(defaultPres);
  const [justAdded, setJustAdded] = useState(false);

  const activeOption = presentations.find(p => p.id === selectedPresentation) || presentations[0];

  const isOutOfStock = !product.stock || product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedPresentation, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const getGenderBadge = (gender?: string) => {
    if (!gender) return null;
    const g = gender.toLowerCase();
    if (g.includes('caballero') || g.includes('hombre')) {
      return (
        <span className="clay-badge bg-blue-50 text-blue-700 border border-blue-200/80 text-[8.5px] sm:text-[9.5px] font-bold py-0.5 px-1.5 rounded-md sm:rounded-lg shrink-0">
          🧔 <span className="hidden xs:inline">Caballero</span>
        </span>
      );
    }
    if (g.includes('dama') || g.includes('mujer')) {
      return (
        <span className="clay-badge bg-pink-50 text-pink-700 border border-pink-200/80 text-[8.5px] sm:text-[9.5px] font-bold py-0.5 px-1.5 rounded-md sm:rounded-lg shrink-0">
          👩 <span className="hidden xs:inline">Dama</span>
        </span>
      );
    }
    return (
      <span className="clay-badge bg-purple-50 text-purple-700 border border-purple-200/80 text-[8.5px] sm:text-[9.5px] font-bold py-0.5 px-1.5 rounded-md sm:rounded-lg shrink-0">
        ⚧ <span className="hidden xs:inline">Unisex</span>
      </span>
    );
  };

  return (
    <div className={`clay-card p-2.5 sm:p-4 flex flex-col justify-between transition-all duration-200 group rounded-2xl ${
      isOutOfStock 
        ? 'opacity-85 border-slate-200/90 bg-[#f4f6fa]' 
        : 'hover:scale-[1.015] hover:shadow-[4px_6px_16px_rgba(99,102,241,0.18)]'
    }`}>
      
      {/* Encabezado de la Tarjeta */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <span className="clay-badge font-mono font-black text-[8.5px] sm:text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
              #{product.sku}
            </span>
            {getGenderBadge(product.gender)}
          </div>

          {/* Badge de Disponibilidad de Inventario */}
          {isOutOfStock ? (
            <span className="clay-badge bg-rose-50 text-rose-700 border border-rose-200/90 text-[8px] sm:text-[9px] font-black py-0.5 px-1.5 sm:px-2 rounded-md sm:rounded-lg flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Agotado</span>
            </span>
          ) : (
            <span className="clay-badge bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-[8px] sm:text-[9px] font-extrabold py-0.5 px-1.5 sm:px-2 rounded-md sm:rounded-lg flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Disp.</span>
            </span>
          )}
        </div>

        {/* Marca inspirada */}
        {product.brand && (
          <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-500 block truncate">
            {product.brand}
          </span>
        )}

        {/* Nombre de la fragancia */}
        <h3 className="font-extrabold text-[11px] sm:text-sm text-slate-900 line-clamp-2 leading-tight min-h-[28px] sm:min-h-[36px] mt-0.5" title={product.name}>
          {product.name}
        </h3>

        {/* Selector de Presentación (50ml, 100ml, 1 Oz, etc.) */}
        {presentations.length > 1 ? (
          <div className="mt-2 sm:mt-3">
            <label className="text-[8px] sm:text-[9.5px] font-extrabold uppercase tracking-wide text-slate-400 block mb-0.5">
              Presentación:
            </label>
            <select
              value={selectedPresentation}
              onChange={(e) => setSelectedPresentation(e.target.value as ProductPresentation)}
              className="w-full text-[10px] sm:text-xs font-bold py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs truncate"
            >
              {presentations.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} — ${opt.price.toFixed(2)}
                </option>
              ))}
            </select>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 truncate hidden sm:block">
              {activeOption.description}
            </p>
          </div>
        ) : (
          <p className="text-[9.5px] sm:text-[11px] text-slate-400 font-medium mt-1 truncate">
            {activeOption.description}
          </p>
        )}
      </div>

      {/* Pie con Precio y Botón Agregar */}
      <div className="flex items-center justify-between mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100/90 gap-1">
        <div className="min-w-0">
          <span className="text-[7.5px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none">
            Total
          </span>
          <span className="text-xs sm:text-lg font-black font-mono text-indigo-700 leading-tight">
            ${activeOption.price.toFixed(2)}
          </span>
        </div>

        {isOutOfStock ? (
          <button
            disabled
            className="px-2 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl bg-slate-200/90 text-slate-400 cursor-not-allowed flex items-center gap-1 shadow-inner shrink-0"
          >
            <span>Agotado</span>
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className={`clay-btn px-2 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0 ${
              justAdded 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'clay-btn-primary !shadow-[2px_3px_8px_rgba(99,102,241,0.3)]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">¡Listo!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Agregar</span>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
