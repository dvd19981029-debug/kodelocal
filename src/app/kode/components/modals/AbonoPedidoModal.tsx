'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, X, CheckCircle2, RefreshCw, Upload, Check } from 'lucide-react';
import { Pedido, FormaPago } from '../../types';
import { compressAndUploadImage } from '../../utils/imageUpload';

interface AbonoPedidoModalProps {
  pedido: Pedido | null;
  formasPago: FormaPago[];
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  onViewComprobante?: (url: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AbonoPedidoModal: React.FC<AbonoPedidoModalProps> = ({
  pedido,
  formasPago,
  onClose,
  onSuccess,
  onViewComprobante,
  showToast,
}) => {
  const [abonoMonto, setAbonoMonto] = useState<string>('');
  const [abonoFormaPagoId, setAbonoFormaPagoId] = useState<string>('1001');
  const [abonoNumDoc, setAbonoNumDoc] = useState<string>('');
  const [abonoComprobante, setAbonoComprobante] = useState<string>('');
  const [abonoSubiendoComprobante, setAbonoSubiendoComprobante] = useState<boolean>(false);
  const [abonoFecha, setAbonoFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [abonoObservaciones, setAbonoObservaciones] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (pedido) {
      const total = parseFloat(pedido.total?.toString() || '0');
      const pagado = parseFloat(pedido.total_pagado?.toString() || '0');
      const saldo = Math.max(0, total - pagado);
      setAbonoMonto(saldo > 0 ? saldo.toFixed(2) : '');

      const primerBanco = formasPago.find((f) => f.tipo === 'BANCO') || formasPago[0];
      if (primerBanco) setAbonoFormaPagoId(primerBanco.id);

      setAbonoNumDoc('');
      setAbonoComprobante('');
      setAbonoObservaciones('');
      setAbonoFecha(new Date().toISOString().split('T')[0]);
    }
  }, [pedido, formasPago]);

  if (!pedido) return null;

  const total = parseFloat(pedido.total?.toString() || '0');
  const pagado = parseFloat(pedido.total_pagado?.toString() || '0');
  const saldoPendiente = Math.max(0, total - pagado);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(abonoMonto.toString());
    if (isNaN(monto) || monto <= 0) {
      showToast('Ingresa un monto válido para el abono ($)', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/kode/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedido.id,
          cliente_id: pedido.cliente_id,
          forma_pago_id: abonoFormaPagoId,
          monto,
          fecha_pago: abonoFecha,
          num_documento_auto: abonoNumDoc.trim(),
          comprobante_url: abonoComprobante.trim(),
          observaciones: abonoObservaciones.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Abono registrado con éxito', 'success');
        await onSuccess();
        onClose();
      } else {
        showToast(data.error || 'Error al registrar abono', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteImage = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          try {
            setAbonoSubiendoComprobante(true);
            const url = await compressAndUploadImage(file);
            setAbonoComprobante(url);
            showToast('¡Comprobante adjuntado desde el portapapeles!', 'success');
          } catch (err: any) {
            showToast(err.message || 'Error al procesar captura', 'error');
          } finally {
            setAbonoSubiendoComprobante(false);
          }
          break;
        }
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAbonoSubiendoComprobante(true);
      const url = await compressAndUploadImage(file);
      setAbonoComprobante(url);
      showToast('Comprobante adjuntado con éxito', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al subir imagen', 'error');
    } finally {
      setAbonoSubiendoComprobante(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="clay-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Registrar Abono / Pago</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Pedido #{pedido.numero_pedido} - {pedido.cliente_nombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 block">Total del Pedido:</span>
            <strong className="text-slate-900 font-mono text-sm">
              ${total.toFixed(2)}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Saldo Pendiente:</span>
            <strong className="text-rose-600 font-mono text-sm">
              ${saldoPendiente.toFixed(2)}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Monto del Abono ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={abonoMonto}
              onChange={(e) => setAbonoMonto(e.target.value)}
              className="clay-input w-full font-mono font-bold text-sm"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Forma de Pago / Cuenta Bancaria *</label>
            <select
              value={abonoFormaPagoId}
              onChange={(e) => setAbonoFormaPagoId(e.target.value)}
              className="clay-input w-full font-bold cursor-pointer"
              required
            >
              {formasPago.filter((fp) => fp.activo !== false).map((fp) => (
                <option key={fp.id} value={fp.id}>
                  {fp.nombre} ({fp.tipo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">No. Comprobante / Autorización Bancaria</label>
            <input
              type="text"
              placeholder="Ej. #Transf 491823, Ref #00129..."
              value={abonoNumDoc}
              onChange={(e) => setAbonoNumDoc(e.target.value)}
              className="clay-input w-full font-mono font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Captura / Comprobante de Transferencia (Foto o Screenshot)
            </label>
            {abonoComprobante ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={abonoComprobante}
                    alt="Comprobante Abono"
                    className="w-10 h-10 object-cover rounded-lg border border-emerald-300 cursor-pointer hover:opacity-85"
                    onClick={() => onViewComprobante ? onViewComprobante(abonoComprobante) : window.open(abonoComprobante, '_blank')}
                    title="Clic para ver en tamaño completo"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Comprobante adjuntado
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewComprobante ? onViewComprobante(abonoComprobante) : window.open(abonoComprobante, '_blank')}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold block"
                    >
                      Ver en grande
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAbonoComprobante('')}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                  title="Quitar comprobante"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div onPaste={handlePasteImage}>
                <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 rounded-xl cursor-pointer transition-all">
                  {abonoSubiendoComprobante ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Subiendo comprobante...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Subir foto o captura del comprobante</span>
                      <span className="text-[10px] text-slate-500">PNG, JPG o pega con Ctrl+V</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={abonoSubiendoComprobante}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Fecha del Pago</label>
            <input
              type="date"
              value={abonoFecha}
              onChange={(e) => setAbonoFecha(e.target.value)}
              className="clay-input w-full font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Observaciones / Notas (Opcional)</label>
            <input
              type="text"
              placeholder="Liquidación final, abono del 50%, etc."
              value={abonoObservaciones}
              onChange={(e) => setAbonoObservaciones(e.target.value)}
              className="clay-input w-full font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="clay-btn clay-btn-light px-4 py-2 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="clay-btn clay-btn-primary px-4 py-2 font-black flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Abono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
