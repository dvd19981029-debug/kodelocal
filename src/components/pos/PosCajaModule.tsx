'use client';

import React, { useMemo, useState } from 'react';
import {
  Calculator,
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
  XCircle,
  User,
  RotateCcw,
  Truck,
  Link2,
  Folder,
  FolderOpen,
  CreditCard,
} from 'lucide-react';
import { CustomerRecord } from '@/lib/customers';
import { SaleRecord } from '@/lib/store';
import { getActiveSessionUI } from '@/lib/auth';
import {
  printDailyCashSalesTicketPdf,
  printDailyCardSalesTicketPdf,
  printDailySummaryByPaymentTicketPdf,
} from '@/lib/thermalTicketPdf';
import { PosCorteZ } from './PosCorteZ';
import { PosWompiLinksDashboard } from './PosWompiLinksDashboard';
import PosDomicilioPanel from './PosDomicilioPanel';

export interface PosCajaModuleProps {
  cajaSubTab: 'listas_facturar' | 'ventas_dia' | 'dtes_emitidos' | 'corte_z' | 'enlaces_pago' | 'domicilio';
  setCajaSubTab: (tab: 'listas_facturar' | 'ventas_dia' | 'dtes_emitidos' | 'corte_z' | 'enlaces_pago' | 'domicilio') => void;
  readyInWindowOrders: SaleRecord[];
  completedDteSales: SaleRecord[];
  pendingPreparationCount: number;
  setPosTab: (tab: any) => void;
  setActiveQuoteSale: (sale: SaleRecord) => void;
  setIsQuoteModalOpen: (open: boolean) => void;
  handleStartInvoiceOrder: (order: SaleRecord) => void;
  handleCancelReadyOrder?: (order: SaleRecord) => void;
  handleEditOrderInPos?: (order: SaleRecord) => void;
  handleChangeOrderDteType?: (order: SaleRecord, newTipo: '01' | '03' | 'TICKET') => void;
  dteSearchQuery: string;
  setDteSearchQuery: (query: string) => void;
  dteFilterType: 'ALL' | '01' | '03' | 'TICKET';
  setDteFilterType: (filter: 'ALL' | '01' | '03' | 'TICKET') => void;
  dteSortBy?: 'FACTURACION' | 'CREACION';
  setDteSortBy?: (sort: 'FACTURACION' | 'CREACION') => void;
  filteredDteSales: SaleRecord[];
  setSelectedSaleDetail: (sale: SaleRecord) => void;
  setCompletedSale: (sale: SaleRecord) => void;
  handleTransmitDte?: (sale: SaleRecord) => Promise<void>;
  isTransmittingDteId?: string | null;
  customers?: CustomerRecord[];
  onOrderChanged?: () => void;
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
  handleCancelReadyOrder,
  handleEditOrderInPos,
  handleChangeOrderDteType,
  dteSearchQuery,
  setDteSearchQuery,
  dteFilterType,
  setDteFilterType,
  dteSortBy = 'FACTURACION',
  setDteSortBy,
  filteredDteSales,
  setSelectedSaleDetail,
  setCompletedSale,
  handleTransmitDte,
  isTransmittingDteId,
  customers,
  onOrderChanged,
}) => {
  const resolveCustomerName = (order: SaleRecord) => {
    if (order.cliente?.nombre && order.cliente.nombre.trim() !== '' && order.cliente.nombre.toLowerCase().trim() !== 'consumidor final') {
      return order.cliente.nombre;
    }
    const custId = (order.cliente as any)?.id || (order as any).customerId;
    if (custId && customers) {
      const found = customers.find(c => c.id === custId);
      if (found?.name) return found.name;
    }
    return order.cliente?.nombre || 'Consumidor Final';
  };

  const [onlyCashToday, setOnlyCashToday] = useState(false);
  const [todaySearch, setTodaySearch] = useState('');

  const parseSaleDateObj = (sale: SaleRecord): Date => {
    const raw = sale.invoicedAt || sale.dteInfo?.fhProcesamiento || sale.createdAt;
    if (!raw) return new Date(0);
    const svMatch = String(raw).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
    if (svMatch) {
      const [, dd, mm, yyyy, t] = svMatch;
      const d = new Date(`${yyyy}-${mm}-${dd}T${t || '00:00:00'}-06:00`);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(raw);
    return !isNaN(d.getTime()) ? d : new Date(0);
  };

  const todaySvKey = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });
  }, []);

  const todayInvoicedSales = useMemo(() => {
    return completedDteSales
      .filter((s) => {
        const d = parseSaleDateObj(s);
        if (isNaN(d.getTime()) || d.getTime() === 0) return false;
        const saleDateKey = d.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });
        return saleDateKey === todaySvKey;
      })
      .sort((a, b) => parseSaleDateObj(b).getTime() - parseSaleDateObj(a).getTime());
  }, [completedDteSales, todaySvKey]);

  const todayCashSales = useMemo(() => {
    return todayInvoicedSales.filter((s) => (s.paymentMethod || 'CASH') === 'CASH');
  }, [todayInvoicedSales]);

  const isEcommerceWompiSale = (s: SaleRecord) => {
    if (s.paymentMethod === 'WOMPI') return true;
    const isOnlineOrder =
      s.channel === 'ONLINE' || String(s.saleNumber || '').toUpperCase().startsWith('WEB-');
    return isOnlineOrder && s.paymentMethod === 'CARD';
  };

  const todayCardSales = useMemo(() => {
    return todayInvoicedSales
      .filter((s) => s.paymentMethod === 'CARD' && !isEcommerceWompiSale(s))
      .map((s) => ({
        ...s,
        cliente: {
          ...s.cliente,
          nombre: resolveCustomerName(s),
        },
      }));
  }, [todayInvoicedSales, customers]);

  const todayMetrics = useMemo(() => {
    let total = 0;
    let cashTotal = 0;
    let cardTotal = 0;
    let transferTotal = 0;
    let wompiTotal = 0;
    let contraEntregaTotal = 0;
    let bitcoinTotal = 0;
    let cashCount = 0;
    let cardCount = 0;
    let transferCount = 0;
    let wompiCount = 0;
    let contraEntregaCount = 0;
    let bitcoinCount = 0;

    for (const s of todayInvoicedSales) {
      const amt = Number(s.total || 0);
      total += amt;
      const pm = s.paymentMethod || 'CASH';
      if (pm === 'CASH') {
        cashTotal += amt;
        cashCount += 1;
      } else if (isEcommerceWompiSale(s)) {
        wompiTotal += amt;
        wompiCount += 1;
      } else if (pm === 'CARD') {
        cardTotal += amt;
        cardCount += 1;
      } else if (pm === 'TRANSFER') {
        transferTotal += amt;
        transferCount += 1;
      } else if (pm === 'CONTRA_ENTREGA') {
        contraEntregaTotal += amt;
        contraEntregaCount += 1;
      } else {
        bitcoinTotal += amt;
        bitcoinCount += 1;
      }
    }

    return {
      total,
      cashTotal,
      cardTotal,
      transferTotal,
      wompiTotal,
      contraEntregaTotal,
      bitcoinTotal,
      cashCount,
      cardCount,
      transferCount,
      wompiCount,
      contraEntregaCount,
      bitcoinCount,
    };
  }, [todayInvoicedSales]);

  const displayedTodaySales = useMemo(() => {
    const base = onlyCashToday ? todayCashSales : todayInvoicedSales;
    const q = todaySearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter((s) => {
      const cName = resolveCustomerName(s).toLowerCase();
      return (
        cName.includes(q) ||
        (s.saleNumber && s.saleNumber.toLowerCase().includes(q)) ||
        (s.dteInfo?.numeroControl && s.dteInfo.numeroControl.toLowerCase().includes(q))
      );
    });
  }, [onlyCashToday, todayCashSales, todayInvoicedSales, todaySearch, customers]);

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
          </div>

          {/* Switcher de Subpestañas */}
          <div className="flex flex-wrap bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-inner gap-1">
            <button
              type="button"
              onClick={() => setCajaSubTab('listas_facturar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
              onClick={() => setCajaSubTab('ventas_dia')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                cajaSubTab === 'ventas_dia'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50 ring-1 ring-teal-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Ventas del Día ({todayInvoicedSales.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCajaSubTab('enlaces_pago')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                cajaSubTab === 'enlaces_pago'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50 ring-1 ring-purple-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Enlaces de Pago</span>
            </button>

            <button
              type="button"
              onClick={() => setCajaSubTab('dtes_emitidos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                cajaSubTab === 'dtes_emitidos'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>DTEs Emitidos ({completedDteSales.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCajaSubTab('corte_z')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                cajaSubTab === 'corte_z'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50 ring-1 ring-amber-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Cierre de Caja / Turno</span>
            </button>

            <button
              type="button"
              onClick={() => setCajaSubTab('domicilio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                cajaSubTab === 'domicilio'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50 ring-1 ring-blue-300'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Domicilio</span>
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

            <div
              onClick={() => setCajaSubTab('ventas_dia')}
              className="clay-card p-4 flex items-center justify-between border-l-4 border-indigo-500 cursor-pointer hover:bg-indigo-50/40 transition-colors"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturadas Hoy</span>
                <div className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
                  {todayInvoicedSales.length}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  ${todayMetrics.total.toFixed(2)} acumulados hoy
                </span>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                            #{order.orderNumber || order.saleNumber}
                          </span>
                          <span className="font-black text-sm text-slate-800 flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                            <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{resolveCustomerName(order)}</span>
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-black rounded-lg border ${
                            (order.tipoComprobante || (order.cliente?.nrc ? '03' : '01')) === '03'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : order.tipoComprobante === 'TICKET'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {(order.tipoComprobante || (order.cliente?.nrc ? '03' : '01')) === '03'
                              ? 'Crédito Fiscal (CCF)'
                              : order.tipoComprobante === 'TICKET'
                              ? 'Ticket'
                              : 'Factura (FC)'}
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
                        <strong className="text-slate-800 text-sm">{resolveCustomerName(order)}</strong>
                        {order.cliente?.numDocumento && (
                          <span className="text-[11px] text-slate-500 font-mono block">Doc: {order.cliente.numDocumento}</span>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-1">
                        <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs gap-1">
                          {(['01', '03'] as const).map((tipo) => {
                            const currentTipo = order.tipoComprobante === '03' || order.cliente?.nrc ? '03' : '01';
                            const isSelected = currentTipo === tipo;
                            return (
                              <button
                                key={tipo}
                                type="button"
                                onClick={() => handleChangeOrderDteType?.(order, tipo)}
                                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition-all ${
                                  isSelected
                                    ? tipo === '03'
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                                title={`Cambiar comprobante a ${tipo === '03' ? 'Crédito Fiscal (CCF-03)' : 'Factura (FC-01)'}`}
                              >
                                {tipo === '03' ? 'CCF (03)' : 'Factura (FC-01)'}
                              </button>
                            );
                          })}
                        </div>
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

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      {handleCancelReadyOrder && (
                        <button
                          type="button"
                          onClick={() => handleCancelReadyOrder(order)}
                          className="clay-btn clay-btn-light px-2.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-1 border border-rose-200 transition-colors"
                          title="Anular comanda"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Anular</span>
                        </button>
                      )}

                      {handleEditOrderInPos && order.channel !== 'ONLINE' && (
                        <button
                          type="button"
                          onClick={() => handleEditOrderInPos(order)}
                          className="clay-btn clay-btn-light px-2.5 py-2 text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 flex items-center justify-center gap-1 border border-amber-200 transition-colors"
                          title="Devolver al Cotizador para modificar productos"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Editar</span>
                        </button>
                      )}

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

      {/* SUBPESTAÑA 1.5: VENTAS DEL DÍA (FACTURACIONES DE HOY Y ARQUEO DE EFECTIVO 80MM) */}
      {cajaSubTab === 'ventas_dia' && (
        <div className="space-y-4">
          {/* Barra Superior de Acciones: Botón "Venta en Efectivo" y Botones de Impresión 80mm */}
          <div className="clay-card p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-white">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyCashToday(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                  !onlyCashToday
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <ReceiptText className="w-3.5 h-3.5" />
                <span>Todas las Facturaciones Hoy ({todayInvoicedSales.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyCashToday((prev) => !prev)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                  onlyCashToday
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Venta en Efectivo ({todayMetrics.cashCount})</span>
                <span className="px-2 py-0.5 rounded-md bg-white/90 text-emerald-800 font-mono text-[11px] font-black">
                  +${todayMetrics.cashTotal.toFixed(2)}
                </span>
              </button>
            </div>

            {/* Botones de Impresión Térmica 80mm */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <button
                type="button"
                onClick={() =>
                  printDailyCashSalesTicketPdf(todayCashSales, {
                    cashier: getActiveSessionUI().name || 'Caja Principal',
                  })
                }
                className="clay-btn clay-btn-success flex-1 lg:flex-none px-3.5 py-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                title="Imprimir ticket de 80mm con el detalle de las Ventas en Efectivo de hoy"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir 80mm: Ventas en Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  printDailyCardSalesTicketPdf(todayCardSales, {
                    cashier: getActiveSessionUI().name || 'Caja Principal',
                  })
                }
                className="clay-btn flex-1 lg:flex-none px-3.5 py-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                title="Imprimir corte de 80mm solo con las transacciones en Tarjeta POS (Hora, Cliente y Monto)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir 80mm: Corte Tarjeta</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  printDailySummaryByPaymentTicketPdf(todayInvoicedSales, {
                    cashier: getActiveSessionUI().name || 'Caja Principal',
                  })
                }
                className="clay-btn clay-btn-primary flex-1 lg:flex-none px-3.5 py-2 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                title="Imprimir ticket de 80mm con la Venta del Día Resumida y el monto por Forma de Pago"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir 80mm: Resumen por Forma de Pago</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen del Día y Efectivo en Caja */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div
              onClick={() => setOnlyCashToday(true)}
              className={`clay-card p-4 border-l-4 border-emerald-500 cursor-pointer transition-all ${
                onlyCashToday ? 'bg-emerald-50/70 ring-2 ring-emerald-400' : 'bg-white hover:bg-emerald-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  Efectivo Hoy (+ En Caja)
                </span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                +${todayMetrics.cashTotal.toFixed(2)}
              </div>
              <span className="text-[10.5px] text-emerald-800 font-bold block mt-0.5">
                {todayMetrics.cashCount} {todayMetrics.cashCount === 1 ? 'venta' : 'ventas'} en efectivo
              </span>
            </div>

            <div className="clay-card p-4 border-l-4 border-indigo-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Tarjeta POS (Mostrador)
                </span>
                <CreditCard className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-black text-indigo-700 font-mono mt-1">
                ${todayMetrics.cardTotal.toFixed(2)}
              </div>
              <span className="text-[10.5px] text-slate-500 font-semibold block mt-0.5">
                {todayMetrics.cardCount} {todayMetrics.cardCount === 1 ? 'cobro en mostrador' : 'cobros en mostrador'}
              </span>
            </div>

            <div className="clay-card p-4 border-l-4 border-purple-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Transferencias
                </span>
                <Send className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-black text-purple-700 font-mono mt-1">
                ${todayMetrics.transferTotal.toFixed(2)}
              </div>
              <span className="text-[10.5px] text-slate-500 font-semibold block mt-0.5">
                {todayMetrics.transferCount} {todayMetrics.transferCount === 1 ? 'transferencia' : 'transferencias'}
              </span>
            </div>

            <div className="clay-card p-4 border-l-4 border-violet-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Wompi / Ecommerce
                </span>
                <Link2 className="w-4 h-4 text-violet-600" />
              </div>
              <div className="text-xl font-black text-violet-700 font-mono mt-1">
                ${todayMetrics.wompiTotal.toFixed(2)}
              </div>
              <span className="text-[10.5px] text-slate-500 font-semibold block mt-0.5">
                {todayMetrics.wompiCount} {todayMetrics.wompiCount === 1 ? 'pago web / enlace' : 'pagos web / enlaces'}
              </span>
            </div>

            <div className="clay-card p-4 border-l-4 border-blue-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Contra Entrega
                </span>
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-blue-700 font-mono mt-1">
                ${todayMetrics.contraEntregaTotal.toFixed(2)}
              </div>
              <span className="text-[10.5px] text-slate-500 font-semibold block mt-0.5">
                {todayMetrics.contraEntregaCount} {todayMetrics.contraEntregaCount === 1 ? 'envío' : 'envíos'}
              </span>
            </div>

            <div
              onClick={() => setOnlyCashToday(false)}
              className="clay-card p-4 border-l-4 border-slate-800 bg-white cursor-pointer hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                  Venta Total del Día
                </span>
                <ReceiptText className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                ${todayMetrics.total.toFixed(2)}
              </div>
              <span className="text-[10.5px] text-slate-500 font-bold block mt-0.5">
                {todayInvoicedSales.length} facturaciones hoy
              </span>
            </div>
          </div>

          {/* Tabla de Facturaciones de Hoy */}
          <div className="clay-card p-4 sm:p-5 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-teal-600" />
                  <span>
                    {onlyCashToday
                      ? `Facturaciones en Efectivo de Hoy (${displayedTodaySales.length})`
                      : `Facturaciones de Hoy (${displayedTodaySales.length})`}
                  </span>
                </h3>
                {onlyCashToday && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Debe haber +${todayMetrics.cashTotal.toFixed(2)} en caja por estas ventas
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={todaySearch}
                  onChange={(e) => setTodaySearch(e.target.value)}
                  placeholder="Buscar por cliente, orden o N° control..."
                  className="clay-input has-icon w-full pr-3 py-1.5 text-xs font-bold"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Comprobante / Orden</th>
                    <th className="py-2.5 px-3">Detalle de Venta</th>
                    <th className="py-2.5 px-3">Forma de Pago</th>
                    <th className="py-2.5 px-3 text-right">Monto ($)</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedTodaySales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <ReceiptText className="w-10 h-10 mx-auto mb-2 opacity-30 text-teal-500" />
                        <p className="font-bold text-sm text-slate-600">
                          {onlyCashToday
                            ? 'No hay facturaciones en efectivo registradas hoy'
                            : 'Aún no hay facturaciones registradas el día de hoy'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedTodaySales.map((sale) => {
                      const d = parseSaleDateObj(sale);
                      const timeStr = d.toLocaleTimeString('es-SV', {
                        timeZone: 'America/El_Salvador',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });
                      const customerName = resolveCustomerName(sale);
                      const isCash = (sale.paymentMethod || 'CASH') === 'CASH';
                      const itemsCount = (sale.items || []).reduce(
                        (sum, it) => sum + (Number(it.quantity) || 1),
                        0
                      );
                      const itemsPreview = (sale.items || [])
                        .slice(0, 2)
                        .map((it) => `${it.quantity}x ${it.name}`)
                        .join(' • ');

                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {timeStr}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-extrabold text-slate-900 text-xs">
                              {customerName}
                            </div>
                            {sale.cliente?.numDocumento && sale.cliente.numDocumento !== '00000000-0' && (
                              <span className="text-[10px] font-mono text-slate-400 block">
                                Doc: {sale.cliente.numDocumento}
                                {sale.cliente.nrc ? ` • NRC: ${sale.cliente.nrc}` : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`clay-badge text-[10px] font-bold py-0.5 px-2 ${
                                  sale.tipoComprobante === '03'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : sale.tipoComprobante === '01'
                                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {sale.tipoComprobante === '03'
                                  ? 'CCF (03)'
                                  : sale.tipoComprobante === '01'
                                  ? 'Factura (01)'
                                  : 'Ticket'}
                              </span>
                              <span className="font-mono font-bold text-slate-700 text-[11px]">
                                #{sale.saleNumber}
                              </span>
                            </div>
                            {sale.dteInfo?.numeroControl && (
                              <span
                                className="text-[9.5px] font-mono text-emerald-700 block truncate max-w-[180px] mt-0.5"
                                title={sale.dteInfo.numeroControl}
                              >
                                {sale.dteInfo.numeroControl}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-[230px]">
                            <span className="text-[11px] font-semibold text-slate-700 truncate block" title={itemsPreview}>
                              {itemsPreview || 'Venta general'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {itemsCount} {itemsCount === 1 ? 'unidad' : 'unidades'}
                              {(sale.items || []).length > 2 ? ` (+${(sale.items || []).length - 2} más)` : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black border ${
                                isCash
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isEcommerceWompiSale(sale)
                                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                                  : sale.paymentMethod === 'CARD'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : sale.paymentMethod === 'TRANSFER'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : sale.paymentMethod === 'CONTRA_ENTREGA'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isCash
                                ? 'Efectivo'
                                : isEcommerceWompiSale(sale)
                                ? 'Wompi / Ecommerce'
                                : sale.paymentMethod === 'CARD'
                                ? 'Tarjeta POS'
                                : sale.paymentMethod === 'TRANSFER'
                                ? 'Transferencia'
                                : sale.paymentMethod === 'CONTRA_ENTREGA'
                                ? 'Contra Entrega'
                                : 'Bitcoin'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-slate-900 whitespace-nowrap">
                            ${Number(sale.total || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedSaleDetail(sale)}
                                className="clay-btn clay-btn-light px-2.5 py-1 text-[11px] font-bold text-indigo-700 inline-flex items-center gap-1"
                                title="Ver detalle del comprobante"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ver</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCompletedSale(sale)}
                                className="clay-btn clay-btn-light px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-indigo-700 inline-flex items-center gap-1"
                                title="Reimprimir Ticket 80mm"
                              >
                                <Printer className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full md:w-auto">
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

              {setDteSortBy && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 ml-1">
                  <button
                    type="button"
                    onClick={() => setDteSortBy('FACTURACION')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                      dteSortBy === 'FACTURACION'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Ordenar por fecha y hora de emisión del DTE"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Fecha Facturación</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDteSortBy('CREACION')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                      dteSortBy === 'CREACION'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Ordenar por fecha y hora de creación del pedido"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Fecha Pedido</span>
                  </button>
                </div>
              )}
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
                    <th className="py-2.5 px-3">
                      {dteSortBy === 'CREACION' ? 'Fecha & Hora (Pedido)' : 'Fecha & Hora (Facturación)'}
                    </th>
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
                    filteredDteSales.map((sale) => {
                      const rawDisplayDate =
                        dteSortBy === 'CREACION'
                          ? sale.createdAt || sale.invoicedAt
                          : sale.dteInfo?.fhProcesamiento || sale.invoicedAt || sale.createdAt;
                      const parseDisplayDate = (val?: string) => {
                        if (!val) return new Date();
                        const svMatch = String(val).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
                        if (svMatch) {
                          const [, dd, mm, yyyy, t] = svMatch;
                          const d = new Date(`${yyyy}-${mm}-${dd}T${t || '00:00:00'}-06:00`);
                          if (!isNaN(d.getTime())) return d;
                        }
                        const d = new Date(val);
                        return !isNaN(d.getTime()) ? d : new Date();
                      };
                      const displayDate = parseDisplayDate(rawDisplayDate);
                      return (
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
                          <div>{displayDate.toLocaleDateString('es-SV')}</div>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          {sale.paymentMethod === 'CASH'
                            ? 'Efectivo'
                            : isEcommerceWompiSale(sale)
                            ? 'Wompi / Ecommerce'
                            : sale.paymentMethod === 'CARD'
                            ? 'Tarjeta POS'
                            : sale.paymentMethod === 'TRANSFER'
                            ? 'Transferencia'
                            : sale.paymentMethod === 'CONTRA_ENTREGA'
                            ? 'Contra Entrega'
                            : 'Bitcoin'}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
      {/* SUBPESTAÑA 3: CIERRE DE CAJA */}
      {cajaSubTab === 'corte_z' && (
        <PosCorteZ />
      )}
      {/* SUBPESTAÑA 4: ENLACES DE PAGO WOMPI */}
      {cajaSubTab === 'enlaces_pago' && (
        <PosWompiLinksDashboard />
      )}
      {/* SUBPESTAÑA 5: DOMICILIO POS */}
      {cajaSubTab === 'domicilio' && (
        <PosDomicilioPanel onOrderChanged={onOrderChanged} />
      )}
    </div>
  );
});

PosCajaModule.displayName = 'PosCajaModule';
