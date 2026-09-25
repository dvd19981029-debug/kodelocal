'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  ExternalLink,
  FileText,
  Truck,
  CreditCard,
  Plus,
  ImageIcon,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Pedido } from '../../types';
import {
  getClienteColorPorEstado,
  getC807TrackingUrl,
  renderBadgeEstadoC807,
} from '../../utils/c807Helpers';

interface PedidosTablaProps {
  pedidos: Pedido[];
  filtroEstado: string;
  setFiltroEstado: (estado: string) => void;
  onVolver: () => void;
  onRefresh: () => Promise<void> | void;
  onGenerarGuia: (pedido: Pedido) => void;
  generandoGuiaPedidoId: string | null;
  onOpenAbonoModal: (pedido: Pedido) => void;
  onViewComprobante: (url: string) => void;
  onEliminarAbono: (pagoId: string) => Promise<void> | void;
}

export const PedidosTabla: React.FC<PedidosTablaProps> = ({
  pedidos,
  filtroEstado,
  setFiltroEstado,
  onVolver,
  onRefresh,
  onGenerarGuia,
  generandoGuiaPedidoId,
  onOpenAbonoModal,
  onViewComprobante,
  onEliminarAbono,
}) => {
  const [expandedPedidoId, setExpandedPedidoId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <button
          onClick={onVolver}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 self-start cursor-pointer"
        >
          ← Volver a Ventas
        </button>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={onRefresh}
            className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            title="Actualizar tabla de pedidos en tiempo real"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <div className="flex gap-1.5 text-xs overflow-x-auto shrink-0">
            {['TODOS', 'PENDIENTE_COMPRA', 'PENDIENTE_PREPARAR', 'GUIA_CREADA'].map((st) => (
              <button
                key={st}
                onClick={() => setFiltroEstado(st)}
                className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  filtroEstado === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st === 'TODOS'
                  ? 'Todos'
                  : st === 'PENDIENTE_COMPRA'
                  ? '🔴 Registrado'
                  : st === 'PENDIENTE_PREPARAR'
                  ? '🟡 Insumos comprados'
                  : '🔵 Enviado'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1250px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">Numero de Pedido</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Cliente</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Teléfono</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Fecha Pedido</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Total</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Estado C807</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Numero de DTE</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Estado Envío</th>
                <th className="py-2.5 px-4 text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                pedidos.map((p) => {
                  const isExpanded = expandedPedidoId === p.id;
                  const totalNum = parseFloat(p.total?.toString() || '0');
                  const totalPagadoNum = parseFloat(p.total_pagado?.toString() || '0');
                  const saldoPendiente = Math.max(0, totalNum - totalPagadoNum);
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Numero de Pedido */}
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {p.numero_pedido}
                        </td>

                        {/* 2. Cliente */}
                        <td className={`py-3 px-4 whitespace-nowrap ${getClienteColorPorEstado(p.estado)}`}>
                          {p.cliente_nombre}
                        </td>

                        {/* 3. Teléfono */}
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <a
                            href={`https://wa.me/503${p.cliente_telefono}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:underline font-bold"
                          >
                            {p.cliente_telefono}
                          </a>
                        </td>

                        {/* 4. Fecha Pedido */}
                        <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString('es-SV')}
                        </td>

                        {/* 5. Total */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-black text-slate-900">
                            ${totalNum.toFixed(2)}
                          </div>
                          <div className="mt-0.5">
                            {p.estado_pago === 'PAGADO' ? (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full inline-block whitespace-nowrap">
                                ✓ Pagado
                              </span>
                            ) : p.estado_pago === 'PARCIAL' ? (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full inline-block whitespace-nowrap" title={`Abonado: $${totalPagadoNum.toFixed(2)}`}>
                                ⏳ Parcial (${totalPagadoNum.toFixed(2)})
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full inline-block whitespace-nowrap">
                                ✕ Pendiente
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 6. Estado C807 */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.c807_guia_numero && p.c807_guia_numero !== 'PENDIENTE' ? (
                            <div className="flex flex-col gap-1 items-start whitespace-nowrap">
                              {renderBadgeEstadoC807(p.c807_estado, true)}
                              <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                  {p.c807_guia_numero}
                                </span>
                                {getC807TrackingUrl(p.c807_guia_numero, p.c807_link_rastreo) && (
                                  <a
                                    href={getC807TrackingUrl(p.c807_guia_numero, p.c807_link_rastreo)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded hover:bg-indigo-50 transition-colors inline-flex"
                                    title="Rastrear Guía C807"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onGenerarGuia(p)}
                                disabled={generandoGuiaPedidoId === p.id}
                                className="px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                title="Generar Guía con C807 Express y emitir DTE automáticamente"
                              >
                                <Truck className={`w-3.5 h-3.5 ${generandoGuiaPedidoId === p.id ? 'animate-spin' : ''}`} />
                                <span>{generandoGuiaPedidoId === p.id ? 'Generando...' : 'Generar Guía'}</span>
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 7. Numero de DTE */}
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                          {p.dte_numero_control || p.dte_codigo_generacion ? (
                            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span
                                className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[140px] whitespace-nowrap"
                                title={`DTE: ${p.dte_numero_control || p.dte_codigo_generacion}`}
                              >
                                {p.dte_numero_control || `${p.dte_codigo_generacion?.slice(0, 10)}...`}
                              </span>
                              {p.dte_pdf_url && (
                                <a
                                  href={p.dte_pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded hover:bg-emerald-100 transition-colors inline-flex"
                                  title="Ver Factura DTE (PDF)"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">-</span>
                          )}
                        </td>

                        {/* 8. Estado Envío */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {(p.estado === 'Registrado' || p.estado === 'PENDIENTE_COMPRA') && (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full inline-block whitespace-nowrap">
                              🔴 Registrado
                            </span>
                          )}
                          {(p.estado === 'Insumos comprados' || p.estado === 'PENDIENTE_PREPARAR') && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full inline-block whitespace-nowrap">
                              🟡 Insumos comprados
                            </span>
                          )}
                          {(p.estado === 'Preparado' || p.estado === 'Enviado' || p.estado === 'GUIA_CREADA') && (
                            <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full inline-block whitespace-nowrap">
                              🔵 Enviado
                            </span>
                          )}
                          {(p.estado === 'Entregado' || p.estado === 'ENTREGADO') && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block whitespace-nowrap">
                              🟢 Entregado
                            </span>
                          )}
                          {(p.estado === 'Cancelado' || p.estado === 'CANCELADO') && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-300 px-2.5 py-0.5 rounded-full inline-block whitespace-nowrap">
                              ⚪ Cancelado
                            </span>
                          )}
                        </td>

                        {/* 9. Acciones */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setExpandedPedidoId(isExpanded ? null : p.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
                            title={isExpanded ? 'Contraer detalles' : 'Expandir detalles'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={9} className="p-4 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-700 block mb-1">Destino:</span>
                                <p className="text-slate-900">{p.cliente_direccion}</p>
                                <p className="text-slate-500">{p.cliente_municipio}, {p.cliente_departamento}</p>
                                {p.cliente_referencia && <p className="text-indigo-600 font-bold mt-1">Ref: {p.cliente_referencia}</p>}
                                {p.notas && <p className="text-slate-500 text-[11px] mt-2 pt-2 border-t border-slate-100 italic">Notas: {p.notas}</p>}
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <span className="font-bold text-slate-700 block mb-1">Fragancias ({p.items.length}):</span>
                                {p.items.map((it, i) => (
                                  <div key={i} className="flex justify-between py-0.5 border-b border-slate-50 last:border-0">
                                    <span>#{it.codigo} - {it.contratipo} ({it.version === 'Plus' || (it.version as any) === 'EXTRA_SHOT' ? 'Plus' : 'Normal'})</span>
                                    <span className="font-mono font-bold">${it.subtotal}</span>
                                  </div>
                                ))}
                              </div>

                              {/* MÓDULO DE CONTROL FINANCIERO Y ABONOS BANCARIOS */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200 col-span-1 md:col-span-2 space-y-3 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-indigo-600" />
                                    <span className="font-extrabold text-slate-800">
                                      Control de Pagos & Abonos Bancarios
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onOpenAbonoModal(p)}
                                    className="clay-btn clay-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Registrar Abono / Pago
                                  </button>
                                </div>

                                {/* Métricas del pedido */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Pedido</span>
                                    <span className="font-mono font-black text-slate-800 text-sm">
                                      ${totalNum.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Abonado</span>
                                    <span className="font-mono font-black text-emerald-600 text-sm">
                                      ${totalPagadoNum.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Saldo Pendiente</span>
                                    <span className={`font-mono font-black text-sm ${saldoPendiente > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                      ${saldoPendiente.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Cobro C807 (CCE)</span>
                                    <span className="font-mono font-black text-indigo-700 text-sm">
                                      ${parseFloat(p.monto_cobrar_cce?.toString() || '0').toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                {/* Historial de Abonos */}
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-bold text-slate-600 block">
                                    Historial de Transacciones / Abonos:
                                  </span>
                                  {(!p.pagos || p.pagos.length === 0) ? (
                                    <div className="text-center py-3 text-slate-400 text-xs bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                                      No hay abonos registrados para este pedido. Usa el botón "Registrar Abono / Pago" para agregar uno.
                                    </div>
                                  ) : (
                                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                                      {p.pagos.map((pg) => (
                                        <div key={pg.id} className="p-2.5 bg-white flex flex-wrap items-center justify-between gap-2 text-xs hover:bg-slate-50/50 transition-colors">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="clay-badge text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                                              {pg.fecha_pago}
                                            </span>
                                            <span className="font-bold text-slate-800">
                                              {pg.forma_pago_nombre || 'Pago'}
                                            </span>
                                            {pg.num_documento_auto && (
                                              <span className="font-mono text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                                                Doc: {pg.num_documento_auto}
                                              </span>
                                            )}
                                            {pg.comprobante_url && (
                                              <button
                                                type="button"
                                                onClick={() => onViewComprobante(pg.comprobante_url || '')}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-0.5 rounded transition-colors shadow-2xs cursor-pointer"
                                                title="Ver captura o comprobante adjunto"
                                              >
                                                <ImageIcon className="w-3 h-3 text-violet-600" />
                                                <span>Ver Comprobante</span>
                                              </button>
                                            )}
                                            {pg.usuario && (
                                              <span className="text-slate-400 text-[10px]">por {pg.usuario}</span>
                                            )}
                                            {pg.observaciones && (
                                              <span className="text-slate-500 text-[11px] italic">({pg.observaciones})</span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="font-mono font-black text-emerald-700 text-sm">
                                              +${parseFloat(pg.monto?.toString() || '0').toFixed(2)}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => onEliminarAbono(pg.id)}
                                              title="Eliminar este abono"
                                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
