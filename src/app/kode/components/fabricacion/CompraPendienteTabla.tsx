'use client';

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Pedido, InsumoItem } from '../../types';
import { formatearMarcaTemporal } from '../../utils/formatters';

interface CompraPendienteTablaProps {
  pedidosRojos: Pedido[];
  insumos: InsumoItem[];
  selectedPedidoId: string | null;
  onSelectPedidoId: (id: string | null) => void;
  onBack: () => void;
  onMarcarInsumo: (target: { item_id: string }) => Promise<void>;
  loading?: boolean;
}

export function CompraPendienteTabla({
  pedidosRojos,
  insumos,
  selectedPedidoId,
  onSelectPedidoId,
  onBack,
  onMarcarInsumo,
  loading = false,
}: CompraPendienteTablaProps) {
  const [sortInsumos, setSortInsumos] = useState<{
    column: 'kodigo' | 'cliente' | 'fecha' | 'version';
    direction: 'asc' | 'desc';
  }>({
    column: 'fecha',
    direction: 'desc',
  });

  const handleToggleSortInsumos = (col: 'kodigo' | 'cliente' | 'fecha' | 'version') => {
    setSortInsumos((prev) => {
      if (prev.column === col) {
        return { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column: col, direction: col === 'fecha' ? 'desc' : 'asc' };
    });
  };

  const insumosSplitPane = useMemo(() => {
    const list = selectedPedidoId
      ? insumos.filter((item) => item.pedido_id === selectedPedidoId)
      : [...insumos];

    return [...list].sort((a, b) => {
      if (sortInsumos.column === 'kodigo') {
        const valA = `${a.contratipo || ''} ${a.codigo || ''}`.trim();
        const valB = `${b.contratipo || ''} ${b.codigo || ''}`.trim();
        return sortInsumos.direction === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
      }

      if (sortInsumos.column === 'cliente') {
        const valA = (a.cliente_nombre || '').trim();
        const valB = (b.cliente_nombre || '').trim();
        return sortInsumos.direction === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
      }

      if (sortInsumos.column === 'fecha') {
        const timeA = new Date(a.fecha_registro || 0).getTime();
        const timeB = new Date(b.fecha_registro || 0).getTime();
        return sortInsumos.direction === 'desc' ? timeB - timeA : timeA - timeB;
      }

      if (sortInsumos.column === 'version') {
        const valA = (a.version || '').trim();
        const valB = (b.version || '').trim();
        return sortInsumos.direction === 'asc'
          ? valA.localeCompare(valB, 'es', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'es', { sensitivity: 'base' });
      }

      return 0;
    });
  }, [insumos, selectedPedidoId, sortInsumos]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          ← Volver a Fabricación
        </button>
        <span className="text-xs text-rose-600 font-bold">Fase 1: Insumos por Comprar</span>
      </div>

      {/* Tabla Split-Pane AppSheet */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ========================================================= */}
          {/* TABLA IZQUIERDA: ESTADO REGISTRADO                        */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col bg-white">
            {/* Header Estado Registrado */}
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Estado Registrado
                </h2>
                {selectedPedidoId && (
                  <button
                    onClick={() => onSelectPedidoId(null)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Ver todos ({pedidosRojos.length})
                  </button>
                )}
              </div>

              <span className="text-xs text-slate-500 font-bold font-mono">
                {pedidosRojos.length} {pedidosRojos.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>

            {/* Tabla Estado Registrado */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Marca Temporal</th>
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-2 w-7 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pedidosRojos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                        No hay pedidos en estado registrado
                      </td>
                    </tr>
                  ) : (
                    pedidosRojos.map((p) => {
                      const isSelected = selectedPedidoId === p.id;
                      const faltantes = p.items.filter((i) => !i.insumo_comprado).length;

                      return (
                        <tr
                          key={p.id}
                          onClick={() => onSelectPedidoId(isSelected ? null : p.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-red-600 hover:text-red-700">
                            <span>{p.cliente_nombre}</span>
                            {faltantes > 0 && (
                              <span className="ml-1.5 text-[10px] font-mono text-slate-400 font-normal">
                                ({faltantes} pend.)
                              </span>
                            )}
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
                          <td className="py-3 px-2 text-center text-slate-400">
                            <ChevronRight className="w-4 h-4 inline opacity-60" />
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
          {/* TABLA DERECHA: INSUMOS PARA COMPRA                        */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col bg-white">
            {/* Header Insumos */}
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Insumos para compra
                </h2>
                {selectedPedidoId && (
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Filtrado por pedido
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 font-bold font-mono">
                {insumosSplitPane.length} {insumosSplitPane.length === 1 ? 'insumo' : 'insumos'}
              </span>
            </div>

            {/* Tabla Insumos */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    {/* 1. Kodigo */}
                    <th
                      onClick={() => handleToggleSortInsumos('kodigo')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      title="Clic para ordenar por Kodigo (A-Z / Z-A)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Kodigo</span>
                        {sortInsumos.column === 'kodigo' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {sortInsumos.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{sortInsumos.direction === 'asc' ? 'A-Z' : 'Z-A'}</span>
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
                      onClick={() => handleToggleSortInsumos('cliente')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      title="Clic para ordenar por Cliente (A-Z / Z-A)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Cliente</span>
                        {sortInsumos.column === 'cliente' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {sortInsumos.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{sortInsumos.direction === 'asc' ? 'A-Z' : 'Z-A'}</span>
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
                      onClick={() => handleToggleSortInsumos('fecha')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      title="Clic para ordenar por Fecha (Reciente / Antiguo)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Fecha registro</span>
                        {sortInsumos.column === 'fecha' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {sortInsumos.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                            <span>{sortInsumos.direction === 'desc' ? 'Más reciente' : 'Más antiguo'}</span>
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
                      onClick={() => handleToggleSortInsumos('version')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      title="Clic para ordenar por Versión (A-Z / Z-A)"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Version</span>
                        {sortInsumos.column === 'version' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs">
                            {sortInsumos.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{sortInsumos.direction === 'asc' ? 'A-Z' : 'Z-A'}</span>
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
                  {insumosSplitPane.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                        ¡Todos los insumos han sido comprados!
                      </td>
                    </tr>
                  ) : (
                    insumosSplitPane.map((item) => {
                      const isPlus = item.version === 'Plus' || item.version === 'EXTRA_SHOT';

                      return (
                        <tr key={item.item_id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Kodigo: En AMARILLO para Normal, en AZUL para Plus */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {isPlus ? (
                                <button
                                  type="button"
                                  onClick={() => onMarcarInsumo({ item_id: item.item_id })}
                                  disabled={loading}
                                  title="Comprar insumo (Plus)"
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] leading-none shrink-0 transition-transform active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
                                >
                                  +
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onMarcarInsumo({ item_id: item.item_id })}
                                  disabled={loading}
                                  title="Comprar insumo (Normal)"
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-[11px] leading-none shrink-0 transition-transform active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
                                >
                                  ↓
                                </button>
                              )}

                              <span
                                onClick={() => onMarcarInsumo({ item_id: item.item_id })}
                                title="Clic para marcar como comprado"
                                className={`font-bold cursor-pointer hover:underline text-xs ${
                                  isPlus
                                    ? 'text-blue-600 hover:text-blue-700'
                                    : 'text-amber-600 hover:text-amber-700'
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
                          <td className={`py-3 px-3 font-bold whitespace-nowrap ${
                            item.pedido_estado === 'Insumos comprados' || item.pedido_estado === 'PENDIENTE_PREPARAR'
                              ? 'text-amber-600'
                              : item.pedido_estado === 'Preparado' || item.pedido_estado === 'GUIA_CREADA'
                              ? 'text-sky-600'
                              : item.pedido_estado === 'Entregado'
                              ? 'text-emerald-600'
                              : 'text-red-600 hover:text-red-700'
                          }`}>
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
