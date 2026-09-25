'use client';

import React from 'react';

interface DashboardMetricasProps {
  metricas: {
    totalVentas: number;
    totalGastosCompras: number;
    total: number;
    [key: string]: any;
  };
  onBack: () => void;
}

export function DashboardMetricas({ metricas, onBack }: DashboardMetricasProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          ← Volver a Inteligencia de Negocios
        </button>
        <span className="text-xs text-slate-500 font-medium">Dashboard General</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clay-card p-4">
          <span className="text-xs font-bold text-slate-500 block mb-1">Ventas Totales</span>
          <span className="text-2xl font-black text-emerald-700 font-mono">
            ${metricas.totalVentas.toFixed(2)}
          </span>
        </div>

        <div className="clay-card p-4">
          <span className="text-xs font-bold text-slate-500 block mb-1">Gastos en Insumos</span>
          <span className="text-2xl font-black text-rose-600 font-mono">
            ${metricas.totalGastosCompras.toFixed(2)}
          </span>
        </div>

        <div className="clay-card p-4">
          <span className="text-xs font-bold text-slate-500 block mb-1">Margen Operativo Bruto</span>
          <span className="text-2xl font-black text-indigo-700 font-mono">
            ${(metricas.totalVentas - metricas.totalGastosCompras).toFixed(2)}
          </span>
        </div>

        <div className="clay-card p-4">
          <span className="text-xs font-bold text-slate-500 block mb-1">Total Pedidos</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{metricas.total}</span>
        </div>
      </div>
    </div>
  );
}
