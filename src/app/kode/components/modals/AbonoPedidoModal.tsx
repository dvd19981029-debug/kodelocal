'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, X, CheckCircle2, RefreshCw, Upload, Check, Copy, ExternalLink, Link2, MessageCircle } from 'lucide-react';
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
  const [generandoEnlaceWompi, setGenerandoEnlaceWompi] = useState<boolean>(false);
  const [wompiLinkGenerado, setWompiLinkGenerado] = useState<{ urlEnlace: string; orderNumber: string } | null>(null);
  const [wompiCopiado, setWompiCopiado] = useState<boolean>(false);

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
      setWompiLinkGenerado(null);
      setWompiCopiado(false);
      setAbonoFecha(new Date().toISOString().split('T')[0]);
    }
  }, [pedido, formasPago]);

  if (!pedido) return null;

  const total = parseFloat(pedido.total?.toString() || '0');
  const pagado = parseFloat(pedido.total_pagado?.toString() || '0');
  const saldoPendiente = Math.max(0, total - pagado);

  // Helpers Wompi
  const handleGenerarEnlaceWompi = async () => {
    if (!pedido) return;
    const montoCalculado = parseFloat(abonoMonto) || saldoPendiente;
    if (montoCalculado <= 0) {
      showToast('Ingresa un monto válido para generar el enlace de pago ($)', 'error');
      return;
    }

    try {
      setGenerandoEnlaceWompi(true);
      const res = await fetch('/api/kode/wompi/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: montoCalculado,
          pedidoNumero: pedido.numero_pedido,
          clienteNombre: pedido.cliente_nombre?.trim() || undefined,
          clienteTelefono: pedido.cliente_telefono?.trim() || undefined,
          clienteEmail: pedido.cliente_email?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.urlEnlace) {
        setWompiLinkGenerado({
          urlEnlace: data.urlEnlace,
          orderNumber: data.orderNumber || pedido.numero_pedido,
        });
        showToast('¡Enlace de pago Wompi generado con éxito!', 'success');
        if (!abonoMonto) {
          setAbonoMonto(montoCalculado.toFixed(2));
        }
      } else {
        showToast(data.error || 'No se pudo generar el enlace con Wompi', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al conectar con Wompi', 'error');
    } finally {
      setGenerandoEnlaceWompi(false);
    }
  };

  const handleCopiarWompiLink = (url: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setWompiCopiado(true);
    showToast('Enlace de Wompi copiado al portapapeles', 'success');
    setTimeout(() => setWompiCopiado(false), 3000);
  };

  const handleCompartirWhatsAppWompi = () => {
    if (!wompiLinkGenerado?.urlEnlace || !pedido) return;
    const phone = pedido.cliente_telefono?.replace(/\D/g, '') || '';
    const cleanPhone = phone.startsWith('503') ? phone : `503${phone}`;
    const montoCalculado = parseFloat(abonoMonto) || saldoPendiente;
    const nombreCliente = pedido.cliente_nombre ? ` ${pedido.cliente_nombre.trim()}` : '';
    const mensaje = `Hola${nombreCliente}! Te compartimos el enlace seguro de pago de KÖDE para tu pedido #${pedido.numero_pedido} por un monto de $${montoCalculado.toFixed(2)} (Tarjeta de Crédito / Débito / Banco Agrícola): ${wompiLinkGenerado.urlEnlace}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(abonoMonto.toString());
    if (isNaN(monto) || monto <= 0) {
      showToast('Ingresa un monto válido para el abono ($)', 'error');
      return;
    }

    const formaSeleccionada = formasPago.find((f) => f.id === abonoFormaPagoId);
    const esWompiActual = Boolean(formaSeleccionada?.nombre?.toLowerCase().includes('wompi') || formaSeleccionada?.id === '1006');
    const obsFinales = [
      abonoObservaciones.trim(),
      esWompiActual && wompiLinkGenerado ? `Enlace Wompi: ${wompiLinkGenerado.urlEnlace}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

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
          observaciones: obsFinales,
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

          {(() => {
            const formaActual = formasPago.find((f) => f.id === abonoFormaPagoId);
            const esWompi = Boolean(formaActual?.nombre?.toLowerCase().includes('wompi') || formaActual?.id === '1006');
            const montoParaWompi = parseFloat(abonoMonto) || saldoPendiente;

            return (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Forma de Pago / Cuenta Bancaria *</label>
                  <select
                    value={abonoFormaPagoId}
                    onChange={(e) => {
                      setAbonoFormaPagoId(e.target.value);
                      setWompiLinkGenerado(null);
                    }}
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
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{esWompi ? 'No. Autorización Wompi' : 'No. Comprobante / Autorización Bancaria'}</span>
                    {esWompi && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        opcional o manual
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder={esWompi ? 'Ej. 984723 o Auto Wompi' : 'Ej. #Transf 491823, Ref #00129...'}
                    value={abonoNumDoc}
                    onChange={(e) => setAbonoNumDoc(e.target.value)}
                    className={`clay-input w-full font-mono ${
                      esWompi ? 'font-bold border-indigo-300 text-indigo-900 bg-indigo-50/20' : 'font-medium'
                    }`}
                  />
                </div>

                {/* Asistente Especial de Pasarela Wompi */}
                {esWompi && (
                  <div className="p-3 bg-gradient-to-r from-violet-50 via-indigo-50/80 to-purple-50 rounded-xl border border-indigo-200 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">💳</span>
                        <div>
                          <span className="text-xs font-black text-indigo-950 block">
                            Pasarela Wompi SV
                          </span>
                          <span className="text-[11px] text-slate-600 block">
                            Genera el enlace de cobro o ingresa directamente la autorización si el cliente ya pagó.
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                        Wompi
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        disabled={generandoEnlaceWompi || montoParaWompi <= 0}
                        onClick={handleGenerarEnlaceWompi}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        {generandoEnlaceWompi ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Generando enlace...</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="w-3.5 h-3.5" />
                            <span>⚡ Generar Enlace de Pago (${montoParaWompi.toFixed(2)})</span>
                          </>
                        )}
                      </button>

                      {wompiLinkGenerado && (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Enlace generado
                        </span>
                      )}
                    </div>

                    {wompiLinkGenerado && (
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-200 space-y-2 shadow-2xs animate-in fade-in duration-150">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={wompiLinkGenerado.urlEnlace}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 select-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopiarWompiLink(wompiLinkGenerado.urlEnlace)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{wompiCopiado ? 'Copiado' : 'Copiar'}</span>
                          </button>
                          <a
                            href={wompiLinkGenerado.urlEnlace}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Abrir</span>
                          </a>
                        </div>

                        {pedido.cliente_telefono && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                            <span className="text-[11px] text-slate-600">
                              Enviar a WhatsApp ({pedido.cliente_telefono}):
                            </span>
                            <button
                              type="button"
                              onClick={handleCompartirWhatsAppWompi}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Compartir por WhatsApp</span>
                            </button>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-500 leading-tight">
                          💡 Una vez el cliente pague, anota el <strong>No. de Autorización</strong> en el campo de arriba y presiona <strong>"Confirmar y Registrar Abono"</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}

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
