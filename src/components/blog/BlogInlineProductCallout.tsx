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

interface InlineCalloutProps {
  product: ProductItem;
  bottleProduct?: ProductItem;
  availableBottles?: ProductItem[];
}

export default function BlogInlineProductCallout({ product, bottleProduct, availableBottles }: InlineCalloutProps) {
  const { addToCart } = useEcommerceCart();
  const presentations = getPresentationsForProduct(product);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>(
    product.category === 'Esencias para Perfume' ? 'ONZA_COMPLETA' : 'UNIDAD'
  );
  const [justAdded, setJustAdded] = useState(false);
  const [addedBottleId, setAddedBottleId] = useState<string | null>(null);

  // Lista de botes de vidrio para scroll horizontal
  const bottlesList = (availableBottles && availableBottles.length > 0)
    ? availableBottles
    : INITIAL_PRODUCTS.filter(p => p.category === 'Botes' && p.imageUrl?.startsWith('/images/botes/'));

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollBottles = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 240;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleAddSpecificBottle = (bottle: ProductItem) => {
    addToCart(bottle, 'UNIDAD', 1);
    setAddedBottleId(bottle.id);
    setTimeout(() => setAddedBottleId(null), 1500);
  };

  const activeOption = presentations.find(p => p.id === selectedPresentation) || presentations[0];
  const displayName = product.officialName?.trim() || product.name;
  const productImage = getProductImage(product);
  const inspiracionName = getInspiracionPerfumeName(product);

  const handleAdd = () => {
    addToCart(product, selectedPresentation, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };



  return (
    <aside aria-label="Fragancia recomendada en este artículo" className="my-8 sm:my-10 p-4 sm:p-6 rounded-3xl clay-card bg-white/95 border border-white/80 shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        
        {/* Imagen del producto en tarjeta burbuja claymórfica */}
        <Link
          href={getProductUrl(product)}
          className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/70 shadow-2xs relative group block"
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
          {product.gender && (
            <div className="absolute top-1.5 left-1.5 z-10">
              <span className="bg-white/95 backdrop-blur-xs text-indigo-900 text-[8px] font-extrabold py-0.5 px-1.5 rounded-md shadow-2xs uppercase">
                {product.gender}
              </span>
            </div>
          )}
        </Link>

        {/* Detalles informativos */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="clay-badge text-[9.5px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Fragancia del Artículo
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              Esencia 100% Pura Sin Diluir
            </span>
          </div>

          <Link href={getProductUrl(product)} className="block group/name">
            <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover/name:text-indigo-700 transition-colors leading-snug truncate">
              {displayName}
            </h4>
          </Link>

          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            <span className="text-slate-400 font-normal">Inspirado en </span>
            <span className="font-semibold text-slate-800">{inspiracionName}</span>
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-base sm:text-lg font-black text-indigo-700">
              ${activeOption.price.toFixed(2)}
            </span>

            {/* Selector de Onza vs Media Onza */}
            {presentations.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/70 text-[11px] font-bold">
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

        {/* Acciones de compra directa */}
        <div className="w-full sm:w-auto shrink-0 flex flex-col sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            onClick={handleAdd}
            className={`w-full sm:w-auto clay-btn clay-btn-primary px-4 py-2.5 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
              justAdded ? 'scale-[1.02]' : ''
            }`}
          >
            {justAdded ? (
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
            href={getProductUrl(product)}
            className="inline-flex items-center justify-center sm:justify-end gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <span>Ver detalles</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* Carrusel Desplazable Horizontal de Botes de Vidrio 100ml */}
      {bottlesList.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-900 block">
                Botes de Vidrio 100ml con Atomizador de Lujo
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Desplaza horizontalmente y elige tu envase favorito
              </span>
            </div>

            {/* Flechas de desplazamiento */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollBottles('left')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Ver anteriores"
                aria-label="Anterior bote"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollBottles('right')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Ver siguientes"
                aria-label="Siguiente bote"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Carrusel horizontal */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2.5 overflow-x-auto scrollbar-none py-1 scroll-smooth snap-x snap-mandatory"
          >
            {bottlesList.map((bottle) => {
              const isAdded = addedBottleId === bottle.id;
              const shortName = bottle.name
                .replace(/^Bote de Vidrio 100ml\s*/i, '')
                .replace(/^Bote de Vidrio\s*/i, '');

              return (
                <div
                  key={bottle.id}
                  className="w-36 sm:w-40 shrink-0 snap-start bg-slate-50/90 hover:bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-2 border border-slate-100 flex items-center justify-center">
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

                  <div className="mb-2">
                    <h5 className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight" title={bottle.name}>
                      {shortName}
                    </h5>
                    <span className="text-xs font-black text-indigo-700 mt-0.5 block">
                      ${bottle.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSpecificBottle(bottle)}
                    className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span className="font-black">¡Agregado!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3 h-3 text-slate-500" />
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
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
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
