'use client';

import React from 'react';
import { ShoppingBag, FlaskConical } from 'lucide-react';

interface FabricacionHubProps {
  pedidosRojosCount: number;
  pedidosAmarillosCount: number;
  onSelectView: (view: 'compra_pendiente' | 'por_fabricar') => void;
}

export function FabricacionHub({
  pedidosRojosCount,
  pedidosAmarillosCount,
  onSelectView,
}: FabricacionHubProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">FABRICACION</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarjeta PEDIDOS COMPRA PENDIENTE */}
        <div
          onClick={() => onSelectView('compra_pendiente')}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-rose-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-inner">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">PEDIDOS COMPRA PENDIENTE</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              {pedidosRojosCount} PEDIDOS EN ROJO
            </span>
          </div>
        </div>

        {/* Tarjeta PEDIDOS POR FABRICAR */}
        <div
          onClick={() => onSelectView('por_fabricar')}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-amber-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">PEDIDOS POR FABRICAR</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              {pedidosAmarillosCount} PEDIDOS EN LABORATORIO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
