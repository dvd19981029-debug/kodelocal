'use client';

import React, { useState } from 'react';
import { ShoppingBag, Check, Sparkles, Plus, Minus } from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS } from '@/lib/store';
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation } from '@/context/EcommerceCartContext';
import BottleSelectionModal from './BottleSelectionModal';

interface ProductCardProps {
  product: ProductItem;
  availableBottles?: ProductItem[];
}

export default function ProductCard({ product, availableBottles }: ProductCardProps) {
  const { cart, addToCart, updateQuantity } = useEcommerceCart();
  const presentations = getPresentationsForProduct(product);
  
  // Presentación por defecto (Onza Completa para esencias, o UNIDAD para suministros)
  const defaultPres = product.category === 'Esencias para Perfume' 
    ? 'ONZA_COMPLETA'
    : 'UNIDAD';

  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>(defaultPres);
  const [justAdded, setJustAdded] = useState(false);
  const [isCardPulsing, setIsCardPulsing] = useState(false);
  const [isBottleModalOpen, setIsBottleModalOpen] = useState(false);

  const activeOption = presentations.find(p => p.id === selectedPresentation) || presentations[0];
  const isOutOfStock = !product.stock || product.stock <= 0;

  // Buscar si esta presentación específica ya está en el carrito
  const matchingCartItems = cart.filter(item => 
    item.product.id === product.id && item.presentation === selectedPresentation
  );
  const currentQuantity = matchingCartItems.reduce((acc, it) => acc + it.quantity, 0);

  const triggerCardPulse = () => {
    setIsCardPulsing(true);
    setTimeout(() => setIsCardPulsing(false), 700);
  };

  const handleIncrement = () => {
    if (matchingCartItems.length > 0) {
      const target = matchingCartItems[0];
      updateQuantity(target.id, target.quantity + 1);
      triggerCardPulse();
    } else {
      handleAdd();
    }
  };

  const handleDecrement = () => {
    if (matchingCartItems.length > 0) {
      const target = matchingCartItems[matchingCartItems.length - 1];
      updateQuantity(target.id, target.quantity - 1);
      triggerCardPulse();
    }
  };

  // Frascos utilizables para el modal
  const bottlesToUse = (availableBottles && availableBottles.length > 0)
    ? availableBottles
    : INITIAL_PRODUCTS.filter(p => p.category === 'Botes');

  const handleAdd = () => {
    if (isOutOfStock) return;

    // Si seleccionó Perfume Preparado, abrir modal obligatorio para elegir bote
    if (selectedPresentation === 'PERFUME_PREPARADO') {
      setIsBottleModalOpen(true);
      return;
    }

    // Onza completa u otros productos individuales
    addToCart(product, selectedPresentation, 1);
    setJustAdded(true);
    triggerCardPulse();
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleConfirmBottle = (chosenBottle: ProductItem) => {
    addToCart(product, 'PERFUME_PREPARADO', 1, chosenBottle);
    setIsBottleModalOpen(false);
    setJustAdded(true);
    triggerCardPulse();
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

  const isPerfumePreparado = selectedPresentation === 'PERFUME_PREPARADO';

  return (
    <>
      <div className={`clay-card p-2 sm:p-3 flex flex-col justify-between transition-all duration-300 group rounded-2xl relative ${
        isOutOfStock 
          ? 'opacity-85 border-slate-200/90 bg-[#f8fafc]' 
          : isCardPulsing
          ? 'scale-[1.03] ring-4 ring-emerald-400/70 shadow-[0_0_22px_rgba(16,185,129,0.35)]'
          : currentQuantity > 0
          ? 'border-emerald-300/80 bg-white shadow-[0_4px_16px_rgba(16,185,129,0.12)]'
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

            {/* Badge Sold Out o Badge de Unidades en Carrito */}
            {isOutOfStock ? (
              <div className="absolute top-1.5 right-1.5 z-10">
                <span className="bg-slate-900 text-white text-[8px] sm:text-[9.5px] font-black py-0.5 px-2 rounded-md shadow-md tracking-wider uppercase">
                  Agotado
                </span>
              </div>
            ) : currentQuantity > 0 ? (
              <div className="absolute top-1.5 right-1.5 z-10 animate-in zoom-in-75 duration-200">
                <span className="bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black py-0.5 px-1.5 rounded-md shadow-md flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  <span>{currentQuantity} en carrito</span>
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

          {/* Selector de Presentación (Onza Completa o Perfume Preparado $15) */}
          {presentations.length > 1 ? (
            <div className="mt-1.5">
              <label className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-wide text-slate-400 block mb-0.5">
                Presentación:
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

              {/* Mensaje de requisito de bote si elige Perfume Preparado */}
              {isPerfumePreparado && (
                <div className="mt-1.5 p-1.5 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-950 flex items-start gap-1 animate-in fade-in">
                  <span className="text-[10px] shrink-0 mt-0.5">⚠️</span>
                  <div className="leading-tight text-[8.5px] sm:text-[9.5px]">
                    <strong className="font-extrabold text-amber-900 block">Debe elegir un bote</strong>
                    <span className="text-amber-800">Se requiere seleccionar el frasco para este perfume.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-1.5 text-[9px] text-slate-400 font-medium truncate">
              {activeOption.description}
            </div>
          )}
        </div>

        {/* ================= CONTROLES DE CARRITO EN TARJETA ================= */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          {isOutOfStock ? (
            <button
              disabled
              className="w-full py-1.5 text-[9.5px] sm:text-xs font-black rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed text-center"
            >
              Agotado
            </button>
          ) : currentQuantity > 0 ? (
            /* YA ESTÁ EN EL CARRITO: Mostrar "Llevas X unidad(es)" y controles de [+] [-] */
            <div className={`space-y-1.5 transition-all duration-300 ${isCardPulsing ? 'scale-[1.02]' : ''}`}>
              {/* Indicador de unidades en carrito */}
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] sm:text-[11px] font-black text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs shrink-0"></span>
                  <span>Llevas {currentQuantity} {currentQuantity === 1 ? 'unidad' : 'unidades'}</span>
                </span>
                <span className="text-[9.5px] font-mono font-bold text-slate-500">
                  ${(activeOption.price * currentQuantity).toFixed(2)}
                </span>
              </div>

              {/* Controles interactivos de cantidad [-] [cant] [+] */}
              <div className="flex items-center justify-between gap-1 w-full bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                <button
                  onClick={handleDecrement}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-black text-xs flex items-center justify-center transition-all shadow-xs active:scale-90 cursor-pointer"
                  title="Disminuir unidad"
                  aria-label="Disminuir unidad"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 text-center font-black text-xs sm:text-sm text-slate-900 leading-tight">
                  <span className="text-indigo-700 font-mono font-extrabold">{currentQuantity}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium block">en carrito</span>
                </div>

                <button
                  onClick={handleIncrement}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center transition-all shadow-xs active:scale-90 cursor-pointer"
                  title="Aumentar unidad"
                  aria-label="Aumentar unidad"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Opción adicional para Perfume Preparado: si desea agregar otro bote */}
              {isPerfumePreparado && (
                <button
                  onClick={() => setIsBottleModalOpen(true)}
                  className="w-full text-center text-[9px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline py-0.5 cursor-pointer"
                >
                  + Agregar con otro frasco
                </button>
              )}
            </div>
          ) : (
            /* AÚN NO EN EL CARRITO: Botón de agregar normal */
            <button
              onClick={handleAdd}
              className={`w-full clay-btn py-1.5 sm:py-2 text-[9.5px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                justAdded 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : isPerfumePreparado
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[2px_3px_8px_rgba(99,102,241,0.3)]'
                  : 'clay-btn-primary !shadow-[2px_3px_8px_rgba(99,102,241,0.3)]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Agregado!</span>
                </>
              ) : isPerfumePreparado ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Elegir Bote ($15)</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Modal de Selección de Bote / Frasco */}
      {isBottleModalOpen && (
        <BottleSelectionModal
          isOpen={isBottleModalOpen}
          onClose={() => setIsBottleModalOpen(false)}
          product={product}
          availableBottles={bottlesToUse}
          onConfirm={handleConfirmBottle}
        />
      )}
    </>
  );
}
