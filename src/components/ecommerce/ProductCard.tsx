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
        <span className="bg-white/90 backdrop-blur-xs text-blue-800 text-[8px] sm:text-[9px] font-black py-0.5 px-1 rounded shadow-xs shrink-0">
          🧔 Cab.
        </span>
      );
    }
    if (g.includes('dama') || g.includes('mujer')) {
      return (
        <span className="bg-white/90 backdrop-blur-xs text-pink-800 text-[8px] sm:text-[9px] font-black py-0.5 px-1 rounded shadow-xs shrink-0">
          👩 Dama
        </span>
      );
    }
    return (
      <span className="bg-white/90 backdrop-blur-xs text-purple-800 text-[8px] sm:text-[9px] font-black py-0.5 px-1 rounded shadow-xs shrink-0">
        ⚧ Uni.
      </span>
    );
  };

  // Nombre oficial (si no tiene, usa el nombre del contratipo)
  const displayName = product.officialName?.trim() ? product.officialName : product.name;
  const productImage = product.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&q=80';

  return (
    <div className={`clay-card p-2 sm:p-3 flex flex-col justify-between transition-all duration-200 group rounded-2xl ${
      isOutOfStock 
        ? 'opacity-85 border-slate-200/90 bg-[#f8fafc]' 
        : 'hover:scale-[1.015] hover:shadow-[4px_6px_16px_rgba(99,102,241,0.18)]'
    }`}>
      
      <div>
        {/* Contenedor de Imagen de Frasco (Estilo Klone Scents) */}
        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-100/90 mb-2 flex items-center justify-center border border-slate-100">
          <img
            src={productImage}
            alt={displayName}
            loading="lazy"
            className={`w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale-[35%]' : ''
            }`}
          />

          {/* Badges superiores sobre la foto */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start z-10">
            <span className="font-mono font-black text-[7.5px] sm:text-[8.5px] bg-slate-900/80 text-white px-1.5 py-0.5 rounded shadow-xs">
              #{product.sku}
            </span>
            {getGenderBadge(product.gender)}
          </div>

          {/* Badge Sold Out / Agotado estilo Klone Scents */}
          {isOutOfStock ? (
            <div className="absolute top-1.5 right-1.5 z-10">
              <span className="bg-slate-900 text-white text-[8px] sm:text-[9.5px] font-black py-0.5 px-2 rounded-md shadow-md tracking-wider uppercase">
                Agotado
              </span>
            </div>
          ) : (
            <div className="absolute bottom-1.5 right-1.5 z-10">
              <span className="bg-emerald-500/90 backdrop-blur-xs text-white text-[7.5px] sm:text-[8.5px] font-bold py-0.5 px-1.5 rounded shadow-xs">
                Disponible
              </span>
            </div>
          )}
        </div>

        {/* Nombre Oficial de la Fragancia */}
        <h3 className="font-black text-xs sm:text-base text-slate-900 line-clamp-1 leading-snug" title={displayName}>
          {displayName}
        </h3>

        {/* Precio Prominente */}
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-sm sm:text-lg font-black text-indigo-700 font-mono leading-tight">
            ${activeOption.price.toFixed(2)}
          </span>
          <span className="text-[8.5px] sm:text-[10px] text-slate-400 font-semibold truncate">
            ({activeOption.name})
          </span>
        </div>

        {/* Inspirado en [Contratipo] de [Marca] (SIN ESTRELLAS DE RESEÑAS) */}
        <div className="text-[10px] sm:text-xs text-slate-600 mt-1 leading-tight min-h-[26px] sm:min-h-[30px] line-clamp-2">
          <span className="text-slate-400 font-normal">Inspirado en </span>
          <span className="font-bold text-slate-800">{product.name}</span>
          {product.brand && (
            <span className="text-slate-500 font-medium"> de {product.brand}</span>
          )}
        </div>

        {/* Selector de Presentación */}
        {presentations.length > 1 ? (
          <div className="mt-1.5">
            <label className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-wide text-slate-400 block mb-0.5">
              Tamaño:
            </label>
            <select
              value={selectedPresentation}
              onChange={(e) => setSelectedPresentation(e.target.value as ProductPresentation)}
              className="w-full text-[9.5px] sm:text-xs font-bold py-1 px-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-2xs truncate"
            >
              {presentations.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} — ${opt.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-1.5 text-[9px] text-slate-400 font-medium truncate">
            {activeOption.description}
          </div>
        )}
      </div>

      {/* Botón Agregar al Carrito */}
      <div className="mt-2 pt-2 border-t border-slate-100">
        {isOutOfStock ? (
          <button
            disabled
            className="w-full py-1.5 text-[9.5px] sm:text-xs font-black rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed text-center"
          >
            Agotado
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className={`w-full clay-btn py-1.5 sm:py-2 text-[9.5px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              justAdded 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'clay-btn-primary !shadow-[2px_3px_8px_rgba(99,102,241,0.3)]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>¡Agregado!</span>
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
