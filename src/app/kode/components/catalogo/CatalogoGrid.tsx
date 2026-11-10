'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, X, Pencil, ShoppingBag, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { CatalogoItem, Pedido } from '../../types';
import { getClienteColorPorEstado, getC807TrackingUrl } from '../../utils/c807Helpers';

interface CatalogoGridProps {
  catalogo: CatalogoItem[];
  pedidos?: Pedido[];
  onAbrirEdicion: (perfume: CatalogoItem) => void;
  onAbrirNuevaFragancia: () => void;
  onSeleccionarPerfume?: (perfume: CatalogoItem) => void;
  onToggleActivo: (perfume: CatalogoItem) => Promise<void>;
  togglingActivoId: string | null;
  onBack?: () => void;
  titulo?: string;
  subtitulo?: string;
}

export function renderGeneroBadge(generoRaw: string | undefined | null) {
  const g = (generoRaw || '').toUpperCase();
  if (g.includes('DAMA') || g.includes('MUJER') || g === 'F') {
    return (
      <span className="inline-flex items-center text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full">
        Dama
      </span>
    );
  }
  if (g.includes('CABALLERO') || g.includes('HOMBRE') || g === 'H') {
    return (
      <span className="inline-flex items-center text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
        Caballero
      </span>
    );
  }
  if (g.includes('UNISEX') || g.includes('MIXTO')) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
        Unisex
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
      {generoRaw || 'Unisex'}
    </span>
  );
}

export function CatalogoGrid({
  catalogo,
  pedidos = [],
  onAbrirEdicion,
  onAbrirNuevaFragancia,
  onSeleccionarPerfume,
  onToggleActivo,
  togglingActivoId,
  onBack,
  titulo,
  subtitulo,
}: CatalogoGridProps) {
  const [filtroGeneroCatalogo, setFiltroGeneroCatalogo] = useState<
    'TODOS' | 'CABALLERO' | 'DAMA' | 'UNISEX'
  >('TODOS');
  const [filtroEstadoCatalogo, setFiltroEstadoCatalogo] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>(
    'TODOS'
  );
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [perfumeDetalle, setPerfumeDetalle] = useState<CatalogoItem | null>(null);
  const [pedidosPerfumeApi, setPedidosPerfumeApi] = useState<Pedido[]>([]);
  const [cargandoPedidosPerfume, setCargandoPedidosPerfume] = useState(false);
  const [expandedPedidoId, setExpandedPedidoId] = useState<string | null>(null);

  useEffect(() => {
    if (!perfumeDetalle) {
      setPedidosPerfumeApi([]);
      setExpandedPedidoId(null);
      return;
    }
    let cancelled = false;
    setCargandoPedidosPerfume(true);
    fetch(
      `/api/kode/pedidos?catalogo_id=${encodeURIComponent(perfumeDetalle.id)}&codigo=${encodeURIComponent(
        perfumeDetalle.codigo || ''
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.pedidos)) {
          setPedidosPerfumeApi(data.pedidos);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCargandoPedidosPerfume(false);
      });
    return () => {
      cancelled = true;
    };
  }, [perfumeDetalle]);

  const pedidosDelPerfume = useMemo(() => {
    if (!perfumeDetalle) return [];
    const map = new Map<string, Pedido>();
    const matchPerfume = (p: Pedido) =>
      (p.items || []).some(
        (it) =>
          it.catalogo_id === perfumeDetalle.id ||
          (perfumeDetalle.codigo && String(it.codigo) === String(perfumeDetalle.codigo))
      );

    pedidos.forEach((p) => {
      if (matchPerfume(p)) map.set(p.id, p);
    });
    pedidosPerfumeApi.forEach((p) => {
      if (matchPerfume(p)) map.set(p.id, p);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }, [perfumeDetalle, pedidos, pedidosPerfumeApi]);

  // Conteos
  const conteosCatalogo = useMemo(() => {
    let cab = 0;
    let dam = 0;
    let uni = 0;
    let act = 0;
    let inact = 0;

    catalogo.forEach((p) => {
      const g = (p.genero || '').toUpperCase();
      if (g.includes('CABALLERO') || g.includes('HOMBRE') || g === 'H') cab++;
      else if (g.includes('DAMA') || g.includes('MUJER') || g === 'F') dam++;
      else uni++;

      if (p.activo !== false) act++;
      else inact++;
    });

    return {
      todos: catalogo.length,
      caballero: cab,
      dama: dam,
      unisex: uni,
      activos: act,
      inactivos: inact,
    };
  }, [catalogo]);

  // Filtrado reactivo
  const catalogoFiltrado = useMemo(() => {
    return catalogo.filter((p) => {
      // 1. Filtro Género
      if (filtroGeneroCatalogo !== 'TODOS') {
        const g = (p.genero || '').toUpperCase();
        if (filtroGeneroCatalogo === 'CABALLERO' && !(g.includes('CABALLERO') || g.includes('HOMBRE') || g === 'H')) {
          return false;
        }
        if (filtroGeneroCatalogo === 'DAMA' && !(g.includes('DAMA') || g.includes('MUJER') || g === 'F')) {
          return false;
        }
        if (filtroGeneroCatalogo === 'UNISEX' && !(g.includes('UNISEX') || g.includes('MIXTO') || (!g.includes('CABALLERO') && !g.includes('DAMA')))) {
          return false;
        }
      }

      // 2. Filtro Disponibilidad
      if (filtroEstadoCatalogo === 'ACTIVOS' && p.activo === false) return false;
      if (filtroEstadoCatalogo === 'INACTIVOS' && p.activo !== false) return false;

      // 3. Filtro por buscador
      if (busquedaCatalogo.trim()) {
        const q = busquedaCatalogo.toLowerCase().trim();
        const codigo = (p.codigo || '').toLowerCase();
        const contratipo = (p.contratipo || '').toLowerCase();
        const marca = (p.marca_inspirada || '').toLowerCase();
        const genero = (p.genero || '').toLowerCase();

        return (
          codigo.includes(q) ||
          contratipo.includes(q) ||
          marca.includes(q) ||
          genero.includes(q)
        );
      }

      return true;
    });
  }, [catalogo, filtroGeneroCatalogo, filtroEstadoCatalogo, busquedaCatalogo]);

  return (
    <div className="space-y-4">
      {/* Barra Superior de Navegación e Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack ? (
            <>
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Volver a Ventas
              </button>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">
                {titulo || 'Catálogo de Fragancias KÖDE'}
              </span>
            </>
          ) : (
            <div>
              <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">
                {titulo || 'INVENTARIO / CATÁLOGO GENERAL'}
              </h2>
              {subtitulo && (
                <p className="text-[11px] text-slate-400 font-medium">{subtitulo}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 font-semibold font-mono bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
            {catalogoFiltrado.length}{' '}
            {catalogoFiltrado.length === 1 ? 'fragancia' : 'fragancias disponibles'}{' '}
            {filtroGeneroCatalogo !== 'TODOS' ? `(${filtroGeneroCatalogo.toLowerCase()})` : ''}{' '}
            {filtroEstadoCatalogo !== 'TODOS' ? `• ${filtroEstadoCatalogo.toLowerCase()}` : ''}
          </span>
          <button
            type="button"
            onClick={onAbrirNuevaFragancia}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir Fragancia</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros de Género, Estado y Buscador Rápido */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Filtros de Género y Disponibilidad */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Géneros */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setFiltroGeneroCatalogo('TODOS')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroGeneroCatalogo === 'TODOS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              Todos ({conteosCatalogo.todos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroGeneroCatalogo('CABALLERO')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroGeneroCatalogo === 'CABALLERO'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              Caballero ({conteosCatalogo.caballero})
            </button>
            <button
              type="button"
              onClick={() => setFiltroGeneroCatalogo('DAMA')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroGeneroCatalogo === 'DAMA'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              Dama ({conteosCatalogo.dama})
            </button>
            <button
              type="button"
              onClick={() => setFiltroGeneroCatalogo('UNISEX')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroGeneroCatalogo === 'UNISEX'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              Unisex ({conteosCatalogo.unisex})
            </button>
          </div>

          <span className="hidden sm:inline-block text-slate-300">|</span>

          {/* Disponibilidad / Estado */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFiltroEstadoCatalogo('TODOS')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filtroEstadoCatalogo === 'TODOS'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100/80'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstadoCatalogo('ACTIVOS')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                filtroEstadoCatalogo === 'ACTIVOS'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Activas ({conteosCatalogo.activos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstadoCatalogo('INACTIVOS')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                filtroEstadoCatalogo === 'INACTIVOS'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Agotadas ({conteosCatalogo.inactivos})
            </button>
          </div>
        </div>

        {/* Buscador Rápido Local */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busquedaCatalogo}
            onChange={(e) => setBusquedaCatalogo(e.target.value)}
            placeholder="Buscar por código, contratipo, marca..."
            className="w-full pl-9 pr-8 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {busquedaCatalogo && (
            <button
              type="button"
              onClick={() => setBusquedaCatalogo('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla Administrativa Limpia */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider z-10">
              <tr>
                <th className="py-3 px-4">Kodigo</th>
                <th className="py-3 px-4">Contratipo</th>
                <th className="py-3 px-4">Marca Inspirada</th>
                <th className="py-3 px-4">Género</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Precio Normal</th>
                <th className="py-3 px-4 text-right">Precio Extra Shot</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {catalogoFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron fragancias con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                catalogoFiltrado.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setPerfumeDetalle(p)}
                    className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                    title="Haz clic para ver en qué pedidos está este perfume"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50/70 group-hover:bg-indigo-600 group-hover:text-white border border-indigo-100 px-2 py-0.5 rounded text-[11px] transition-colors">
                        #{p.codigo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 group-hover:text-indigo-700 group-hover:underline">
                      {p.contratipo}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{p.marca_inspirada}</td>
                    <td className="py-3 px-4">{renderGeneroBadge(p.genero)}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={togglingActivoId === p.id}
                        onClick={() => onToggleActivo(p)}
                        title={
                          p.activo !== false
                            ? 'Clic para desactivar (marcar agotada)'
                            : 'Clic para activar (disponible para venta)'
                        }
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs ${
                          p.activo !== false
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.activo !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <span>
                          {togglingActivoId === p.id
                            ? '...'
                            : p.activo !== false
                            ? 'Activa'
                            : 'Inactiva'}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      ${parseFloat(p.precio_normal?.toString() || '20').toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                      ${parseFloat(p.precio_extra_shot?.toString() || '25').toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAbrirEdicion(p)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-2xs cursor-pointer inline-flex items-center gap-1"
                          title={`Editar fragancia #${p.codigo} ${p.contratipo}`}
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                          <span>Editar</span>
                        </button>

                        {onSeleccionarPerfume && (
                          p.activo !== false ? (
                            <button
                              type="button"
                              onClick={() => onSeleccionarPerfume(p)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              title={`Crear pedido con #${p.codigo} ${p.contratipo}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Pedido</span>
                            </button>
                          ) : (
                            <span
                              className="px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold border border-slate-200 select-none cursor-not-allowed"
                              title="Fragancia inactiva / agotada. Actívala para poder venderla."
                            >
                              Agotada
                            </span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal estilo AppSheet: Ficha de Fragancia y Pedidos Relacionados */}
      {perfumeDetalle && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPerfumeDetalle(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Perfume */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="px-3 py-2 rounded-2xl bg-indigo-600/50 border border-indigo-400/40 flex items-center justify-center font-mono text-base font-black text-white shadow-inner">
                  #{perfumeDetalle.codigo}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {perfumeDetalle.contratipo}
                    </h2>
                    {renderGeneroBadge(perfumeDetalle.genero)}
                  </div>
                  <p className="text-xs text-slate-300 font-medium flex flex-wrap items-center gap-2 mt-0.5">
                    <span>{perfumeDetalle.marca_inspirada || 'Sin marca especificada'}</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-300 font-bold">
                      Normal ${parseFloat(perfumeDetalle.precio_normal?.toString() || '20').toFixed(2)}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-purple-300 font-bold">
                      Plus ${parseFloat(perfumeDetalle.precio_extra_shot?.toString() || '25').toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onSeleccionarPerfume && perfumeDetalle.activo !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = perfumeDetalle;
                      setPerfumeDetalle(null);
                      onSeleccionarPerfume(target);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Pedido</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPerfumeDetalle(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Listado de Pedidos Relacionados */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Pedidos con #{perfumeDetalle.codigo} {perfumeDetalle.contratipo} ({pedidosDelPerfume.length})
                  </h3>
                </div>
                {cargandoPedidosPerfume && (
                  <span className="text-[11px] font-bold text-indigo-600 animate-pulse">
                    Buscando historial...
                  </span>
                )}
              </div>

              {pedidosDelPerfume.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-400 text-xs font-semibold">
                  {cargandoPedidosPerfume
                    ? 'Cargando pedidos asociados...'
                    : 'Este perfume aún no aparece en ningún pedido registrado.'}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">N° Pedido</th>
                          <th className="py-2.5 px-3">Cliente</th>
                          <th className="py-2.5 px-3">Fecha</th>
                          <th className="py-2.5 px-3">Versión / Cant.</th>
                          <th className="py-2.5 px-3">Estado</th>
                          <th className="py-2.5 px-3">Vendedora</th>
                          <th className="py-2.5 px-3 text-right">Total Pedido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pedidosDelPerfume.map((ped) => {
                          const itemsMatching = (ped.items || []).filter(
                            (it) =>
                              it.catalogo_id === perfumeDetalle.id ||
                              (perfumeDetalle.codigo && String(it.codigo) === String(perfumeDetalle.codigo))
                          );
                          const isExp = expandedPedidoId === ped.id;
                          const totalUnidadesPedido = (ped.items || []).reduce(
                            (acc, it) => acc + Math.max(1, Number(it.cantidad || 1)),
                            0
                          );
                          return (
                            <React.Fragment key={ped.id}>
                              <tr
                                onClick={() => setExpandedPedidoId(isExp ? null : ped.id)}
                                className={`cursor-pointer transition-colors ${
                                  isExp ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono font-black text-indigo-700 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1">
                                    {ped.numero_pedido}
                                    {isExp ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                    )}
                                  </span>
                                </td>
                                <td className={`py-2.5 px-3 font-bold whitespace-nowrap ${getClienteColorPorEstado(ped.estado)}`}>
                                  {ped.cliente_nombre}{' '}
                                  <span className="font-mono opacity-80">({totalUnidadesPedido})</span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                                  {new Date(ped.created_at).toLocaleDateString('es-SV')}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <div className="flex flex-wrap gap-1">
                                    {itemsMatching.map((it, idx) => {
                                      const isPlus = it.version === 'Plus' || it.version === 'EXTRA_SHOT';
                                      return (
                                        <span
                                          key={it.id || idx}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                                            isPlus
                                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                                              : 'bg-slate-100 text-slate-700 border-slate-200'
                                          }`}
                                        >
                                          {it.cantidad}x {isPlus ? 'Plus' : 'Normal'}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {ped.estado}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-semibold whitespace-nowrap">
                                  {ped.vendedora_nombre || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                                  ${parseFloat(ped.total?.toString() || '0').toFixed(2)}
                                </td>
                              </tr>
                              {isExp && (
                                <tr className="bg-slate-50/90">
                                  <td colSpan={7} className="p-3.5 border-l-4 border-l-indigo-600">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[11px]">
                                      <div className="text-slate-600 font-semibold">
                                        📍 {ped.cliente_direccion} ({ped.cliente_municipio}, {ped.cliente_departamento}) • Tel:{' '}
                                        <span className="font-mono font-bold text-emerald-700">{ped.cliente_telefono}</span>
                                      </div>
                                      {ped.c807_guia_numero && ped.c807_guia_numero !== 'PENDIENTE' && (
                                        <a
                                          href={getC807TrackingUrl(ped.c807_guia_numero, ped.c807_link_rastreo)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 hover:underline"
                                        >
                                          <span>Guía: {ped.c807_guia_numero}</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 mb-1">
                                      Todos los perfumes en este pedido ({ped.items?.length || 0}):
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(ped.items || []).map((it, idx) => (
                                        <span
                                          key={it.id || idx}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                            it.catalogo_id === perfumeDetalle.id ||
                                            String(it.codigo) === String(perfumeDetalle.codigo)
                                              ? 'bg-indigo-100 border-indigo-300 text-indigo-900'
                                              : 'bg-white border-slate-200 text-slate-700'
                                          }`}
                                        >
                                          {it.cantidad}x #{it.codigo} {it.contratipo} ({it.version})
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
