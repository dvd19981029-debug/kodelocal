// src/components/blog/BlogInlineProductCallout.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { useEcommerceCart, getPresentationsForProduct, ProductPresentation } from '@/context/EcommerceCartContext';
import { getProductImage } from '@/lib/perfumeImages';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { getProductUrl } from '@/lib/productUrl';

interface InlineCalloutProps {
  product: ProductItem;
  bottleProduct?: ProductItem;
}

export default function BlogInlineProductCallout({ product, bottleProduct }: InlineCalloutProps) {
  const { addToCart } = useEcommerceCart();
  const presentations = getPresentationsForProduct(product);
  const [selectedPresentation, setSelectedPresentation] = useState<ProductPresentation>(
    product.category === 'Esencias para Perfume' ? 'ONZA_COMPLETA' : 'UNIDAD'
  );
  const [justAdded, setJustAdded] = useState(false);
  const [bottleAdded, setBottleAdded] = useState(false);

  const activeOption = presentations.find(p => p.id === selectedPresentation) || presentations[0];
  const displayName = product.officialName?.trim() || product.name;
  const productImage = getProductImage(product);
  const inspiracionName = getInspiracionPerfumeName(product);

  const handleAdd = () => {
    addToCart(product, selectedPresentation, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleAddBottle = () => {
    if (!bottleProduct) return;
    addToCart(bottleProduct, 'UNIDAD', 1);
    setBottleAdded(true);
    setTimeout(() => setBottleAdded(false), 1500);
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

      {/* Opción de Frasco de Vidrio Complementario */}
      {bottleProduct && (
        <div className="mt-4 pt-3 border-t border-slate-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 p-3 rounded-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={bottleProduct.imageUrl}
              alt={bottleProduct.name}
              onError={(e) => {
                e.currentTarget.src = '/images/botes/bote_100ml_degrade_azul_noche.jpg';
              }}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
            />
            <div className="text-xs min-w-0">
              <span className="font-bold text-slate-800 block truncate">
                {bottleProduct.name}
              </span>
              <span className="text-[11px] text-indigo-700 font-extrabold">
                ${bottleProduct.price.toFixed(2)} • Frasco de Vidrio 100ml con Atomizador
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddBottle}
            className="clay-btn clay-btn-light px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs shrink-0 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {bottleAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700 font-black">¡Bote Agregado!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                <span>Agregar Bote de Vidrio</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Nota legal y garantía */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          Inspiración olfativa de perfumería fina • NO comercializamos réplicas
        </span>
        <span className="hidden sm:inline text-slate-400">
          Envíos a todo El Salvador (24-48h)
        </span>
      </div>
    </aside>
  );
}
