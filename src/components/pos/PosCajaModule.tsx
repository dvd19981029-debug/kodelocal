'use client';

import React from 'react';
import {
  ReceiptText,
  CheckCheck,
  FileCheck,
  CheckCircle2,
  Clock,
  Box,
  Store,
  FileText,
  Banknote,
  Search,
  Eye,
  FileDown,
  Printer,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { SaleRecord } from '@/lib/store';

export interface PosCajaModuleProps {
  cajaSubTab: 'listas_facturar' | 'dtes_emitidos';
  setCajaSubTab: (tab: 'listas_facturar' | 'dtes_emitidos') => void;
  readyInWindowOrders: SaleRecord[];
  completedDteSales: SaleRecord[];
  pendingPreparationCount: number;
  setPosTab: (tab: any) => void;
  setActiveQuoteSale: (sale: SaleRecord) => void;
  setIsQuoteModalOpen: (open: boolean) => void;
  handleStartInvoiceOrder: (order: SaleRecord) => void;
  dteSearchQuery: string;
  setDteSearchQuery: (query: string) => void;
  dteFilterType: 'ALL' | '01' | '03' | 'TICKET';
  setDteFilterType: (filter: 'ALL' | '01' | '03' | 'TICKET') => void;
  filteredDteSales: SaleRecord[];
  setSelectedSaleDetail: (sale: SaleRecord) => void;
  setCompletedSale: (sale: SaleRecord) => void;
  handleTransmitDte?: (sale: SaleRecord) => Promise<void>;
  isTransmittingDteId?: string | null;
}

export const PosCajaModule: React.FC<PosCajaModuleProps> = React.memo(({
  cajaSubTab,
  setCajaSubTab,
  readyInWindowOrders,
  completedDteSales,
  pendingPreparationCount,
  setPosTab,
  setActiveQuoteSale,
  setIsQuoteModalOpen,
  handleStartInvoiceOrder,
  dteSearchQuery,
  setDteSearchQuery,
  dteFilterType,
  setDteFilterType,
  filteredDteSales,
  setSelectedSaleDetail,
  setCompletedSale,
  handleTransmitDte,
  isTransmittingDteId,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Encabezado y Selector de Subpestañas (Estilo Mecanic OS) */}
      <div
        className="clay-card-dark p-5 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <ReceiptText className="w-64 h-64 text-indigo-200" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
                🏛️ Módulo de Caja & DTE
              </span>
              <span className="text-xs text-indigo-200 font-medium">Facturación Electrónica El Salvador</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Caja, Ventanilla & Facturación DTE
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl font-normal leading-relaxed">
              Flujo centralizado: Cobra las órdenes preparadas por Bodega y emite los documentos electrónicos tributarios (Facturas y Créditos Fiscales).
            </p>
          </div>

          {/* Switcher de Subpestañas */}
          <div className="flex bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setCajaSubTab('listas_facturar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                cajaSubTab === 'listas_facturar'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>Órdenes Listas ({readyInWindowOrders.length})</span>
              {readyInWindowOrders.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setCajaSubTab('dtes_emitidos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                cajaSubTab === 'dtes_emitidos'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>DTEs Emitidos ({completedDteSales.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBPESTAÑA 1: ÓRDENES LISTAS PARA FACTURAR */}
      {cajaSubTab === 'listas_facturar' && (
        <div className="space-y-4">
          {/* Métricas rápidas de ventanilla */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className={`clay-card p-4 flex items-center justify-between border-l-4 border-emerald-500 ${readyInWindowOrders.length > 0 ? 'bg-emerald-50/40 ring-1 ring-emerald-300' : ''}`}>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listas en Ventanilla</span>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                  {readyInWindowOrders.length}
                </div>
                <span className="text-[10px] text-emerald-800 font-medium">Listas para cobro inmediato</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="clay-card p-4 flex items-center justify-between border-l-4 border-amber-500">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Preparación (Bodega)</span>
                <div className="text-2xl font-black text-amber-600 font-mono mt-0.5">
                  {pendingPreparationCount}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Siendo alistadas en estantería</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="clay-card p-4 flex items-center justify-between border-l-4 border-indigo-500">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturadas Hoy</span>
                <div className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
                  {completedDteSales.length}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Comprobantes DTE con sello</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <ReceiptText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Listado de Órdenes Listas en Ventanilla */}
          {readyInWindowOrders.length === 0 ? (
            <div className="clay-card p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-100/70 text-amber-600 flex items-center justify-center shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-800">
                  No hay órdenes en ventanilla en este momento
                </h4>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Cuando las vendedoras creen órdenes desde el Cotizador y el equipo de Bodega termine de prepararlas y presione <strong>"Poner en Ventanilla"</strong>, aparecerán aquí para cobro y emisión oficial de DTE.
                </p>
              </div>
              {pendingPreparationCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setPosTab('bodega_ordenes')}
                  className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 mt-2 flex items-center gap-1.5"
                >
                  <Box className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ver {pendingPreparationCount} {pendingPreparationCount === 1 ? 'orden' : 'órdenes'} en preparación en Bodega</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPosTab('nueva_orden')}
                  className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold mt-2 flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Crear Nueva Orden en Cotizador</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {readyInWindowOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="clay-card p-5 bg-white border-2 border-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.15)] flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Encabezado de la Tarjeta */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                            #{order.orderNumber || order.saleNumber}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>Listo en Ventanilla</span>
                          </span>
                        </div>
                        <span className="text-[10.5px] text-slate-400 font-sans mt-1 block">
                          Creado: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Vendedor: {order.vendedor || 'Mostrador'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total a Cobrar</span>
                        <span className="text-2xl font-black font-mono text-emerald-600">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Datos del Cliente */}
                    <div className="my-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cliente</span>
                        <strong className="text-slate-800 text-sm">{order.cliente.nombre}</strong>
                        {order.cliente.numDocumento && (
                          <span className="text-[11px] text-slate-500 font-mono block">Doc: {order.cliente.numDocumento}</span>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-1">
                        <span className={`clay-badge text-[10.5px] font-bold py-0.5 px-2 ${
                          order.tipoComprobante === '03' || order.cliente.nrc
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}>
                          {order.tipoComprobante === '03' || order.cliente.nrc ? 'Crédito Fiscal (CCF-03)' : 'Factura (FC-01)'}
                        </span>
                        {order.cliente.nrc && (
                          <span className="text-[10px] font-mono text-purple-700 font-bold">NRC: {order.cliente.nrc}</span>
                        )}
                      </div>
                    </div>

                    {/* Desglose de Productos Preparados por Bodega */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Items Preparados ({order.items.length})
                      </span>
                      <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl p-2.5 max-h-44 overflow-y-auto bg-slate-50/40">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between text-xs gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 truncate block">{it.name}</span>
                                {it.puesto && (
                                  <span className="clay-badge text-[9px] font-mono font-black bg-amber-100 text-amber-900 px-1 py-0.2 border border-amber-200">
                                    📍{it.puesto}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10.5px] text-slate-500">
                                {it.quantity} {it.unit || 'Oz'} x ${it.price.toFixed(2)}
                              </span>
                            </div>
                            <span className="font-mono font-black text-slate-800">
                              ${it.total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pie de tarjeta con Botón de Cobro */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2.5">
                    <div className="text-xs text-slate-500 font-medium">
                      Subtotal: <strong className="font-mono text-slate-700">${order.subtotal.toFixed(2)}</strong> • IVA (13%): <strong className="font-mono text-slate-700">${order.ivaTotal.toFixed(2)}</strong>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuoteSale(order);
                          setIsQuoteModalOpen(true);
                        }}
                        className="clay-btn clay-btn-light px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-700 flex items-center justify-center gap-1"
                        title="Ver comanda / cotización en PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Comanda</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartInvoiceOrder(order)}
                        className="clay-btn clay-btn-success flex-1 sm:flex-none px-4 py-2.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_4px_12px_rgba(16,185,129,0.35)]"
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cobrar y Facturar DTE</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* SUBPESTAÑA 2: DTES EMITIDOS (HISTORIAL OFICIAL ANTE HACIENDA) */}
      {cajaSubTab === 'dtes_emitidos' && (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Filtros de DTE */}
          <div className="clay-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Buscar por N° de Control (DTE-01-...), Código de Generación, cliente u orden..."
                value={dteSearchQuery}
                onChange={(e) => setDteSearchQuery(e.target.value)}
                className="clay-input has-icon w-full pr-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <button
                type="button"
                onClick={() => setDteFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dteFilterType === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({completedDteSales.length})
              </button>
              <button
                type="button"
                onClick={() => setDteFilterType('01')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dteFilterType === '01'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Factura (01)
              </button>
              <button
                type="button"
                onClick={() => setDteFilterType('03')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dteFilterType === '03'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Crédito Fiscal (03)
              </button>
              <button
                type="button"
                onClick={() => setDteFilterType('TICKET')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dteFilterType === 'TICKET'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tickets
              </button>
            </div>
          </div>

          {/* Tabla de Auditoría de DTEs Emitidos */}
          <div className="clay-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Registro Oficial de Documentos Tributarios Electrónicos</span>
              </h3>
              <span className="clay-badge text-[10px] bg-slate-100 text-slate-700 font-bold">
                {filteredDteSales.length} documentos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">N° Control / Código Generación</th>
                    <th className="py-2.5 px-3">Fecha & Hora</th>
                    <th className="py-2.5 px-3">Tipo DTE</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3 text-right">Total ($)</th>
                    <th className="py-2.5 px-3 text-center">Estado Hacienda</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDteSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <ReceiptText className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                        <p className="font-bold text-sm text-slate-600">No se encontraron DTEs emitidos</p>
                        <p className="text-xs text-slate-400 mt-0.5">Los comprobantes facturados en ventanilla se registrarán aquí.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDteSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono">
                          {sale.dteInfo?.numeroControl ? (
                            <div className="font-bold text-emerald-700 text-xs truncate max-w-[170px]" title={sale.dteInfo.numeroControl}>
                              {sale.dteInfo.numeroControl}
                            </div>
                          ) : (
                            <div className="font-bold text-slate-700 text-xs">
                              #{sale.saleNumber}
                            </div>
                          )}
                          {sale.dteInfo?.codigoGeneracion && (
                            <span className="text-[9.5px] text-slate-400 truncate block max-w-[170px]" title={sale.dteInfo.codigoGeneracion}>
                              UUID: {sale.dteInfo.codigoGeneracion.slice(0, 18)}...
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div>{new Date(sale.invoicedAt || sale.createdAt).toLocaleDateString('es-SV')}</div>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {new Date(sale.invoicedAt || sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`clay-badge text-[10px] font-bold py-0.5 px-2 ${
                            sale.tipoComprobante === '03'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : sale.tipoComprobante === '01'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {sale.tipoComprobante === '03' ? 'Crédito Fiscal (03)' : sale.tipoComprobante === '01' ? 'Factura (01)' : 'Ticket'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-extrabold text-slate-800 block text-xs truncate max-w-[160px]">
                            {sale.cliente.nombre}
                          </span>
                          {sale.cliente.numDocumento && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Doc: {sale.cliente.numDocumento}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-bold text-[11px]">
                          {sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Bitcoin'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-indigo-700">
                          ${sale.total.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {sale.dteInfo?.codigoGeneracion ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{sale.dteInfo.simulated ? 'Aprobado (Test)' : 'Sello Hacienda'}</span>
                            </span>
                          ) : (sale.tipoComprobante === '01' || sale.tipoComprobante === '03') ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Pendiente DTE</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Ticket Local</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Botón Emitir DTE si está pendiente de certificar */}
                            {(sale.tipoComprobante === '01' || sale.tipoComprobante === '03') && !sale.dteInfo?.codigoGeneracion && handleTransmitDte && (
                              <button
                                type="button"
                                disabled={isTransmittingDteId === sale.id || isTransmittingDteId === sale.saleNumber}
                                onClick={() => handleTransmitDte(sale)}
                                className="clay-btn px-2.5 py-1 text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                                title="Emitir DTE a Factura Llama y Ministerio de Hacienda"
                              >
                                {isTransmittingDteId === sale.id || isTransmittingDteId === sale.saleNumber ? (
                                  <>
                                    <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Enviando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3 h-3" />
                                    <span>Emitir DTE</span>
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedSaleDetail(sale)}
                              className="clay-btn clay-btn-light px-2.5 py-1 text-[11px] font-bold text-indigo-700 inline-flex items-center gap-1"
                              title="Ver detalle del comprobante"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                            </button>
                            {sale.dteInfo?.codigoGeneracion && (
                              <a
                                href={`/api/dte/${sale.dteInfo.codigoGeneracion}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="clay-btn clay-btn-light px-2 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                                title="Descargar PDF oficial DTE"
                              >
                                <FileDown className="w-3 h-3" />
                                <span>PDF</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setCompletedSale(sale)}
                              className="clay-btn clay-btn-light px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-indigo-700 inline-flex items-center gap-1"
                              title="Reimprimir Ticket"
                            >
                              <Printer className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
});

PosCajaModule.displayName = 'PosCajaModule';
