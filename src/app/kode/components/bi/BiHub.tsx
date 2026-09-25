'use client';

import React from 'react';
import { TrendingUp, ReceiptText } from 'lucide-react';

interface BiHubProps {
  onSelectView: (view: 'dashboard' | 'compras') => void;
}

export function BiHub({ onSelectView }: BiHubProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">INTELIGENCIA DE NEGOCIOS</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarjeta DASHBOARD */}
        <div
          onClick={() => onSelectView('dashboard')}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">DASHBOARD</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">VENTAS & MÉTRICAS</span>
          </div>
        </div>

        {/* Tarjeta COMPRAS */}
        <div
          onClick={() => onSelectView('compras')}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-rose-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-inner">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Compras</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">GASTOS DE INSUMOS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
