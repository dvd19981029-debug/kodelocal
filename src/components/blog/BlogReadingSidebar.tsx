// src/components/blog/BlogReadingSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Wand2, Truck, ShieldCheck } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import ProductCard from '@/components/ecommerce/ProductCard';
import TableOfContents from '@/components/blog/TableOfContents';

interface BlogReadingSidebarProps {
  product: ProductItem;
  bottleProduct?: ProductItem;
  content: string;
}

export default function BlogReadingSidebar({ product, bottleProduct, content }: BlogReadingSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<'esencia' | 'bote'>('esencia');

  return (
    <aside className="space-y-6">
      <div className="sticky top-20 space-y-6">
        
        {/* ================= CARD 1: Producto del Artículo (Esencia o Bote de Vidrio) ================= */}
        <div className="clay-card p-4 sm:p-5 bg-white/95 rounded-3xl border border-white/80 shadow-md space-y-3">
          <div className="border-b border-slate-100 pb-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="clay-badge text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {activeTab === 'esencia' ? 'Esencia Destacada' : 'Bote de Vidrio 100ml'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {activeTab === 'esencia' ? '1 oz / ½ oz' : '100 ML'}
              </span>
            </div>

            {/* Pestañas para alternar entre la esencia y el bote de vidrio */}
            {bottleProduct && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80 mb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('esencia')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'esencia'
                      ? 'bg-[#7c3aed] text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Esencia Pura
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bote')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'bote'
                      ? 'bg-[#7c3aed] text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bote de Vidrio
                </button>
              </div>
            )}

            <h3 className="text-sm font-black text-slate-900">
              {activeTab === 'esencia' ? 'Pruébala mientras lees' : 'Frasco con atomizador de lujo'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {activeTab === 'esencia'
                ? 'Esencia 100% pura • Alta fijación'
                : 'Cierre hermético • Atomizador de alta dispersión'}
            </p>
          </div>

          {/* Tarjeta real de compra interactiva */}
          <div className="max-w-xs mx-auto">
            <ProductCard product={activeTab === 'esencia' ? product : (bottleProduct || product)} />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              Garantía Aromaniak
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <Truck className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
              Entrega 24-48h
            </span>
          </div>
        </div>

        {/* ================= CARD 2: Incentivo "Arma tu propio perfume" (100ml) ================= */}
        <div className="clay-card p-5 bg-gradient-to-br from-purple-50/90 to-indigo-50/90 rounded-3xl border border-purple-100/90 shadow-xs space-y-2.5">
          <span className="clay-badge text-[9px] font-black uppercase text-purple-800 bg-white px-2 py-0.5 rounded-md shadow-2xs">
            Kit Completo 100ml
          </span>
          <h4 className="text-sm font-black text-slate-900 leading-snug">
            ¿Prefieres recibir tu perfume formulado y listo para usar?
          </h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Combina tu esencia favorita con alcohol de perfumería y el frasco de vidrio de tu elección en nuestro kit especial.
          </p>
          <Link
            href={`/?categoria=Arma+tu+perfume&essenceId=${product.id}`}
            className="w-full clay-btn clay-btn-primary py-2.5 px-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Armar mi Perfume ($15.00)
          </Link>
        </div>

        {/* ================= CARD 3: Índice de Lectura Rápida Sticky ================= */}
        <div className="hidden lg:block">
          <TableOfContents content={content} />
        </div>

      </div>
    </aside>
  );
}
