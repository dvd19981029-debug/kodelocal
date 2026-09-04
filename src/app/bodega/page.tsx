'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  CheckCircle2, 
  Clock, 
  Droplets, 
  Search, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Printer,
  RotateCcw
} from 'lucide-react';
import { SaleRecord } from '@/lib/store';
import { getActiveUser, UserAccount } from '@/lib/auth';

export default function BodegaPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kodelocal_sales');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'READY'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentUser(getActiveUser());
  }, []);

  useEffect(() => {
    localStorage.setItem('kodelocal_sales', JSON.stringify(sales));
  }, [sales]);

  const handleToggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMarkAsReady = (orderId: string) => {
    setSales(prev => prev.map(s => {
      if (s.id === orderId) {
        return { ...s, status: 'READY_AT_WINDOW' };
      }
      return s;
    }));
  };

  const handleMarkAsCompleted = (orderId: string) => {
    setSales(prev => prev.map(s => {
      if (s.id === orderId) {
        return { ...s, status: 'COMPLETED' };
      }
      return s;
    }));
  };

  const filteredOrders = sales.filter(s => {
    const isPending = s.status === 'PENDING_PREPARATION' || !s.status;
    const isReady = s.status === 'READY_AT_WINDOW';
    
    if (activeFilter === 'PENDING' && !isPending) return false;
    if (activeFilter === 'READY' && !isReady) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.saleNumber.toLowerCase().includes(q) ||
      (s.vendedor && s.vendedor.toLowerCase().includes(q)) ||
      s.items.some(it => it.name.toLowerCase().includes(q) || (it.puesto && it.puesto.toLowerCase().includes(q)))
    );
  });

  const pendingCount = sales.filter(s => s.status === 'PENDING_PREPARATION' || !s.status).length;
  const readyCount = sales.filter(s => s.status === 'READY_AT_WINDOW').length;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      
      {/* Cabecera Principal de Bodega */}
      <div className="clay-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-2xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(217,119,6,0.3)]">
            <Box className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800">Bodega & Comandas de Preparación</h1>
              <span className="clay-badge bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5">
                Ventanilla de Entrega
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ubicación física en estantes por puesto • <strong className="text-amber-700">Vista libre de precios y dinero</strong>
            </p>
          </div>
        </div>

        {/* Contadores rápidos */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`clay-card px-4 py-2.5 flex items-center gap-2 transition-all flex-1 md:flex-initial ${
              activeFilter === 'PENDING' ? 'border-2 border-amber-400 bg-amber-50/70' : ''
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Por Preparar:</span>
            <span className="clay-badge bg-amber-200 text-amber-900 font-black text-xs px-2 py-0.5">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('READY')}
            className={`clay-card px-4 py-2.5 flex items-center gap-2 transition-all flex-1 md:flex-initial ${
              activeFilter === 'READY' ? 'border-2 border-emerald-400 bg-emerald-50/70' : ''
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-700">En Ventanilla:</span>
            <span className="clay-badge bg-emerald-200 text-emerald-900 font-black text-xs px-2 py-0.5">
              {readyCount}
            </span>
          </button>
        </div>
      </div>

      {/* Barra de Filtro y Búsqueda */}
      <div className="clay-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por comanda (CMD-1081), fragancia o puesto (A1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input has-icon w-full text-xs py-2"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`clay-btn px-3 py-1.5 text-xs font-bold rounded-xl flex-1 sm:flex-initial ${
              activeFilter === 'PENDING' ? 'clay-btn-primary' : 'clay-btn-light'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('READY')}
            className={`clay-btn px-3 py-1.5 text-xs font-bold rounded-xl flex-1 sm:flex-initial ${
              activeFilter === 'READY' ? 'clay-btn-primary' : 'clay-btn-light'
            }`}
          >
            Listos ({readyCount})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`clay-btn px-3 py-1.5 text-xs font-bold rounded-xl flex-1 sm:flex-initial ${
              activeFilter === 'ALL' ? 'clay-btn-primary' : 'clay-btn-light'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Lista de Comandas */}
      {filteredOrders.length === 0 ? (
        <div className="clay-card p-12 text-center text-slate-400">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-3 opacity-30 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-700">No hay comandas en este estado</h3>
          <p className="text-xs text-slate-500 mt-1">
            Los pedidos enviados desde el Punto de Venta aparecerán automáticamente aquí para su preparación.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING_PREPARATION' || !order.status;
            const isReady = order.status === 'READY_AT_WINDOW';
            const allItemsChecked = order.items.every((_, idx) => checkedItems[`${order.id}-${idx}`]);

            return (
              <div 
                key={order.id} 
                className={`clay-card p-5 flex flex-col justify-between transition-all ${
                  isPending ? 'border-l-4 border-amber-500' : 'border-l-4 border-emerald-500'
                }`}
              >
                <div>
                  {/* Encabezado de la comanda */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-indigo-700">
                          #{order.saleNumber}
                        </span>
                        <span className={`clay-badge text-[10px] font-bold py-0.5 px-2.5 ${
                          isPending 
                            ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {isPending ? '⏳ En Preparación' : '✅ En Ventanilla'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{order.vendedor || 'Mostrador'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-400 block">Total Ítems</span>
                      <span className="text-base font-black text-slate-700">
                        {order.items.reduce((a, b) => a + b.quantity, 0)} {order.items.some(i => i.unit === 'Onza') ? 'Oz' : 'Un.'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de productos para preparar con su PUESTO */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => {
                      const isChecked = checkedItems[`${order.id}-${idx}`];
                      return (
                        <div 
                          key={idx}
                          onClick={() => handleToggleItemCheck(order.id, idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isChecked 
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 line-through opacity-75' 
                              : 'bg-white border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={!!isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-600 cursor-pointer pointer-events-none"
                            />
                            <div>
                              <h4 className="font-black text-xs text-slate-800">
                                {item.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Unidad: {item.unit || 'Onza'}
                              </span>
                            </div>
                          </div>

                          {/* Puesto destacado y Cantidad requerida */}
                          <div className="flex items-center gap-2">
                            {item.puesto ? (
                              <span className="clay-badge bg-amber-100 text-amber-900 border border-amber-300 font-mono font-black text-xs py-1 px-2.5 shadow-sm">
                                📍 PUESTO: {item.puesto}
                              </span>
                            ) : (
                              <span className="clay-badge bg-slate-100 text-slate-600 text-[10px] py-0.5 px-2">
                                Puesto: Mostrador
                              </span>
                            )}

                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-black text-xs border border-indigo-100">
                              Cant: {item.quantity} {item.unit === 'Onza' ? 'Oz' : 'Un.'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Acciones de la Comanda */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    {order.cliente?.nombre || 'Cliente general'}
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <button
                        onClick={() => handleMarkAsReady(order.id)}
                        className="clay-btn clay-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entregar en Ventanilla</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsCompleted(order.id)}
                        className="clay-btn clay-btn-light px-3.5 py-2 text-xs flex items-center gap-1.5 font-bold text-emerald-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Completado / Facturado</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
