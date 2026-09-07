'use client';

import React, { useState } from 'react';
import { ShoppingBag, Check, Sparkles, Plus, Minus } from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS } from '@/lib/store';
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation } from '@/context/EcommerceCartContext';
import { getProductImage } from '@/lib/perfumeImages';

interface ProductCardProps {
  product: ProductItem;
  availableBottles?: ProductItem[];
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, updateQuantity } = useEcommerceCart();
  const presentations = getPresentationsForProduct(product);
  
  // Presentación por defecto (Onza Completa para esencias, o UNIDAD para suministros)
  const defaultPres = product.category === 'Esencias para Perfume' 
    ? 'ONZA_COMPLETA'
    : 'UNIDAD';

  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>(defaultPres);
  const [justAdded, setJustAdded] = useState(false);
  const [isCardPulsing, setIsCardPulsing] = useState(false);

  const activeOption = presentations.find(p => p.id === selectedPresentation) || presentations[0];

  // Cálculo preciso de inventario y onzas comprometidas en el carrito
  const isEssence = product.category === 'Esencias para Perfume';

  const cartEssenceUsed = cart
    .filter(item => item.product.id === product.id)
    .reduce((acc, item) => {
      if (item.presentation === 'MEDIA_ONZA') return acc + item.quantity * 0.5;
      if (item.presentation === 'ONZA_COMPLETA') return acc + item.quantity * 1.0;
      return acc + item.quantity;
    }, 0);

  const totalStock = typeof product.stock === 'number' ? product.stock : 0;
  const isOutOfStock = totalStock <= 0;

  // Stock restante disponible para este cliente en esta sesión
  const remainingStock = isEssence
    ? Math.max(0, totalStock - cartEssenceUsed)
    : Math.max(0, totalStock - (cart.find(it => it.product.id === product.id)?.quantity || 0));

  // Consumo de inventario según la presentación elegida
  const requiredStock = selectedPresentation === 'MEDIA_ONZA' ? 0.5 : 1.0;
  const canAddMore = remainingStock >= requiredStock;

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
    if (!canAddMore) return;
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

  const handleAdd = () => {
    if (isOutOfStock || !canAddMore) return;

    // Onza completa, media onza u otros productos individuales
    addToCart(product, selectedPresentation, 1);
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
  const productImage = getProductImage(product);

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
            ) : cartEssenceUsed > 0 ? (
              <div className="absolute top-1.5 right-1.5 z-10 animate-in zoom-in-75 duration-200">
                <span className="bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black py-0.5 px-1.5 rounded-md shadow-md flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  <span>{isEssence ? `${cartEssenceUsed} oz en carrito` : `${cartEssenceUsed} en carrito`}</span>
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

          {/* Precio Prominente según Presentación Seleccionada */}
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-sm sm:text-lg font-black text-indigo-700 font-mono leading-tight">
              ${activeOption.price.toFixed(2)}
            </span>
            <span className="text-[8.5px] sm:text-[10px] text-slate-400 font-semibold truncate">
              ({activeOption.name})
            </span>
          </div>

          {/* Inspirado en [Contratipo] de [Marca] */}
          <div className="text-[10px] sm:text-xs text-slate-600 mt-1 leading-tight min-h-[26px] sm:min-h-[30px] line-clamp-2">
            <span className="text-slate-400 font-normal">Inspirado en </span>
            <span className="font-bold text-slate-800">{product.name}</span>
            {product.brand && (
              <span className="text-slate-500 font-medium"> de {product.brand}</span>
            )}
          </div>

          {/* Selector de Presentación 100% Personalizado (Sin cuadro de diálogo del navegador) */}
          {presentations.length > 1 ? (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[7.5px] sm:text-[8.5px] font-extrabold uppercase tracking-wide text-slate-400">
                  Presentación:
                </span>
                {/* Indicador de existencias en tiempo real */}
                <span className={`text-[8.5px] font-bold ${
                  remainingStock <= 1 && remainingStock > 0 
                    ? 'text-amber-600' 
                    : remainingStock === 0 
                    ? 'text-rose-600' 
                    : 'text-slate-500'
                }`}>
                  {remainingStock === 0 ? (
                    'Tope en carrito'
                  ) : selectedPresentation === 'MEDIA_ONZA' ? (
                    `Disp: ${Math.floor(remainingStock / 0.5)} medias onzas`
                  ) : (
                    `Disp: ${Math.floor(remainingStock)} onzas`
                  )}
                </span>
              </div>

              {/* Botonera de Presentaciones Segmentada (1 Onza y ½ Onza) */}
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs">
                {presentations.map((opt) => {
                  const isSelected = selectedPresentation === opt.id;
                  
                  // Verificar si la opción está disponible según stock
                  const isOptOutOfStock = 
                    (opt.id === 'ONZA_COMPLETA' && remainingStock < 1.0) ||
                    (opt.id === 'MEDIA_ONZA' && remainingStock < 0.5);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPresentation(opt.id)}
                      className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center min-h-[38px] sm:min-h-[42px] relative ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs font-black scale-[1.02]'
                          : isOptOutOfStock
                          ? 'bg-white/50 text-slate-400 opacity-60 hover:bg-white/80 font-medium'
                          : 'bg-white hover:bg-indigo-50/60 text-slate-700 border border-slate-200/70 shadow-2xs font-bold'
                      }`}
                    >
                      <span className="text-[10px] sm:text-[11px] leading-tight flex items-center gap-0.5">
                        {opt.id === 'MEDIA_ONZA' ? '½ Onza' : '1 Onza'}
                      </span>
                      <span className={`text-[8.5px] sm:text-[9.5px] font-mono leading-tight mt-0.5 ${
                        isSelected ? 'text-indigo-100' : isOptOutOfStock ? 'text-slate-400 line-through' : 'text-slate-500'
                      }`}>
                        ${opt.price.toFixed(2)}
                      </span>
                      {/* Indicador sutil si ya tiene de esta presentación en carrito */}
                      {cart.some(it => it.product.id === product.id && it.presentation === opt.id) && (
                        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                          isSelected ? 'bg-pink-400 ring-2 ring-white' : 'bg-emerald-500 ring-1 ring-white'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500 font-medium px-0.5">
              <span>{activeOption.description}</span>
              <span className="font-bold text-slate-700">Stock: {Math.floor(remainingStock)} disp.</span>
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
                  <span>
                    Llevas {currentQuantity} {
                      selectedPresentation === 'MEDIA_ONZA' 
                        ? (currentQuantity === 1 ? 'media onza' : 'medias onzas') 
                        : selectedPresentation === 'ONZA_COMPLETA' 
                        ? (currentQuantity === 1 ? 'onza' : 'onzas') 
                        : (currentQuantity === 1 ? 'unidad' : 'unidades')
                    }
                  </span>
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
                  title="Disminuir una unidad"
                  aria-label="Disminuir unidad"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 text-center font-black text-xs sm:text-sm text-slate-900 leading-tight">
                  <span className="text-indigo-700 font-mono font-extrabold">{currentQuantity}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium block">
                    {selectedPresentation === 'MEDIA_ONZA' ? '½ oz' : selectedPresentation === 'ONZA_COMPLETA' ? '1 oz' : 'en carrito'}
                  </span>
                </div>

                <button
                  onClick={handleIncrement}
                  disabled={!canAddMore}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs flex items-center justify-center transition-all shadow-xs ${
                    canAddMore
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-90 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={canAddMore ? "Aumentar una unidad" : "Máximo disponible en inventario"}
                  aria-label="Aumentar unidad"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mensaje de tope de stock alcanzado */}
              {!canAddMore && (
                <p className="text-[8.5px] text-amber-600 text-center font-bold">
                  Máximo disponible alcanzado ({remainingStock} oz restantes)
                </p>
              )}
            </div>
          ) : (
            /* AÚN NO EN EL CARRITO: Botón de agregar normal */
            <button
              onClick={handleAdd}
              disabled={!canAddMore}
              className={`w-full clay-btn py-1.5 sm:py-2 text-[9.5px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                !canAddMore
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : justAdded 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'clay-btn-primary !shadow-[2px_3px_8px_rgba(99,102,241,0.3)] active:scale-95 cursor-pointer'
              }`}
            >
              {!canAddMore ? (
                <span>Sin existencias suficientes</span>
              ) : justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Agregar {selectedPresentation === 'MEDIA_ONZA' ? '½ Onza' : selectedPresentation === 'ONZA_COMPLETA' ? '1 Onza' : 'al carrito'}</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </>
  );
}
