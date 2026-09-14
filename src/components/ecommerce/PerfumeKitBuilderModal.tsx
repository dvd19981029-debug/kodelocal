'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Search, 
  ChevronLeft,
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  PackageCheck,
  Droplets,
  Tag
} from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { MOCK_100ML_BOTTLES } from '@/lib/bottles';
import { useEcommerceCart, getEssenceDiscreteStock } from '@/context/EcommerceCartContext';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { getProductImage } from '@/lib/perfumeImages';

interface PerfumeKitBuilderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  availableEssences: ProductItem[];
  availableBottles?: ProductItem[];
  inline?: boolean;
  initialEssenceId?: string;
}

export default function PerfumeKitBuilderModal({
  isOpen = true,
  onClose,
  availableEssences,
  availableBottles,
  inline = false,
  initialEssenceId,
}: PerfumeKitBuilderModalProps) {
  const { addKitToCart, cart, kitConfig } = useEcommerceCart();

  // Wizard de 3 pasos claros (1: Esencia, 2: Frasco 100ml, 3: Personalizar)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Estados de configuración del perfume
  const [selectedEssence, setSelectedEssence] = useState<ProductItem | null>(null);

  // Preseleccionar la esencia si se recibe initialEssenceId con stock disponible
  useEffect(() => {
    if (initialEssenceId && availableEssences && availableEssences.length > 0) {
      const found = availableEssences.find(
        (e) => String(e.id) === String(initialEssenceId) || String(e.sku) === String(initialEssenceId)
      );
      if (found) {
        const stockInfo = getEssenceDiscreteStock(found.stock || 0, cart, found.id);
        if (stockInfo.available1oz > 0) {
          setSelectedEssence(found);
          setCurrentStep(2);
        }
      }
    }
  }, [initialEssenceId, availableEssences, cart]);

  // Mantener la sección visible y centrada en pantalla al avanzar de paso
  useEffect(() => {
    if (inline) {
      const el = document.getElementById('seccion-arma-tu-perfume');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentStep, inline]);
  
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
  const bottlesScrollRef = useRef<HTMLDivElement>(null);

  const scrollBottles = (direction: 'left' | 'right') => {
    if (bottlesScrollRef.current) {
      const scrollAmount = 260;
      bottlesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleSelectBottle = (bottle: ProductItem, e?: React.MouseEvent<HTMLDivElement>) => {
    setSelectedBottle(bottle);
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

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

  // Cálculo de disponibilidad de medias onzas para la versión PLUS (+½ oz extra)
  const selectedEssenceStock = useMemo(() => {
    if (!selectedEssence) return null;
    return getEssenceDiscreteStock(selectedEssence.stock || 0, cart, selectedEssence.id);
  }, [selectedEssence, cart]);

  const hasHalfOzAvailable = selectedEssenceStock ? selectedEssenceStock.availableHalfOz >= 1 : false;

  // Si no hay medias onzas disponibles en el contratipo elegido, bloquear y desactivar versión PLUS
  useEffect(() => {
    if (!hasHalfOzAvailable && isPlus) {
      setIsPlus(false);
    }
  }, [hasHalfOzAvailable, isPlus]);

  const basePrice = selectedEssence?.finishedPerfumePrice != null 
    ? Number(selectedEssence.finishedPerfumePrice) 
    : (kitConfig?.basePrice ?? 15.00);
  const extraShotPrice = kitConfig?.extraShotPrice ?? 3.00;
  const plusCost = (isPlus && hasHalfOzAvailable) ? extraShotPrice : 0.00;
  const totalPrice = basePrice + plusCost;

  const handleConfirmKit = () => {
    if (!selectedEssence || !activeBottle) return;

    addKitToCart({
      essence: selectedEssence,
      bottle: activeBottle,
      hasLabel,
      isPlus: isPlus && hasHalfOzAvailable,
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
          ? 'max-w-4xl mx-auto rounded-3xl shadow-xl border border-white/90 my-2 max-h-[86vh] sm:max-h-[calc(100dvh-130px)]' 
          : 'max-w-4xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-white/90 overscroll-contain'
      } bg-white relative flex flex-col overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ================= CABECERA COMPACTA CLAYMÓRFICA ================= */}
      <div className="px-4 sm:px-6 py-3 border-b border-purple-100/80 bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-slate-50/80 flex items-center justify-between relative shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-[2px_4px_10px_rgba(124,58,237,0.3)] shrink-0">
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
          <span className="bg-purple-100/80 text-purple-900 border border-purple-200/90 text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs shrink-0 ml-1">
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

      {/* ================= STEPPER DE PROGRESO CLAYMÓRFICO ================= */}
      <div className="px-3 sm:px-6 py-2 border-b border-slate-100 bg-[#f8fafc]">
        <div className="clay-tabs-track flex items-stretch gap-1 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`clay-tab-item py-1.5 sm:py-2 px-2 sm:px-3 text-[11px] sm:text-xs font-extrabold flex-1 transition-all cursor-pointer gap-1.5 ${
              currentStep === 1
                ? 'clay-tab-active'
                : selectedEssence
                ? 'text-purple-700 bg-purple-50/70 hover:bg-purple-50'
                : 'clay-tab-inactive'
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
              currentStep === 1
                ? 'bg-white text-purple-700'
                : selectedEssence
                ? 'bg-purple-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {selectedEssence && currentStep !== 1 ? '✓' : '1'}
            </span>
            <span className="truncate">1. Esencia</span>
          </button>

          <button
            type="button"
            onClick={() => selectedEssence && setCurrentStep(2)}
            disabled={!selectedEssence}
            className={`clay-tab-item py-1.5 sm:py-2 px-2 sm:px-3 text-[11px] sm:text-xs font-extrabold flex-1 transition-all gap-1.5 ${
              currentStep === 2
                ? 'clay-tab-active'
                : activeBottle && selectedEssence
                ? 'text-purple-700 bg-purple-50/70 hover:bg-purple-50 cursor-pointer'
                : 'clay-tab-inactive opacity-60 cursor-not-allowed'
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
              currentStep === 2
                ? 'bg-white text-purple-700'
                : activeBottle && selectedEssence
                ? 'bg-purple-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {activeBottle && selectedEssence && currentStep > 2 ? '✓' : '2'}
            </span>
            <span className="truncate">2. Frasco</span>
          </button>

          <button
            type="button"
            onClick={() => selectedEssence && activeBottle && setCurrentStep(3)}
            disabled={!selectedEssence || !activeBottle}
            className={`clay-tab-item py-1.5 sm:py-2 px-2 sm:px-3 text-[11px] sm:text-xs font-extrabold flex-1 transition-all gap-1.5 ${
              currentStep === 3
                ? 'clay-tab-active'
                : 'clay-tab-inactive opacity-60 cursor-not-allowed'
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
              currentStep === 3
                ? 'bg-white text-purple-700'
                : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className="truncate">3. Personalizar</span>
          </button>
        </div>
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
                    className="clay-input w-full pl-9 pr-8 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 bg-white"
                  />
                  {essenceSearch && (
                    <button
                      onClick={() => setEssenceSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                      className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black transition-all cursor-pointer ${
                        essenceGenderFilter === gender
                          ? 'clay-btn-primary shadow-xs'
                          : 'clay-btn-light text-slate-600'
                      }`}
                    >
                      {gender === 'Caballero' ? 'Hombre' : gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Área Deslizante Optimizada de Selección de Esencias */}
              <div className={`flex-1 ${inline ? 'min-h-[160px] max-h-[220px] sm:max-h-[250px]' : 'min-h-[160px] max-h-[34vh]'} overflow-y-auto pr-1 p-2 bg-[#f1f4f9]/60 rounded-2xl border border-slate-200/80`}>
                {filteredEssences.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-12 text-center text-xs text-slate-400 font-medium">
                    No se encontraron esencias disponibles con ese criterio.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                    {filteredEssences.map((essence) => {
                      const isChosen = selectedEssence?.id === essence.id;
                      const name = essence.officialName?.trim() || essence.name;

                      // Regla de inventario: protección de stock basada en minStock y carrito
                      const totalStock = typeof essence.stock === 'number' ? essence.stock : 0;
                      const discrete = getEssenceDiscreteStock(totalStock, cart, essence.id);
                      const available1oz = discrete.available1oz;
                      const minStockThreshold = typeof essence.minStock === 'number' && essence.minStock > 0
                        ? essence.minStock
                        : 15;
                      const isBelowMinAlert = available1oz > 0 && available1oz <= minStockThreshold;
                      const isOutOfStock = available1oz <= 0;

                      return (
                        <div
                          key={essence.id}
                          onClick={() => !isOutOfStock && setSelectedEssence(essence)}
                          className={`p-2.5 rounded-2xl transition-all border select-none flex flex-col justify-between relative group ${
                            isOutOfStock
                              ? 'opacity-55 cursor-not-allowed bg-slate-100 border-slate-200'
                              : isChosen
                              ? 'clay-card bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/50 shadow-md scale-[1.02] cursor-pointer'
                              : 'clay-card bg-white hover:bg-slate-50 border-white/90 hover:scale-[1.01] cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="flex items-start gap-2.5 mb-1.5">
                              {/* Miniatura destacada de la esencia con estilo clay */}
                              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs shrink-0 flex items-center justify-center p-0.5">
                                <img
                                  src={getProductImage(essence)}
                                  alt={name}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/essence_bottle_blank.webp';
                                  }}
                                  className="w-full h-full object-cover object-center rounded-lg"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-bold mb-0.5">
                                  {essence.gender && (
                                    <span className="uppercase text-purple-700 bg-purple-100/70 px-1 py-0.2 rounded font-black text-[8px]">
                                      {essence.gender === 'Caballero' ? 'Hombre' : essence.gender}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
                                  {name}
                                </p>
                              </div>
                            </div>
                            <p className="text-[9.5px] text-slate-500 font-medium truncate mt-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100" title={`Inspirado en ${getInspiracionPerfumeName(essence)}`}>
                              <span className="text-slate-400">Inspirado en: </span>
                              <strong className="text-purple-900 font-bold">
                                {getInspiracionPerfumeName(essence)}
                              </strong>
                            </p>
                          </div>

                          <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9.5px]">
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
                                ? available1oz === 1 ? '¡Solo 1 onza!' : `¡Solo ${available1oz} oz!`
                                : 'Disponible'}
                            </span>
                            {isChosen && (
                              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
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

              {/* Indicador de esencia seleccionada con diseño Clay */}
              {selectedEssence && (
                <div className="p-2.5 sm:p-3 rounded-2xl clay-card bg-purple-50/80 border border-purple-200/80 text-purple-950 flex items-center justify-between shrink-0 shadow-xs max-w-2xl mx-auto w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-purple-200 shadow-2xs shrink-0 flex items-center justify-center p-0.5">
                      <img
                        src={getProductImage(selectedEssence)}
                        alt={selectedEssence.officialName || selectedEssence.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] text-purple-700 font-bold uppercase tracking-wider block">Esencia elegida:</span>
                      <strong className="text-xs sm:text-sm font-black text-purple-950 truncate block">
                        {selectedEssence.officialName || selectedEssence.name}
                      </strong>
                      <span className="text-[10px] text-purple-800 font-medium truncate block">
                        Inspirado en: {getInspiracionPerfumeName(selectedEssence)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="clay-btn clay-btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  >
                    <span>Continuar a Frasco</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* -------------------- PASO 2: TU FRASCO (TODOS DE 100 ML) -------------------- */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-200 h-full flex flex-col justify-between">
              
              {/* Encabezado centrado */}
              <div className="text-center space-y-1 shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-900 text-xs font-black shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Elige tu Frasco de 100ml</span>
                  <span className="bg-purple-200/80 text-purple-900 px-2 py-0.2 rounded-full text-[10.5px]">
                    {bottlesList.length} modelos
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Desplaza horizontalmente para explorar y elegir tu modelo de frasco
                </p>
              </div>

              {/* Área de desplazamiento horizontal para frascos con botones de flecha */}
              <div className="relative group/carousel my-auto py-1 px-1 max-w-3xl mx-auto w-full">
                {/* Botón flecha izquierda */}
                <button
                  type="button"
                  onClick={() => scrollBottles('left')}
                  aria-label="Ver frascos anteriores"
                  className="absolute -left-1 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 text-slate-700 hover:text-purple-700 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 hover:bg-purple-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Pista de Frascos con desplazamiento horizontal */}
                <div
                  ref={bottlesScrollRef}
                  className="flex gap-3 sm:gap-4 overflow-x-auto py-3 px-8 sm:px-10 snap-x snap-mandatory scroll-smooth no-scrollbar"
                >
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
                        onClick={(e) => !isBottleOutOfStock && handleSelectBottle(bottle, e)}
                        className={`w-38 sm:w-44 shrink-0 snap-center p-3 rounded-2xl transition-all border select-none relative flex flex-col items-center text-center cursor-pointer ${
                          isBottleOutOfStock
                            ? 'opacity-55 cursor-not-allowed bg-slate-100 border-slate-200'
                            : isChosen
                            ? 'clay-card bg-purple-50/90 border-purple-500 ring-2 ring-purple-400/60 shadow-lg scale-[1.03] -translate-y-0.5'
                            : 'clay-card bg-white hover:bg-slate-50 border-white/90 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-white mb-2 flex items-center justify-center border border-slate-100 shadow-2xs p-1">
                          <img
                            src={bottle.imageUrl || '/images/botes/bote_100ml_sauvage_degrade_negro.jpg'}
                            alt={bottle.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = '/images/botes/bote_100ml_sauvage_degrade_negro.jpg';
                            }}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>

                        <p className="text-xs font-black text-slate-900 leading-tight line-clamp-2 min-h-[2rem]">
                          {bottle.name}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1 flex-wrap justify-center">
                          <span className="text-[9px] font-black text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded">
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
                              ? bStock === 1 ? '¡Solo 1!' : `¡Solo ${bStock}!`
                              : 'Disponible'}
                          </span>
                        </div>

                        {isChosen && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botón flecha derecha */}
                <button
                  type="button"
                  onClick={() => scrollBottles('right')}
                  aria-label="Ver más frascos"
                  className="absolute -right-1 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 text-slate-700 hover:text-purple-700 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 hover:bg-purple-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Frasco elegido resumen */}
              <div className="p-3 rounded-2xl clay-card bg-purple-50/70 border border-purple-200/80 text-purple-950 flex items-center justify-between shrink-0 shadow-xs max-w-xl mx-auto w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-purple-200 shadow-2xs shrink-0 p-0.5">
                    <img
                      src={activeBottle.imageUrl || '/images/botes/bote_100ml_sauvage_degrade_negro.jpg'}
                      alt={activeBottle.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = '/images/botes/bote_100ml_sauvage_degrade_negro.jpg';
                      }}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] text-purple-700 font-bold uppercase tracking-wider block">Frasco seleccionado:</span>
                    <strong className="text-xs sm:text-sm font-black text-purple-950 truncate block">
                      {activeBottle.name} (100 ml)
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="clay-btn clay-btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* -------------------- PASO 3: PERSONALIZACIÓN & VERSIÓN PLUS -------------------- */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-200 max-w-2xl mx-auto w-full">
              
              {/* 1. Selección de Etiqueta (Sin costo adicional) */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>¿Deseas etiqueta con el nombre de tu fragancia?</span>
                  <span className="text-[10px] text-purple-800 font-black bg-purple-100/70 border border-purple-200 px-2 py-0.2 rounded-full">Gratis</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHasLabel(true)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      hasLabel
                        ? 'clay-card bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/40 shadow-xs'
                        : 'clay-card bg-white border-white/90 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <strong className="block text-xs font-black text-slate-900">
                        Con Etiqueta
                      </strong>
                      <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium leading-tight block">
                        Nombre de tu perfume impreso.
                      </span>
                    </div>
                    {hasLabel && (
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0 ml-1">
                        ✓
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasLabel(false)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      !hasLabel
                        ? 'clay-card bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/40 shadow-xs'
                        : 'clay-card bg-white border-white/90 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <strong className="block text-xs font-black text-slate-900">
                        Sin Etiqueta
                      </strong>
                      <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium leading-tight block">
                        Frasco liso y minimalista.
                      </span>
                    </div>
                    {!hasLabel && (
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0 ml-1">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Casilla Versión PLUS (+½ Onza extra por +$3.00) */}
              <div 
                onClick={() => {
                  if (!hasHalfOzAvailable) return;
                  setIsPlus(!isPlus);
                }}
                className={`p-2.5 sm:p-3 rounded-2xl transition-all select-none flex items-start gap-2.5 ${
                  !hasHalfOzAvailable
                    ? 'bg-slate-100 border border-slate-200 opacity-60 cursor-not-allowed'
                    : isPlus
                    ? 'clay-card bg-purple-50/85 border-purple-500 shadow-md ring-2 ring-purple-400/60 cursor-pointer'
                    : 'clay-card bg-white border-white/90 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isPlus && hasHalfOzAvailable}
                    disabled={!hasHalfOzAvailable}
                    onChange={() => {}}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-md text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      Versión PLUS (+½ Onza extra de esencia)
                    </span>
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9.5px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      +${extraShotPrice.toFixed(2)}
                    </span>
                    {!hasHalfOzAvailable && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                        Sin stock ½ oz
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium mt-0.5 leading-snug">
                    {!hasHalfOzAvailable ? (
                      <span className="text-rose-600 font-bold block">
                        No hay disponibilidad de medias onzas para versión PLUS.
                      </span>
                    ) : (
                      <>
                        Aumenta a <strong>1.5 Onzas de esencia pura</strong> para mayor fijación y concentración.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* 3. Tarjeta Resumen Final del Perfume con Estilo Clay */}
              <div className="p-2.5 sm:p-3 rounded-2xl clay-card bg-white/90 border border-purple-100 shadow-xs space-y-1.5">
                <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block">
                  Resumen de tu preparación:
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Fragancia:</span>
                    <strong className="text-slate-900 font-black truncate block text-[11px] sm:text-xs">
                      {selectedEssence ? (selectedEssence.officialName || selectedEssence.name) : 'No seleccionada'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Frasco:</span>
                    <strong className="text-slate-900 font-black truncate block text-[11px] sm:text-xs">
                      {activeBottle.name} (100 ml)
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Concentración:</span>
                    <strong className={`truncate block text-[11px] sm:text-xs ${(isPlus && hasHalfOzAvailable) ? 'text-purple-700 font-black' : 'text-slate-700 font-bold'}`}>
                      {(isPlus && hasHalfOzAvailable) ? '1.5 Oz (PLUS)' : '1 Oz Estándar'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">Etiqueta:</span>
                    <strong className="text-slate-700 font-bold block text-[11px] sm:text-xs">
                      {hasLabel ? 'Con etiqueta' : 'Sin etiqueta'}
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ================= BARRA INFERIOR DE NAVEGACIÓN Y COMPRA ================= */}
        <div className="p-2.5 sm:p-3.5 border-t border-purple-100/80 bg-[#f8fafc]/95 backdrop-blur-md sticky bottom-0 z-20 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto w-full">
            
            {/* Precio total en vivo */}
            <div className="min-w-0 shrink-0">
              <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider leading-none mb-0.5">
                Total:
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-purple-950 leading-none">
                  ${totalPrice.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 hidden md:inline truncate">
                  {(isPlus && hasHalfOzAvailable) ? '(+½ oz PLUS)' : '(1 Oz)'}
                </span>
              </div>
            </div>

            {/* Botones de navegación según el paso */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                  className="clay-btn clay-btn-light px-2.5 sm:px-3.5 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  title="Paso anterior"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Atrás</span>
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  disabled={currentStep === 1 && !selectedEssence}
                  onClick={() => setCurrentStep((prev) => (prev + 1) as 2 | 3)}
                  className={`px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 ${
                    currentStep === 1 && !selectedEssence
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'clay-btn-primary active:scale-95 cursor-pointer hover:brightness-105'
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
                  className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md min-w-0 ${
                    !selectedEssence
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : justAdded
                      ? 'clay-btn-success text-white'
                      : 'clay-btn-primary active:scale-95 cursor-pointer hover:brightness-105'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="truncate">¡Agregado!</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        <span className="sm:hidden">Agregar Perfume</span>
                        <span className="hidden sm:inline">Agregar Perfume (${totalPrice.toFixed(2)})</span>
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

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
