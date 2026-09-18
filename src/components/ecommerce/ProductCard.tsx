'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check, Sparkles, Plus, Minus } from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS } from '@/lib/store';
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation, getEssenceDiscreteStock } from '@/context/EcommerceCartContext';
import { getProductImage } from '@/lib/perfumeImages';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { getProductUrl } from '@/lib/productUrl';

interface ProductCardProps {
  product: ProductItem;
  availableBottles?: ProductItem[];
  priority?: boolean;
}

function ProductCardComponent({ product, priority = false }: ProductCardProps) {
  const { cart, addToCart, updateQuantity } = useEcommerceCart();
  const presentations = getPresentationsForProduct(product);
  
  // Presentación por defecto: 'ONZA_COMPLETA' (1 Onza seleccionada primero)
  const defaultPres = product.category === 'Esencias para Perfume' 
    ? 'ONZA_COMPLETA'
    : 'UNIDAD';

  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>(defaultPres);
  const [justAdded, setJustAdded] = useState(false);
  const [isCardPulsing, setIsCardPulsing] = useState(false);

  const activeOption = presentations.find(p => p.id === selectedPresentation) || presentations[0];

  // Filtrar únicamente los ítems del carrito que afectan a este producto específico para evitar re-cálculos innecesarios
  const relevantCartItems = React.useMemo(() => {
    return cart.filter(item => 
      item.product?.id === product.id || 
      (item.kitDetails && item.kitDetails.essenceId === product.id)
    );
  }, [cart, product.id]);

  // Cálculo de inventario discreto 80/20 (80% onzas completas, 20% medias onzas)
  const isEssence = product.category === 'Esencias para Perfume';
  const totalStock = typeof product.stock === 'number' ? product.stock : 0;
  const isOutOfStock = totalStock <= 0;

  const discreteStock = React.useMemo(() => {
    return isEssence ? getEssenceDiscreteStock(totalStock, relevantCartItems, product.id) : null;
  }, [isEssence, totalStock, relevantCartItems, product.id]);

  // Unidades disponibles según la presentación actualmente seleccionada
  const availableUnits = isEssence
    ? (selectedPresentation === 'MEDIA_ONZA' ? (discreteStock?.availableHalfOz ?? 0) : (discreteStock?.available1oz ?? 0))
    : Math.max(0, totalStock - (relevantCartItems.find(it => it.product?.id === product.id && !it.kitDetails)?.quantity || 0));

  const canAddMore = availableUnits >= 1;

  // Umbral de stock mínimo de alerta definido en la tabla de productos
  const minStockThreshold = typeof product.minStock === 'number' && product.minStock > 0
    ? product.minStock
    : 15;
  const isBelowMinAlert = availableUnits > 0 && availableUnits <= minStockThreshold;

  // Buscar si esta presentación específica ya está en el carrito
  const matchingCartItems = React.useMemo(() => {
    return selectedPresentation
      ? relevantCartItems.filter(item => item.product?.id === product.id && item.presentation === selectedPresentation && !item.kitDetails)
      : [];
  }, [selectedPresentation, relevantCartItems, product.id]);

  const currentQuantity = React.useMemo(() => {
    return matchingCartItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [matchingCartItems]);

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
    if (isOutOfStock || !canAddMore || !selectedPresentation) return;

    // Onza completa, media onza u otros productos individuales
    addToCart(product, selectedPresentation, 1);
    setJustAdded(true);
    triggerCardPulse();
    setTimeout(() => setJustAdded(false), 1200);
  };

  const isBottle = product.category === 'Botes' || product.category === 'Botes & Envases';

  const getGenderBadge = (gender?: string) => {
    if (isBottle) {
      return (
        <span className="bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200 text-[8.5px] sm:text-[9.5px] font-extrabold py-0.5 px-1.5 rounded-md shadow-xs shrink-0 tracking-wide uppercase">
          100 ML
        </span>
      );
    }
    if (!gender) return null;
    const g = gender.toLowerCase();
    if (g.includes('caballero') || g.includes('hombre')) {
      return (
        <span className="bg-white/95 backdrop-blur-xs text-blue-900 text-[8.5px] sm:text-[9.5px] font-extrabold py-0.5 px-1.5 rounded-md shadow-xs shrink-0 tracking-wide uppercase">
          Hombre
        </span>
      );
    }
    if (g.includes('dama') || g.includes('mujer')) {
      return (
        <span className="bg-white/95 backdrop-blur-xs text-pink-900 text-[8.5px] sm:text-[9.5px] font-extrabold py-0.5 px-1.5 rounded-md shadow-xs shrink-0 tracking-wide uppercase">
          Dama
        </span>
      );
    }
    return (
      <span className="bg-white/95 backdrop-blur-xs text-purple-900 text-[8.5px] sm:text-[9.5px] font-extrabold py-0.5 px-1.5 rounded-md shadow-xs shrink-0 tracking-wide uppercase">
        Unisex
      </span>
    );
  };

  // Nombre oficial de contratipo (muestra contratipo comercial)
  const displayName = product.officialName?.trim() || product.name;
  const productImage = getProductImage(product);

  // Nombre de inspiración (contratipo) y cálculo dinámico de escala de texto
  const inspiracionPerfumeName = getInspiracionPerfumeName(product);
  const inspiracionNameLength = inspiracionPerfumeName.length;

  // Si el nombre es largo, reducimos el tamaño progresivamente para que quepa sin salirse de la tarjeta
  const inspiredSizeClass = inspiracionNameLength > 30
    ? 'text-[8px] sm:text-[9px]'
    : inspiracionNameLength > 22
    ? 'text-[9px] sm:text-[10px]'
    : inspiracionNameLength > 16
    ? 'text-[10px] sm:text-[11px]'
    : 'text-[10.5px] sm:text-xs';

  return (
    <>
      <div className={`h-full flex flex-col justify-between transition-all duration-300 group relative ${
        isOutOfStock ? 'opacity-85' : ''
      }`}>
        
        {/* Sección Superior: Imagen y Datos del Producto */}
        <div className="flex-1 flex flex-col">
          {/* Contenedor de Imagen de Frasco con estilo Tarjeta Burbuja Claymórfica */}
          <Link 
            href={getProductUrl(product)}
            className={`block relative w-full aspect-square clay-card overflow-hidden mb-2 sm:mb-2.5 flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 ${
              isOutOfStock 
                ? 'opacity-85 border-slate-200/90 bg-[#f8fafc]' 
                : isCardPulsing
                ? 'scale-[1.02] ring-3 ring-purple-500/70 shadow-[0_6px_20px_rgba(88,28,135,0.25)]'
                : currentQuantity > 0
                ? 'ring-1.5 ring-purple-400/60 shadow-[0_4px_14px_rgba(88,28,135,0.12)]'
                : 'hover:scale-[1.015] hover:shadow-[4px_8px_16px_rgba(88,28,135,0.15)]'
            }`}
          >
            <img
              src={productImage}
              alt={displayName}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = product.category === 'Botes' 
                  ? '/images/botes/bote_100ml_degrade_azul_noche.jpg'
                  : '/images/essence_bottle_blank.webp';
              }}
              className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108 ${
                isOutOfStock ? 'grayscale-[35%]' : ''
              }`}
            />

            {/* Badge de género limpio sobre la foto (sin número ni emojis) */}
            <div className="absolute top-2 left-2 z-10">
              {getGenderBadge(product.gender)}
            </div>

            {/* Badge Agotado en esquina superior derecha */}
            {isOutOfStock && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-slate-900 text-white text-[8px] sm:text-[9px] font-black py-0.5 px-2 rounded-md shadow-md tracking-wider uppercase">
                  Agotado
                </span>
              </div>
            )}

            {/* Indicador en esquina inferior derecha: cuando la presentación seleccionada está en carrito */}
            {currentQuantity > 0 && (
              <div className="absolute bottom-2 right-2 z-10 animate-in zoom-in-75 duration-200 pointer-events-none">
                <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-black py-0.5 px-1.5 rounded-md shadow-md flex items-center gap-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>
                    {isEssence
                      ? selectedPresentation === 'MEDIA_ONZA'
                        ? `${currentQuantity} ${currentQuantity === 1 ? '½ onza' : '½ onzas'}`
                        : `${currentQuantity} ${currentQuantity === 1 ? 'onza' : 'onzas'}`
                      : `${currentQuantity}`}
                  </span>
                </span>
              </div>
            )}
          </Link>

          {/* Detalles del producto con alturas normalizadas */}
          <div className="pl-3.5 pr-2 sm:pl-4 sm:pr-2.5 flex-1 flex flex-col justify-start">
            {/* Nombre Oficial de la Fragancia (Contratipo) */}
            <div className="h-6 sm:h-7 flex items-center">
              <Link href={getProductUrl(product)} className="block group/title w-full">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-1 leading-snug group-hover/title:text-indigo-600 transition-colors" title={displayName}>
                  {displayName}
                </h3>
              </Link>
            </div>

            {/* Precio en BOLD a la par de Disponibilidad */}
            <div className="mt-0.5 h-6 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-bold text-indigo-700 leading-tight tracking-tight">
                ${activeOption.price.toFixed(2)}
              </span>
              <span className={`text-[8px] sm:text-[9px] tracking-tight ${
                availableUnits === 0
                  ? 'text-slate-400 font-normal'
                  : isBelowMinAlert
                  ? 'text-amber-700 font-black'
                  : 'text-emerald-700 font-bold'
              }`}>
                {availableUnits === 0
                  ? 'Sin existencias'
                  : isBelowMinAlert
                  ? isEssence
                    ? selectedPresentation === 'MEDIA_ONZA'
                      ? availableUnits === 1 ? '¡Solo queda 1 media onza!' : `¡Solo quedan ${availableUnits} medias onzas!`
                      : availableUnits === 1 ? '¡Solo queda 1 onza!' : `¡Solo quedan ${availableUnits} onzas!`
                    : availableUnits === 1 ? '¡Solo queda 1 unidad!' : `¡Solo quedan ${availableUnits} unidades!`
                  : 'Disponible'}
              </span>
            </div>

            {/* Inspirado en el perfume original (altura fija de 2 líneas normalizada) */}
            <div className="mt-0.5 h-8 sm:h-9 flex items-center">
              {isEssence ? (
                <p 
                  className={`${inspiredSizeClass} text-slate-600 leading-tight line-clamp-2 break-words`} 
                  title={`Inspirado en ${inspiracionPerfumeName}`}
                >
                  <span className="text-slate-400 font-normal">Inspirado en </span>
                  <span className="font-semibold text-slate-700">
                    {inspiracionPerfumeName}
                  </span>
                </p>
              ) : isBottle ? (
                <span className="text-[10.5px] sm:text-xs text-slate-500 font-normal truncate">Frasco de Vidrio • Cierre de Rosca</span>
              ) : (
                <span className="text-[10.5px] sm:text-xs text-slate-500 font-normal truncate">{product.unit || 'Unidad'} • Disponible</span>
              )}
            </div>
          </div>
        </div>

        {/* Sección Inferior: Selector de Presentación y Botón alineados al pie */}
        <div className="mt-auto pt-2 flex flex-col justify-end">
          {/* Selector de Presentación con altura fija uniforme (34px) */}
          <div className="h-[34px] sm:h-[36px] flex items-center mb-1.5">
            {presentations.length > 1 ? (
              <div className="w-full grid grid-cols-2 gap-1 p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs h-full">
                {presentations.map((opt) => {
                  const isSelected = selectedPresentation === opt.id;
                  
                  // Verificar si la opción está disponible según stock discreto
                  const isOptOutOfStock = isEssence
                    ? (opt.id === 'ONZA_COMPLETA' ? (discreteStock?.available1oz ?? 0) <= 0 : (discreteStock?.availableHalfOz ?? 0) <= 0)
                    : availableUnits <= 0;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPresentation(opt.id)}
                      className={`h-full rounded-lg text-center transition-all cursor-pointer select-none flex items-center justify-center px-1 relative ${
                        isSelected
                          ? 'bg-[#7c3aed] text-white shadow-xs font-black scale-[1.02]'
                          : isOptOutOfStock
                          ? 'bg-white/50 text-slate-400 opacity-60 hover:bg-white/80 font-medium'
                          : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200/70 shadow-2xs font-bold'
                      }`}
                    >
                      <span className="text-[10.5px] sm:text-[11.5px] leading-tight font-extrabold">
                        {opt.id === 'MEDIA_ONZA' ? '½ Onza' : '1 Onza'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50/80 rounded-xl border border-slate-200/60 px-2 text-center text-[10px] sm:text-[11px] font-bold text-slate-600">
                <span className="truncate">{presentations[0]?.description || 'Presentación única'}</span>
              </div>
            )}
          </div>

          {/* Botón de Agregar al Carrito SÓLIDO con altura fija para no desalinear */}
          <div>
            {isOutOfStock ? (
              <button
                disabled
                className="w-full h-[38px] sm:h-[40px] text-[9.5px] sm:text-xs font-black rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed text-center flex items-center justify-center"
              >
                Agotado
              </button>
            ) : currentQuantity > 0 ? (
              /* YA ESTÁ EN EL CARRITO: Misma altura fija de 38px/40px */
              <div className={`transition-all duration-300 ${isCardPulsing ? 'scale-[1.02]' : ''}`}>
                <div className="flex items-center justify-between gap-1 w-full bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 shadow-2xs h-[38px] sm:h-[40px]">
                  <button
                    onClick={handleDecrement}
                    className="w-8 h-full rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-black text-xs flex items-center justify-center transition-all shadow-xs active:scale-90 cursor-pointer"
                    title="Disminuir una unidad"
                    aria-label="Disminuir unidad"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1 text-center font-black text-xs sm:text-sm text-slate-900 leading-tight">
                    <span className="text-purple-700 font-extrabold">{currentQuantity}</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium block">
                      {selectedPresentation === 'MEDIA_ONZA' ? '½ oz' : selectedPresentation === 'ONZA_COMPLETA' ? '1 oz' : 'en carrito'}
                    </span>
                  </div>

                  <button
                    onClick={handleIncrement}
                    disabled={!canAddMore}
                    className={`w-8 h-full rounded-lg font-black text-xs flex items-center justify-center transition-all shadow-xs ${
                      canAddMore
                        ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white active:scale-90 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title={canAddMore ? "Aumentar una unidad" : "Máximo disponible en inventario"}
                    aria-label="Aumentar unidad"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* AÚN NO EN EL CARRITO */
              <button
                onClick={handleAdd}
                disabled={isOutOfStock || !canAddMore}
                className={`w-full h-[38px] sm:h-[40px] text-[10.5px] sm:text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 select-none ${
                  !canAddMore
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : justAdded 
                    ? 'bg-[#7c3aed] text-white shadow-md scale-[1.02]' 
                    : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-sm active:scale-95 cursor-pointer'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>¡Agregado!</span>
                  </>
                ) : !canAddMore ? (
                  <span>Sin existencias</span>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Agregar al carrito</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Disponibilidad de retiro o envío */}
          <div className="mt-1.5 text-center">
            <span className="text-[8.5px] sm:text-[9.5px] text-slate-400 font-medium tracking-tight block">
              Retiro en local o envíos a todo El Salvador
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

const ProductCard = React.memo(ProductCardComponent, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.product.stock === next.product.stock &&
    prev.product.price === next.product.price &&
    prev.priority === next.priority
  );
});

export default ProductCard;

