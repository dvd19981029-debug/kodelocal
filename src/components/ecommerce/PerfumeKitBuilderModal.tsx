'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  PackageCheck,
  Droplets,
  Tag
} from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { MOCK_100ML_BOTTLES } from '@/lib/bottles';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { getOriginalPerfumeName } from '@/lib/perfumeNames';
import { getProductImage } from '@/lib/perfumeImages';

interface PerfumeKitBuilderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  availableEssences: ProductItem[];
  availableBottles?: ProductItem[];
  inline?: boolean;
}

export default function PerfumeKitBuilderModal({
  isOpen = true,
  onClose,
  availableEssences,
  availableBottles,
  inline = false,
}: PerfumeKitBuilderModalProps) {
  const { addKitToCart } = useEcommerceCart();

  // Wizard de 3 pasos claros (1: Esencia, 2: Frasco 100ml, 3: Personalizar)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Estados de configuración del perfume
  const [selectedEssence, setSelectedEssence] = useState<ProductItem | null>(null);
  
  // Usar los frascos de 100ml reales con fotos en fondo blanco del inventario
  const bottlesList = useMemo(() => {
    const realFromCatalog = (availableBottles || []).filter(b => 
      b.imageUrl && b.imageUrl.startsWith('/images/botes/')
    );
    if (realFromCatalog.length > 0) return realFromCatalog;
    return MOCK_100ML_BOTTLES;
  }, [availableBottles]);

  const [selectedBottle, setSelectedBottle] = useState<ProductItem | null>(null);
  const activeBottle: ProductItem = selectedBottle || bottlesList[0] || MOCK_100ML_BOTTLES[0];

  const [hasLabel, setHasLabel] = useState<boolean>(true);
  const [isPlus, setIsPlus] = useState<boolean>(false);
  const [justAdded, setJustAdded] = useState(false);

  // Filtros internos para búsqueda de esencia en el paso 1
  const [essenceSearch, setEssenceSearch] = useState('');
  const [essenceGenderFilter, setEssenceGenderFilter] = useState<'Todos' | 'Caballero' | 'Dama' | 'Unisex'>('Todos');

  // Filtrado de esencias en tiempo real (seguro con o sin stock inicial)
  const filteredEssences = useMemo(() => {
    const q = essenceSearch.toLowerCase().trim();
    const source = (availableEssences && availableEssences.length > 0) 
      ? availableEssences 
      : [];

    return source.filter((item) => {
      if (essenceGenderFilter !== 'Todos') {
        const g = (item.gender || '').toLowerCase();
        if (!g.includes(essenceGenderFilter.toLowerCase())) return false;
      }

      if (!q) return true;
      const name = (item.name || '').toLowerCase();
      const official = (item.officialName || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const sku = (item.sku || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();

      const normQ = q.replace(/acqua/g, 'aqua');
      const normName = name.replace(/acqua/g, 'aqua');
      const normDesc = desc.replace(/acqua/g, 'aqua');

      return name.includes(q) || normName.includes(normQ) || official.includes(q) || brand.includes(q) || sku.includes(q) || desc.includes(q) || normDesc.includes(normQ);
    });
  }, [availableEssences, essenceSearch, essenceGenderFilter]);

  // Bloquear el scroll de la página de fondo solo cuando esté en modo modal flotante
  useEffect(() => {
    if (inline || !isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, inline]);

  if (!inline && !isOpen) return null;

  const basePrice = 15.00;
  const plusCost = isPlus ? 3.00 : 0.00;
  const totalPrice = basePrice + plusCost;

  const handleConfirmKit = () => {
    if (!selectedEssence || !activeBottle) return;

    addKitToCart({
      essence: selectedEssence,
      bottle: activeBottle,
      hasLabel,
      isPlus,
      quantity: 1,
    });

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      if (onClose) onClose();
      setCurrentStep(1);
    }, 1100);
  };

  const handleClose = () => {
    if (onClose) onClose();
    setCurrentStep(1);
  };

  const builderCard = (
    <div 
      className={`clay-card w-full ${
        inline 
          ? 'max-w-5xl mx-auto rounded-3xl shadow-xl border-2 border-amber-300/80 my-2' 
          : 'max-w-4xl max-h-[94vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-white/90 overscroll-contain'
      } bg-white relative flex flex-col overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ================= CABECERA COMPACTA ================= */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50/80 via-purple-50/70 to-indigo-50/80 flex items-center justify-between relative shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 flex items-center gap-1.5 leading-tight">
              <span>Arma tu propio perfume</span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">
              1 oz pura de tu contratipo favorito, frasco de 100ml y alcohol con fijador
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-300/80 text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs shrink-0 ml-1">
            ${totalPrice.toFixed(2)}
          </span>
        </div>

        {onClose && (
          <button
            onClick={handleClose}
            className={`rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-all cursor-pointer ${
              inline 
                ? 'flex items-center gap-1.5 py-1 px-2.5 text-xs font-bold border border-slate-200/80 bg-white/70' 
                : 'p-1.5 text-slate-400'
            }`}
            title={inline ? 'Volver a Esencias' : 'Cerrar'}
          >
            {inline && <span className="hidden sm:inline text-[11px]">Volver a Esencias</span>}
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

        {/* ================= STEPPER DE PROGRESO COMPACTO ================= */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/90 text-center select-none text-[11px] sm:text-xs font-extrabold shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-2 px-2 transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              currentStep === 1
                ? 'border-indigo-600 text-indigo-700 bg-white font-black'
                : selectedEssence
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 1
                ? 'bg-indigo-600 text-white'
                : selectedEssence
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {selectedEssence ? '✓' : '1'}
            </span>
            <span className="truncate">1. Esencia</span>
          </button>

          <button
            type="button"
            onClick={() => selectedEssence && setCurrentStep(2)}
            disabled={!selectedEssence}
            className={`py-2 px-2 transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              currentStep === 2
                ? 'border-indigo-600 text-indigo-700 bg-white font-black'
                : activeBottle
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 2
                ? 'bg-indigo-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              2
            </span>
            <span className="truncate">2. Frasco 100ml</span>
          </button>

          <button
            type="button"
            onClick={() => selectedEssence && activeBottle && setCurrentStep(3)}
            disabled={!selectedEssence || !activeBottle}
            className={`py-2 px-2 transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              currentStep === 3
                ? 'border-indigo-600 text-indigo-700 bg-white font-black'
                : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 3
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className="truncate">3. Personalizar</span>
          </button>
        </div>

        {/* ================= CUERPO CENTRAL DEL WIZARD (ESPACIO OPTIMIZADO) ================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          
          {/* -------------------- PASO 1: TU ESENCIA -------------------- */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in duration-200 h-full flex flex-col">
              
              {/* Barra superior de búsqueda y filtros en una sola fila compacta */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar fragancia: Nombre del perfume..."
                    value={essenceSearch}
                    onChange={(e) => setEssenceSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-2xs"
                  />
                  {essenceSearch && (
                    <button
                      onClick={() => setEssenceSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
                  {(['Todos', 'Caballero', 'Dama', 'Unisex'] as const).map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setEssenceGenderFilter(gender)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-black transition-all cursor-pointer ${
                        essenceGenderFilter === gender
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {gender === 'Caballero' ? 'Hombre' : gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Área Amplia y Optimizada de Selección de Esencias */}
              <div className={`flex-1 ${inline ? 'min-h-[380px] max-h-[580px]' : 'min-h-[320px] max-h-[50vh] sm:max-h-[54vh]'} overflow-y-auto pr-1 p-1 bg-slate-50/50 rounded-2xl border border-slate-200/80`}>
                {filteredEssences.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-12 text-center text-xs text-slate-400 font-medium">
                    No se encontraron esencias disponibles con ese criterio.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                    {filteredEssences.map((essence) => {
                      const isChosen = selectedEssence?.id === essence.id;
                      const name = essence.officialName?.trim() || essence.name;

                      // Regla de inventario: protección de stock basada en minStock
                      const totalStock = typeof essence.stock === 'number' ? essence.stock : 0;
                      const available1oz = Math.floor(totalStock * 0.8);
                      const minStockThreshold = typeof essence.minStock === 'number' && essence.minStock > 0
                        ? essence.minStock
                        : 15;
                      const isBelowMinAlert = available1oz > 0 && available1oz <= minStockThreshold;
                      const isOutOfStock = available1oz <= 0;

                      return (
                        <div
                          key={essence.id}
                          onClick={() => !isOutOfStock && setSelectedEssence(essence)}
                          className={`p-2 sm:p-2.5 rounded-xl transition-all border select-none flex flex-col justify-between ${
                            isOutOfStock
                              ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
                              : isChosen
                              ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-400/50 shadow-sm scale-[1.01] cursor-pointer'
                              : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="flex items-start gap-2 mb-1">
                              {/* Miniatura de la esencia */}
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-slate-50 border border-slate-200/80 shrink-0 flex items-center justify-center">
                                <img
                                  src={getProductImage(essence)}
                                  alt={name}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/essence_bottle_blank.webp';
                                  }}
                                  className="w-full h-full object-cover object-center"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold mb-0.5">
                                  {essence.gender && (
                                    <span className="uppercase text-slate-600 font-black">
                                      {essence.gender.slice(0, 3)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-black text-slate-900 leading-snug line-clamp-2">
                                  {name}
                                </p>
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5" title={`Inspirado en ${getOriginalPerfumeName(essence)}`}>
                              <span className="text-slate-400">Inspirado en: </span>
                              <strong className="text-slate-800 font-semibold">
                                {getOriginalPerfumeName(essence)}
                              </strong>
                            </p>
                          </div>

                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px]">
                            <span className={`tracking-tight ${
                              isOutOfStock
                                ? 'text-slate-400 font-normal'
                                : isBelowMinAlert
                                ? 'text-amber-700 font-black'
                                : 'text-emerald-700 font-bold'
                            }`}>
                              {isOutOfStock
                                ? 'Sin existencias'
                                : isBelowMinAlert
                                ? available1oz === 1 ? '¡Solo queda 1 onza!' : `¡Solo quedan ${available1oz} onzas!`
                                : 'Disponible'}
                            </span>
                            {isChosen && (
                              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Indicador de esencia seleccionada */}
              {selectedEssence && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Droplets className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider block">Esencia elegida:</span>
                      <strong className="text-xs sm:text-sm font-black text-emerald-900 truncate block">
                        {selectedEssence.officialName || selectedEssence.name}
                      </strong>
                      <span className="text-[10px] text-emerald-800 font-medium truncate block">
                        Inspirado en: {getOriginalPerfumeName(selectedEssence)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="clay-btn clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Continuar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* -------------------- PASO 2: TU FRASCO (TODOS DE 100 ML) -------------------- */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-200 h-full flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <h3 className="text-xs sm:text-sm font-black text-slate-800">
                  Elige tu modelo favorito (Todos de 100ml con atomizador de lujo incluidos):
                </h3>
                <span className="text-[11px] font-black text-indigo-600">
                  {bottlesList.length} modelos
                </span>
              </div>

              {/* Área Amplia y Despejada de Frascos */}
              <div className={`flex-1 ${inline ? 'min-h-[380px] max-h-[580px]' : 'min-h-[320px] max-h-[50vh] sm:max-h-[54vh]'} overflow-y-auto pr-1 p-1`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                  {bottlesList.map((bottle) => {
                    const isChosen = activeBottle.id === bottle.id;
                    const bStock = typeof bottle.stock === 'number' ? bottle.stock : 50;
                    const bMinStockThreshold = typeof bottle.minStock === 'number' && bottle.minStock > 0
                      ? bottle.minStock
                      : 15;
                    const isBottleBelowMin = bStock > 0 && bStock <= bMinStockThreshold;
                    const isBottleOutOfStock = bStock <= 0;

                    return (
                      <div
                        key={bottle.id}
                        onClick={() => !isBottleOutOfStock && setSelectedBottle(bottle)}
                        className={`p-2.5 rounded-2xl transition-all border select-none relative flex flex-col items-center text-center ${
                          isBottleOutOfStock
                            ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
                            : isChosen
                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-400/50 shadow-md scale-[1.02] cursor-pointer'
                            : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs cursor-pointer'
                        }`}
                      >
                        <div className="w-full aspect-square max-h-28 rounded-xl overflow-hidden bg-white mb-2 flex items-center justify-center border border-slate-100">
                          <img
                            src={bottle.imageUrl || '/images/botes/bote_100ml_sauvage_degrade_negro.jpg'}
                            alt={bottle.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = '/images/botes/bote_100ml_sauvage_degrade_negro.jpg';
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <p className="text-[10.5px] font-black text-slate-900 leading-tight line-clamp-2">
                          {bottle.name}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1 flex-wrap justify-center">
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                            100 ml
                          </span>
                          <span className={`text-[8.5px] px-1 rounded ${
                            isBottleOutOfStock
                              ? 'text-slate-400 font-normal bg-slate-100'
                              : isBottleBelowMin
                              ? 'text-amber-800 font-black bg-amber-50 border border-amber-200/80'
                              : 'text-emerald-700 font-bold bg-emerald-50'
                          }`}>
                            {isBottleOutOfStock
                              ? 'Sin existencias'
                              : isBottleBelowMin
                              ? bStock === 1 ? '¡Solo queda 1!' : `¡Solo quedan ${bStock}!`
                              : 'Disponible'}
                          </span>
                        </div>

                        {isChosen && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Frasco elegido resumen */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-indigo-200 shrink-0">
                    <img
                      src={activeBottle.imageUrl || '/images/botes/bote_100ml_sauvage_degrade_negro.jpg'}
                      alt={activeBottle.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = '/images/botes/bote_100ml_sauvage_degrade_negro.jpg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-indigo-700 font-bold uppercase tracking-wider block">Frasco seleccionado:</span>
                    <strong className="text-xs sm:text-sm font-black text-indigo-900 truncate block">
                      {activeBottle.name} (100 ml)
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="clay-btn clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* -------------------- PASO 3: PERSONALIZACIÓN & VERSIÓN PLUS -------------------- */}
          {currentStep === 3 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              
              {/* 1. Selección de Etiqueta (Sin costo adicional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <span>¿Deseas etiqueta con el nombre de tu fragancia?</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Gratis</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setHasLabel(true)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      hasLabel
                        ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-400/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <strong className="block text-xs font-black text-slate-900">
                        Con Etiqueta
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">
                        Lleva el nombre de tu perfume impreso de forma nítida.
                      </span>
                    </div>
                    {hasLabel && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasLabel(false)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      !hasLabel
                        ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-400/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <strong className="block text-xs font-black text-slate-900">
                        Sin Etiqueta
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">
                        Frasco limpio y liso para acabado minimalista.
                      </span>
                    </div>
                    {!hasLabel && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                  </button>
                </div>
              </div>

              {/* 2. Casilla Versión PLUS (+½ Onza extra por +$3.00) */}
              <div 
                onClick={() => setIsPlus(!isPlus)}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-start gap-3 ${
                  isPlus
                    ? 'bg-gradient-to-r from-amber-50/95 via-purple-50/90 to-indigo-50/90 border-amber-400 shadow-md ring-2 ring-amber-300/60'
                    : 'bg-slate-50/90 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isPlus}
                    onChange={() => {}}
                    className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      Versión PLUS (+½ Onza extra de esencia pura)
                    </span>
                    <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      +$3.00
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                    Aumenta la concentración de tu perfume a <strong>1.5 Onzas de esencia pura</strong> (1 onza base + media onza adicional) para mayor intensidad y presencia.
                  </p>
                </div>
              </div>

              {/* 3. Tarjeta Resumen Final del Perfume */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-pink-50/80 border border-indigo-100 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  Resumen de tu preparación:
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Fragancia:</span>
                    <strong className="text-slate-900 font-black truncate block">
                      {selectedEssence ? (selectedEssence.officialName || selectedEssence.name) : 'No seleccionada'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Frasco:</span>
                    <strong className="text-slate-900 font-black truncate block">
                      {activeBottle.name} (100 ml)
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Concentración:</span>
                    <strong className={isPlus ? 'text-amber-800 font-black' : 'text-slate-700 font-bold'}>
                      {isPlus ? '1.5 Onzas (Versión PLUS)' : '1 Onza Estándar'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Etiqueta:</span>
                    <strong className="text-slate-700 font-bold">
                      {hasLabel ? 'Con etiqueta' : 'Sin etiqueta'}
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ================= BARRA INFERIOR DE NAVEGACIÓN Y COMPRA ================= */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Precio total en vivo */}
          <div>
            <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">
              Total a pagar:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                ${totalPrice.toFixed(2)}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {isPlus ? '(Incluye +½ oz PLUS)' : '(1 Onza Estándar)'}
              </span>
            </div>
          </div>

          {/* Botones de navegación según el paso */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Atrás</span>
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                disabled={currentStep === 1 && !selectedEssence}
                onClick={() => setCurrentStep((prev) => (prev + 1) as 2 | 3)}
                className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  currentStep === 1 && !selectedEssence
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'clay-btn-primary active:scale-95 cursor-pointer'
                }`}
              >
                <span>{currentStep === 1 ? 'Continuar a Frasco' : 'Continuar a Personalizar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!selectedEssence || justAdded}
                onClick={handleConfirmKit}
                className={`flex-1 sm:flex-initial px-6 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  !selectedEssence
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : justAdded
                    ? 'bg-emerald-600 text-white'
                    : 'clay-btn bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 !text-white active:scale-95 cursor-pointer shadow-[0_4px_18px_rgba(16,185,129,0.45)] hover:brightness-105'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Perfume Agregado!</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    <span>Agregar Perfume (${totalPrice.toFixed(2)})</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
  );

  if (inline) {
    return builderCard;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {builderCard}
    </div>
  );
}
