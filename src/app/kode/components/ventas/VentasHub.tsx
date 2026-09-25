'use client';

import React from 'react';
import {
  User,
  ShoppingBag,
  Users,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import { VentasView } from '../../types';

interface VentasHubProps {
  onNavigate: (view: VentasView) => void;
  onNuevoCliente: () => void;
  clientesCount: number;
  pedidosCount: number;
  catalogoCount: number;
}

export function VentasHub({
  onNavigate,
  onNuevoCliente,
  clientesCount,
  pedidosCount,
  catalogoCount,
}: VentasHubProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">VENTAS</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tarjeta NUEVO CLIENTE */}
        <div
          onClick={onNuevoCliente}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">NUEVO CLIENTE</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">VENTAS</span>
          </div>
        </div>

        {/* Tarjeta NUEVO PEDIDO */}
        <div
          onClick={() => onNavigate('nuevo_pedido')}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">NUEVO PEDIDO</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">VENTAS</span>
          </div>
        </div>

        {/* Tarjeta CLIENTES */}
        <div
          onClick={() => onNavigate('clientes')}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">CLIENTES</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              {clientesCount} REGISTRADOS
            </span>
          </div>
        </div>

        {/* Tarjeta PEDIDOS */}
        <div
          onClick={() => onNavigate('pedidos')}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-inner">
            <ListOrdered className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">PEDIDOS</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              {pedidosCount} PEDIDOS
            </span>
          </div>
        </div>

        {/* Tarjeta CATALOGO */}
        <div
          onClick={() => onNavigate('catalogo')}
          className="clay-card p-5 cursor-pointer flex items-center gap-4 transition-all hover:scale-[1.02] hover:border-indigo-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">CATALOGO</h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">
              {catalogoCount} FRAGANCIAS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
