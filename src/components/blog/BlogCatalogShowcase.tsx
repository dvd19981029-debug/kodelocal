// src/components/blog/BlogCatalogShowcase.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { INITIAL_PRODUCTS } from '@/lib/store';
import ProductCard from '@/components/ecommerce/ProductCard';

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
    <div className="my-10 p-5 sm:p-7 rounded-3xl clay-card bg-white/95 border border-white/80 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
        <div>
          <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg mb-1">
            Catálogo Aromaniak
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
            Fragancias de Inspiración Mencionadas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Esencias 100% puras sin diluir • Perfumería fina de inspiración olfativa • NO somos réplicas ni imitaciones
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          Ver catálogo completo
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid con las TARJETAS EXACTAS del E-commerce */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {featured.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>

      {/* Nota legal y de autenticidad */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          Aromaniak elabora contratipos propios de alta gama inspirados en familias olfativas de diseñador. NO comercializamos réplicas ni imitaciones.
        </span>
        <Link href="/" className="font-bold text-indigo-700 hover:underline shrink-0">
          Explorar tienda online
        </Link>
      </div>
    </div>
  );
}
