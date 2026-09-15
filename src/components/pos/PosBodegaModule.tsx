'use client';

import React from 'react';
import { 
  Box, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ReceiptText, 
  Search, 
  Eye 
} from 'lucide-react';
import { SaleRecord, ProductItem } from '@/lib/store';

export interface PosBodegaModuleProps {
  sales: SaleRecord[];
  products: ProductItem[];
  readyInWindowCount: number;
  pendingPreparationCount: number;
  completedOrdersCount: number;
  bodegaOrdenesFilter: 'ALL' | 'READY' | 'PENDING' | 'COMPLETED';
  setBodegaOrdenesFilter: (filter: 'ALL' | 'READY' | 'PENDING' | 'COMPLETED') => void;
  bodegaOrdenesSearch: string;
  setBodegaOrdenesSearch: (search: string) => void;
  filteredBodegaOrders: SaleRecord[];
  setSelectedSaleDetail: (sale: SaleRecord) => void;
  handleMarkOrderDeliveredFromPos: (orderId: string) => void;
}

export const PosBodegaModule: React.FC<PosBodegaModuleProps> = React.memo(({
  sales,
  products,
  readyInWindowCount,
  pendingPreparationCount,
  completedOrdersCount,
  bodegaOrdenesFilter,
  setBodegaOrdenesFilter,
  bodegaOrdenesSearch,
  setBodegaOrdenesSearch,
  filteredBodegaOrders,
  setSelectedSaleDetail,
  handleMarkOrderDeliveredFromPos,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Cabecera & Métricas de Órdenes */}
      <div
        className="clay-card-dark p-5 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #4338ca 100%)' }}
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Box className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
                📦 Seguimiento Operativo
              </span>
              <span className="text-xs text-amber-100">Bodega & Preparación</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">
              Estado de Comandas y Pedidos en Bodega
            </h2>
            <p className="text-xs text-amber-100/90 mt-1 max-w-xl">
              Supervisa en tiempo real qué órdenes están siendo preparadas en estantería (📍 puestos) y cuáles ya están listas en ventanilla para entrega al cliente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-4 rounded-2xl border backdrop-blur-md text-center ${
              readyInWindowCount > 0 
                ? 'bg-emerald-500/90 border-emerald-300 text-white animate-bounce' 
                : 'bg-white/10 border-white/20 text-white'
            }`}>
              <span className="text-[10.5px] uppercase font-black block tracking-wider">
                Listos en Ventanilla
              </span>
              <div className="text-3xl md:text-4xl font-black font-mono mt-0.5">
                {readyInWindowCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-amber-500">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Preparación</p>
            <h3 className="text-2xl font-black text-amber-600 font-mono mt-0.5">{pendingPreparationCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
            <Clock className="w-5 h-5" />
          </span>
        </div>

        <div className={`clay-card p-4 flex items-center justify-between border-l-4 border-emerald-500 ${readyInWindowCount > 0 ? 'bg-emerald-50/50 ring-2 ring-emerald-400' : ''}`}>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Listos en Ventanilla</p>
            <h3 className="text-2xl font-black text-emerald-700 font-mono mt-0.5">{readyInWindowCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>

        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-blue-500">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregados al Cliente</p>
            <h3 className="text-2xl font-black text-blue-600 font-mono mt-0.5">{completedOrdersCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
            <Truck className="w-5 h-5" />
          </span>
        </div>

        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-indigo-500">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Comandas Hoy</p>
            <h3 className="text-2xl font-black text-indigo-600 font-mono mt-0.5">{sales.length}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
            <ReceiptText className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="clay-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBodegaOrdenesFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              bodegaOrdenesFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setBodegaOrdenesFilter('READY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              bodegaOrdenesFilter === 'READY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Listos en Ventanilla ({readyInWindowCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setBodegaOrdenesFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              bodegaOrdenesFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En Preparación ({pendingPreparationCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setBodegaOrdenesFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              bodegaOrdenesFilter === 'COMPLETED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Entregados ({completedOrdersCount})</span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar comanda, cliente o fragancia..."
            value={bodegaOrdenesSearch}
            onChange={(e) => setBodegaOrdenesSearch(e.target.value)}
            className="clay-input has-icon w-full pr-3 py-1.5 text-xs font-bold"
          />
        </div>
      </div>

      {/* Listado de Tarjetas de Órdenes */}
      {filteredBodegaOrders.length === 0 ? (
        <div className="clay-card p-12 text-center text-slate-400">
          <Box className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No hay órdenes con este filtro</h3>
          <p className="text-xs text-slate-500 mt-1">
            Las ventas procesadas en el Punto de Venta se envían automáticamente a Bodega y su estado se sincroniza en vivo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBodegaOrders.map(order => {
            const isPending = order.status === 'PENDING_PREPARATION' || !order.status;
            const isReady = order.status === 'READY_AT_WINDOW';
            const isCompleted = order.status === 'COMPLETED';

            return (
              <div 
                key={order.id} 
                className={`clay-card p-4 flex flex-col justify-between transition-all ${
                  isReady 
                    ? 'border-l-4 border-emerald-500 bg-emerald-50/20 shadow-md ring-1 ring-emerald-200' 
                    : isPending 
                    ? 'border-l-4 border-amber-500 bg-amber-50/10' 
                    : 'border-l-4 border-slate-300 bg-white'
                }`}
              >
                <div>
                  {/* Fila Superior: Comanda & Estado */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-indigo-700">
                          #{order.saleNumber}
                        </span>
                        <span className={`clay-badge text-[10px] font-black py-0.5 px-2.5 ${
                          isReady 
                            ? 'bg-emerald-500 text-white shadow-sm animate-pulse' 
                            : isPending 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isReady ? '✅ ¡LISTO EN VENTANILLA!' : isPending ? '⏳ En Preparación' : '📦 Entregado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-1 font-medium">
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>Cliente: <strong className="text-slate-700">{order.cliente?.nombre || 'Consumidor Final'}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Total</span>
                      <span className="text-sm font-black text-slate-800 font-mono">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Stepper Visual de Estado */}
                  <div className="my-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">1</span>
                        <span>Caja</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className={`flex items-center gap-1 ${isPending ? 'text-amber-600 font-black animate-pulse' : 'text-emerald-600'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isPending ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>2</span>
                        <span>Bodega</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className={`flex items-center gap-1 ${isReady ? 'text-emerald-700 font-black' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isReady ? 'bg-emerald-600 text-white animate-bounce' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}>3</span>
                        <span>Ventanilla</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className={`flex items-center gap-1 ${isCompleted ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>4</span>
                        <span>Entregado</span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Ítems y Puesto en Estantería */}
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                      Productos en Comanda ({order.items.length}):
                    </span>
                    {order.items.map((it, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex justify-between items-center gap-2">
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{it.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            Cant: <strong className="text-indigo-700">{it.quantity} {it.unit || 'Oz'}</strong>
                          </span>
                        </div>
                        <span className="clay-badge text-[9.5px] font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 border border-amber-300 shrink-0">
                          📍 Puesto: {it.puesto || products.find(p => p.id === it.productId)?.puesto || 'A1'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones de Acción para la Cajera */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSaleDetail(order)}
                    className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Ticket</span>
                  </button>

                  {isReady && (
                    <button
                      type="button"
                      onClick={() => handleMarkOrderDeliveredFromPos(order.id)}
                      className="clay-btn clay-btn-primary px-4 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-emerald-600 !shadow-[3px_4px_12px_rgba(16,185,129,0.4)] animate-pulse"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Entregar al Cliente</span>
                    </button>
                  )}

                  {isPending && (
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Bodega preparando...</span>
                    </span>
                  )}

                  {isCompleted && (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Entregado</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

PosBodegaModule.displayName = 'PosBodegaModule';
export default PosBodegaModule;
