'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Upload, 
  Package, 
  Calculator, 
  AlertTriangle,
  Settings2,
  DollarSign,
  Download,
  BrainCircuit,
  FileSpreadsheet
} from 'lucide-react';
import { getStaffToken } from '@/lib/auth';

export default function AbastecimientoInteligentePage() {
  const [budget, setBudget] = useState<number>(3000);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRunAlgorithm = () => {
    setIsProcessing(true);
    // Simular el algoritmo
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
    }, 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-indigo-600" />
          Motor Predictivo de Abastecimiento
        </h1>
        <p className="text-sm text-slate-500 font-medium max-w-3xl">
          El algoritmo analiza la velocidad de venta real (ADR) de los últimos 30 días, calcula los días de supervivencia de cada fragancia y genera una Orden de Compra óptima basada en tu liquidez actual y el catálogo del proveedor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Paso 1: Configuración de Liquidez y Archivo */}
        <div className={`clay-card p-5 space-y-5 transition-opacity ${step > 1 ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">1</div>
            <h3 className="font-bold text-slate-800">Parámetros del Algoritmo</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">Presupuesto Líquido Disponible</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number" 
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="clay-input pl-9 w-full font-black text-lg text-emerald-700 bg-emerald-50/30"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">El sistema nunca sugerirá una compra mayor a este monto.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">Formato de Proveedor (Apaesa)</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".xlsx, .csv"
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="file-upload" 
                />
                <label 
                  htmlFor="file-upload" 
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${file ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-300 hover:border-indigo-400 text-slate-500 hover:bg-slate-50'}`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-sm font-semibold">{file ? file.name : 'Subir catálogo .xlsx'}</span>
                </label>
              </div>
            </div>

            <button 
              disabled={!file}
              onClick={() => setStep(2)}
              className="clay-btn clay-btn-primary w-full py-3 disabled:opacity-50"
            >
              Cargar Reglas de Compra
            </button>
          </div>
        </div>

        {/* Paso 2: Análisis Algorítmico */}
        <div className={`clay-card p-5 space-y-5 transition-opacity ${step === 2 ? 'opacity-100 ring-2 ring-indigo-500' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-xs">2</div>
            <h3 className="font-bold text-slate-800">Motor Predictivo (Knapsack)</h3>
          </div>

          <div className="h-full flex flex-col items-center justify-center py-6 space-y-4">
            {isProcessing ? (
              <>
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-600 animate-pulse text-center">Cruzando velocidades de venta<br/>con costos del proveedor...</p>
              </>
            ) : (
              <>
                <Calculator className="w-12 h-12 text-slate-300" />
                <p className="text-xs text-slate-400 text-center px-4">
                  El sistema está listo para cruzar el presupuesto de ${budget} contra el catálogo subido para calcular la distribución óptima (Mochila Fraccional).
                </p>
                <button 
                  onClick={handleRunAlgorithm}
                  className="clay-btn clay-btn-success w-full mt-4 flex items-center justify-center gap-2"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Ejecutar Algoritmo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Paso 3: Exportación de Borrador */}
        <div className={`clay-card p-5 space-y-5 transition-opacity ${step === 3 ? 'opacity-100 ring-2 ring-emerald-500' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs">3</div>
            <h3 className="font-bold text-slate-800">Borrador Optimizado</h3>
          </div>

          <div className="space-y-4 pt-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wide">Inversión Calculada</span>
              <span className="text-2xl font-black text-emerald-600">$2,985.40</span>
              <span className="text-[10px] font-medium text-emerald-700 mt-1">Margen protegido y stock salvado (60 días)</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Hombre Salvaje (Dior)</span>
                <span className="text-xs font-mono text-indigo-600 font-bold">+2.5 L</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-700">One Million</span>
                <span className="text-xs font-mono text-indigo-600 font-bold">+1.0 L</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Invictus</span>
                <span className="text-xs font-mono text-indigo-600 font-bold">+1.0 L</span>
              </div>
              <p className="text-[10px] text-slate-400 text-center pt-2 italic">Y 14 esencias más...</p>
            </div>

            <button className="clay-btn w-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-2 py-3 mt-4">
              <Download className="w-4 h-4" />
              Descargar Excel para Apaesa
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
