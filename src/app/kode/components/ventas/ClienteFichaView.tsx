'use client';

import React from 'react';
import {
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  User,
  Phone,
  MessageCircle,
  Plus,
  ExternalLink,
  Truck,
  FileText,
  X,
} from 'lucide-react';
import { ClienteDirectorioItem, Pedido } from '../../types';
import {
  getClienteColorPorEstado,
  getC807TrackingUrl,
  renderBadgeEstadoC807,
} from '../../utils/c807Helpers';

interface ClienteFichaViewProps {
  cliente: ClienteDirectorioItem | null;
  pedidos: Pedido[];
  onClose: () => void;
  onNuevoPedido: (cliente: ClienteDirectorioItem) => void;
  onGenerarGuia: (pedido: Pedido) => void;
  generandoGuiaPedidoId: string | null;
}

export const ClienteFichaView: React.FC<ClienteFichaViewProps> = ({
  cliente,
  pedidos,
  onClose,
  onNuevoPedido,
  onGenerarGuia,
  generandoGuiaPedidoId,
}) => {
  if (!cliente) return null;

  const totalFacturado = pedidos.reduce(
    (sum, p) => sum + parseFloat(p.total?.toString() || '0'),
    0
  );
  const entregadosCount = pedidos.filter(
    (p) => p.estado === 'Entregado' || p.estado === 'ENTREGADO'
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header del Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/50 border border-indigo-400/40 flex items-center justify-center text-lg font-black text-white shadow-inner">
              {cliente.nombre
                ? cliente.nombre
                    .split(' ')
                    .filter(Boolean)
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'CL'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {cliente.nombre}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Ficha de Cliente
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-0.5">
                <span>{cliente.municipio || 'SV'}, {cliente.departamento || 'El Salvador'}</span>
                <span>•</span>
                <span className="font-mono text-indigo-300 font-bold">{cliente.telefono}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cerrar ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Métricas rápidas del cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Pedidos</span>
                <p className="text-lg font-black text-slate-900 leading-none mt-0.5">
                  {pedidos.length}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Facturado</span>
                <p className="text-lg font-black text-emerald-600 leading-none mt-0.5 font-mono">
                  ${totalFacturado.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Entregados con éxito</span>
                <p className="text-lg font-black text-sky-700 leading-none mt-0.5">
                  {entregadosCount}
                </p>
              </div>
            </div>
          </div>

          {/* Datos Generales y Contacto */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Información Detallada del Cliente</span>
              </h3>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:503${cliente.telefono}`}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Llamar</span>
                </a>
                <a
                  href={`https://wa.me/503${cliente.telefono}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNuevoPedido(cliente);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Pedido</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Teléfono Móvil</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{cliente.telefono}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Documento Identidad</span>
                <span className="font-mono font-bold text-slate-800">
                  {cliente.numero_documento
                    ? `${cliente.tipo_documento || 'DUI'}: ${cliente.numero_documento}`
                    : 'No registrado'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Correo Electrónico</span>
                <span className="text-slate-800 truncate block font-medium" title={cliente.email || ''}>
                  {cliente.email || 'No registrado'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dirección de Entrega</span>
                <span className="text-slate-800 font-medium block">
                  {cliente.direccion || 'Sin dirección registrada'}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                  {cliente.municipio}, {cliente.departamento}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Punto de Referencia</span>
                <span className="text-slate-700 italic block">
                  {cliente.referencia || 'Sin punto de referencia'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla: Historial de Pedidos */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Historial de Pedidos ({pedidos.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Ordenados de más reciente a más antiguo
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {pedidos.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-60" />
                  <p className="font-bold text-xs">No hay pedidos registrados para este cliente</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Puedes crear su primer pedido con el botón "+ Nuevo Pedido"
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[1250px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
                      <tr>
                        <th className="py-2.5 px-4 whitespace-nowrap">Numero de Pedido</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Cliente</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Teléfono</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Fecha Pedido</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Total</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Estado C807</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Numero de DTE</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Estado Envío</th>
                        <th className="py-2.5 px-4 whitespace-nowrap">Fragancias / Productos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {pedidos.map((p) => {
                        const tieneGuia = !!p.c807_guia_numero && p.c807_guia_numero !== 'PENDIENTE';
                        const linkRastreo = getC807TrackingUrl(p.c807_guia_numero, p.c807_link_rastreo);
                        const totalNum = parseFloat(p.total?.toString() || '0');
                        const totalPagadoNum = parseFloat(p.total_pagado?.toString() || '0');

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
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

                            {/* 9. Fragancias / Productos */}
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-sm">
                                {p.items && p.items.length > 0 ? (
                                  p.items.map((it, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 font-medium"
                                    >
                                      <span className="font-bold text-indigo-600">{it.cantidad}x</span>
                                      <span>{it.contratipo || it.codigo}</span>
                                      <span className="text-[9px] text-slate-400 font-mono">({it.version})</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Sin detalle de items</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/80 transition-colors border border-slate-200 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
