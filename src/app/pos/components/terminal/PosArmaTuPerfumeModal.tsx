'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Check, Wand2, Plus, Minus, Sparkles, Tag, Droplets } from 'lucide-react';
import { ProductItem, CartItem } from '@/lib/store';
import { formatPerfumeDisplayName, getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { getProductImage } from '@/lib/perfumeImages';

export interface PosArmaTuPerfumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  cart: CartItem[];
  kitConfig: { basePrice: number; extraShotPrice: number };
  onAddKit: (payload: {
    essence: ProductItem;
    bottle: ProductItem;
    hasLabel: boolean;
    isPlus: boolean;
    quantity: number;
    unitPrice: number;
    maxStock: number;
  }) => void;
}

function parseKitComponentsFromCartItem(item: CartItem) {
  const rawId = String(item.product.id || '');
  const fullMatch = rawId.match(/^kit-(.+?)-(bote-[a-z0-9-]+|bottle-\d+)-(label|nolabel)-(plus|std)$/i);
  if (!fullMatch) return null;
  return {
    essenceId: fullMatch[1],
    bottleId: fullMatch[2],
    isPlus: fullMatch[4].toLowerCase() === 'plus',
  };
}

export const PosArmaTuPerfumeModal: React.FC<PosArmaTuPerfumeModalProps> = ({
  isOpen,
  onClose,
  products,
  cart,
  kitConfig,
  onAddKit,
}) => {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'Todos' | 'Caballero' | 'Dama' | 'Unisex'>('Todos');
  const [selectedEssenceId, setSelectedEssenceId] = useState<string>('');
  const [selectedBottleId, setSelectedBottleId] = useState<string>('');
  const [isPlus, setIsPlus] = useState(false);
  const [hasLabel, setHasLabel] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const essences = useMemo(() => {
    return products.filter(
      (p) =>
        p.category === 'Esencias para Perfume' ||
        p.category === 'Esencias & Fragancias' ||
        p.unit === 'Onza'
    );
  }, [products]);

  const bottles = useMemo(() => {
    return products.filter(
      (p) =>
        (p.category === 'Botes' ||
          p.category === 'Botes & Envases' ||
          p.category === 'Envases & Botes' ||
          p.name.toLowerCase().startsWith('bote') ||
          p.name.toLowerCase().includes('frasco')) &&
        p.imageUrl?.startsWith('/images/botes/')
    );
  }, [products]);

  const getEssenceAvailableInPos = (essence: ProductItem) => {
    let used1oz = 0;
    let usedHalfOz = 0;
    for (const item of cart) {
      if (item.product.id === essence.id) {
        if (item.presentation === 'MEDIA_ONZA') usedHalfOz += item.quantity;
        else used1oz += item.quantity;
      } else {
        const kit = parseKitComponentsFromCartItem(item);
        if (kit && kit.essenceId === essence.id) {
          used1oz += item.quantity;
          if (kit.isPlus) usedHalfOz += item.quantity;
        }
      }
    }
    return {
      available1oz: Math.max(0, (essence.stock || 0) - used1oz),
      availableHalfOz: Math.max(0, (essence.stockHalf || 0) - usedHalfOz),
    };
  };

  const getBottleAvailableInPos = (bottle: ProductItem) => {
    let used = 0;
    for (const item of cart) {
      if (item.product.id === bottle.id) {
        used += item.quantity;
      } else {
        const kit = parseKitComponentsFromCartItem(item);
        if (kit && kit.bottleId === bottle.id) {
          used += item.quantity;
        }
      }
    }
    return Math.max(0, (bottle.stock || 0) - used);
  };

  // Auto-seleccionar primer frasco disponible al abrir
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedBottleId && bottles.length > 0) {
      const firstAvail = bottles.find((b) => getBottleAvailableInPos(b) > 0) || bottles[0];
      if (firstAvail) setSelectedBottleId(firstAvail.id);
    }
  }, [isOpen, bottles, selectedBottleId]);

  const filteredEssences = useMemo(() => {
    const q = search.trim().toLowerCase();
    return essences
      .filter((e) => {
        if (genderFilter !== 'Todos') {
          const g = (e.gender || '').toLowerCase();
          if (genderFilter === 'Caballero' && !g.includes('caballero') && !g.includes('hombre')) return false;
          if (genderFilter === 'Dama' && !g.includes('dama') && !g.includes('mujer')) return false;
          if (genderFilter === 'Unisex' && !g.includes('unisex')) return false;
        }
        if (!q) return true;
        const text = `${e.sku || ''} ${e.name} ${e.officialName || ''} ${getInspiracionPerfumeName(e)}`.toLowerCase();
        return text.includes(q);
      })
      .sort((a, b) => {
        const aAvail = getEssenceAvailableInPos(a).available1oz > 0 ? 1 : 0;
        const bAvail = getEssenceAvailableInPos(b).available1oz > 0 ? 1 : 0;
        return bAvail - aAvail;
      });
  }, [essences, search, genderFilter, cart]);

  const selectedEssence = useMemo(
    () => essences.find((e) => e.id === selectedEssenceId) || null,
    [essences, selectedEssenceId]
  );

  const selectedBottle = useMemo(
    () => bottles.find((b) => b.id === selectedBottleId) || bottles[0] || null,
    [bottles, selectedBottleId]
  );

  const essenceStock = selectedEssence ? getEssenceAvailableInPos(selectedEssence) : { available1oz: 0, availableHalfOz: 0 };
  const bottleStock = selectedBottle ? getBottleAvailableInPos(selectedBottle) : 0;

  // Si la esencia no tiene ½ oz disponible, desactivar PLUS automáticamente
  useEffect(() => {
    if (isPlus && essenceStock.availableHalfOz <= 0) {
      setIsPlus(false);
    }
  }, [isPlus, essenceStock.availableHalfOz]);

  const maxKits = useMemo(() => {
    if (!selectedEssence || !selectedBottle) return 0;
    const limits = [essenceStock.available1oz, bottleStock];
    if (isPlus) limits.push(essenceStock.availableHalfOz);
    return Math.max(0, Math.min(...limits));
  }, [selectedEssence, selectedBottle, essenceStock, bottleStock, isPlus]);

  useEffect(() => {
    if (maxKits > 0 && quantity > maxKits) {
      setQuantity(maxKits);
    } else if (quantity < 1) {
      setQuantity(1);
    }
  }, [maxKits, quantity]);

  if (!isOpen) return null;

  const baseKitPrice =
    selectedEssence?.finishedPerfumePrice != null
      ? Number(selectedEssence.finishedPerfumePrice)
      : kitConfig.basePrice;
  const unitPrice = isPlus
    ? Number((baseKitPrice + kitConfig.extraShotPrice).toFixed(2))
    : baseKitPrice;
  const lineTotal = Number((unitPrice * quantity).toFixed(2));
  const canSubmit = Boolean(selectedEssence && selectedBottle && maxKits >= 1 && quantity >= 1);

  const handleConfirm = () => {
    if (!canSubmit || !selectedEssence || !selectedBottle) return;
    onAddKit({
      essence: selectedEssence,
      bottle: selectedBottle,
      hasLabel,
      isPlus,
      quantity,
      unitPrice,
      maxStock: maxKits,
    });
    setQuantity(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/55 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-950">
                Arma tu propio perfume (Caja POS)
              </h2>
              <p className="text-[11px] font-semibold text-slate-600">
                Selecciona esencia (1 oz), frasco 100ml y personalización para descontar inventario real.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body 2 columnas */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Izquierda: Selector de Esencia */}
          <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col gap-3 min-h-[320px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. Elige la Esencia (1 oz)
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                {filteredEssences.length} esencias
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, nombre o inspiración..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {(['Todos', 'Caballero', 'Dama', 'Unisex'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    genderFilter === g
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[340px] space-y-1.5 pr-1">
              {filteredEssences.map((ess) => {
                const avail = getEssenceAvailableInPos(ess);
                const disabled = avail.available1oz <= 0;
                const isSelected = selectedEssence?.id === ess.id;
                const kitBase = ess.finishedPerfumePrice != null ? Number(ess.finishedPerfumePrice) : kitConfig.basePrice;
                const displayName = formatPerfumeDisplayName(ess);
                const insp = getInspiracionPerfumeName(ess);

                return (
                  <button
                    key={ess.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedEssenceId(ess.id);
                      setQuantity(1);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-2 border-indigo-600 bg-indigo-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {ess.sku && (
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {ess.sku}
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-950 truncate">
                          {displayName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                        Inspirado en <strong className="text-slate-800">{insp}</strong>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-indigo-700 tabular-nums">
                        ${kitBase.toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-bold ${disabled ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {disabled ? 'Sin 1 oz' : `1 oz: ${avail.available1oz} · ½: ${avail.availableHalfOz}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Derecha: Frasco 100ml + Opciones + Resumen */}
          <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              {/* Frasco 100ml */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  2. Elige el Frasco de 100 ml
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[210px] overflow-y-auto pr-1">
                  {bottles.map((bottle) => {
                    const avail = getBottleAvailableInPos(bottle);
                    const disabled = avail <= 0;
                    const isSelected = selectedBottle?.id === bottle.id;
                    return (
                      <button
                        key={bottle.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedBottleId(bottle.id)}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-2 border-indigo-600 bg-indigo-50/70'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={getProductImage(bottle)}
                          alt={bottle.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-black text-slate-900 truncate">
                            {bottle.name.replace(/^Bote\s+100ml\s+/i, '')}
                          </div>
                          <div className={`text-[10px] font-bold ${disabled ? 'text-rose-600' : 'text-slate-600'}`}>
                            {disabled ? 'Agotado' : `Disp: ${avail}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Concentración y Etiqueta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-indigo-600" />
                    Concentración
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPlus(false)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        !isPlus
                          ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Estándar 1 oz
                    </button>
                    <button
                      type="button"
                      disabled={!selectedEssence || essenceStock.availableHalfOz <= 0}
                      onClick={() => setIsPlus(true)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                        isPlus
                          ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      PLUS +${kitConfig.extraShotPrice.toFixed(2)}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    Etiqueta del frasco
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHasLabel(true)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        hasLabel
                          ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Con etiqueta
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasLabel(false)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        !hasLabel
                          ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Sin etiqueta
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer resumen + cantidad + CTA */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              {selectedEssence && selectedBottle ? (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-black text-slate-950 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {formatPerfumeDisplayName(selectedEssence)} ({isPlus ? '1.5 oz PLUS' : '1 oz'})
                    </span>
                    <span className="text-indigo-700 tabular-nums shrink-0">
                      ${unitPrice.toFixed(2)} c/u
                    </span>
                  </div>
                  <div className="text-slate-700 font-semibold">
                    Frasco: {selectedBottle.name} • {hasLabel ? 'Con etiqueta' : 'Sin etiqueta'}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Selecciona una esencia de la izquierda para armar el perfume.</span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <div className="flex items-center rounded-xl border border-slate-300 bg-white px-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-10 flex items-center justify-center text-slate-800 disabled:opacity-30 cursor-pointer"
                    aria-label="Disminuir"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-slate-950 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxKits, quantity + 1))}
                    disabled={quantity >= maxKits}
                    className="w-8 h-10 flex items-center justify-center text-slate-800 disabled:opacity-30 cursor-pointer"
                    aria-label="Aumentar"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  <span>Agregar al Carrito • ${lineTotal.toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
