'use client';

import React, { useState, useMemo } from 'react';
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
  Wand2
} from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { MOCK_100ML_BOTTLES } from '@/lib/bottles';
import { useEcommerceCart } from '@/context/EcommerceCartContext';

interface PerfumeKitBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableEssences: ProductItem[];
  availableBottles?: ProductItem[];
}

export default function PerfumeKitBuilderModal({
  isOpen,
  onClose,
  availableEssences,
  availableBottles,
}: PerfumeKitBuilderModalProps) {
  const { addKitToCart } = useEcommerceCart();

  // Wizard de 3 pasos claros y despejados (1: Esencia, 2: Frasco 100ml, 3: Personalizar)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Estados de configuración del perfume
  const [selectedEssence, setSelectedEssence] = useState<ProductItem | null>(null);
  
  // Usar los frascos de 100ml variados
  const bottlesList = useMemo(() => {
    // Si se pasaron botes de 100ml desde la base, combinarlos con los variados para dar máxima variedad
    const existing100ml = (availableBottles || []).filter(b => b.name.toLowerCase().includes('100'));
    const combined = [...MOCK_100ML_BOTTLES];
    existing100ml.forEach(eb => {
      if (!combined.some(b => b.id === eb.id)) {
        combined.unshift(eb);
      }
    });
    // Ordenar según existencia en stock descendente
    return combined.sort((a, b) => (b.stock || 0) - (a.stock || 0));
  }, [availableBottles]);

  const [selectedBottle, setSelectedBottle] = useState<ProductItem>(bottlesList[0]);
  const [hasLabel, setHasLabel] = useState<boolean>(true);
  const [isPlus, setIsPlus] = useState<boolean>(false); // +$3.00 por media onza adicional
  const [justAdded, setJustAdded] = useState(false);

  // Filtros internos para búsqueda de esencia en el paso 1
  const [essenceSearch, setEssenceSearch] = useState('');
  const [essenceGenderFilter, setEssenceGenderFilter] = useState<'Todos' | 'Caballero' | 'Dama' | 'Unisex'>('Todos');

  // Filtrado de esencias en tiempo real
  const filteredEssences = useMemo(() => {
    const q = essenceSearch.toLowerCase().trim();
    return availableEssences.filter((item) => {
      if (!item.stock || item.stock < (isPlus ? 1.5 : 1.0)) return false;

      if (essenceGenderFilter !== 'Todos') {
        const g = (item.gender || '').toLowerCase();
        if (!g.includes(essenceGenderFilter.toLowerCase())) return false;
      }

      if (!q) return true;
      const name = (item.name || '').toLowerCase();
      const official = (item.officialName || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const sku = (item.sku || '').toLowerCase();

      return name.includes(q) || official.includes(q) || brand.includes(q) || sku.includes(q);
    });
  }, [availableEssences, essenceSearch, essenceGenderFilter, isPlus]);

  if (!isOpen) return null;

  // Precio fijo base $15.00, o $18.00 si lleva PLUS
  const basePrice = 15.00;
  const plusCost = isPlus ? 3.00 : 0.00;
  const totalPrice = basePrice + plusCost;

  const handleConfirmKit = () => {
    if (!selectedEssence || !selectedBottle) return;

    addKitToCart({
      essence: selectedEssence,
      bottle: selectedBottle,
      hasLabel,
      isPlus,
      quantity: 1,
    });

    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
      setCurrentStep(1);
    }, 1100);
  };

  const handleClose = () => {
    onClose();
    setCurrentStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="clay-card w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl relative shadow-2xl flex flex-col border border-white/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= CABECERA DEL MODAL ================= */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/90 via-purple-50/80 to-indigo-50/90 flex items-center justify-between relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="clay-badge text-[9.5px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/70 border border-amber-300 px-2 py-0.5 rounded-md shadow-2xs">
                ✨ Servicio Especial
              </span>
              <span className="text-xs font-black text-indigo-700 font-mono">
                $15.00 Precio Fijo
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span>Arma tu propio perfume</span>
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= STEPPER DE PROGRESO DESPEJADO (3 PASOS) ================= */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/90 text-center select-none text-[11px] sm:text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-2.5 px-2 transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
              currentStep === 1
                ? 'border-indigo-600 text-indigo-700 bg-white font-black'
                : selectedEssence
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
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
            className={`py-2.5 px-2 transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              currentStep === 2
                ? 'border-indigo-600 text-indigo-700 bg-white font-black'
                : selectedBottle
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
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
            onClick={() => selectedEssence && selectedBottle && setCurrentStep(3)}
            disabled={!selectedEssence || !selectedBottle}
            className={`py-2.5 px-2 transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              currentStep === 3
                ? 'border-indigo-600 text-indigo-700 bg-white font-black'
                : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === 3
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className="truncate">3. Personalizar</span>
          </button>
        </div>

        {/* ================= CUERPO CENTRAL DEL WIZARD (UNO A LA VEZ) ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* -------------------- PASO 1: TU ESENCIA -------------------- */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Paso 1: Elige la esencia de tu perfume</span>
                  <span className="text-xs text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md">
                    1 Onza Pura Incluida
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Busca entre nuestros más de 600 contratipos de lujo la fragancia que deseas preparar.
                </p>
              </div>

              {/* Buscador y Filtros */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o inspiración: Sauvage, 212, Baccarat, One Million..."
                    value={essenceSearch}
                    onChange={(e) => setEssenceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-2xs"
                  />
                  {essenceSearch && (
                    <button
                      onClick={() => setEssenceSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {(['Todos', 'Caballero', 'Dama', 'Unisex'] as const).map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setEssenceGenderFilter(gender)}
                      className={`px-3 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                        essenceGenderFilter === gender
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista Contenida de Esencias */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 p-1 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                {filteredEssences.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-xs text-slate-400 font-medium">
                    No se encontraron esencias con existencias disponibles.
                  </div>
                ) : (
                  filteredEssences.map((essence) => {
                    const isChosen = selectedEssence?.id === essence.id;
                    const name = essence.officialName || essence.name;

                    return (
                      <div
                        key={essence.id}
                        onClick={() => setSelectedEssence(essence)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all border select-none flex flex-col justify-between ${
                          isChosen
                            ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-400/50 shadow-xs scale-[1.01]'
                            : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold mb-1">
                            <span>#{essence.sku}</span>
                            {essence.gender && (
                              <span className="uppercase text-slate-600 font-black">
                                {essence.gender.slice(0, 3)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-black text-slate-900 leading-snug line-clamp-2">
                            {name}
                          </p>
                          {essence.officialName && (
                            <p className="text-[9.5px] text-slate-400 truncate mt-0.5">
                              {essence.name}
                            </p>
                          )}
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px]">
                          <span className="text-emerald-700 font-bold">
                            Disp: {Math.floor(essence.stock)} oz
                          </span>
                          {isChosen && (
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Indicador de esencia seleccionada */}
              {selectedEssence && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💧</span>
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Esencia elegida:</span>
                      <strong className="text-xs sm:text-sm font-black text-emerald-900">
                        {selectedEssence.officialName || selectedEssence.name}
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="clay-btn clay-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <span>Paso 2</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* -------------------- PASO 2: TU FRASCO (TODOS DE 100 ML EN CONTENEDOR APARTE) -------------------- */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Paso 2: Elige tu Frasco de 100ml</span>
                  <span className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md">
                    ¡Todos Incluidos en los $15!
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Todos nuestros envases son de <strong>100 ml</strong> con atomizador de lujo y sellado hermético. Elige el estilo que más te guste:
                </p>
              </div>

              {/* Contenedor Aparte para los Botes según Stock (No disperso en la pantalla) */}
              <div className="p-3 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                  <span>Modelos de 100ml disponibles en bodega:</span>
                  <span className="text-indigo-600 font-extrabold">{bottlesList.length} opciones</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {bottlesList.map((bottle) => {
                    const isChosen = selectedBottle.id === bottle.id;

                    return (
                      <div
                        key={bottle.id}
                        onClick={() => setSelectedBottle(bottle)}
                        className={`p-2.5 rounded-2xl cursor-pointer transition-all border select-none relative flex flex-col items-center text-center ${
                          isChosen
                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-400/50 shadow-md scale-[1.02]'
                            : 'bg-white/80 hover:bg-white border-slate-200/80 shadow-2xs'
                        }`}
                      >
                        <div className="w-14 h-16 rounded-xl overflow-hidden bg-slate-100 mb-1.5 flex items-center justify-center border border-slate-100">
                          <img
                            src={bottle.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&q=80'}
                            alt={bottle.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <p className="text-[10px] font-black text-slate-900 leading-tight line-clamp-2">
                          {bottle.name}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1 flex-wrap justify-center">
                          <span className="text-[8.5px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                            100 ml
                          </span>
                          <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            {bottle.stock} disp.
                          </span>
                        </div>

                        {isChosen && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Frasco elegido resumen */}
              <div className="p-3 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧴</span>
                  <div>
                    <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">Frasco seleccionado:</span>
                    <strong className="text-xs sm:text-sm font-black text-indigo-900">
                      {selectedBottle.name} (100 ml)
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="clay-btn clay-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <span>Paso 3</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* -------------------- PASO 3: PERSONALIZACIÓN & VERSIÓN PLUS -------------------- */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Paso 3: Personalización & Concentración</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configura los detalles finales para que laboratorio prepare tu fragancia exactamente como te gusta.
                </p>
              </div>

              {/* 1. Selección de Etiqueta (Sin costo adicional) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <span>🏷️ ¿Deseas etiqueta con el nombre de tu fragancia?</span>
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
                        🏷️ Con Etiqueta
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">
                        Lleva la etiqueta elegante de Aromaniak con el nombre de tu perfume.
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
                        ✨ Sin Etiqueta
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">
                        Frasco limpio y liso para regalo minimalista o discreto.
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
                      💎 Versión PLUS (+½ Onza extra de esencia pura concentrada)
                    </span>
                    <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      +$3.00
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                    Sube la concentración total de tu perfume a <strong>1.5 Onzas de esencia pura</strong> (1 onza base + media onza adicional) para una proyección y fijación extrema de 12 a 16 horas.
                  </p>
                </div>
              </div>

              {/* 3. Tarjeta Resumen Final del Perfume */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/80 to-pink-50/80 border border-indigo-100 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  Resumen de tu preparación:
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Fragancia:</span>
                    <strong className="text-slate-900 font-black truncate block">
                      {selectedEssence ? (selectedEssence.officialName || selectedEssence.name) : 'No seleccionada'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Frasco:</span>
                    <strong className="text-slate-900 font-black truncate block">
                      {selectedBottle.name} (100 ml)
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Concentración:</span>
                    <strong className={isPlus ? 'text-amber-800 font-black' : 'text-slate-700 font-bold'}>
                      {isPlus ? '🔥 1.5 Onzas (Versión PLUS)' : '1 Onza Estándar'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Etiqueta:</span>
                    <strong className="text-slate-700 font-bold">
                      {hasLabel ? 'Con etiqueta Aromaniak' : 'Sin etiqueta'}
                    </strong>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ================= BARRA INFERIOR DE NAVEGACIÓN Y COMPRA ================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Precio total en vivo */}
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
              Total a pagar:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
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
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
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
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md ${
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
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  !selectedEssence
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : justAdded
                    ? 'bg-emerald-600 text-white'
                    : 'clay-btn bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 !text-white active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(99,102,241,0.4)]'
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
    </div>
  );
}
