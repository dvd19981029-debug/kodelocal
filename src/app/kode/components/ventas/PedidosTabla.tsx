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
  Eye,
  Package,
  MapPin,
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
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">Numero de Pedido</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Cliente</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Teléfono</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Fecha Pedido</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Total</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Estado C807</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Numero de DTE</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Estado Envío</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Detalle</th>
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
                  const subtotalNum = parseFloat(p.subtotal?.toString() || '0');
                  const descuentoNum = parseFloat(p.descuento?.toString() || '0');
                  const costoEnvioNum = parseFloat(p.costo_envio?.toString() || '0');
                  const totalPagadoNum = parseFloat(p.total_pagado?.toString() || '0');
                  const cobroCceNum = parseFloat(p.monto_cobrar_cce?.toString() || '0');
                  const saldoPendiente = Math.max(0, totalNum - totalPagadoNum);
                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        className={`transition-colors ${
                          isExpanded
                            ? 'bg-indigo-50/90 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* 1. Numero de Pedido (Click para ver detalle) */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedPedidoId(isExpanded ? null : p.id)}
                            className={`font-mono font-black text-[1.15em] whitespace-nowrap tracking-tight cursor-pointer inline-flex items-center gap-1 text-left transition-all ${
                              isExpanded
                                ? 'bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg shadow-xs'
                                : `hover:underline ${getClienteColorPorEstado(p.estado)}`
                            }`}
                            title="Haz clic para ver qué lleva el pedido y cómo va a pagar"
                          >
                            <span>{p.numero_pedido}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 opacity-75 shrink-0" />
                            )}
                          </button>
                        </td>

                        {/* 2. Cliente */}
                        <td className={`py-2.5 px-3 whitespace-nowrap ${getClienteColorPorEstado(p.estado)}`}>
                          {p.cliente_nombre}
                        </td>

                        {/* 3. Teléfono */}
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
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
                        <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString('es-SV')}
                        </td>

                        {/* 5. Total */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-mono font-black text-slate-900 text-sm">
                            ${totalNum.toFixed(2)}
                          </div>
                        </td>

                        {/* 6. Estado C807 */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
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
                        <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                          {p.dte_numero_control || p.dte_codigo_generacion ? (
                            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span
                                className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[130px] whitespace-nowrap"
                                title={`DTE: ${p.dte_numero_control || p.dte_codigo_generacion}`}
                              >
                                {p.dte_numero_control || `${p.dte_codigo_generacion?.slice(0, 10)}...`}
                              </span>
                              {(p.dte_codigo_generacion || p.dte_pdf_url) && (
                                <a
                                  href={
                                    p.dte_codigo_generacion
                                      ? `/api/kode/dte/${p.dte_codigo_generacion}/pdf`
                                      : p.dte_pdf_url
                                  }
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
                        <td className="py-2.5 px-3 whitespace-nowrap">
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

                        {/* 9. Detalle */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedPedidoId(isExpanded ? null : p.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer border shadow-2xs ${
                              isExpanded
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            }`}
                            title={isExpanded ? 'Ocultar detalle del pedido' : 'Ver qué lleva y cómo va a pagar'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isExpanded ? 'Ocultar' : 'Ver detalle'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-indigo-50/40 border-l-4 border-l-indigo-600 border-b-2 border-b-indigo-200">
                          <td colSpan={9} className="py-2 px-4">
                            <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] leading-tight">
                              {/* 1. LO QUE LLEVA (COMPACTO: CÓDIGO + NOMBRE + VERSIÓN) */}
                              <div className="bg-white py-2 px-3 rounded-lg border border-indigo-200/80 shadow-2xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                                  <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                                    Lo que lleva ({p.items?.reduce((acc, it) => acc + (Number(it.cantidad) || 1), 0) || p.items?.length || 0})
                                  </span>
                                  {descuentoNum > 0 && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                      Promo -${descuentoNum.toFixed(0)}
                                    </span>
                                  )}
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {p.items.map((it, i) => {
                                    const isPlus = it.version === 'Plus' || (it.version as any) === 'EXTRA_SHOT';
                                    const cant = Number(it.cantidad) || 1;
                                    return (
                                      <div key={i} className="py-1 flex items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-1 min-w-0">
                                          {cant > 1 && (
                                            <span className="font-mono font-black text-indigo-700">
                                              {cant}x
                                            </span>
                                          )}
                                          <span className="font-mono font-bold text-slate-500 shrink-0">
                                            #{it.codigo}
                                          </span>
                                          <span className="font-bold text-slate-900 truncate">
                                            {it.contratipo}
                                          </span>
                                        </div>
                                        <span
                                          className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border shrink-0 ${
                                            isPlus
                                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                                              : 'bg-slate-100 text-slate-600 border-slate-200'
                                          }`}
                                        >
                                          {isPlus ? '⚡ Plus' : 'Normal'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 2. CÓMO VA A PAGAR (COMPACTO) */}
                              <div className="bg-white py-2 px-3 rounded-lg border border-indigo-200/80 shadow-2xs flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-1 mb-1.5">
                                    <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                                      Cómo va a pagar
                                    </span>
                                    <span
                                      className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase ${
                                        p.tipo_pago === 'CONTRAENTREGA'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : p.tipo_pago === 'MIXTO'
                                          ? 'bg-violet-50 text-violet-800 border-violet-200'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}
                                    >
                                      {p.tipo_pago || 'CONTRAENTREGA'}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-200/70 mb-1">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      Cobrar C807: <strong className="font-mono text-indigo-700">${cobroCceNum.toFixed(2)}</strong>
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">
                                      Anticipo: <strong className="font-mono text-emerald-600">${totalPagadoNum.toFixed(2)}</strong>
                                    </span>
                                  </div>

                                  {p.pagos && p.pagos.length > 0 && (
                                    <div className="space-y-0.5">
                                      {p.pagos.map((pg, idx) => {
                                        const esContraEntrega = String(pg.forma_pago_id) === '1003';
                                        return (
                                          <div key={pg.id || idx} className="flex items-center justify-between text-[11px] py-0.5 gap-1">
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span className="font-semibold text-slate-700 truncate">
                                                {pg.forma_pago_nombre || (esContraEntrega ? 'Contra Entrega' : 'Pago')}
                                              </span>
                                              {pg.comprobante_url && (
                                                <button
                                                  type="button"
                                                  onClick={() => onViewComprobante(pg.comprobante_url || '')}
                                                  className="text-[9px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-1 py-0.2 rounded cursor-pointer shrink-0"
                                                  title="Ver comprobante"
                                                >
                                                  Comprobante
                                                </button>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <span className="font-mono font-black text-slate-900">
                                                ${parseFloat(pg.monto?.toString() || '0').toFixed(2)}
                                              </span>
                                              {pg.id && !esContraEntrega && (
                                                <button
                                                  type="button"
                                                  onClick={() => onEliminarAbono(pg.id)}
                                                  title="Eliminar abono"
                                                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => onOpenAbonoModal(p)}
                                    className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    Registrar Abono
                                  </button>
                                </div>
                              </div>

                              {/* 3. DIRECCIÓN DE ENTREGA (COMPACTO) */}
                              <div className="bg-white py-2 px-3 rounded-lg border border-indigo-200/80 shadow-2xs flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                    <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                                      Destino
                                    </span>
                                    {p.vendedora_nombre && (
                                      <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={p.vendedora_nombre}>
                                        Por: <strong className="text-slate-600">{p.vendedora_nombre.split(' ')[0]}</strong>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-900 font-semibold leading-snug">
                                    {p.cliente_direccion}
                                  </p>
                                  <p className="text-slate-500 text-[10px] font-medium">
                                    {p.cliente_municipio}, {p.cliente_departamento}
                                    {p.cliente_referencia ? ` · Ref: ${p.cliente_referencia}` : ''}
                                  </p>
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
