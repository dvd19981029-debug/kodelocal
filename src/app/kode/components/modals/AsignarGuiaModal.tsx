// src/app/kode/components/modals/AsignarGuiaModal.tsx
import React, { useState } from 'react';
import { Truck, Check } from 'lucide-react';
import { Pedido } from '../../types';
import { resolveC807DeptoCode } from '@/lib/svTerritory';

interface Props {
  pedido: Pedido | null;
  onClose: () => void;
  onGuardarManual: (numGuia: string, linkGuia: string) => Promise<void>;
  onGenerarAutomatica: () => Promise<void>;
  generandoGuia: boolean;
}

export function AsignarGuiaModal({
  pedido,
  onClose,
  onGuardarManual,
  onGenerarAutomatica,
  generandoGuia,
}: Props) {
  const [numGuia, setNumGuia] = useState(pedido?.c807_guia_numero || '');
  const [linkGuia, setLinkGuia] = useState(pedido?.c807_link_rastreo || '');
  const [guardando, setGuardando] = useState(false);

  if (!pedido) return null;

  const handleGuardar = async () => {
    if (!numGuia.trim()) return;
    try {
      setGuardando(true);
      await onGuardarManual(numGuia.trim(), linkGuia.trim());
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="clay-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Guía de Envío C807 Express</h3>
            <p className="text-xs text-slate-500 font-medium">Pedido #{pedido.numero_pedido} - {pedido.cliente_nombre}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Al guardar la guía de paquetería C807, el pedido <strong>{pedido.numero_pedido}</strong> pasará a estado <strong>Azul (Guía creada / Enviado)</strong>.
        </p>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Destino: {pedido.cliente_departamento}</span>
            <span className="clay-badge bg-sky-100 text-sky-800 font-black">
              C807: {resolveC807DeptoCode(pedido.cliente_departamento)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Modalidad: <strong className="text-slate-700">{pedido.tipo_pago}</strong></span>
            <span>{pedido.tipo_pago === 'CONTRAENTREGA' ? `Cobro C807: $${Number(pedido.total || 0).toFixed(2)}` : 'Servicio Pagado (SER)'}</span>
          </div>
        </div>

        {/* BOTÓN DE GENERACIÓN DIRECTA AUTOMÁTICA */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onGenerarAutomatica}
            disabled={generandoGuia}
            className="w-full clay-btn bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Truck className={`w-4 h-4 ${generandoGuia ? 'animate-spin' : ''}`} />
            <span>{generandoGuia ? 'Generando en C807 Express...' : '🚀 Generar Guía Automática con C807'}</span>
          </button>
        </div>

        <div className="relative my-1 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <span className="relative bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">o ingresar guía existente</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Número de Guía C807 *</label>
            <input
              type="text"
              placeholder="Ej. C807-SV-981245"
              value={numGuia}
              onChange={(e) => setNumGuia(e.target.value)}
              className="clay-input w-full text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Enlace de Rastreo (Opcional)</label>
            <input
              type="text"
              placeholder="https://c807xpress.com/tracking/?guia=..."
              value={linkGuia}
              onChange={(e) => setLinkGuia(e.target.value)}
              className="clay-input w-full text-xs font-mono font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={!numGuia.trim() || guardando || generandoGuia}
            className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{guardando ? 'Guardando...' : 'Guardar Manualmente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
