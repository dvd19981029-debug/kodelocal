// src/components/blog/BlogInlineProductCallout.tsx
'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS } from '@/lib/store';
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation } from '@/context/EcommerceCartContext';
import { getProductImage } from '@/lib/perfumeImages';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { getProductUrl } from '@/lib/productUrl';
import { PostRecommendations } from '@/lib/recommendations';
import { useLiveProducts } from '@/hooks/useLiveProducts';

interface InlineCalloutProps {
  product?: ProductItem;
  bottleProduct?: ProductItem;
  availableBottles?: ProductItem[];
  recommendations?: PostRecommendations;
  catalog?: ProductItem[];
}

export default function BlogInlineProductCallout({
  product,
  bottleProduct,
  availableBottles,
  recommendations,
  catalog,
}: InlineCalloutProps) {
  const { addToCart } = useEcommerceCart();
  const liveProducts = useLiveProducts(catalog);
  const liveProductMap = React.useMemo(() => new Map(liveProducts.map(p => [p.id, p])), [liveProducts]);

  // Producto principal sincronizado en tiempo real
  const initialMain = recommendations?.primaryProduct || product || INITIAL_PRODUCTS[0];
  const mainProduct = (initialMain ? liveProductMap.get(initialMain.id) : null) || initialMain;
  const presentations = getPresentationsForProduct(mainProduct);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>(
    mainProduct.category === 'Esencias para Perfume' ? 'ONZA_COMPLETA' : 'UNIDAD'
  );

  const [justAddedMain, setJustAddedMain] = useState(false);
  const [addedBottleId, setAddedBottleId] = useState<string | null>(null);
  const [addedEssenceId, setAddedEssenceId] = useState<string | null>(null);

  // Esencias adicionales detectadas por palabras clave en el artículo sincronizadas en tiempo real
  const additionalEssences = (recommendations?.matchedEssences || [])
    .filter((e) => e.id !== mainProduct.id)
    .map((e) => liveProductMap.get(e.id) || e);

  // Lista de botes de vidrio para scroll horizontal sincronizados en tiempo real
  const rawBottles = (recommendations?.recommendedBottles && recommendations.recommendedBottles.length > 0)
    ? recommendations.recommendedBottles
    : (availableBottles && availableBottles.length > 0)
    ? availableBottles
    : liveProducts.filter((p) => p.category === 'Botes' && p.imageUrl?.startsWith('/images/botes/'));
  const bottlesList = rawBottles.map((b) => liveProductMap.get(b.id) || b);

  const scrollBottlesRef = useRef<HTMLDivElement>(null);
  const scrollEssencesRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 240;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleAddMain = () => {
    const liveTarget = liveProductMap.get(mainProduct.id) || mainProduct;
    addToCart(liveTarget, selectedPresentation, 1);
    setJustAddedMain(true);
    setTimeout(() => setJustAddedMain(false), 1500);
  };

  const handleAddEssence = (ess: ProductItem) => {
    const liveTarget = liveProductMap.get(ess.id) || ess;
    addToCart(liveTarget, 'ONZA_COMPLETA', 1);
    setAddedEssenceId(liveTarget.id);
    setTimeout(() => setAddedEssenceId(null), 1500);
  };

  const handleAddBottle = (bottle: ProductItem) => {
    const liveTarget = liveProductMap.get(bottle.id) || bottle;
    addToCart(liveTarget, 'UNIDAD', 1);
    setAddedBottleId(liveTarget.id);
    setTimeout(() => setAddedBottleId(null), 1500);
  };

  const activeOption = presentations.find((p) => p.id === selectedPresentation) || presentations[0];
  const displayName = mainProduct.officialName?.trim() || mainProduct.name;
  const productImage = getProductImage(mainProduct);
  const inspiracionName = getInspiracionPerfumeName(mainProduct);

  const headline = recommendations?.headline || 'Fragancia del Artículo';
  const subheadline = recommendations?.subheadline || 'Esencia 100% Pura Sin Diluir';

  return (
    <aside aria-label="Productos recomendados en este artículo" className="my-6 sm:my-10 p-3.5 sm:p-6 rounded-3xl clay-card bg-white/95 border border-white/80 shadow-md space-y-5 w-full max-w-full min-w-0 overflow-hidden">
      
      {/* 1. TARJETA PRINCIPAL: Esencia destacada */}
      <div className="w-full max-w-full min-w-0">
        
        {/* Encabezado de la tarjeta: Título del llamado y badge de género (sin tapar la foto ni recortar texto con 3 puntos) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
          <span className="clay-badge text-[10px] sm:text-xs font-black uppercase text-[#7c3aed] bg-purple-50 px-2.5 py-1 rounded-lg">
            {headline}
          </span>
          {mainProduct.gender && (
            <span className="text-[10px] font-black uppercase text-indigo-900 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
              {mainProduct.gender}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full max-w-full min-w-0">
          {/* Contenedor fila en móvil (imagen grande + datos principales) */}
          <div className="flex items-start gap-3.5 sm:gap-4 w-full sm:flex-1 min-w-0">
            {/* Imagen del producto: Amplia, nítida, sin etiquetas que tapen el frasco */}
            <Link
              href={getProductUrl(mainProduct)}
              className="shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-2xs relative group block flex items-center justify-center p-1.5"
            >
              <img
                src={productImage}
                alt={displayName}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/images/essence_bottle_blank.webp';
                }}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Detalles informativos con espacio adecuado y sin recortes */}
            <div className="flex-1 min-w-0">
              <Link href={getProductUrl(mainProduct)} className="block group/name">
                <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover/name:text-[#7c3aed] transition-colors leading-snug break-words">
                  {displayName}
                </h4>
              </Link>

              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-normal">
                <span className="text-slate-400 font-normal">Inspirado en </span>
                <span className="font-semibold text-slate-700">{inspiracionName}</span>
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-[#7c3aed]">
                  ${activeOption.price.toFixed(2)}
                </span>

                {/* Selector de Onza vs Media Onza */}
                {presentations.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-[11px] font-bold">
                    {presentations.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedPresentation(opt.id)}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          selectedPresentation === opt.id
                            ? 'bg-[#7c3aed] text-white shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.id === 'MEDIA_ONZA' ? `½ oz ($${opt.price.toFixed(2)})` : `1 oz ($${opt.price.toFixed(2)})`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acciones de compra directa */}
          <div className="w-full sm:w-auto shrink-0 flex flex-col sm:items-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              onClick={handleAddMain}
              className={`w-full sm:w-auto clay-btn clay-btn-primary px-5 py-3 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                justAddedMain ? 'scale-[1.02]' : ''
              }`}
            >
              {justAddedMain ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Agregado al Carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Agregar al Carrito</span>
                </>
              )}
            </button>

            <Link
              href={getProductUrl(mainProduct)}
              className="inline-flex items-center justify-center sm:justify-end gap-1 text-xs font-bold text-[#7c3aed] hover:text-purple-900 transition-colors py-0.5"
            >
              <span>Ver detalles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>

      {/* 2. OTRAS ESENCIAS MENCIONADAS EN EL ARTÍCULO */}
      {additionalEssences.length > 0 && (
        <div className="pt-4 border-t border-slate-100/90 space-y-2.5 w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                Otras Fragancias del Artículo
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-snug">
                Esencias 100% puras recomendadas
              </p>
            </div>

            {/* Flechas de desplazamiento */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => scrollContainer(scrollEssencesRef, 'left')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Ver anteriores"
                aria-label="Anterior fragancia"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(scrollEssencesRef, 'right')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Ver siguientes"
                aria-label="Siguiente fragancia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollEssencesRef}
            className="flex gap-2.5 overflow-x-auto scrollbar-none py-1.5 scroll-smooth snap-x snap-mandatory w-full max-w-full min-w-0 touch-pan-x overscroll-x-contain"
          >
            {additionalEssences.map((ess) => {
              const isAdded = addedEssenceId === ess.id;
              const essName = ess.officialName?.trim() || ess.name;
              const essInspiracion = getInspiracionPerfumeName(ess);
              const essImg = getProductImage(ess);

              return (
                <div
                  key={ess.id}
                  className="w-36 sm:w-40 shrink-0 snap-start bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <Link
                    href={getProductUrl(ess)}
                    className="block group flex-1 cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-2 border border-slate-100 flex items-center justify-center shrink-0 p-1">
                      <img
                        src={essImg}
                        alt={essName}
                        onError={(e) => {
                          e.currentTarget.src = '/images/essence_bottle_blank.webp';
                        }}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    <div className="mb-2 flex flex-col justify-start">
                      {ess.gender && (
                        <span className="text-[9px] font-black text-indigo-700 uppercase mb-0.5 block">
                          {ess.gender}
                        </span>
                      )}
                      <h5 className="text-xs font-black text-slate-800 line-clamp-1 leading-tight group-hover:text-[#7c3aed] transition-colors" title={essName}>
                        {essName}
                      </h5>
                      <p className="text-[10px] text-slate-500 line-clamp-1 leading-tight mt-0.5" title={`Inspirado en ${essInspiracion}`}>
                        Inspirado en {essInspiracion}
                      </p>
                      <span className="text-xs font-black text-[#7c3aed] mt-1 block">
                        ${ess.price.toFixed(2)} <span className="text-[9px] text-slate-400 font-normal">/ 1 oz</span>
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleAddEssence(ess)}
                    className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-2xs'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span className="font-black">¡Agregado!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3 h-3" />
                        <span>+ Agregar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CARRUSEL HORIZONTAL DE BOTES DE VIDRIO 100ML */}
      {bottlesList.length > 0 && (
        <div className="pt-4 border-t border-slate-100/90 space-y-2.5 w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                Botes de Vidrio 100ml con Atomizador
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-snug">
                Frascos de rosca hermética listos para envasar
              </p>
            </div>

            {/* Flechas de desplazamiento */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => scrollContainer(scrollBottlesRef, 'left')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Ver anteriores"
                aria-label="Anterior bote"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer(scrollBottlesRef, 'right')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Ver siguientes"
                aria-label="Siguiente bote"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollBottlesRef}
            className="flex gap-2.5 overflow-x-auto scrollbar-none py-1.5 scroll-smooth snap-x snap-mandatory w-full max-w-full min-w-0 touch-pan-x overscroll-x-contain"
          >
            {bottlesList.map((bottle) => {
              const isAdded = addedBottleId === bottle.id;
              const shortName = bottle.name
                .replace(/^Bote de Vidrio 100ml\s*/i, '')
                .replace(/^Bote de Vidrio\s*/i, '');

              return (
                <div
                  key={bottle.id}
                  className="w-36 sm:w-40 shrink-0 snap-start bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <Link
                    href={getProductUrl(bottle)}
                    className="block group flex-1 cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-2 border border-slate-100 flex items-center justify-center shrink-0 p-1">
                      <img
                        src={bottle.imageUrl}
                        alt={bottle.name}
                        onError={(e) => {
                          e.currentTarget.src = '/images/botes/bote_100ml_degrade_azul_noche.jpg';
                        }}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    <div className="mb-2 flex flex-col justify-start">
                      <span className="text-[9px] font-black text-slate-500 uppercase mb-0.5 block">
                        100 ML
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight group-hover:text-[#7c3aed] transition-colors" title={bottle.name}>
                        {shortName}
                      </h5>
                      <span className="text-xs font-black text-[#7c3aed] mt-1 block">
                        ${bottle.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleAddBottle(bottle)}
                    className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-2xs'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span className="font-black">¡Agregado!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3 h-3" />
                        <span>+ Agregar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nota de inspiración y entrega */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1 font-medium text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          Inspiración olfativa
        </span>
        <span className="text-slate-500 font-medium">
          Retiro en local o envíos a todo El Salvador
        </span>
      </div>
    </aside>
  );
}
