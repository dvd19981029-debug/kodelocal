'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Pencil } from 'lucide-react';
import { CatalogoItem } from '../../types';

interface CatalogoGridProps {
  catalogo: CatalogoItem[];
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
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded text-[11px]">
                        #{p.codigo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{p.contratipo}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{p.marca_inspirada}</td>
                    <td className="py-3 px-4">{renderGeneroBadge(p.genero)}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-center">
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
    </div>
  );
}
