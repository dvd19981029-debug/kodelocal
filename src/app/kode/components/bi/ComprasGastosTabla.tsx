'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CompraGasto } from '../../types';

interface ComprasGastosTablaProps {
  compras: CompraGasto[];
  onRegistrarCompra: (compra: {
    fecha_compra: string;
    categoria: string;
    concepto: string;
    proveedor: string;
    monto_total: number;
  }) => void;
  onEliminarCompra: (id: string) => void;
  onBack: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function ComprasGastosTabla({
  compras,
  onRegistrarCompra,
  onEliminarCompra,
  onBack,
  showToast,
}: ComprasGastosTablaProps) {
  const [nuevaCompraFecha, setNuevaCompraFecha] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [nuevaCompraCategoria, setNuevaCompraCategoria] = useState<string>('ESENCIAS');
  const [nuevaCompraConcepto, setNuevaCompraConcepto] = useState('');
  const [nuevaCompraProveedor, setNuevaCompraProveedor] = useState('');
  const [nuevaCompraMonto, setNuevaCompraMonto] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCompraConcepto.trim() || nuevaCompraMonto <= 0) {
      showToast('Ingrese un concepto y monto válido', 'error');
      return;
    }

    onRegistrarCompra({
      fecha_compra: nuevaCompraFecha,
      categoria: nuevaCompraCategoria,
      concepto: nuevaCompraConcepto.trim(),
      proveedor: nuevaCompraProveedor.trim() || 'Proveedor Local',
      monto_total: parseFloat(nuevaCompraMonto.toString()),
    });

    setNuevaCompraConcepto('');
    setNuevaCompraMonto(0);
    setNuevaCompraProveedor('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          ← Volver a Inteligencia de Negocios
        </button>
        <span className="text-xs text-slate-500 font-medium">Registro de Compras / Gastos</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-4">
          <div className="clay-card p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              Nueva Compra de Insumo
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Compra</label>
                <input
                  type="date"
                  value={nuevaCompraFecha}
                  onChange={(e) => setNuevaCompraFecha(e.target.value)}
                  className="clay-input w-full text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={nuevaCompraCategoria}
                  onChange={(e) => setNuevaCompraCategoria(e.target.value)}
                  className="clay-input w-full text-xs font-bold cursor-pointer"
                >
                  <option value="ESENCIAS">ESENCIAS</option>
                  <option value="FRASCOS">FRASCOS</option>
                  <option value="CAJAS">CAJAS</option>
                  <option value="PAPEL">PAPEL</option>
                  <option value="OTROS INSUMOS">OTROS INSUMOS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Concepto *</label>
                <input
                  type="text"
                  placeholder="Ej. 10 Litros Esencia Aventus..."
                  value={nuevaCompraConcepto}
                  onChange={(e) => setNuevaCompraConcepto(e.target.value)}
                  className="clay-input w-full text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej. Aromas Creativos, Inveromatic..."
                  value={nuevaCompraProveedor}
                  onChange={(e) => setNuevaCompraProveedor(e.target.value)}
                  className="clay-input w-full text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto Total ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={nuevaCompraMonto || ''}
                  onChange={(e) => setNuevaCompraMonto(parseFloat(e.target.value) || 0)}
                  className="clay-input w-full text-xs font-mono font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="clay-btn clay-btn-primary w-full py-2.5 text-xs font-black shadow-md mt-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Guardar Compra
              </button>
            </form>
          </div>
        </div>

        {/* Tabla de Gastos estilo AppSheet */}
        <div className="lg:col-span-8">
          <div className="clay-card overflow-hidden border border-slate-200/80 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">ID Gasto</th>
                    <th className="py-3 px-4">Fecha Compra</th>
                    <th className="py-3 px-4">Concepto</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {compras.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No hay registros de compras o gastos.
                      </td>
                    </tr>
                  ) : (
                    compras.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{c.id}</td>
                        <td className="py-3 px-4 font-mono">{c.fecha_compra}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.concepto}</td>
                        <td className="py-3 px-4 text-slate-600">{c.proveedor}</td>
                        <td className="py-3 px-4">
                          <span className="clay-badge text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            {c.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                          ${c.monto_total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onEliminarCompra(c.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
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
