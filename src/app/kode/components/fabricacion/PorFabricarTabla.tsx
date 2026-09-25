'use client';

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronUp, ChevronDown, Truck } from 'lucide-react';
import { Pedido } from '../../types';
import { formatearMarcaTemporal } from '../../utils/formatters';

interface PorFabricarTablaProps {
  pedidosAmarillos: Pedido[];
  selectedPedidoId: string | null;
  onSelectPedidoId: (id: string | null) => void;
  onBack: () => void;
  onAsignarGuia: (pedido: Pedido) => void;
}

export function PorFabricarTabla({
  pedidosAmarillos,
  selectedPedidoId,
  onSelectPedidoId,
  onBack,
  onAsignarGuia,
}: PorFabricarTablaProps) {
  const [sortFragancias, setSortFragancias] = useState<{
    column: 'kodigo' | 'cliente' | 'fecha' | 'version';
    direction: 'asc' | 'desc';
  }>({
    column: 'fecha',
    direction: 'desc',
  });

  const handleToggleSortFragancias = (col: 'kodigo' | 'cliente' | 'fecha' | 'version') => {
    setSortFragancias((prev) => {
      if (prev.column === col) {
        return { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column: col, direction: col === 'fecha' ? 'desc' : 'asc' };
    });
  };

  const selectedPedido = useMemo(() => {
    if (!selectedPedidoId) return null;
    return pedidosAmarillos.find((p) => p.id === selectedPedidoId) || null;
  }, [pedidosAmarillos, selectedPedidoId]);

  const fraganciasSplitPane = useMemo(() => {
    const list: Array<{
      item_id: string;
      pedido_id: string;
      numero_pedido: string;
      cliente_nombre: string;
      fecha_registro: string;
      codigo: string;
      contratipo: string;
      version: string;
      cantidad: number;
    }> = [];

    pedidosAmarillos.forEach((ped) => {
      if (selectedPedidoId && ped.id !== selectedPedidoId) return;
      (ped.items || []).forEach((it, idx) => {
        list.push({
          item_id: it.id || `${ped.id}-frag-${idx}`,
          pedido_id: ped.id,
          numero_pedido: ped.numero_pedido,
          cliente_nombre: ped.cliente_nombre,
          fecha_registro: ped.created_at,
          codigo: it.codigo,
          contratipo: it.contratipo,
          version: it.version,
          cantidad: it.cantidad,
        });
      });
    });

    return [...list].sort((a, b) => {
      if (sortFragancias.column === 'kodigo') {
        const valA = `${a.contratipo || ''} ${a.codigo || ''}`.trim();
        const valB = `${b.contratipo || ''} ${b.codigo || ''}`.trim();
        return sortFragancias.direction === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
      }

      if (sortFragancias.column === 'cliente') {
        const valA = (a.cliente_nombre || '').trim();
        const valB = (b.cliente_nombre || '').trim();
        return sortFragancias.direction === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
      }

      if (sortFragancias.column === 'fecha') {
        const timeA = new Date(a.fecha_registro || 0).getTime();
        const timeB = new Date(b.fecha_registro || 0).getTime();
        return sortFragancias.direction === 'desc' ? timeB - timeA : timeA - timeB;
      }

      if (sortFragancias.column === 'version') {
        const valA = (a.version || '').trim();
        const valB = (b.version || '').trim();
        return sortFragancias.direction === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
      }

      return 0;
    });
  }, [pedidosAmarillos, selectedPedidoId, sortFragancias]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          ← Volver a Fabricación
        </button>
        <span className="text-xs text-amber-700 font-bold">Fase 2: Pedidos por Fabricar</span>
      </div>

      {/* Tabla Split-Pane AppSheet */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ========================================================= */}
          {/* TABLA IZQUIERDA: ESTADO LISTO FABRICAR                    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col bg-white">
            {/* Header Estado Listo Fabricar */}
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Estado Listo Fabricar
                </h2>
                {selectedPedidoId && (
                  <button
                    onClick={() => onSelectPedidoId(null)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Ver todos ({pedidosAmarillos.length})
                  </button>
                )}
              </div>

              <span className="text-xs text-slate-500 font-bold font-mono">
                {pedidosAmarillos.length} {pedidosAmarillos.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>

            {/* Tabla Estado Listo Fabricar */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Marca Temporal</th>
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pedidosAmarillos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                        No hay pedidos listos para fabricar
                      </td>
                    </tr>
                  ) : (
                    pedidosAmarillos.map((p) => {
                      const isSelected = selectedPedidoId === p.id;

                      return (
                        <tr
                          key={p.id}
                          onClick={() => onSelectPedidoId(isSelected ? null : p.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50/80 border-l-4 border-l-amber-500'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-amber-600 hover:text-amber-700">
                            <span>{p.cliente_nombre}</span>
                            <span className="ml-1.5 text-[10px] font-mono text-slate-400 font-normal">
                              ({p.items.length} {p.items.length === 1 ? 'frag.' : 'frags.'})
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {formatearMarcaTemporal(p.created_at)}
                          </td>
                          <td
                            className="py-3 px-3 text-slate-700 font-medium text-xs truncate max-w-[180px]"
                            title={p.vendedora_nombre || 'Erika Melgar'}
                          >
                            {p.vendedora_nombre || 'Erika Melgar'}
                          </td>
                          <td className="py-3 px-2 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAsignarGuia(p);
                                }}
                                title="Asignar Guía C807"
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                              >
                                C807 →
                              </button>
                              <ChevronRight className="w-4 h-4 inline opacity-60 text-slate-400" />
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

          {/* ========================================================= */}
          {/* TABLA DERECHA: FRAGANCIAS POR FABRICAR                    */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col bg-white">
            {/* Header Fragancias */}
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Fragancias por fabricar
                </h2>
                {selectedPedidoId && (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    Filtrado por pedido
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedPedido && (
                  <button
                    type="button"
                    onClick={() => onAsignarGuia(selectedPedido)}
                    className="text-[11px] font-bold px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Asignar C807 ({selectedPedido.numero_pedido})</span>
                  </button>
                )}
                <span className="text-xs text-slate-500 font-bold font-mono">
                  {fraganciasSplitPane.length} {fraganciasSplitPane.length === 1 ? 'fragancia' : 'fragancias'}
                </span>
              </div>
            </div>

            {/* Tabla Fragancias */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    {/* 1. Kodigo */}
                    <th
                      onClick={() => handleToggleSortFragancias('kodigo')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      title="Clic para ordenar por Kodigo (A-Z / Z-A)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Kodigo</span>
                        {sortFragancias.column === 'kodigo' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {sortFragancias.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{sortFragancias.direction === 'asc' ? 'A-Z' : 'Z-A'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-[10px]" title="Ordenar A-Z">
                            ⇅
                          </span>
                        )}
                      </div>
                    </th>

                    {/* 2. Cliente */}
                    <th
                      onClick={() => handleToggleSortFragancias('cliente')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      title="Clic para ordenar por Cliente (A-Z / Z-A)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Cliente</span>
                        {sortFragancias.column === 'cliente' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {sortFragancias.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{sortFragancias.direction === 'asc' ? 'A-Z' : 'Z-A'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-[10px]" title="Ordenar A-Z">
                            ⇅
                          </span>
                        )}
                      </div>
                    </th>

                    {/* 3. Fecha registro */}
                    <th
                      onClick={() => handleToggleSortFragancias('fecha')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      title="Clic para ordenar por Fecha (Reciente / Antiguo)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Fecha registro</span>
                        {sortFragancias.column === 'fecha' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {sortFragancias.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                            <span>{sortFragancias.direction === 'desc' ? 'Más reciente' : 'Más antiguo'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-[10px]" title="Ordenar por fecha">
                            ⇅
                          </span>
                        )}
                      </div>
                    </th>

                    {/* 4. Version */}
                    <th
                      onClick={() => handleToggleSortFragancias('version')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      title="Clic para ordenar por Versión (A-Z / Z-A)"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Version</span>
                        {sortFragancias.column === 'version' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {sortFragancias.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{sortFragancias.direction === 'asc' ? 'A-Z' : 'Z-A'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-[10px]" title="Ordenar por versión">
                            ⇅
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {fraganciasSplitPane.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                        No hay fragancias pendientes de fabricar
                      </td>
                    </tr>
                  ) : (
                    fraganciasSplitPane.map((item) => {
                      const isPlus = item.version === 'Plus' || item.version === 'EXTRA_SHOT';

                      return (
                        <tr key={item.item_id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Kodigo: En AMARILLO para Normal, en AZUL para Plus */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {isPlus ? (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[11px] leading-none shrink-0 shadow-2xs">
                                  +
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] leading-none shrink-0 shadow-2xs">
                                  ↓
                                </span>
                              )}

                              <span
                                className={`font-bold text-xs ${
                                  isPlus ? 'text-blue-600' : 'text-amber-600'
                                }`}
                              >
                                {item.contratipo} - {item.codigo}
                              </span>

                              {item.cantidad > 1 && (
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                  ({item.cantidad} uds)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Cliente */}
                          <td className="py-3 px-3 font-bold text-amber-600 whitespace-nowrap">
                            {item.cliente_nombre}
                          </td>

                          {/* 3. Fecha registro */}
                          <td className="py-3 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {formatearMarcaTemporal(item.fecha_registro)}
                          </td>

                          {/* 4. Version */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isPlus ? (
                              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                Plus
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                Normal
                              </span>
                            )}
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
      </div>
    </div>
  );
}
