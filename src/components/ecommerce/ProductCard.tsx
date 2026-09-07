'use client';

import React, { useState } from 'react';
import { Sparkles, ShoppingBag, Check } from 'lucide-react';
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

  const handleAdd = () => {
    addToCart(product, selectedPresentation, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const getGenderBadge = (gender?: string) => {
    if (!gender) return null;
    const g = gender.toLowerCase();
    if (g.includes('caballero') || g.includes('hombre')) {
      return (
        <span className="clay-badge bg-blue-50 text-blue-700 border border-blue-200/80 text-[9.5px] font-bold py-0.5 px-2 rounded-lg">
          🧔 Caballero
        </span>
      );
    }
    if (g.includes('dama') || g.includes('mujer')) {
      return (
        <span className="clay-badge bg-pink-50 text-pink-700 border border-pink-200/80 text-[9.5px] font-bold py-0.5 px-2 rounded-lg">
          👩 Dama
        </span>
      );
    }
    return (
      <span className="clay-badge bg-purple-50 text-purple-700 border border-purple-200/80 text-[9.5px] font-bold py-0.5 px-2 rounded-lg">
        ⚧ Unisex
      </span>
    );
  };

  return (
    <div className="clay-card p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 hover:scale-[1.015] hover:shadow-[4px_6px_16px_rgba(99,102,241,0.18)] group">
      
      {/* Encabezado de la Tarjeta */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <span className="clay-badge font-mono font-black text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            #{product.sku}
          </span>
          {getGenderBadge(product.gender)}
        </div>

        {/* Marca inspirada */}
        {product.brand && (
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block truncate">
            {product.brand}
          </span>
        )}

        {/* Nombre de la fragancia */}
        <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug min-h-[36px] mt-0.5">
          {product.name}
        </h3>

        {/* Selector de Presentación (50ml, 100ml, 1 Oz, etc.) */}
        {presentations.length > 1 ? (
          <div className="mt-3">
            <label className="text-[9.5px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">
              Presentación:
            </label>
            <select
              value={selectedPresentation}
              onChange={(e) => setSelectedPresentation(e.target.value as ProductPresentation)}
              className="w-full text-xs font-bold py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs"
            >
              {presentations.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} — ${opt.price.toFixed(2)}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">
              {activeOption.description}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            {activeOption.description}
          </p>
        )}
      </div>

      {/* Pie con Precio y Botón Agregar */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/90 gap-2">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Total
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-indigo-700 leading-none">
            ${activeOption.price.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleAdd}
          className={`clay-btn px-3.5 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
            justAdded 
              ? 'bg-emerald-500 text-white shadow-md' 
              : 'clay-btn-primary !shadow-[3px_4px_10px_rgba(99,102,241,0.35)]'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>¡Agregado!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
