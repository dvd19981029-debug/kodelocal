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
  ChevronDown,
  ChevronUp,
  Package,
  CreditCard,
  MapPin,
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
  const [filtroLogisticaDias, setFiltroLogisticaDias] = useState<'7dias' | 'todos'>('7dias');
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState<string | null>(null);

  // Módulo de Logística C807: Envíos filtrados y ordenados del más reciente al más antiguo
  const { pedidosLogistica, conteoLogistica7Dias, conteoLogisticaTodos } = useMemo(() => {
    const ahora = Date.now();
    const limite7Dias = ahora - 7 * 24 * 60 * 60 * 1000;

    // Pedidos de los últimos 7 días
    const pedidosEn7Dias = pedidos.filter((p) => {
      const f = p.created_at || p.c807_fecha_guia;
      if (!f) return true;
      const t = new Date(f).getTime();
      return !isNaN(t) && t >= limite7Dias;
    });

    const conteoLogistica7Dias = pedidosEn7Dias.length;
    const conteoLogisticaTodos = pedidos.length;

    let list = filtroLogisticaDias === '7dias' ? pedidosEn7Dias : pedidos;

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

    // Ordenar siempre del más reciente al más antiguo
    const sorted = [...list].sort((a, b) => {
      const timeA = new Date(a.created_at || a.c807_fecha_guia || 0).getTime();
      const timeB = new Date(b.created_at || b.c807_fecha_guia || 0).getTime();
      return timeB - timeA;
    });

    return {
      pedidosLogistica: sorted,
      conteoLogistica7Dias,
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

        {/* BOTONES DE FILTRO: ÚLTIMOS 7 DÍAS / TODOS LOS PEDIDOS */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setFiltroLogisticaDias('7dias')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filtroLogisticaDias === '7dias'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Últimos 7 días</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {conteoLogistica7Dias}
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
            <span>Todos los pedidos</span>
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
                  const isExpanded = expandedPedidoId === p.id;
                  const tieneGuia = !!p.c807_guia_numero && p.c807_guia_numero !== 'PENDIENTE';
                  const linkRastreo = getC807TrackingUrl(p.c807_guia_numero, p.c807_link_rastreo);
                  const totalNum = parseFloat(p.total?.toString() || '0');
                  const subtotalNum = parseFloat(p.subtotal?.toString() || '0');
                  const descuentoNum = parseFloat(p.descuento?.toString() || '0');
                  const costoEnvioNum = parseFloat(p.costo_envio?.toString() || '0');
                  const totalPagadoNum = parseFloat(p.total_pagado?.toString() || '0');
                  const cobroCceNum = parseFloat(p.monto_cobrar_cce?.toString() || '0');

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
                        <td className="py-2.5 px-4 whitespace-nowrap">
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
                        <td className={`py-2.5 px-4 whitespace-nowrap ${getClienteColorPorEstado(p.estado)}`}>
                          {p.cliente_nombre}
                        </td>

                        {/* 3. Teléfono */}
                        <td className="py-2.5 px-4 font-mono whitespace-nowrap">
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
                        <td className="py-2.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString('es-SV')}
                        </td>

                        {/* 5. Total */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-black text-slate-900 text-sm">
                            ${totalNum.toFixed(2)}
                          </div>
                        </td>

                        {/* 6. Estado C807 */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
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
                        <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap">
                          {p.dte_numero_control || p.dte_codigo_generacion ? (
                            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap text-[11px]">
                                {p.dte_numero_control || p.dte_codigo_generacion?.slice(0, 15)}
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
                                  className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded hover:bg-emerald-50 transition-colors inline-flex"
                                  title="Ver DTE Factura Llama (PDF)"
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
                        <td className="py-2.5 px-4 whitespace-nowrap">
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
                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                          {p.cliente_municipio ? `${p.cliente_municipio}, ${p.cliente_departamento}` : p.cliente_departamento || '-'}
                        </td>

                        {/* 10. Acciones WhatsApp */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
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

                            {!(p.dte_numero_control || p.dte_codigo_generacion) && (
                              <button
                                type="button"
                                onClick={() => onEmitirDte(p)}
                                disabled={emitiendoDteId === p.id}
                                className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                title="Emitir Factura Electrónica (DTE) manualmente si aún no ha sido emitida"
                              >
                                <ReceiptText className={`w-3 h-3 ${emitiendoDteId === p.id ? 'animate-spin' : 'text-emerald-600'}`} />
                                <span>{emitiendoDteId === p.id ? 'Emitiendo...' : 'Facturar DTE'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-indigo-50/40 border-l-4 border-l-indigo-600 border-b-2 border-b-indigo-200">
                          <td colSpan={10} className="py-2 px-4">
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
                                          <div key={pg.id || idx} className="flex items-center justify-between text-[11px] py-0.5">
                                            <span className="font-semibold text-slate-700">
                                              {pg.forma_pago_nombre || (esContraEntrega ? 'Contra Entrega' : 'Pago')}{' '}
                                              <span className="text-[10px] text-slate-400">
                                                ({esContraEntrega ? 'Al recibir' : pg.estado_pago || 'Pagado'})
                                              </span>
                                            </span>
                                            <span className="font-mono font-black text-slate-900">
                                              ${parseFloat(pg.monto?.toString() || '0').toFixed(2)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
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
}
