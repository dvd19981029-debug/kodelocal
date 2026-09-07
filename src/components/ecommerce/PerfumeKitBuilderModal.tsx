'use client';

import React, { useState, useMemo } from 'react';
import { X, Check, Sparkles, Search, Droplets, ShieldCheck, Plus, PackageCheck } from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { useEcommerceCart } from '@/context/EcommerceCartContext';

interface PerfumeKitBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableEssences: ProductItem[];
  availableBottles: ProductItem[];
}

export default function PerfumeKitBuilderModal({
  isOpen,
  onClose,
  availableEssences,
  availableBottles,
}: PerfumeKitBuilderModalProps) {
  const { addKitToCart } = useEcommerceCart();

  // Estados de configuración del Kit
  const [selectedEssence, setSelectedEssence] = useState<ProductItem | null>(null);
  const [selectedBottle, setSelectedBottle] = useState<ProductItem | null>(availableBottles[0] || null);
  const [hasLabel, setHasLabel] = useState<boolean>(true);
  const [isPlus, setIsPlus] = useState<boolean>(false); // +$3.00 por media onza adicional
  const [justAdded, setJustAdded] = useState(false);

  // Filtros internos para búsqueda de esencia
  const [essenceSearch, setEssenceSearch] = useState('');
  const [essenceGenderFilter, setEssenceGenderFilter] = useState<'Todos' | 'Caballero' | 'Dama' | 'Unisex'>('Todos');

  // Filtrado de esencias en tiempo real
  const filteredEssences = useMemo(() => {
    const q = essenceSearch.toLowerCase().trim();
    return availableEssences.filter((item) => {
      // Solo esencias con existencia disponible
      if (!item.stock || item.stock < (isPlus ? 1.5 : 1.0)) return false;

      // Filtro de género
      if (essenceGenderFilter !== 'Todos') {
        const g = (item.gender || '').toLowerCase();
        if (!g.includes(essenceGenderFilter.toLowerCase())) return false;
      }

      // Filtro de búsqueda
      if (!q) return true;
      const name = (item.name || '').toLowerCase();
      const official = (item.officialName || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const sku = (item.sku || '').toLowerCase();

      return name.includes(q) || official.includes(q) || brand.includes(q) || sku.includes(q);
    });
  }, [availableEssences, essenceSearch, essenceGenderFilter, isPlus]);

  if (!isOpen) return null;

  // Cálculo de precio fijo: $15.00 base, o $18.00 con la versión PLUS (+½ oz extra)
  const basePrice = 15.00;
  const plusCost = isPlus ? 3.00 : 0.00;
  const totalPrice = basePrice + plusCost;

  const canSubmit = Boolean(selectedEssence && selectedBottle);

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
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="clay-card w-full max-w-2xl max-h-[92vh] overflow-hidden bg-white rounded-3xl relative shadow-2xl flex flex-col border border-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= CABECERA DEL MODAL ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-pink-50/70 flex items-start justify-between relative">
          <div className="pr-8">
            <div className="flex items-center gap-2">
              <span className="clay-badge text-[10px] font-black uppercase text-indigo-700 bg-white/90 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs">
                Precio Fijo $15.00
              </span>
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                <span>Kit Completo Preparado</span>
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 mt-1">
              Personaliza tu Perfume Preparado
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5">
              Incluye <strong>1 onza de esencia pura</strong> + <strong>alcohol con fijador</strong> + <strong>frasco con atomizador</strong> + <strong>etiqueta opcional</strong>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= CONTENIDO DEL CONFIGURADOR ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* PASO 1: SELECCIONAR LA ESENCIA (OBLIGATORIO) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  Selecciona tu Contratipo / Esencia <span className="text-indigo-600">(1 Onza pura incluida)</span>
                </h3>
              </div>
              {selectedEssence && (
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Seleccionada</span>
                </span>
              )}
            </div>

            {/* Buscador y Filtros de Género para la Esencia */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar esencia: Sauvage, 212, Baccarat, One Million, Carolina Herrera..."
                  value={essenceSearch}
                  onChange={(e) => setEssenceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(['Todos', 'Caballero', 'Dama', 'Unisex'] as const).map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setEssenceGenderFilter(gender)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
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

            {/* Listado de Esencias con Scroll Vertical */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1 p-1 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              {filteredEssences.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium">
                  No se encontraron esencias con existencias disponibles para este criterio.
                </div>
              ) : (
                filteredEssences.map((essence) => {
                  const isChosen = selectedEssence?.id === essence.id;
                  const name = essence.officialName || essence.name;

                  return (
                    <div
                      key={essence.id}
                      onClick={() => setSelectedEssence(essence)}
                      className={`p-2 rounded-xl cursor-pointer transition-all border select-none relative flex flex-col justify-between ${
                        isChosen
                          ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-400/50 shadow-xs scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[8px] text-slate-400 font-bold mb-1">
                          <span>#{essence.sku}</span>
                          {essence.gender && (
                            <span className="uppercase text-slate-500 font-black">
                              {essence.gender.slice(0, 3)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-black text-slate-900 leading-snug line-clamp-2">
                          {name}
                        </p>
                        {essence.officialName && (
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">
                            {essence.name}
                          </p>
                        )}
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px]">
                        <span className="text-slate-500 font-semibold">
                          Disp: {Math.floor(essence.stock)} oz
                        </span>
                        {isChosen && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Esencia elegida resumen */}
            {selectedEssence && (
              <div className="p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200/90 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌸</span>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Esencia seleccionada: </span>
                    <strong className="text-indigo-900 font-black">
                      {selectedEssence.officialName || selectedEssence.name}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEssence(null)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {/* PASO 2: SELECCIONAR EL BOTE / FRASCO (INCLUIDO EN LOS $15) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                  2
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900">
                  Selecciona el Frasco / Bote <span className="text-emerald-700 font-extrabold">(¡Incluido sin costo adicional!)</span>
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {availableBottles.map((bottle) => {
                const isChosen = selectedBottle?.id === bottle.id;

                return (
                  <div
                    key={bottle.id}
                    onClick={() => setSelectedBottle(bottle)}
                    className={`p-2.5 rounded-2xl cursor-pointer transition-all border select-none relative flex flex-col items-center text-center ${
                      isChosen
                        ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-400/50 shadow-xs scale-[1.02]'
                        : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="w-14 h-16 rounded-xl overflow-hidden bg-slate-100 mb-1.5 flex items-center justify-center border border-slate-100">
                      <img
                        src={bottle.imageUrl || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&q=80'}
                        alt={bottle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[10.5px] sm:text-xs font-black text-slate-900 leading-tight">
                      {bottle.name}
                    </p>
                    <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                      Incluido ($0.00)
                    </span>

                    {isChosen && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PASO 3: OPCIÓN DE ETIQUETA (SIN COSTO ADICIONAL) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                3
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                ¿Deseas que tu perfume lleve etiqueta con su nombre? <span className="text-emerald-700 font-extrabold">(Gratis)</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setHasLabel(true)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasLabel
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-400/40 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <strong className="block text-xs font-black text-slate-900">
                    🏷️ Con Etiqueta
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Etiqueta elegante Aromaniak con el nombre de tu fragancia.
                  </span>
                </div>
                {hasLabel && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => setHasLabel(false)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  !hasLabel
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-400/40 shadow-2xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <strong className="block text-xs font-black text-slate-900">
                    ✨ Sin Etiqueta
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Frasco limpio y liso para uso personal o regalo minimalista.
                  </span>
                </div>
                {!hasLabel && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
              </button>
            </div>
          </div>

          {/* PASO 4: CASILLA OPCIONAL VERSIÓN PLUS (+½ ONZA EXTRA POR +$3.00) */}
          <div className="pt-2 border-t border-slate-100">
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
                  onChange={() => {}} // Manejado en contenedor
                  className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    💎 Hacer mi Kit versión PLUS (+½ Onza extra)
                  </span>
                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                    +$3.00
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                  ¿Deseas mayor concentración y fijación? Marcando esta casilla le agregamos <strong>media onza adicional</strong> a tu perfume (total <strong>1.5 onzas de esencia pura</strong>).
                </p>

                <div className="mt-2 text-[10.5px] font-bold text-slate-700 flex items-center gap-2">
                  <span>Concentración:</span>
                  {isPlus ? (
                    <span className="text-indigo-700 font-black">
                      🔥 1.5 Onzas (1 oz base + ½ oz adicional)
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      1 Onza Estándar
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= BARRA INFERIOR DE TOTAL Y AGREGAR AL CARRITO ================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
              Total del Kit Preparado:
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

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!canSubmit || justAdded}
              onClick={handleConfirmKit}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                !canSubmit
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'clay-btn-primary active:scale-95 cursor-pointer'
              }`}
            >
              {!selectedEssence ? (
                <span>Elige una esencia primero</span>
              ) : !selectedBottle ? (
                <span>Elige un frasco</span>
              ) : justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Kit Agregado al Carrito!</span>
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>Añadir Kit al Carrito (${totalPrice.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
