'use client';

import React from 'react';
import { Menu, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { NavSection, VentasView, FabView, BiView } from '../../types';

interface KodeHeaderProps {
  setMobileMenuOpen: (open: boolean) => void;
  activeNav: NavSection;
  ventasView: VentasView;
  setVentasView: (view: VentasView) => void;
  fabView: FabView;
  setFabView: (view: FabView) => void;
  biView: BiView;
  setBiView: (view: BiView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefreshAll: () => Promise<void> | void;
}

export const KodeHeader: React.FC<KodeHeaderProps> = ({
  setMobileMenuOpen,
  activeNav,
  ventasView,
  setVentasView,
  fabView,
  setFabView,
  biView,
  setBiView,
  searchQuery,
  setSearchQuery,
  onRefreshAll,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-[#f1f4f9]/95 backdrop-blur-md px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {/* Botón Hamburguesa para Móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors lg:hidden shrink-0 cursor-pointer"
            title="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb de navegación */}
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 min-w-0 truncate">
            <button
              onClick={() => {
                if (activeNav === 'VENTAS') setVentasView('hub');
                if (activeNav === 'FABRICACION') setFabView('hub');
                if (activeNav === 'INTELIGENCIA_NEGOCIOS') setBiView('hub');
              }}
              className="text-slate-900 hover:text-indigo-600 transition-colors uppercase shrink-0 cursor-pointer"
            >
              {activeNav.replace('_', ' ')}
            </button>

            {activeNav === 'VENTAS' && ventasView !== 'hub' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-indigo-600 uppercase truncate">
                  {ventasView === 'nuevo_pedido'
                    ? 'Nuevo Pedido'
                    : ventasView === 'nuevo_cliente'
                    ? 'Nuevo Cliente'
                    : ventasView === 'clientes'
                    ? 'Clientes'
                    : ventasView === 'pedidos'
                    ? 'Listado Pedidos'
                    : ventasView === 'ficha_cliente'
                    ? 'Ficha de Cliente'
                    : 'Catálogo'}
                </span>
              </>
            )}

            {activeNav === 'FABRICACION' && fabView !== 'hub' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-indigo-600 uppercase truncate">
                  {fabView === 'compra_pendiente' ? 'Pedidos Compra Pendiente' : 'Pedidos a Fabricar'}
                </span>
              </>
            )}

            {activeNav === 'INTELIGENCIA_NEGOCIOS' && biView !== 'hub' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-indigo-600 uppercase truncate">
                  {biView === 'compras' ? 'Compras de Insumos' : 'Dashboard'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Sincronizar en móvil */}
        <div className="flex items-center gap-1 sm:hidden">
          <button
            type="button"
            onClick={onRefreshAll}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Sincronizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={`Buscar en ${activeNav.replace('_', ' ')}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
      </div>
    </header>
  );
};
