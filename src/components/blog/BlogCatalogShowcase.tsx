// src/components/blog/BlogCatalogShowcase.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { INITIAL_PRODUCTS } from '@/lib/store';
import ProductCard from '@/components/ecommerce/ProductCard';

interface ShowcaseProps {
  genderFilter?: string | null;
  limit?: number;
}

export default function BlogCatalogShowcase({ genderFilter, limit = 3 }: ShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'Esencias' | 'Botes' | 'Insumos'>('Esencias');

  // 1. Esencias
  let essenceCandidates = INITIAL_PRODUCTS.filter(p => p.isAvailableOnline && p.category === 'Esencias para Perfume');
  if (genderFilter && genderFilter !== 'Todos') {
    const filtered = essenceCandidates.filter(p => p.gender?.toLowerCase() === genderFilter.toLowerCase());
    if (filtered.length >= limit) {
      essenceCandidates = filtered;
    }
  }

  // 2. Botes y Frascos de Vidrio
  const bottleCandidates = INITIAL_PRODUCTS.filter(p => p.isAvailableOnline && p.category === 'Botes');

  // 3. Insumos y Materias Primas / Empaque
  const supplyCandidates = INITIAL_PRODUCTS.filter(p => 
    p.isAvailableOnline && (p.category === 'Insumos y Materia Prima' || p.category === 'Empaque' || p.category === 'Insumos')
  );

  const currentProducts = activeTab === 'Esencias'
    ? essenceCandidates.slice(0, limit)
    : activeTab === 'Botes'
    ? bottleCandidates.slice(0, limit)
    : supplyCandidates.slice(0, limit);

  return (
    <div className="my-10 p-5 sm:p-7 rounded-3xl clay-card bg-white/95 border border-white/80 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
        <div>
          <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg mb-1">
            Catálogo Aromaniak
          </span>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
            Productos y Materiales Disponibles
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Esencias 100% puras • Botes de vidrio con atomizador • Insumos de perfumería
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          Ver tienda completa
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Selector de Categoría (Pestañas de Productos: Esencias, Botes, Insumos) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('Esencias')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            activeTab === 'Esencias'
              ? 'clay-btn-primary text-white shadow-xs font-black'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs'
          }`}
        >
          Esencias 100% Puras
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('Botes')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            activeTab === 'Botes'
              ? 'clay-btn-primary text-white shadow-xs font-black'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs'
          }`}
        >
          Botes y Frascos de Vidrio
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('Insumos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            activeTab === 'Insumos'
              ? 'clay-btn-primary text-white shadow-xs font-black'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs'
          }`}
        >
          Insumos y Empaque
        </button>
      </div>

      {/* Grid con las TARJETAS EXACTAS del E-commerce */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {currentProducts.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>

      {/* Nota de inspiración y entrega */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          Esencias de inspiración olfativa, botes de vidrio y materias primas. Retiro en local o envíos a todo El Salvador.
        </span>
        <Link href="/" className="font-bold text-indigo-700 hover:underline shrink-0">
          Explorar tienda online
        </Link>
      </div>
    </div>
  );
}
