// src/components/blog/BlogCatalogShowcase.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { INITIAL_PRODUCTS } from '@/lib/store';
import { getProductUrl } from '@/lib/productUrl';

interface ShowcaseProps {
  genderFilter?: string | null;
  limit?: number;
}

export default function BlogCatalogShowcase({ genderFilter, limit = 3 }: ShowcaseProps) {
  // Filtrar o tomar los productos más icónicos de Aromaniak
  let candidates = INITIAL_PRODUCTS.filter(p => p.isAvailableOnline && p.category === 'Esencias para Perfume');
  
  if (genderFilter && genderFilter !== 'Todos') {
    const filtered = candidates.filter(p => p.gender?.toLowerCase() === genderFilter.toLowerCase());
    if (filtered.length >= limit) {
      candidates = filtered;
    }
  }

  const featured = candidates.slice(0, limit);

  return (
    <div className="my-10 p-5 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Catálogo Aromaniak SV
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            Fragancias Destacadas Mencionadas
          </h3>
        </div>
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors"
        >
          Ver Todo
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid de Productos Recomendados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {featured.map((prod) => {
          const productUrl = getProductUrl({
            id: prod.id,
            sku: prod.sku,
            category: prod.category,
          });

          return (
            <div
              key={prod.id}
              className="flex flex-col bg-slate-50/70 hover:bg-white rounded-2xl p-4 border border-slate-200/70 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <Link href={productUrl} className="relative aspect-square rounded-xl overflow-hidden bg-white mb-3 flex items-center justify-center p-2">
                <img
                  src={prod.imageUrl || '/images/esencias/esencia_1.webp'}
                  alt={prod.name}
                  loading="lazy"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                {prod.gender && (
                  <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {prod.gender}
                  </span>
                )}
              </Link>

              <div className="flex-1 flex flex-col">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">
                  {prod.officialName || prod.brand || 'Aromaniak'}
                </span>
                <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-1 mb-1">
                  <Link href={productUrl} className="hover:text-purple-700 transition-colors">
                    {prod.name}
                  </Link>
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">
                  {prod.description || `Inspiración de ${prod.brand || 'Lujo'}`}
                </p>

                <div className="mt-auto pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Por Onza</span>
                    <span className="text-sm font-black text-slate-900">
                      ${prod.price.toFixed(2)}
                    </span>
                  </div>
                  <Link
                    href={productUrl}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-900 text-white text-xs font-black hover:bg-purple-950 transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Comprar
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer del showcase */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Esencias 100% puras sin diluir • Envíos a todo El Salvador
        </span>

        <Link
          href="/"
          className="sm:hidden text-xs font-bold text-purple-700"
        >
          Ver todo el catálogo →
        </Link>
      </div>
    </div>
  );
}
