'use client';

import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';

interface NuevaFraganciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function NuevaFraganciaModal({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}: NuevaFraganciaModalProps) {
  const [form, setForm] = useState({
    codigo: '',
    contratipo: '',
    marca_inspirada: '',
    genero: 'Caballero',
    precio_normal: 20,
    precio_extra_shot: 25,
    activo: true,
  });
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.contratipo.trim()) {
      showToast('Código y Contratipo son obligatorios', 'error');
      return;
    }

    try {
      setGuardando(true);
      const res = await fetch('/api/kode/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: form.codigo.trim(),
          contratipo: form.contratipo.trim(),
          marca_inspirada: form.marca_inspirada.trim(),
          genero: form.genero,
          precio_normal: parseFloat(form.precio_normal.toString()),
          precio_extra_shot: parseFloat(form.precio_extra_shot.toString()),
          activo: form.activo,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Nueva fragancia añadida al catálogo', 'success');
        setForm({
          codigo: '',
          contratipo: '',
          marca_inspirada: '',
          genero: 'Caballero',
          precio_normal: 20,
          precio_extra_shot: 25,
          activo: true,
        });
        onSuccess();
        onClose();
      } else {
        showToast(data.error || 'Error al añadir fragancia', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error de conexión', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Añadir Nueva Fragancia al Catálogo
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Ingresa los datos para registrar un nuevo perfume en inventario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Disponibilidad Inicial */}
          <div
            onClick={() => setForm((prev) => ({ ...prev, activo: !prev.activo }))}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              form.activo
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                : 'bg-rose-50/70 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  form.activo ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {form.activo ? '✓' : '✕'}
              </div>
              <div>
                <span className="font-extrabold block text-xs">
                  {form.activo ? 'FRAGANCIA ACTIVA (Disponible para venta)' : 'FRAGANCIA INACTIVA (Agotada)'}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {form.activo
                    ? 'Se activará inmediatamente para crear pedidos y cotizar.'
                    : 'Se guardará como agotada en el catálogo sin opción a venderse.'}
                </span>
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider shrink-0 ${
                form.activo
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-rose-100 border-rose-300 text-rose-800'
              }`}
            >
              {form.activo ? 'Activa' : 'Inactiva'}
            </div>
          </div>

          {/* Grid Código y Género */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kodigo / Código *</label>
              <input
                type="text"
                required
                value={form.codigo}
                onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Ej. 1007 o #250"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Género *</label>
              <select
                value={form.genero}
                onChange={(e) => setForm((prev) => ({ ...prev, genero: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="Caballero">Caballero</option>
                <option value="Dama">Dama</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
          </div>

          {/* Contratipo */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Contratipo (Nombre de la fragancia) *</label>
            <input
              type="text"
              required
              value={form.contratipo}
              onChange={(e) => setForm((prev) => ({ ...prev, contratipo: e.target.value }))}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Ej. Sauvage Elixir H"
            />
          </div>

          {/* Marca Inspirada */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Marca Inspirada / Diseñador</label>
            <input
              type="text"
              value={form.marca_inspirada}
              onChange={(e) => setForm((prev) => ({ ...prev, marca_inspirada: e.target.value }))}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Ej. Dior"
            />
          </div>

          {/* Precios Normal y Extra Shot */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Precio Normal ($) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.precio_normal}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, precio_normal: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Precio Extra Shot ($) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.precio_extra_shot}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      precio_extra_shot: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-purple-700"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{guardando ? 'Guardando...' : 'Añadir Fragancia'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
