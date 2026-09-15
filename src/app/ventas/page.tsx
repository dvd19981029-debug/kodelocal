'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ReceiptText, 
  Search, 
  FileCheck, 
  Printer, 
  Eye, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  X,
  CreditCard,
  Banknote,
  Send,
  RotateCw,
  FileDown
} from 'lucide-react';
import { SaleRecord } from '@/lib/store';
import { flushOfflineQueue } from '@/lib/offlineSync';

export default function VentasPage() {
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kodelocal_sales');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING_DTE' | 'TRANSMITTED_DTE' | 'TICKETS'>('ALL');
  const [transmittingId, setTransmittingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  useEffect(() => {
    localStorage.setItem('kodelocal_sales', JSON.stringify(sales));
  }, [sales]);

  // Cargar ventas y DTEs oficiales registrados en la base de datos Supabase
  useEffect(() => {
    fetch('/api/sales?limit=150')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.sales)) {
          const dbSales: SaleRecord[] = data.sales.map((s: any) => ({
            id: s.id,
            saleNumber: s.saleNumber,
            orderNumber: s.saleNumber,
            createdAt: s.createdAt,
            invoicedAt: s.createdAt,
            channel: s.channel || 'POS',
            total: Number(s.total || 0),
            subtotal: Number(s.subtotal || 0),
            ivaTotal: Number(s.ivaTotal || 0),
            shippingCost: Number(s.shippingCost || 0),
            paymentMethod: s.paymentMethod || 'CASH',
            paymentStatus: s.paymentStatus || 'COMPLETED',
            status: s.orderStatus || 'COMPLETED',
            tipoComprobante: s.tipoComprobante || '01',
            cajero: s.cashierName || 'Caja 1',
            vendedor: s.sellerName || 'Mostrador',
            cliente: {
              nombre: s.customer?.name || 'Consumidor Final',
              numDocumento: s.customer?.documentNum || undefined,
              nrc: s.customer?.nrc || undefined,
              correo: s.customer?.email || undefined,
              telefono: s.customer?.phone || undefined,
              direccion: s.customer?.address || undefined,
              actividadEconomica: s.customer?.activityDesc || undefined,
            },
            items: (s.items || []).map((it: any) => ({
              productId: it.productId,
              name: it.productName,
              quantity: it.quantity,
              price: Number(it.unitPrice || 0),
              total: Number(it.total || 0),
              unit: it.unit || 'Unidad',
            })),
            dteInfo: s.dteDocument ? {
              codigoGeneracion: s.dteDocument.codigoGeneracion,
              numeroControl: s.dteDocument.numeroControl,
              selloRecepcion: s.dteDocument.selloRecepcion,
              estado: s.dteDocument.estado,
              simulated: s.dteDocument.estado === 'SIMULADO',
              mensaje: s.dteDocument.mensajeRespuesta,
              mhDteUrl: s.dteDocument.mhDteUrl,
              pdfUrl: `/api/dte/${s.dteDocument.codigoGeneracion}/pdf`,
              jsonUrl: `/api/dte/${s.dteDocument.codigoGeneracion}/json`,
              fhProcesamiento: s.dteDocument.fhProcesamiento,
            } : undefined,
          }));

          setSales(prev => {
            const mergedMap = new Map<string, SaleRecord>();
            dbSales.forEach(s => mergedMap.set(s.saleNumber, s));
            prev.forEach(p => {
              if (!mergedMap.has(p.saleNumber)) {
                mergedMap.set(p.saleNumber, p);
              } else {
                const existing = mergedMap.get(p.saleNumber)!;
                if (!existing.dteInfo && p.dteInfo) {
                  existing.dteInfo = p.dteInfo;
                }
              }
            });
            const merged = Array.from(mergedMap.values());
            if (typeof window !== 'undefined') {
              localStorage.setItem('kodelocal_sales', JSON.stringify(merged));
            }
            return merged;
          });
        }
      })
      .catch(err => console.error('Error cargando ventas desde DB en /ventas:', err));
  }, []);

  // Escuchar sincronización de ventas desde el motor offline
  useEffect(() => {
    const handleSalesUpdate = () => {
      const saved = localStorage.getItem('kodelocal_sales');
      if (saved) {
        try { setSales(JSON.parse(saved)); } catch (e) {}
      }
    };
    window.addEventListener('kodelocal_sales_updated', handleSalesUpdate);
    return () => {
      window.removeEventListener('kodelocal_sales_updated', handleSalesUpdate);
    };
  }, []);

  const totalVentas = useMemo(() => sales.reduce((acc, s) => acc + s.total, 0), [sales]);
  const totalIvaRecaudado = useMemo(() => sales.reduce((acc, s) => acc + s.ivaTotal, 0), [sales]);
  
  const dteTransmitidosCount = useMemo(
    () => sales.filter(s => (s.tipoComprobante === '01' || s.tipoComprobante === '03') && Boolean(s.dteInfo?.codigoGeneracion)).length,
    [sales]
  );
  const dtePendientesCount = useMemo(
    () => sales.filter(s => (s.tipoComprobante === '01' || s.tipoComprobante === '03') && !s.dteInfo?.codigoGeneracion).length,
    [sales]
  );
  const ticketsCount = useMemo(
    () => sales.filter(s => s.tipoComprobante !== '01' && s.tipoComprobante !== '03').length,
    [sales]
  );

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // 1. Filtro por pestaña
      if (filterTab === 'PENDING_DTE') {
        const isFiscal = s.tipoComprobante === '01' || s.tipoComprobante === '03';
        const isNotTransmitted = !s.dteInfo?.codigoGeneracion;
        if (!isFiscal || !isNotTransmitted) return false;
      } else if (filterTab === 'TRANSMITTED_DTE') {
        const isFiscal = s.tipoComprobante === '01' || s.tipoComprobante === '03';
        const isTransmitted = Boolean(s.dteInfo?.codigoGeneracion);
        if (!isFiscal || !isTransmitted) return false;
      } else if (filterTab === 'TICKETS') {
        if (s.tipoComprobante === '01' || s.tipoComprobante === '03') return false;
      }

      // 2. Filtro por búsqueda
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.saleNumber.toLowerCase().includes(q) ||
        s.cliente.nombre.toLowerCase().includes(q) ||
        (s.dteInfo?.codigoGeneracion && s.dteInfo.codigoGeneracion.toLowerCase().includes(q)) ||
        (s.dteInfo?.numeroControl && s.dteInfo.numeroControl.toLowerCase().includes(q))
      );
    });
  }, [sales, searchQuery, filterTab]);

  // Transmitir un DTE individual pendiente a Factura Llama / Ministerio de Hacienda
  const handleTransmitDte = async (sale: SaleRecord) => {
    setTransmittingId(sale.id);
    try {
      const res = await fetch('/api/dte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoDte: sale.tipoComprobante === '03' ? '03' : '01',
          saleId: sale.saleNumber || sale.id,
          cliente: {
            nombre: sale.cliente?.nombre || 'Consumidor Final',
            numDocumento: sale.cliente?.numDocumento,
            nrc: sale.cliente?.nrc,
            email: sale.cliente?.correo,
            giro: sale.cliente?.actividadEconomica,
            telefono: sale.cliente?.telefono,
            direccion: sale.cliente?.direccion,
            departamento: sale.cliente?.departamento || 'San Salvador',
            municipio: sale.cliente?.municipio || 'San Salvador Centro',
          },
          items: sale.items.map((it: any) => ({
            codigo: it.productId || 'GEN-01',
            nombre: it.name,
            cantidad: it.quantity,
            precioUnitario: it.price,
            total: it.total,
            unit: it.unit,
            tipoItem: it.tipoItem || (it.productId === 'ENVIO-DOM' ? 2 : 1),
          })),
          total: sale.total,
          subtotal: sale.subtotal,
          iva: sale.ivaTotal,
          metodoPago: sale.paymentMethod || 'CASH',
        }),
      });
      const data = await res.json();
      if (data && data.dte && data.dte.codigoGeneracion) {
        const newDteInfo = {
          codigoGeneracion: data.dte.codigoGeneracion,
          numeroControl: data.dte.numeroControl,
          selloRecepcion: data.dte.selloRecepcion,
          estado: data.dte.estado,
          simulated: data.dte.simulated,
          mensaje: data.dte.mensaje,
          mhDteUrl: data.dte.mhDteUrl,
          pdfUrl: data.dte.pdfUrl,
          jsonUrl: data.dte.jsonUrl,
          fhProcesamiento: data.dte.fhProcesamiento,
        };

        const updatedSales = sales.map(s => {
          if (s.id === sale.id || s.saleNumber === sale.saleNumber) {
            return { ...s, dteInfo: newDteInfo };
          }
          return s;
        });

        setSales(updatedSales);
        localStorage.setItem('kodelocal_sales', JSON.stringify(updatedSales));
        window.dispatchEvent(new Event('kodelocal_sales_updated'));

        if (selectedSale && (selectedSale.id === sale.id || selectedSale.saleNumber === sale.saleNumber)) {
          setSelectedSale({ ...selectedSale, dteInfo: newDteInfo });
        }
      } else {
        alert(`No se pudo emitir DTE: ${data?.error || data?.dte?.mensaje || 'Error en Factura Llama'}`);
      }
    } catch (err: any) {
      alert(`Error al conectar con el servicio DTE: ${err?.message || 'Fallo de conexión'}`);
    } finally {
      setTransmittingId(null);
    }
  };

  // Transmitir todos los comprobantes pendientes de contingencia
  const handleTransmitAllPending = async () => {
    setIsSyncingAll(true);
    try {
      await flushOfflineQueue();
      const raw = localStorage.getItem('kodelocal_sales');
      if (raw) setSales(JSON.parse(raw));
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Resumen Superior con KPIs de Facturación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Ventas */}
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ventas Totales</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-0.5">${totalVentas.toFixed(2)}</h3>
            <span className="text-xs text-slate-500 font-medium">{sales.length} transacciones</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 2. DTEs Certificados (MH) */}
        <div 
          onClick={() => setFilterTab('TRANSMITTED_DTE')}
          className="clay-card p-5 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all"
          title="Clic para ver solo comprobantes transmitidos"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DTEs Certificados (MH)</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{dteTransmitidosCount}</h3>
            <span className="text-xs text-emerald-700 font-semibold">Con Sello de Hacienda</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* 3. DTEs Pendientes de Transmisión (Contingencia) */}
        <div 
          onClick={() => setFilterTab('PENDING_DTE')}
          className={`clay-card p-5 flex items-center justify-between cursor-pointer transition-all ${
            dtePendientesCount > 0 
              ? 'bg-amber-50/90 border-2 border-amber-400 shadow-md ring-2 ring-amber-300/40' 
              : 'hover:border-slate-300'
          }`}
          title="Clic para ver comprobantes pendientes de transmisión"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${dtePendientesCount > 0 ? 'text-amber-900 font-black' : 'text-slate-400'}`}>
                Pendientes DTE (MH)
              </p>
              {dtePendientesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-black bg-amber-500 text-white animate-pulse">
                  Alerta
                </span>
              )}
            </div>
            <h3 className={`text-2xl font-black mt-0.5 ${dtePendientesCount > 0 ? 'text-amber-700 font-black' : 'text-slate-500'}`}>
              {dtePendientesCount}
            </h3>
            <span className={`text-xs ${dtePendientesCount > 0 ? 'text-amber-800 font-bold' : 'text-slate-400 font-medium'}`}>
              {dtePendientesCount > 0 ? 'En Contingencia Offline' : 'Al día con Hacienda'}
            </span>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
            dtePendientesCount > 0 ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-slate-100 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* 4. IVA Débito Fiscal */}
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IVA Débito (13%)</p>
            <h3 className="text-2xl font-black text-purple-600 mt-0.5">${totalIvaRecaudado.toFixed(2)}</h3>
            <span className="text-xs text-slate-500 font-medium">Impuesto desglosado</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Banner de Alerta cuando hay comprobantes pendientes de contingencia */}
      {dtePendientesCount > 0 && (
        <div className="clay-card p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                <span>{dtePendientesCount} {dtePendientesCount === 1 ? 'comprobante fiscal pendiente' : 'comprobantes fiscales pendientes'} de transmitir</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] uppercase font-bold">
                  Modo Contingencia
                </span>
              </h4>
              <p className="text-xs text-amber-900/90 mt-0.5">
                Ventas registradas sin internet. Para cumplir con la normativa de Hacienda, deben transmitirse a Factura Llama.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterTab('PENDING_DTE')}
              className="clay-btn clay-btn-light px-3.5 py-2 text-xs font-bold text-amber-900 w-full sm:w-auto text-center"
            >
              Filtrar Pendientes
            </button>
            <button
              type="button"
              disabled={isSyncingAll}
              onClick={handleTransmitAllPending}
              className="clay-btn px-4 py-2 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 shadow-xs w-full sm:w-auto transition-all"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Transmitiendo...' : 'Transmitir a MH Ahora'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Pestañas de Filtro y Buscador */}
      <div className="flex flex-col gap-3">
        {/* Pestañas de Filtro Rápido */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todas ({sales.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('PENDING_DTE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              filterTab === 'PENDING_DTE'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : dtePendientesCount > 0
                ? 'bg-amber-100/90 text-amber-900 border-2 border-amber-400 font-black'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pendientes de DTE ({dtePendientesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('TRANSMITTED_DTE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              filterTab === 'TRANSMITTED_DTE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>DTEs Certificados ({dteTransmitidosCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('TICKETS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterTab === 'TICKETS'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tickets Internos ({ticketsCount})
          </button>
        </div>

        {/* Buscador */}
        <div className="clay-card p-3 sm:p-4 flex items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Buscar por N° Venta, Cliente, Código de Generación o N° Control..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="clay-input has-icon w-full pr-4 py-2 text-xs sm:text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="clay-card overflow-hidden p-2 sm:p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">N° Venta / Hora</th>
                <th className="py-3 px-3.5">Cliente Receptor</th>
                <th className="py-3 px-3.5">Comprobante</th>
                <th className="py-3 px-3.5">Método Pago</th>
                <th className="py-3 px-3.5">Total Cobrado</th>
                <th className="py-3 px-3.5">Estado DTE (Hacienda)</th>
                <th className="py-3 px-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <p className="font-semibold">No se encontraron ventas para este filtro.</p>
                    {filterTab === 'PENDING_DTE' && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">
                        ✨ ¡Excelente! No tienes comprobantes pendientes de transmitir a Hacienda.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isFiscalDoc = sale.tipoComprobante === '01' || sale.tipoComprobante === '03';
                  const isDtePending = isFiscalDoc && !sale.dteInfo?.codigoGeneracion;

                  return (
                    <tr 
                      key={sale.id} 
                      className={`transition-colors ${isDtePending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/60'}`}
                    >
                      {/* N° Venta y Hora */}
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-800 font-mono block">#{sale.saleNumber}</span>
                        <span className="text-[10.5px] text-slate-400">
                          {new Date(sale.createdAt).toLocaleDateString('es-SV')} • {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800">{sale.cliente.nombre}</div>
                        {sale.cliente.numDocumento && (
                          <div className="text-[10.5px] font-mono text-slate-400">Doc: {sale.cliente.numDocumento}</div>
                        )}
                      </td>

                      {/* Tipo Comprobante */}
                      <td className="py-3 px-3.5">
                        <span className={`clay-badge text-[10.5px] font-bold py-0.5 px-2 ${
                          sale.tipoComprobante === '03'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : sale.tipoComprobante === '01'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sale.tipoComprobante === '03' ? 'Crédito Fiscal (03)' : sale.tipoComprobante === '01' ? 'Factura (01)' : 'Ticket de Caja'}
                        </span>
                      </td>

                      {/* Método Pago */}
                      <td className="py-3 px-3.5 font-semibold text-slate-600">
                        {sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : sale.paymentMethod}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3.5 font-black text-slate-900 font-mono text-sm">
                        ${sale.total.toFixed(2)}
                      </td>

                      {/* Estado DTE (Hacienda) */}
                      <td className="py-3 px-3.5">
                        {isDtePending ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Pendiente Transmisión</span>
                            </span>
                            <button
                              type="button"
                              disabled={transmittingId === sale.id}
                              onClick={() => handleTransmitDte(sale)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 shadow-xs transition-all disabled:opacity-50"
                              title="Transmitir este DTE a Factura Llama ahora"
                            >
                              {transmittingId === sale.id ? (
                                <>
                                  <RotateCw className="w-2.5 h-2.5 animate-spin" />
                                  <span>Transmitiendo...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-2.5 h-2.5" />
                                  <span>Transmitir a MH</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : sale.dteInfo?.codigoGeneracion ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{sale.dteInfo.estado || 'PROCESADO'}</span>
                              {sale.dteInfo.simulated && (
                                <span className="text-[9.5px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                  Simulado
                                </span>
                              )}
                            </div>
                            {sale.dteInfo.numeroControl && (
                              <span className="font-mono text-[9.5px] text-slate-500 truncate max-w-[150px]">
                                {sale.dteInfo.numeroControl}
                              </span>
                            )}
                            <a
                              href={`/api/dte/${sale.dteInfo.codigoGeneracion}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-0.5"
                            >
                              <FileDown className="w-2.5 h-2.5" /> Ver PDF Oficial
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Ticket Interno</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(sale)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors shadow-xs"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle de Venta y DTE */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedSale(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">Detalle de Venta</h3>
            <p className="text-xs font-mono text-indigo-600 mb-4">#{selectedSale.saleNumber}</p>

            {/* DTE Box: Estado del Comprobante Fiscal */}
            {selectedSale.dteInfo?.codigoGeneracion ? (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 mb-4 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    DTE-{selectedSale.tipoComprobante} • Certificado en Factura Llama
                  </span>
                  <span className="clay-badge bg-emerald-200/70 text-emerald-900 text-[10px] py-0.5 px-2 font-black">
                    {selectedSale.dteInfo.estado}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-700 space-y-1">
                  <p><strong>N° Control:</strong> {selectedSale.dteInfo.numeroControl}</p>
                  <p className="break-all"><strong>Código Generación:</strong> {selectedSale.dteInfo.codigoGeneracion}</p>
                  {selectedSale.dteInfo.selloRecepcion && (
                    <p className="break-all"><strong>Sello MH:</strong> {selectedSale.dteInfo.selloRecepcion}</p>
                  )}
                </div>
                <div className="pt-2 flex items-center gap-2 border-t border-emerald-200">
                  <a
                    href={`/api/dte/${selectedSale.dteInfo.codigoGeneracion}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="clay-btn px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                  >
                    <FileDown className="w-3 h-3" /> Descargar PDF Oficial
                  </a>
                </div>
              </div>
            ) : (selectedSale.tipoComprobante === '01' || selectedSale.tipoComprobante === '03') ? (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 mb-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>DTE-{selectedSale.tipoComprobante} Pendiente de Transmisión (Contingencia)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Esta venta fue registrada sin internet. No cuenta con Sello de Recepción de Hacienda todavía.
                </p>
                <button
                  type="button"
                  disabled={transmittingId === selectedSale.id}
                  onClick={() => handleTransmitDte(selectedSale)}
                  className="clay-btn px-3 py-1.5 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>{transmittingId === selectedSale.id ? 'Transmitiendo a Factura Llama...' : 'Transmitir a Factura Llama Ahora'}</span>
                </button>
              </div>
            ) : null}

            {/* Datos Cliente */}
            <div className="py-2 text-xs space-y-1 border-b border-slate-200 mb-3">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Cliente</p>
              <p className="font-bold text-slate-800 text-sm">{selectedSale.cliente.nombre}</p>
              {selectedSale.cliente.numDocumento && (
                <p className="text-slate-600 font-mono">Doc: {selectedSale.cliente.numDocumento}</p>
              )}
              {selectedSale.cliente.nrc && (
                <p className="text-slate-600 font-mono">NRC: {selectedSale.cliente.nrc}</p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Artículos</p>
              {selectedSale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800">{it.name}</span>
                    <span className="text-slate-400 block">{it.quantity} x ${it.price.toFixed(2)}</span>
                  </div>
                  <span className="font-black text-slate-900">${it.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Neto):</span>
                <span>${selectedSale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>IVA 13%:</span>
                <span>${selectedSale.ivaTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total:</span>
                <span className="text-indigo-600 text-xl font-black">${selectedSale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botón Imprimir */}
            <div className="mt-5">
              <button
                onClick={() => window.print()}
                className="clay-btn clay-btn-light w-full py-3 text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
