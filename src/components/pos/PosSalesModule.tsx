'use client';

import React from 'react';
import { Droplets, DollarSign, Tag, FileCheck, Flame, Search, Eye } from 'lucide-react';
import { SaleRecord } from '@/lib/store';

export interface PosSalesModuleProps {
  sales: SaleRecord[];
  totalOnzasVendidas: number;
  totalMontoVentas: number;
  totalBotesVendidos: number;
  rankingFragancias: Array<{
    sku?: string;
    name: string;
    onzas: number;
    totalMonto: number;
  }>;
  ventasSearch: string;
  setVentasSearch: (val: string) => void;
  setSelectedSaleDetail: (sale: SaleRecord) => void;
}

export const PosSalesModule: React.FC<PosSalesModuleProps> = React.memo(({
  sales,
  totalOnzasVendidas,
  totalMontoVentas,
  totalBotesVendidos,
  rankingFragancias,
  ventasSearch,
  setVentasSearch,
  setSelectedSaleDetail,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* KPI PRINCIPAL: TOTAL DE ONZAS VENDIDAS EN EL DÍA */}
      <div
        className="clay-card-dark p-6 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #6d28d9 100%)' }}
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Droplets className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
                💧 Métrica Clave del Día
              </span>
              <span className="text-xs text-indigo-200">Perfumería & Fragancias</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">
              Resumen de Fragancias Vendidas en el Turno
            </h2>
            <p className="text-xs text-indigo-100/90 mt-1 max-w-xl">
              Monitoreo en tiempo real del consumo de esencias contratipo preparadas y despachadas en mostrador.
            </p>
          </div>

          <div className="text-left md:text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <span className="text-[11px] uppercase font-bold text-indigo-200 block">Total Onzas Despachadas</span>
            <div className="text-4xl md:text-5xl font-black font-mono tracking-tight text-amber-300">
              {totalOnzasVendidas} <span className="text-2xl text-white">Oz</span>
            </div>
            <span className="text-[10px] text-indigo-200 block mt-0.5">
              Equivalente a {(totalOnzasVendidas / 1.7).toFixed(0)} frascos de 50ml aprox.
            </span>
          </div>
        </div>
      </div>

      {/* Métricas Secundarias de Caja */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ingresos en Caja</p>
            <h3 className="text-xl font-black text-indigo-600 mt-0.5">
              ${totalMontoVentas.toFixed(2)}
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Recaudado en el turno</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="clay-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Botes & Atomizadores</p>
            <h3 className="text-xl font-black text-amber-600 mt-0.5">
              {totalBotesVendidos} Un.
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Envases de 30, 50 y 100ml</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner font-bold">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="clay-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comprobantes Emitidos</p>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">
              {sales.length}
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">DTEs Hacienda & Tickets</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ranking de Fragancias por Onzas Vendidas */}
      <div className="clay-card p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Ranking de Fragancias Más Vendidas (en Onzas)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Desglose de cada esencia solicitada por los clientes hoy
            </p>
          </div>
          <span className="clay-badge text-[10px] bg-amber-100 text-amber-900 font-bold">
            {rankingFragancias.length} esencias distintas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3" style={{ width: '10%' }}>SKU</th>
                <th className="py-2.5 px-3" style={{ width: '50%' }}>Fragancia / Contratipo</th>
                <th className="py-2.5 px-3 text-right" style={{ width: '20%' }}>Onzas Vendidas</th>
                <th className="py-2.5 px-3 text-right" style={{ width: '20%' }}>Total Recaudado ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankingFragancias.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Aún no se han registrado ventas de fragancias en este turno.
                  </td>
                </tr>
              ) : (
                rankingFragancias.map((frag, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      #{frag.sku || 'S/N'}
                    </td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-800">
                      {frag.name}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="clay-badge text-xs font-mono font-black bg-indigo-100 text-indigo-800 px-2 py-0.5">
                        {frag.onzas} Oz
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-800">
                      ${frag.totalMonto.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Listado Completo de Comprobantes del Día */}
      <div className="clay-card p-5 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-sm font-black text-slate-800">
            Historial de Comprobantes Emitidos en Caja
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Buscar comanda (#CMD-1081) o cliente..."
              value={ventasSearch}
              onChange={(e) => setVentasSearch(e.target.value)}
              className="clay-input has-icon w-full pr-3 py-1.5 text-xs font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Comanda / Hora</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Comprobante DTE</th>
                <th className="py-2.5 px-3">Método</th>
                <th className="py-2.5 px-3 text-right">Total ($)</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No hay ventas registradas.
                  </td>
                </tr>
              ) : (
                sales
                  .filter(s => {
                    if (!ventasSearch.trim()) return true;
                    const q = ventasSearch.toLowerCase().trim();
                    return (
                      s.saleNumber.toLowerCase().includes(q) ||
                      s.cliente.nombre.toLowerCase().includes(q) ||
                      (s.dteInfo?.numeroControl && s.dteInfo.numeroControl.toLowerCase().includes(q))
                    );
                  })
                  .map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        <div>#{sale.saleNumber}</div>
                        <span className="text-[10px] text-slate-400 font-sans font-normal">
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-slate-800 block text-xs">{sale.cliente.nombre}</span>
                        {sale.cliente.numDocumento && (
                          <span className="text-[10px] font-mono text-slate-400">Doc: {sale.cliente.numDocumento}</span>
                        )}
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
                        {sale.dteInfo?.numeroControl && (
                          <span className="block text-[9.5px] font-mono text-emerald-700 font-bold mt-0.5 truncate max-w-[140px]">
                            {sale.dteInfo.numeroControl}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-bold text-[11px]">
                        {sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-indigo-700">
                        ${sale.total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleDetail(sale)}
                          className="clay-btn clay-btn-light px-2.5 py-1 text-[11px] font-bold text-indigo-700 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

PosSalesModule.displayName = 'PosSalesModule';
export default PosSalesModule;
