'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Droplets,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Scale,
  DollarSign,
  ArrowRight,
  Search,
  Info,
} from 'lucide-react';
import { ProductItem } from '@/lib/store';
import { getStaffToken } from '@/lib/auth';

interface EnvasarKgModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  allProducts?: ProductItem[];
  defaultUserName?: string;
  onSuccess: (updatedProduct: ProductItem, summary: any) => void;
}

export default function EnvasarKgModal({
  isOpen,
  onClose,
  product: initialProduct,
  allProducts = [],
  defaultUserName = 'Bodega / Envasado',
  onSuccess,
}: EnvasarKgModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(initialProduct);
  const [searchQuery, setSearchQuery] = useState('');

  const [kgProcessed, setKgProcessed] = useState<number>(1);
  const [ozProduced, setOzProduced] = useState<number>(32);
  const [halfOzProduced, setHalfOzProduced] = useState<number>(8);
  const [puesto, setPuesto] = useState<string>('');
  const [costPerKg, setCostPerKg] = useState<number>(0);
  const [deductFromGarrafa, setDeductFromGarrafa] = useState<boolean>(true);
  const [saveYieldAsDefault, setSaveYieldAsDefault] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar producto seleccionado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(initialProduct);
      setErrorMsg(null);
      setNotes('');
      setSaveYieldAsDefault(false);
    }
  }, [isOpen, initialProduct]);

  // Al cambiar el producto seleccionado, inicializar valores base y estimación
  useEffect(() => {
    if (!selectedProduct) return;
    const availKg = Number(selectedProduct.stockKg || 0);
    const defaultKg = availKg > 0 ? availKg : 1;
    const baseOz = Number(selectedProduct.yieldOzPerKg ?? 32);
    const baseHalf = Number(selectedProduct.yieldHalfPerKg ?? 8);

    setKgProcessed(defaultKg);
    setOzProduced(Math.round(defaultKg * baseOz));
    setHalfOzProduced(Math.round(defaultKg * baseHalf));
    setPuesto(selectedProduct.puesto || '');
    setCostPerKg(Number(selectedProduct.costPerKg || 0));
    setDeductFromGarrafa(availKg > 0);
  }, [selectedProduct]);

  const baseYieldOzPerKg = Number(selectedProduct?.yieldOzPerKg ?? 32);
  const baseYieldHalfPerKg = Number(selectedProduct?.yieldHalfPerKg ?? 8);

  // Recalcular estimación sugerida cuando el usuario cambia los Kg a procesar
  const handleKgChange = (newKg: number) => {
    const validKg = Math.max(0, newKg);
    setKgProcessed(validKg);
    if (validKg > 0) {
      setOzProduced(Math.round(validKg * baseYieldOzPerKg));
      setHalfOzProduced(Math.round(validKg * baseYieldHalfPerKg));
    }
  };

  const handleResetToEstimation = () => {
    const validKg = kgProcessed > 0 ? kgProcessed : 1;
    setOzProduced(Math.round(validKg * baseYieldOzPerKg));
    setHalfOzProduced(Math.round(validKg * baseYieldHalfPerKg));
  };

  // Filtrado de esencias si el usuario abre el modal desde el botón general sin elegir fila
  const essenceOptions = useMemo(() => {
    const essences = allProducts.filter(
      (p) => p.category === 'Esencias para Perfume' || p.unit === 'Onza'
    );
    if (!searchQuery.trim()) return essences.slice(0, 30);
    const q = searchQuery.toLowerCase().trim();
    return essences
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.officialName || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.puesto || '').toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [allProducts, searchQuery]);

  if (!isOpen) return null;

  const estimatedEquivOz = Number(
    ((kgProcessed || 0) * (baseYieldOzPerKg + baseYieldHalfPerKg * 0.5)).toFixed(2)
  );
  const realEquivOz = Number((ozProduced + halfOzProduced * 0.5).toFixed(2));
  const diffEquivOz = Number((realEquivOz - estimatedEquivOz).toFixed(2));

  const currentGarrafaKg = Number(selectedProduct?.stockKg || 0);
  const newGarrafaKg = deductFromGarrafa
    ? Math.max(0, Number((currentGarrafaKg - (kgProcessed || 0)).toFixed(3)))
    : currentGarrafaKg;

  const currentStockOz = Number(selectedProduct?.stock || 0);
  const currentStockHalf = Number(selectedProduct?.stockHalf || 0);
  const newStockOz = currentStockOz + (ozProduced || 0);
  const newStockHalf = currentStockHalf + (halfOzProduced || 0);

  const calculatedCostPerOz =
    costPerKg > 0 && realEquivOz > 0
      ? Number((costPerKg / realEquivOz).toFixed(2))
      : Number(selectedProduct?.cost || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setErrorMsg('Selecciona una esencia para envasar.');
      return;
    }
    if (ozProduced <= 0 && halfOzProduced <= 0) {
      setErrorMsg('Ingresa al menos 1 onza o ½ onza obtenida en el envasado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const token = getStaffToken();
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}`, 'x-staff-token': token } : {}),
        },
        body: JSON.stringify({
          action: 'envasar_kg',
          id: selectedProduct.id,
          sku: selectedProduct.sku,
          kgProcessed: Number(kgProcessed || 1),
          ozProduced: Math.round(Number(ozProduced || 0)),
          halfOzProduced: Math.round(Number(halfOzProduced || 0)),
          puesto: puesto.trim(),
          costPerKg: Number(costPerKg || 0),
          deductFromGarrafa,
          saveYieldAsDefault,
          userName: defaultUserName,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo procesar el envasado');
      }

      onSuccess(data.product, data.summary);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión al guardar el envasado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="clay-card w-full max-w-2xl p-6 relative my-8 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-slate-800">
                Envasado de Esencia (Kg a Onzas y ½ Onzas)
              </h3>
              <span className="clay-badge bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 border border-amber-300">
                Rendimiento Modificable
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Convierte los Kg en garrafa a existencias reales de 1 Oz y ½ Oz listas para venta en estante.
            </p>
          </div>
        </div>

        {/* Selector de Esencia si no vino pre-seleccionada o si desea cambiarla */}
        {!selectedProduct ? (
          <div className="mt-4 space-y-3">
            <label className="text-xs font-black text-slate-700 block">
              Buscar Esencia a Envasar:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escribe nombre, SKU (#73, #77) o puesto (B6, B7)..."
                className="clay-input has-icon w-full py-2.5 text-xs font-bold"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
              {essenceOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedProduct(item)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-indigo-50/60 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-black text-xs text-slate-800 block">
                      #{item.sku} — {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.officialName ? `${item.officialName} • ` : ''}
                      Stock: <strong>{item.stock} Oz</strong> / <strong>{item.stockHalf || 0} ½ Oz</strong>
                      {item.puesto ? ` • 📍 ${item.puesto}` : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`clay-badge text-[10px] font-mono font-black px-2 py-0.5 ${
                        Number(item.stockKg || 0) > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      🛢️ Garrafa: {Number(item.stockKg || 0)} Kg
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Ficha resumen de la esencia seleccionada */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-lg">
                    SKU #{selectedProduct.sku}
                  </span>
                  <h4 className="font-black text-sm text-slate-900">{selectedProduct.name}</h4>
                  {selectedProduct.puesto && (
                    <span className="clay-badge text-[10px] font-mono font-black bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-300">
                      📍 {selectedProduct.puesto}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  En Estante actual: <strong className="text-slate-800">{currentStockOz} de 1 Oz</strong> y{' '}
                  <strong className="text-indigo-700">{currentStockHalf} de ½ Oz</strong> • En Garrafa:{' '}
                  <strong className="text-amber-800">{currentGarrafaKg} Kg</strong>
                </p>
              </div>
              {allProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="clay-btn clay-btn-light px-2.5 py-1 text-[11px] font-bold text-indigo-700 shrink-0"
                >
                  Cambiar esencia
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* PASO 1: KG A PROCESAR Y ESTANTE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70">
              <div>
                <label className="text-[11px] font-black text-amber-950 flex items-center gap-1 mb-1">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kg a Envasar Hoy *</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    required
                    value={kgProcessed}
                    onChange={(e) => handleKgChange(parseFloat(e.target.value) || 0)}
                    className="clay-input w-full py-2 px-3 text-sm font-mono font-black text-center bg-white border-amber-300"
                  />
                  <span className="text-xs font-black text-amber-900">Kg</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {[0.5, 1, 2].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleKgChange(preset)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                        kgProcessed === preset
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                      }`}
                    >
                      {preset} Kg
                    </button>
                  ))}
                  {currentGarrafaKg > 0 && currentGarrafaKg !== 1 && currentGarrafaKg !== 0.5 && currentGarrafaKg !== 2 && (
                    <button
                      type="button"
                      onClick={() => handleKgChange(currentGarrafaKg)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                    >
                      Todo ({currentGarrafaKg} Kg)
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Puesto / Estante</span>
                </label>
                <input
                  type="text"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value.toUpperCase())}
                  placeholder="Ej. B6, B7, A1..."
                  className="clay-input w-full py-2 px-3 text-sm font-mono font-black text-center uppercase bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Ubicación donde quedarán envasadas
                </span>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-700 flex items-center gap-1 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Costo por Kg ($ Opcional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerKg === 0 ? '' : costPerKg}
                  onChange={(e) => setCostPerKg(parseFloat(e.target.value) || 0)}
                  placeholder="Ej. 45.00"
                  className="clay-input w-full py-2 px-3 text-sm font-mono font-bold text-center bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Calcula el costo real por onza
                </span>
              </div>
            </div>

            {/* PASO 2: RENDIMIENTO ESTIMADO PERO 100% MODIFICABLE */}
            <div className="p-4 rounded-2xl bg-indigo-50/40 border-2 border-indigo-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Rendimiento Real Obtenido (Modificable)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Estimación sugerida para <strong>{kgProcessed} Kg</strong>:{' '}
                    <strong>{Math.round(kgProcessed * baseYieldOzPerKg)} de 1 Oz</strong> y{' '}
                    <strong>{Math.round(kgProcessed * baseYieldHalfPerKg)} de ½ Oz</strong> ({estimatedEquivOz} oz equiv.). Modifícalo según lo que rindió realmente:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToEstimation}
                  className="clay-btn clay-btn-light px-2.5 py-1 text-[10.5px] font-bold text-indigo-700 flex items-center gap-1 self-start sm:self-auto shrink-0"
                  title="Volver a cargar la estimación sugerida por Kg"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar Estimado</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Frascos de 1 Onza */}
                <div className="p-3.5 rounded-xl bg-white border border-amber-300 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                      Onzas Completas (1 Oz)
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-400">
                      Base: {baseYieldOzPerKg} por Kg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOzProduced((prev) => Math.max(0, prev - 1))}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-slate-700 text-base flex items-center justify-center shrink-0"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={ozProduced}
                      onChange={(e) => setOzProduced(Math.max(0, parseInt(e.target.value) || 0))}
                      className="clay-input w-full text-center font-mono font-black text-lg text-amber-950 py-1.5 border-amber-300"
                    />
                    <button
                      type="button"
                      onClick={() => setOzProduced((prev) => prev + 1)}
                      className="w-9 h-9 rounded-xl bg-amber-100 hover:bg-amber-200 font-black text-amber-900 text-base flex items-center justify-center shrink-0"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Stock actual: {currentStockOz}</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      Nuevo Stock: {newStockOz} Oz
                    </span>
                  </div>
                </div>

                {/* Frascos de ½ Onza */}
                <div className="p-3.5 rounded-xl bg-white border border-indigo-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-indigo-950 bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                      Medias Onzas (½ Oz)
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-400">
                      Base: {baseYieldHalfPerKg} por Kg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHalfOzProduced((prev) => Math.max(0, prev - 1))}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-slate-700 text-base flex items-center justify-center shrink-0"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={halfOzProduced}
                      onChange={(e) => setHalfOzProduced(Math.max(0, parseInt(e.target.value) || 0))}
                      className="clay-input w-full text-center font-mono font-black text-lg text-indigo-950 py-1.5 border-indigo-300"
                    />
                    <button
                      type="button"
                      onClick={() => setHalfOzProduced((prev) => prev + 1)}
                      className="w-9 h-9 rounded-xl bg-indigo-100 hover:bg-indigo-200 font-black text-indigo-900 text-base flex items-center justify-center shrink-0"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Stock actual: {currentStockHalf}</span>
                    <span className="font-bold text-indigo-700 flex items-center gap-1">
                      Nuevo Stock: {newStockHalf} ½ Oz
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Resumen de Rendimiento Real vs Estimado */}
              <div className="p-3 rounded-xl bg-white/90 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">Rendimiento Total Equivalente:</span>
                  <span className="font-mono font-black text-sm text-indigo-700">
                    {realEquivOz} oz efectivas
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({ozProduced} + {halfOzProduced * 0.5} oz)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {diffEquivOz === 0 ? (
                    <span className="clay-badge bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5">
                      ✅ Igual al estimado ({estimatedEquivOz} oz)
                    </span>
                  ) : diffEquivOz > 0 ? (
                    <span className="clay-badge bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5">
                      ⬆️ +{diffEquivOz} oz sobre el estimado ({estimatedEquivOz} oz)
                    </span>
                  ) : (
                    <span className="clay-badge bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5">
                      ⬇️ {diffEquivOz} oz vs estimado ({estimatedEquivOz} oz)
                    </span>
                  )}

                  {costPerKg > 0 && realEquivOz > 0 && (
                    <span className="clay-badge bg-slate-100 text-slate-800 text-[10px] font-mono font-black px-2 py-0.5">
                      Costo real/Oz: ${calculatedCostPerOz.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Opciones de Garrafa y Estimación Futura */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={deductFromGarrafa}
                    onChange={(e) => setDeductFromGarrafa(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span>
                    Descontar <strong>{kgProcessed} Kg</strong> del stock en Garrafa (
                    <span className="font-mono text-amber-800">{currentGarrafaKg} Kg</span>{' '}
                    <ArrowRight className="w-3 h-3 inline" />{' '}
                    <span className="font-mono text-emerald-700">{newGarrafaKg} Kg</span>)
                  </span>
                </label>

                {currentGarrafaKg <= 0 && (
                  <span className="text-[10.5px] text-amber-700 font-semibold flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Ingreso directo a estante (Garrafa en 0 Kg)
                  </span>
                )}
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={saveYieldAsDefault}
                  onChange={(e) => setSaveYieldAsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
                <span>
                  Guardar este rendimiento (
                  <strong>
                    {kgProcessed > 0 ? Math.round(ozProduced / kgProcessed) : ozProduced} Oz y{' '}
                    {kgProcessed > 0 ? Math.round(halfOzProduced / kgProcessed) : halfOzProduced} ½ Oz por Kg
                  </strong>
                  ) como nueva estimación predeterminada para esta esencia
                </span>
              </label>

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones opcionales del lote o envasado (ej. Lote más denso, envasado por turno mañana)..."
                  className="clay-input w-full py-1.5 px-3 text-xs bg-white mt-1"
                />
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="clay-btn clay-btn-light px-4 py-2.5 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-black flex items-center gap-2 !bg-emerald-600 !shadow-[3px_4px_12px_rgba(16,185,129,0.35)] disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Aplicando Envasado...'
                    : `Confirmar Envasado (+${ozProduced} Oz y +${halfOzProduced} ½ Oz)`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
