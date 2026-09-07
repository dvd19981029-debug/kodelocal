'use client';

import React, { useState } from 'react';
import { X, Check, Sparkles, AlertCircle } from 'lucide-react';
import { ProductItem } from '@/lib/store';

interface BottleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem;
  availableBottles: ProductItem[];
  onConfirm: (bottle: ProductItem) => void;
}

export default function BottleSelectionModal({
  isOpen,
  onClose,
  product,
  availableBottles,
  onConfirm,
}: BottleSelectionModalProps) {
  const [selectedBottleId, setSelectedBottleId] = useState<string>(
    availableBottles[0]?.id || ''
  );

  if (!isOpen) return null;

  const currentBottle = availableBottles.find((b) => b.id === selectedBottleId) || availableBottles[0];
  const perfumePrice = 15.00;
  const bottlePrice = currentBottle ? currentBottle.price : 0;
  const totalPrice = perfumePrice + bottlePrice;

  const handleConfirm = () => {
    if (!currentBottle) return;
    onConfirm(currentBottle);
  };

  const displayName = product.officialName?.trim() ? product.officialName : product.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="clay-card w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-4 sm:p-6 relative shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado con Perfume */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
          <div className="w-14 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200&q=80'}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <span className="clay-badge text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md inline-block mb-0.5">
              #{product.sku}
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
              {displayName}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Inspirado en {product.name} {product.brand ? `(${product.brand})` : ''}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-black text-indigo-700 font-mono">
                Perfume Preparado: $15.00
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de Requisito: Elegir Bote */}
        <div className="my-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-black text-amber-900">
              Debes elegir un bote para este perfume
            </strong>
            <p className="text-[11px] text-amber-800 font-medium mt-0.5">
              Has seleccionado <strong>Perfume Preparado ($15.00)</strong>. Selecciona a continuación el frasco de vidrio en el que se preparará tu fragancia. El costo del bote se sumará a tu pedido.
            </p>
          </div>
        </div>

        {/* Selección de Frascos Disponibles */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Botes y Frascos Disponibles:
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {availableBottles.map((bottle) => {
              const isSelected = (currentBottle?.id === bottle.id);
              return (
                <div
                  key={bottle.id}
                  onClick={() => setSelectedBottleId(bottle.id)}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-[2px_3px_10px_rgba(99,102,241,0.15)]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={bottle.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=100&q=80'}
                        alt={bottle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {bottle.name}
                      </h4>
                      <span className="text-[10.5px] text-slate-400 font-medium block">
                        {bottle.brand || 'Envase de Lujo con Atomizador'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs sm:text-sm font-black text-indigo-700 font-mono">
                      +${bottle.price.toFixed(2)}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen y Botón de Confirmación */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">Total Combinado:</span>
              <span className="text-[10px] text-slate-400">
                Perfume ($15.00) + Bote (${bottlePrice.toFixed(2)})
              </span>
            </div>
            <span className="text-base sm:text-lg font-black font-mono text-indigo-700">
              ${totalPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="clay-btn clay-btn-light flex-1 py-2.5 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="clay-btn clay-btn-primary flex-[2] py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 !shadow-[2px_4px_12px_rgba(99,102,241,0.35)] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agregar Perfume y Bote (${totalPrice.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
