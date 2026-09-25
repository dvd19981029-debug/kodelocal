import React from 'react';
import { 
  Store, 
  Pin, 
  PinOff, 
  ReceiptText, 
  Users, 
  Box, 
  Droplets, 
  Truck, 
  ExternalLink, 
  RotateCw 
} from 'lucide-react';
import { PosTab } from '../../types';

export interface PosSidebarProps {
  posTab: PosTab;
  setPosTab: (tab: PosTab) => void;
  isSidebarExpanded: boolean;
  isSidebarPinned: boolean;
  setIsSidebarPinned: (pinned: boolean) => void;
  setIsSidebarHovered: (hovered: boolean) => void;
  totalItemsCount: number;
  readyInWindowCount: number;
  completedDteCount: number;
  customersCount: number;
  pendingPreparationCount: number;
  totalOnzasVendidas: number;
  totalMontoVentas: number;
  salesCount: number;
  offlineQueueCount: number;
  onFlushOfflineQueue: () => void;
  onNavigateLogistica: () => void;
}

export const PosSidebar: React.FC<PosSidebarProps> = ({
  posTab,
  setPosTab,
  isSidebarExpanded,
  isSidebarPinned,
  setIsSidebarPinned,
  setIsSidebarHovered,
  totalItemsCount,
  readyInWindowCount,
  completedDteCount,
  customersCount,
  pendingPreparationCount,
  totalOnzasVendidas,
  totalMontoVentas,
  salesCount,
  offlineQueueCount,
  onFlushOfflineQueue,
  onNavigateLogistica,
}) => {
  return (
    <aside 
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
      className={`w-full ${isSidebarPinned ? 'lg:w-64' : 'lg:w-16'} shrink-0 relative transition-all duration-300 ease-in-out`}
    >
      <div className={`${
        isSidebarExpanded && !isSidebarPinned
          ? 'lg:absolute lg:top-0 lg:left-0 lg:w-64 lg:z-40 lg:shadow-2xl rounded-2xl bg-white/95 lg:bg-slate-50/95 lg:backdrop-blur-md p-1 border border-slate-200/80'
          : 'w-full'
      } space-y-3 transition-all duration-300`}>
        
        {/* Header del Menú */}
        <div className="clay-card p-2.5 flex items-center gap-2.5 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0 mx-auto lg:mx-0">
            <Store className="w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <div className="min-w-0 flex-1 flex items-center justify-between animate-in fade-in duration-200">
              <div className="min-w-0">
                <h2 className="font-black text-xs text-slate-800 leading-tight truncate">Punto de Venta</h2>
                <p className="text-[10px] text-slate-500 font-medium truncate">Caja & Facturación</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSidebarPinned ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                }`}
                title={isSidebarPinned ? 'Desfijar menú (se oculta automáticamente)' : 'Fijar menú abierto'}
              >
                {isSidebarPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Módulos de Navegación */}
        <div className="clay-card p-2 space-y-1 overflow-hidden">
          {isSidebarExpanded && (
            <p className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider animate-in fade-in duration-150">
              Módulos de Atención
            </p>
          )}

          {/* 1. Cotizador / Orden */}
          <button
            type="button"
            onClick={() => setPosTab('nueva_orden')}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'} rounded-xl text-xs font-bold transition-all relative ${
              posTab === 'nueva_orden' || posTab === 'pos'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Cotizador / Orden"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0 flex items-center justify-center">
                <Store className="w-4 h-4" />
                {!isSidebarExpanded && totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              {isSidebarExpanded && (
                <span className="truncate animate-in fade-in duration-150">Cotizador / Orden</span>
              )}
            </div>
            {isSidebarExpanded && totalItemsCount > 0 && (
              <span className={`clay-badge text-[10px] font-black px-2 py-0.5 shrink-0 ${
                posTab === 'nueva_orden' || posTab === 'pos' ? 'bg-white text-indigo-900' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* 2. Caja & Facturación */}
          <button
            type="button"
            onClick={() => setPosTab('caja_facturacion')}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'} rounded-xl text-xs font-bold transition-all relative ${
              posTab === 'caja_facturacion'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Caja & Facturación (DTE)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0 flex items-center justify-center">
                <ReceiptText className={`w-4 h-4 ${posTab === 'caja_facturacion' ? 'text-white' : 'text-emerald-600'}`} />
                {!isSidebarExpanded && readyInWindowCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 bg-emerald-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {readyInWindowCount}
                  </span>
                )}
              </div>
              {isSidebarExpanded && (
                <span className="truncate animate-in fade-in duration-150">Caja & Facturación</span>
              )}
            </div>
            {isSidebarExpanded && (
              readyInWindowCount > 0 ? (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-white animate-pulse shadow-xs shrink-0">
                  {readyInWindowCount} listo{readyInWindowCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
                  {completedDteCount} DTE
                </span>
              )
            )}
          </button>

          {/* 3. Clientes */}
          <button
            type="button"
            onClick={() => setPosTab('clientes')}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'} rounded-xl text-xs font-bold transition-all relative ${
              posTab === 'clientes'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Clientes (FC y CCF)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className="w-4 h-4 shrink-0" />
              {isSidebarExpanded && (
                <span className="truncate animate-in fade-in duration-150">Clientes</span>
              )}
            </div>
            {isSidebarExpanded && (
              <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
                {customersCount}
              </span>
            )}
          </button>

          {/* 4. Pedidos en Bodega */}
          <button
            type="button"
            onClick={() => setPosTab('bodega_ordenes')}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'} rounded-xl text-xs font-bold transition-all relative ${
              posTab === 'bodega_ordenes'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Pedidos en Bodega"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0 flex items-center justify-center">
                <Box className={`w-4 h-4 ${posTab === 'bodega_ordenes' ? 'text-white' : 'text-amber-500'}`} />
                {!isSidebarExpanded && pendingPreparationCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 bg-amber-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                    {pendingPreparationCount}
                  </span>
                )}
              </div>
              {isSidebarExpanded && (
                <span className="truncate animate-in fade-in duration-150">Pedidos en Bodega</span>
              )}
            </div>
            {isSidebarExpanded && (
              <div className="flex items-center gap-1 shrink-0">
                {pendingPreparationCount > 0 ? (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    posTab === 'bodega_ordenes' ? 'bg-white text-indigo-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {pendingPreparationCount} prep.
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">0</span>
                )}
              </div>
            )}
          </button>

          {/* 5. Ventas & Onzas */}
          <button
            type="button"
            onClick={() => setPosTab('ventas')}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'} rounded-xl text-xs font-bold transition-all relative ${
              posTab === 'ventas'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Ventas & Onzas"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Droplets className={`w-4 h-4 shrink-0 ${posTab === 'ventas' ? 'text-white' : 'text-cyan-500'}`} />
              {isSidebarExpanded && (
                <span className="truncate animate-in fade-in duration-150">Ventas & Onzas</span>
              )}
            </div>
            {isSidebarExpanded && (
              <span className={`clay-badge text-[10px] font-mono font-bold px-1.5 py-0.5 shrink-0 ${
                posTab === 'ventas' ? 'bg-white text-indigo-900' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {totalOnzasVendidas} Oz
              </span>
            )}
          </button>

          {/* 6. Envíos & Domicilio */}
          <button
            type="button"
            onClick={onNavigateLogistica}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'} rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all text-left`}
            title="Envíos & Domicilio"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Truck className="w-4 h-4 text-blue-500 shrink-0" />
              {isSidebarExpanded && (
                <span className="truncate animate-in fade-in duration-150">Envíos & Domicilio</span>
              )}
            </div>
            {isSidebarExpanded && (
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {/* Indicador de Ventas Offline en Cola */}
          {offlineQueueCount > 0 && (
            <button
              type="button"
              onClick={onFlushOfflineQueue}
              className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-3 py-2' : 'justify-center p-2'} rounded-xl text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-all shadow-xs`}
              title="Ventas guardadas localmente. Clic para forzar sincronización con Supabase"
            >
              <div className="flex items-center gap-2 min-w-0">
                <RotateCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                {isSidebarExpanded && (
                  <span className="truncate">{offlineQueueCount} venta{offlineQueueCount > 1 ? 's' : ''} offline</span>
                )}
              </div>
              {isSidebarExpanded && (
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                  Sincronizar
                </span>
              )}
            </button>
          )}
        </div>

        {/* Resumen del Día */}
        {isSidebarExpanded ? (
          <div className="clay-card p-3 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-100/80 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-black text-indigo-950 text-[11px] flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-indigo-600" />
                <span>Onzas Hoy:</span>
              </span>
              <span className="font-mono font-black text-xs text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                {totalOnzasVendidas} Oz
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-indigo-100/60 text-slate-600 text-[11px]">
              <span>Total Cobrado:</span>
              <strong className="font-mono text-slate-800">${totalMontoVentas.toFixed(2)}</strong>
            </div>

            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span>Listos Ventanilla:</span>
              <strong className={`font-mono ${readyInWindowCount > 0 ? 'text-emerald-700 font-black' : 'text-slate-800'}`}>
                {readyInWindowCount}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span>Comprobantes:</span>
              <strong className="font-mono text-slate-800">{salesCount}</strong>
            </div>
          </div>
        ) : (
          <div 
            className="clay-card p-2 flex flex-col items-center justify-center text-center gap-1 cursor-pointer hover:bg-indigo-50/70 transition-colors"
            title={`Resumen Hoy:\n• ${totalOnzasVendidas} Oz vendidas\n• $${totalMontoVentas.toFixed(2)} total cobrado\n• ${readyInWindowCount} listos en ventanilla\n• ${salesCount} comprobantes`}
          >
            <Droplets className="w-4 h-4 text-indigo-600" />
            <span className="text-[9px] font-mono font-black text-indigo-700 leading-none">
              {totalOnzasVendidas}
            </span>
            <span className="text-[8px] text-slate-400 font-bold uppercase leading-none">
              Oz
            </span>
          </div>
        )}

      </div>
    </aside>
  );
};
