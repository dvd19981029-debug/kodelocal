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

interface InlineCalloutProps {
  product?: ProductItem;
  bottleProduct?: ProductItem;
  availableBottles?: ProductItem[];
  recommendations?: PostRecommendations;
}

export default function BlogInlineProductCallout({
  product,
  bottleProduct,
  availableBottles,
  recommendations,
}: InlineCalloutProps) {
  const { addToCart } = useEcommerceCart();

  // Producto principal
  const mainProduct = recommendations?.primaryProduct || product || INITIAL_PRODUCTS[0];
  const presentations = getPresentationsForProduct(mainProduct);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>(
    mainProduct.category === 'Esencias para Perfume' ? 'ONZA_COMPLETA' : 'UNIDAD'
  );

  const [justAddedMain, setJustAddedMain] = useState(false);
  const [addedBottleId, setAddedBottleId] = useState<string | null>(null);
  const [addedEssenceId, setAddedEssenceId] = useState<string | null>(null);

  // Esencias adicionales detectadas por palabras clave en el artículo
  const additionalEssences = (recommendations?.matchedEssences || [])
    .filter((e) => e.id !== mainProduct.id);

  // Lista de botes de vidrio para scroll horizontal
  const bottlesList = (recommendations?.recommendedBottles && recommendations.recommendedBottles.length > 0)
    ? recommendations.recommendedBottles
    : (availableBottles && availableBottles.length > 0)
    ? availableBottles
    : INITIAL_PRODUCTS.filter((p) => p.category === 'Botes' && p.imageUrl?.startsWith('/images/botes/'));


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
    addToCart(mainProduct, selectedPresentation, 1);
    setJustAddedMain(true);
    setTimeout(() => setJustAddedMain(false), 1500);
  };

  const handleAddEssence = (ess: ProductItem) => {
    addToCart(ess, 'ONZA_COMPLETA', 1);
    setAddedEssenceId(ess.id);
    setTimeout(() => setAddedEssenceId(null), 1500);
  };

  const handleAddBottle = (bottle: ProductItem) => {
    addToCart(bottle, 'UNIDAD', 1);
    setAddedBottleId(bottle.id);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-5 w-full max-w-full min-w-0">
        
        {/* Contenedor fila en móvil (imagen + datos principales juntos) */}
        <div className="flex items-start gap-3.5 w-full sm:flex-1 min-w-0">
          {/* Imagen del producto en contenedor perfectamente cuadrado */}
          <Link
            href={getProductUrl(mainProduct)}
            className="shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/70 shadow-2xs relative group block"
          >
            <img
              src={productImage}
              alt={displayName}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/images/essence_bottle_blank.webp';
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {mainProduct.gender && (
              <div className="absolute top-1 left-1 z-10">
                <span className="bg-white/95 backdrop-blur-xs text-indigo-900 text-[8px] font-extrabold py-0.5 px-1.5 rounded-md shadow-2xs uppercase">
                  {mainProduct.gender}
                </span>
              </div>
            )}
          </Link>

          {/* Detalles informativos al lado de la imagen */}
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <span className="inline-block clay-badge text-[9px] font-black uppercase text-[#7c3aed] bg-purple-50 px-2 py-0.5 rounded-md leading-none max-w-full truncate">
                {headline}
              </span>
            </div>

            <Link href={getProductUrl(mainProduct)} className="block group/name">
              <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover/name:text-[#7c3aed] transition-colors leading-tight line-clamp-1">
                {displayName}
              </h4>
            </Link>

            <p className="text-xs text-slate-500 mt-0.5 font-medium line-clamp-1">
              <span className="text-slate-400 font-normal">Inspirado en </span>
              <span className="font-semibold text-slate-700">{inspiracionName}</span>
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-lg font-black text-[#7c3aed]">
                ${activeOption.price.toFixed(2)}
              </span>

              {/* Selector de Onza vs Media Onza */}
              {presentations.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-[10.5px] font-bold">
                  {presentations.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPresentation(opt.id)}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        selectedPresentation === opt.id
                          ? 'bg-[#7c3aed] text-white shadow-2xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.id === 'MEDIA_ONZA' ? '½ oz ($1.90)' : '1 oz ($3.75)'}
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
            className={`w-full sm:w-auto clay-btn clay-btn-primary px-4 py-2.5 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
              justAddedMain ? 'scale-[1.02]' : ''
            }`}
          >
            {justAddedMain ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>¡Agregado al Carrito!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Agregar al Carrito</span>
              </>
            )}
          </button>

          <Link
            href={getProductUrl(mainProduct)}
            className="inline-flex items-center justify-center sm:justify-end gap-1 text-[11px] font-bold text-[#7c3aed] hover:text-purple-900 transition-colors"
          >
            <span>Ver detalles</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* 2. OTRAS ESENCIAS MENCIONADAS EN EL ARTÍCULO (Carrusel alineado milimétricamente) */}
      {additionalEssences.length > 0 && (
        <div className="pt-4 border-t border-slate-100/90 space-y-2.5 w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 block truncate">
                Otras Fragancias Mencionadas en Este Artículo
              </span>
              <span className="text-[11px] text-slate-500 font-medium block truncate">
                Esencias 100% puras recomendadas según el tema de la guía
              </span>
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
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2 border border-slate-100 flex items-center justify-center shrink-0">
                    <img
                      src={essImg}
                      alt={essName}
                      onError={(e) => {
                        e.currentTarget.src = '/images/essence_bottle_blank.webp';
                      }}
                      className="w-full h-full object-cover"
                    />
                    {ess.gender && (
                      <span className="absolute top-1 left-1 bg-white/95 text-[8px] font-black text-slate-800 px-1 py-0.5 rounded shadow-2xs uppercase">
                        {ess.gender}
                      </span>
                    )}
                  </div>

                  <div className="mb-2 flex flex-col justify-start">
                    <h5 className="text-[11px] font-black text-slate-800 line-clamp-1 leading-tight" title={essName}>
                      {essName}
                    </h5>
                    <p className="text-[9.5px] text-slate-500 line-clamp-1 leading-tight mt-0.5" title={`Inspirado en ${essInspiracion}`}>
                      {essInspiracion}
                    </p>
                    <span className="text-xs font-black text-[#7c3aed] mt-1 block">
                      ${ess.price.toFixed(2)} <span className="text-[9px] text-slate-400 font-normal">/ 1 oz</span>
                    </span>
                  </div>

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
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 block truncate">
                Botes de Vidrio 100ml con Atomizador de Lujo
              </span>
              <span className="text-[11px] text-slate-500 font-medium block truncate">
                Desplaza horizontalmente y elige tu envase favorito
              </span>
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
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2 border border-slate-100 flex items-center justify-center shrink-0">
                    <img
                      src={bottle.imageUrl}
                      alt={bottle.name}
                      onError={(e) => {
                        e.currentTarget.src = '/images/botes/bote_100ml_degrade_azul_noche.jpg';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 left-1 bg-white/95 text-[8px] font-black text-slate-800 px-1 py-0.5 rounded shadow-2xs">
                      100 ML
                    </span>
                  </div>

                  <div className="mb-2 flex flex-col justify-start">
                    <h5 className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight" title={bottle.name}>
                      {shortName}
                    </h5>
                    <span className="text-xs font-black text-[#7c3aed] mt-1 block">
                      ${bottle.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddBottle(bottle)}
                    className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-purple-50 hover:bg-[#7c3aed] text-[#7c3aed] hover:text-white border border-purple-100 shadow-2xs'
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
                        <span>+ Bote</span>
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
