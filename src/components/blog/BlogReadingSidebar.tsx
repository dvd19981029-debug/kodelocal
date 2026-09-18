// src/components/blog/BlogReadingSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Wand2, Truck, ShieldCheck } from 'lucide-react';
import { ProductItem, INITIAL_PRODUCTS } from '@/lib/store';
import ProductCard from '@/components/ecommerce/ProductCard';
import TableOfContents from '@/components/blog/TableOfContents';
import { PostRecommendations } from '@/lib/recommendations';
import { getProductImage } from '@/lib/perfumeImages';

interface BlogReadingSidebarProps {
  product?: ProductItem;
  bottleProduct?: ProductItem;
  availableBottles?: ProductItem[];
  recommendations?: PostRecommendations;
  content: string;
}

export default function BlogReadingSidebar({
  product,
  bottleProduct,
  availableBottles,
  recommendations,
  content,
}: BlogReadingSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<'esencia' | 'bote' | 'insumo'>('esencia');

  // Esencias recomendadas
  const matchedEssences = (recommendations?.matchedEssences && recommendations.matchedEssences.length > 0)
    ? recommendations.matchedEssences
    : product
    ? [product]
    : [INITIAL_PRODUCTS[0]];

  const [selectedEssenceId, setSelectedEssenceId] = React.useState<string>(
    recommendations?.primaryProduct?.id || product?.id || matchedEssences[0]?.id || ''
  );

  // Botes recomendados
  const bottlesList = (recommendations?.recommendedBottles && recommendations.recommendedBottles.length > 0)
    ? recommendations.recommendedBottles
    : (availableBottles && availableBottles.length > 0)
    ? availableBottles
    : INITIAL_PRODUCTS.filter((p) => p.category === 'Botes' && p.imageUrl?.startsWith('/images/botes/'));

  const [selectedBottleId, setSelectedBottleId] = React.useState<string>(
    bottleProduct?.id || (bottlesList[0]?.id || '')
  );

  // Insumos recomendados
  const suppliesList = recommendations?.recommendedSupplies || [];
  const [selectedSupplyId, setSelectedSupplyId] = React.useState<string>(
    suppliesList[0]?.id || ''
  );

  const currentEssence = matchedEssences.find((e) => e.id === selectedEssenceId) || matchedEssences[0];
  const currentBottle = bottlesList.find((b) => b.id === selectedBottleId) || bottleProduct || bottlesList[0] || currentEssence;
  const currentSupply = suppliesList.find((s) => s.id === selectedSupplyId) || suppliesList[0] || currentEssence;

  const displayedProduct = activeTab === 'esencia'
    ? currentEssence
    : activeTab === 'bote'
    ? currentBottle
    : currentSupply;

  return (
    <aside className="space-y-6">
      <div className="sticky top-20 space-y-6">
        
        {/* ================= CARD 1: Producto del Artículo (Esencia, Bote o Insumo) ================= */}
        <div className="clay-card p-4 sm:p-5 bg-white/95 rounded-3xl border border-white/80 shadow-md space-y-3">
          <div className="border-b border-slate-100 pb-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="clay-badge text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {activeTab === 'esencia'
                  ? 'Esencia Destacada'
                  : activeTab === 'bote'
                  ? 'Bote de Vidrio 100ml'
                  : 'Insumo de Perfumería'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {activeTab === 'esencia' ? '1 oz / ½ oz' : activeTab === 'bote' ? '100 ML' : 'Grado Cosmético'}
              </span>
            </div>

            {/* Pestañas para alternar entre esencias, botes e insumos */}
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
                Esencia
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
                Bote 100ml
              </button>
              {suppliesList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('insumo')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'insumo'
                      ? 'bg-[#7c3aed] text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Insumo
                </button>
              )}
            </div>

            <h3 className="text-sm font-black text-slate-900 line-clamp-1">
              {activeTab === 'esencia'
                ? currentEssence.officialName || currentEssence.name
                : activeTab === 'bote'
                ? currentBottle.name.replace(/^Bote de Vidrio 100ml\s*/i, 'Frasco ')
                : currentSupply.name}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {activeTab === 'esencia'
                ? 'Esencia 100% pura • Alta fijación'
                : activeTab === 'bote'
                ? 'Cierre hermético • Atomizador de alta dispersión'
                : 'Materia prima especial de formulación'}
            </p>
          </div>

          {/* Selector Horizontal de Esencias Mencionadas si hay más de 1 */}
          {activeTab === 'esencia' && matchedEssences.length > 1 && (
            <div className="space-y-1.5 pb-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <span>Fragancias del artículo:</span>
                <span className="text-indigo-700">${currentEssence.price.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 snap-x">
                {matchedEssences.map((e) => {
                  const isSelected = e.id === currentEssence.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedEssenceId(e.id)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-[#7c3aed] border-[#7c3aed] scale-105 shadow-2xs'
                          : 'border-slate-200/80 hover:border-slate-300 opacity-75 hover:opacity-100 bg-white'
                      }`}
                      title={e.name}
                    >
                      <img
                        src={getProductImage(e)}
                        alt={e.name}
                        onError={(ev) => {
                          ev.currentTarget.src = '/images/essence_bottle_blank.webp';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Selector Horizontal de Insumos al ver la pestaña de insumos */}
          {activeTab === 'insumo' && suppliesList.length > 1 && (
            <div className="space-y-1.5 pb-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <span>Insumos recomendados:</span>
                <span className="text-indigo-700">${currentSupply.price.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 snap-x">
                {suppliesList.map((s) => {
                  const isSelected = s.id === currentSupply.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSupplyId(s.id)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-[#7c3aed] border-[#7c3aed] scale-105 shadow-2xs'
                          : 'border-slate-200/80 hover:border-slate-300 opacity-75 hover:opacity-100 bg-white'
                      }`}
                      title={s.name}
                    >
                      <img
                        src={s.imageUrl || '/images/botes/bote_100ml_degrade_azul_noche.jpg'}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tarjeta real de compra interactiva (perfectamente simétrica) */}
          <div className="max-w-xs mx-auto">
            <ProductCard product={displayedProduct} />
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
            href={`/?categoria=Arma+tu+perfume&essenceId=${currentEssence.id}`}
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
