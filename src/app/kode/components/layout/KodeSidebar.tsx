'use client';

import React from 'react';
import { DollarSign, Package, FlaskConical, Truck, TrendingUp, User, X, Menu } from 'lucide-react';
import { NavSection, VentasView, FabView, BiView, Vendedora } from '../../types';

interface KodeSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeNav: NavSection;
  setActiveNav: (nav: NavSection) => void;
  setVentasView: (view: VentasView) => void;
  setFabView: (view: FabView) => void;
  setBiView: (view: BiView) => void;
  setSearchQuery: (q: string) => void;
  metricas: { total: number; rojos: number; amarillos: number; azules: number };
  catalogoCount: number;
  vendedoraSeleccionada: string;
  setVendedoraSeleccionada: (id: string) => void;
  vendedoras: Vendedora[];
}

export const KodeSidebar: React.FC<KodeSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen,
  activeNav,
  setActiveNav,
  setVentasView,
  setFabView,
  setBiView,
  setSearchQuery,
  metricas,
  catalogoCount,
  vendedoraSeleccionada,
  setVendedoraSeleccionada,
  vendedoras,
}) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-30 h-screen bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 shadow-xl lg:shadow-sm ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarOpen ? 'w-72 lg:w-64' : 'w-72 lg:w-20'} shrink-0`}
    >
      <div>
        {/* Logo y Encabezado del Sistema */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-md border border-white/40 shrink-0">
              K
            </div>
            <div className={`${sidebarOpen ? 'block' : 'block lg:hidden'} animate-in fade-in duration-200`}>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">KÖDE</span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                  App
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">kode.aromaniaksv.com</span>
            </div>
          </div>

          {/* Acciones de cabecera de barra lateral */}
          <div className="flex items-center">
            {/* Botón Cerrar en Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors lg:hidden cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Botón Colapsar en Escritorio */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden lg:flex cursor-pointer"
              title={sidebarOpen ? 'Colapsar barra lateral' : 'Expandir barra lateral'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Menú de Módulos (Exacto a AppSheet) */}
        <nav className="p-3 space-y-1.5">
          <button
            onClick={() => {
              setActiveNav('VENTAS');
              setVentasView('hub');
              setSearchQuery('');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left cursor-pointer ${
              activeNav === 'VENTAS'
                ? 'clay-btn-primary shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <div className={`flex-1 items-center justify-between ${sidebarOpen ? 'flex' : 'flex lg:hidden'}`}>
              <span>VENTAS</span>
              <span className="text-[10px] font-mono opacity-80">{metricas.total}</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveNav('INVENTARIO');
              setSearchQuery('');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left cursor-pointer ${
              activeNav === 'INVENTARIO'
                ? 'clay-btn-primary shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <div className={`flex-1 items-center justify-between ${sidebarOpen ? 'flex' : 'flex lg:hidden'}`}>
              <span>INVENTARIO</span>
              <span className="text-[10px] font-mono opacity-80">{catalogoCount}</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveNav('FABRICACION');
              setFabView('hub');
              setSearchQuery('');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left cursor-pointer ${
              activeNav === 'FABRICACION'
                ? 'clay-btn-primary shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FlaskConical className="w-4 h-4 shrink-0" />
            <div className={`flex-1 items-center justify-between ${sidebarOpen ? 'flex' : 'flex lg:hidden'}`}>
              <span>FABRICACION</span>
              {(metricas.rojos > 0 || metricas.amarillos > 0) && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
                  {metricas.rojos + metricas.amarillos}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => {
              setActiveNav('LOGISTICA');
              setSearchQuery('');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left cursor-pointer ${
              activeNav === 'LOGISTICA'
                ? 'clay-btn-primary shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <div className={`flex-1 items-center justify-between ${sidebarOpen ? 'flex' : 'flex lg:hidden'}`}>
              <span>LOGISTICA</span>
              <span className="text-[10px] font-mono opacity-80">{metricas.azules}</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveNav('INTELIGENCIA_NEGOCIOS');
              setBiView('hub');
              setSearchQuery('');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all text-left cursor-pointer ${
              activeNav === 'INTELIGENCIA_NEGOCIOS'
                ? 'clay-btn-primary shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <div className={`flex-1 items-center justify-between ${sidebarOpen ? 'flex' : 'flex lg:hidden'}`}>
              <span>INTELIGENCIA DE NEGOCIOS</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Vendedora / Perfil activo al pie */}
      <div className={`p-3 border-t border-slate-100 bg-slate-50/50 m-2 rounded-2xl ${sidebarOpen ? 'block' : 'block lg:hidden'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <User className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px] font-bold text-slate-500">Vendedora en Turno:</span>
        </div>
        <select
          value={vendedoraSeleccionada}
          onChange={(e) => setVendedoraSeleccionada(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-sm"
        >
          {vendedoras.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
};
