// src/components/blog/BlogReadingSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Wand2, Truck, ShieldCheck } from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS } from '@/lib/store';
import ProductCard from '@/components/ecommerce/ProductCard';
import TableOfContents from '@/components/blog/TableOfContents';

interface BlogReadingSidebarProps {
  product: ProductItem;
  bottleProduct?: ProductItem;
  availableBottles?: ProductItem[];
  content: string;
}

export default function BlogReadingSidebar({ product, bottleProduct, availableBottles, content }: BlogReadingSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<'esencia' | 'bote'>('esencia');

  const bottlesList = (availableBottles && availableBottles.length > 0)
    ? availableBottles
    : INITIAL_PRODUCTS.filter(p => p.category === 'Botes' && p.imageUrl?.startsWith('/images/botes/'));

  const [selectedBottleId, setSelectedBottleId] = React.useState<string>(
    bottleProduct?.id || (bottlesList[0]?.id || '')
  );

  const currentBottle = bottlesList.find(b => b.id === selectedBottleId) || bottleProduct || bottlesList[0] || product;

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
            {bottlesList.length > 0 && (
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
              {activeTab === 'esencia' ? 'Pruébala mientras lees' : (currentBottle.name.replace(/^Bote de Vidrio 100ml\s*/i, 'Frasco '))}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {activeTab === 'esencia'
                ? 'Esencia 100% pura • Alta fijación'
                : 'Cierre hermético • Atomizador de alta dispersión'}
            </p>
          </div>

          {/* Selector Horizontal de Botes al ver la pestaña de botes */}
          {activeTab === 'bote' && bottlesList.length > 0 && (
            <div className="space-y-1.5 pb-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <span>Modelos 100ml (Desliza):</span>
                <span className="text-indigo-700">${currentBottle.price.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 snap-x">
                {bottlesList.map((b) => {
                  const isSelected = b.id === currentBottle.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBottleId(b.id)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-[#7c3aed] border-[#7c3aed] scale-105 shadow-2xs'
                          : 'border-slate-200/80 hover:border-slate-300 opacity-75 hover:opacity-100 bg-white'
                      }`}
                      title={b.name}
                    >
                      <img
                        src={b.imageUrl}
                        alt={b.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tarjeta real de compra interactiva */}
          <div className="max-w-xs mx-auto">
            <ProductCard product={activeTab === 'esencia' ? product : currentBottle} />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              Garantía Aromaniak
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <Truck className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
              Retiro en local o envíos a todo El Salvador
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
