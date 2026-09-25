'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Layers,
  ExternalLink,
  Truck,
  FileText,
  Check,
  Copy,
  MessageCircle,
  ReceiptText,
} from 'lucide-react';
import { Pedido } from '../../types';
import {
  getC807TrackingUrl,
  renderBadgeEstadoC807,
  getClienteColorPorEstado,
} from '../../utils/c807Helpers';

interface LogisticaViewProps {
  pedidos: Pedido[];
  searchQuery?: string;
  onGenerarGuiaDirecta: (pedido: Pedido) => Promise<void>;
  generandoGuiaPedidoId: string | null;
  onAsignarGuiaManual: (pedido: Pedido) => void;
  onEmitirDte: (pedido: Pedido) => Promise<void>;
  emitiendoDteId: string | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function LogisticaView({
  pedidos,
  searchQuery = '',
  onGenerarGuiaDirecta,
  generandoGuiaPedidoId,
  onAsignarGuiaManual,
  onEmitirDte,
  emitiendoDteId,
  showToast,
}: LogisticaViewProps) {
  const [filtroLogisticaDias, setFiltroLogisticaDias] = useState<'20dias' | 'todos'>('20dias');
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Módulo de Logística C807: Envíos filtrados y ordenados de más reciente a más antigua
  const { pedidosLogistica, conteoLogistica20Dias, conteoLogisticaTodos } = useMemo(() => {
    const ahora = Date.now();
    const limite20Dias = ahora - 20 * 24 * 60 * 60 * 1000;

    // Base de logística: pedidos con guía asignada o en estados de envío/despacho
    const base = pedidos.filter(
      (p) =>
        p.c807_guia_numero ||
        p.estado === 'GUIA_CREADA' ||
        p.estado === 'PENDIENTE_PREPARAR' ||
        p.estado === 'Enviado' ||
        p.estado === 'Entregado'
    );

    const pedidosEn20Dias = base.filter((p) => {
      const f = p.c807_fecha_guia || p.created_at;
      if (!f) return true;
      const t = new Date(f).getTime();
      return !isNaN(t) && t >= limite20Dias;
    });

    const conteoLogistica20Dias = pedidosEn20Dias.length;
    const conteoLogisticaTodos = base.length;

    let list = filtroLogisticaDias === '20dias' ? pedidosEn20Dias : base;

    // Filtro por buscador superior
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.numero_pedido.toLowerCase().includes(q) ||
          (p.c807_guia_numero || '').toLowerCase().includes(q) ||
          p.cliente_nombre.toLowerCase().includes(q) ||
          (p.cliente_municipio || '').toLowerCase().includes(q) ||
          (p.cliente_departamento || '').toLowerCase().includes(q) ||
          (p.c807_estado || '').toLowerCase().includes(q)
      );
    }

    // Ordenar siempre de la más reciente a la más antigua
    const sorted = [...list].sort((a, b) => {
      const timeA = new Date(a.c807_fecha_guia || a.created_at || 0).getTime();
      const timeB = new Date(b.c807_fecha_guia || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    return {
      pedidosLogistica: sorted,
      conteoLogistica20Dias,
      conteoLogisticaTodos,
    };
  }, [pedidos, searchQuery, filtroLogisticaDias]);

  const handleCopiarMensajeC807 = (p: Pedido) => {
    const link = getC807TrackingUrl(p.c807_guia_numero, p.c807_link_rastreo);
    const mensaje = `Buenas tardes\nSu orden con el número de pedido ${p.numero_pedido} ya se encuentra en camino.\nLe comparto el número de rastreo: ${p.c807_guia_numero || 'Pendiente'}${link ? `\nPuede rastrearlo en este link: ${link}` : ''}`;
    navigator.clipboard.writeText(mensaje);
    setCopiedTrackingId(p.id);
    showToast('Mensaje de WhatsApp copiado', 'info');
    setTimeout(() => setCopiedTrackingId(null), 3000);
  };

  const handleAbrirWhatsAppC807 = (p: Pedido) => {
    const link = getC807TrackingUrl(p.c807_guia_numero, p.c807_link_rastreo);
    const mensaje = `Buenas tardes\nSu orden con el número de pedido ${p.numero_pedido} ya se encuentra en camino.\nLe comparto el número de rastreo: ${p.c807_guia_numero || ''}${link ? `\nPuede rastrearlo en este link: ${link}` : ''}`;
    const url = `https://wa.me/503${p.cliente_telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">
            LOGISTICA & ENVIOS C807
          </h2>
          <span className="text-xs text-slate-500 font-mono font-medium">
            {pedidosLogistica.length} {pedidosLogistica.length === 1 ? 'guía mostrada' : 'guías mostradas'}
          </span>
        </div>

        {/* BOTONES DE FILTRO: ÚLTIMOS 20 DÍAS / TODOS */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setFiltroLogisticaDias('20dias')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroLogisticaDias === '20dias'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Últimos 20 días</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {conteoLogistica20Dias}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroLogisticaDias('todos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroLogisticaDias === 'todos'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver todos</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {conteoLogisticaTodos}
            </span>
          </button>
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
                <th className="py-2.5 px-4 whitespace-nowrap">Destino</th>
                <th className="py-2.5 px-4 text-center whitespace-nowrap">Acciones WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pedidosLogistica.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    {filtroLogisticaDias === '20dias'
                      ? 'No hay envíos registrados en los últimos 20 días.'
                      : 'No hay envíos registrados en logística.'}
                  </td>
                </tr>
              ) : (
                pedidosLogistica.map((p) => {
                  const tieneGuia = !!p.c807_guia_numero && p.c807_guia_numero !== 'PENDIENTE';
                  const linkRastreo = getC807TrackingUrl(p.c807_guia_numero, p.c807_link_rastreo);
                  const totalNum = parseFloat(p.total?.toString() || '0');
                  const totalPagadoNum = parseFloat(p.total_pagado?.toString() || '0');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
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
                        {tieneGuia ? (
                          <div className="flex flex-col gap-1 items-start whitespace-nowrap">
                            {renderBadgeEstadoC807(p.c807_estado, true)}
                            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                {p.c807_guia_numero}
                              </span>
                              {linkRastreo && (
                                <a
                                  href={linkRastreo}
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
                              onClick={() => onGenerarGuiaDirecta(p)}
                              disabled={generandoGuiaPedidoId === p.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                              title="Generar Guía con C807 Express y emitir DTE automáticamente"
                            >
                              <Truck className={`w-3.5 h-3.5 ${generandoGuiaPedidoId === p.id ? 'animate-spin' : ''}`} />
                              <span>{generandoGuiaPedidoId === p.id ? 'Generando...' : 'Generar Guía'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onAsignarGuiaManual(p)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Asignar guía manual"
                            >
                              Manual
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 7. Numero de DTE */}
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                        {p.dte_numero_control || p.dte_codigo_generacion ? (
                          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap text-[11px]">
                              {p.dte_numero_control || p.dte_codigo_generacion?.slice(0, 15)}
                            </span>
                            {p.dte_pdf_url && (
                              <a
                                href={p.dte_pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded hover:bg-emerald-50 transition-colors inline-flex"
                                title="Ver DTE Factura Llama"
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

                      {/* 9. Destino */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {p.cliente_municipio ? `${p.cliente_municipio}, ${p.cliente_departamento}` : p.cliente_departamento || '-'}
                      </td>

                      {/* 10. Acciones WhatsApp */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleCopiarMensajeC807(p)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Copiar mensaje WhatsApp"
                          >
                            {copiedTrackingId === p.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedTrackingId === p.id ? 'Copiado' : 'Copiar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAbrirWhatsAppC807(p)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Enviar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEmitirDte(p)}
                            disabled={emitiendoDteId === p.id}
                            className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                            title="Emitir Factura Electrónica (DTE) con Factura Llama"
                          >
                            <ReceiptText className={`w-3 h-3 ${emitiendoDteId === p.id ? 'animate-spin' : 'text-emerald-600'}`} />
                            <span>{emitiendoDteId === p.id ? 'Emitiendo...' : 'Facturar DTE'}</span>
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
  );
}
