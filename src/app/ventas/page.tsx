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
  X,
  CreditCard,
  Banknote
} from 'lucide-react';
import { SaleRecord } from '@/lib/store';

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

  useEffect(() => {
    localStorage.setItem('kodelocal_sales', JSON.stringify(sales));
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      return (
        s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.dteInfo?.codigoGeneracion && s.dteInfo.codigoGeneracion.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.dteInfo?.numeroControl && s.dteInfo.numeroControl.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [sales, searchQuery]);

  const totalVentas = useMemo(() => sales.reduce((acc, s) => acc + s.total, 0), [sales]);
  const totalIvaRecaudado = useMemo(() => sales.reduce((acc, s) => acc + s.ivaTotal, 0), [sales]);
  const dteCount = useMemo(() => sales.filter(s => s.tipoComprobante === '01' || s.tipoComprobante === '03').length, [sales]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Totales</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">${totalVentas.toFixed(2)}</h3>
            <span className="text-xs text-slate-500 font-medium">{sales.length} transacciones</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(99,102,241,0.2)]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">DTEs Transmitidos (MH)</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{dteCount}</h3>
            <span className="text-xs text-slate-500 font-medium">Facturas y Créditos Fiscales</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(16,185,129,0.2)]">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">IVA Débito Fiscal (13%)</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">${totalIvaRecaudado.toFixed(2)}</h3>
            <span className="text-xs text-slate-500 font-medium">Impuesto desglosado para Hacienda</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(168,85,247,0.2)]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Barra de Búsqueda */}
      <div className="clay-card p-4 sm:p-5 flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar por N° Venta, Cliente, Código de Generación o N° Control..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input has-icon w-full pr-4 py-2.5 text-sm font-mono"
          />
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="clay-card overflow-hidden p-2 sm:p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">N° Venta / Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Comprobante</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Estado DTE</th>
                <th className="py-3 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                  
                  {/* N° Venta y Hora */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 font-mono block">{sale.saleNumber}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  {/* Cliente */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-700">{sale.cliente.nombre}</div>
                    {sale.cliente.numDocumento && (
                      <div className="text-xs font-mono text-slate-400">{sale.cliente.numDocumento}</div>
                    )}
                  </td>

                  {/* Tipo Comprobante */}
                  <td className="py-3 px-4">
                    <span className={`clay-badge text-xs py-1 px-2.5 ${
                      sale.tipoComprobante === '03'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : sale.tipoComprobante === '01'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sale.tipoComprobante === '03' ? 'Crédito Fiscal (03)' : sale.tipoComprobante === '01' ? 'Factura (01)' : 'Ticket'}
                    </span>
                  </td>

                  {/* Método Pago */}
                  <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                    {sale.paymentMethod}
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 font-black text-slate-900 text-base">
                    ${sale.total.toFixed(2)}
                  </td>

                  {/* Estado DTE */}
                  <td className="py-3 px-4">
                    {sale.dteInfo ? (
                      <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{sale.dteInfo.estado}</span>
                        {sale.dteInfo.simulated && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Simulado
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Sin DTE</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors shadow-[1px_2px_4px_rgba(164,177,198,0.2)]"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              ))}
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
            <p className="text-xs font-mono text-indigo-600 mb-4">{selectedSale.saleNumber}</p>

            {/* DTE Box */}
            {selectedSale.dteInfo && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 mb-4 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-indigo-800">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    Factura Llama - DTE-{selectedSale.tipoComprobante}
                  </span>
                  <span className="clay-badge bg-emerald-100 text-emerald-800 text-[10px] py-0.5 px-2">
                    {selectedSale.dteInfo.estado}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 space-y-1">
                  <p><strong>N° Control:</strong> {selectedSale.dteInfo.numeroControl}</p>
                  <p className="break-all"><strong>Código de Generación:</strong> {selectedSale.dteInfo.codigoGeneracion}</p>
                  {selectedSale.dteInfo.selloRecepcion && (
                    <p className="break-all"><strong>Sello de Recepción MH:</strong> {selectedSale.dteInfo.selloRecepcion}</p>
                  )}
                </div>
              </div>
            )}

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
