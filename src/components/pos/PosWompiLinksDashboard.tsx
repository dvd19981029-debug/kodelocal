'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard,
  Link2,
  Copy,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Phone,
  Sparkles,
  ShieldCheck,
  Trash2,
  BellRing,
  X,
  FileText,
  QrCode,
} from 'lucide-react';
import { getStaffToken, getActiveSessionUI } from '@/lib/auth';

export interface AromaniakWompiEnlace {
  id: number;
  id_enlace?: number | null;
  referencia: string;
  monto: number;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  concepto?: string | null;
  url_enlace: string;
  url_qr_enlace?: string | null;
  creado_por?: string | null;
  estado: 'PENDIENTE' | 'PAGADO' | string;
  transaccion_id?: string | null;
  codigo_autorizacion?: string | null;
  fecha_pago?: string | null;
  created_at: string;
}

function playPaymentApprovedSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // Do - Mi - Sol - Do (acorde mayor de confirmación)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.11 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.11);
      osc.stop(ctx.currentTime + idx * 0.11 + 0.36);
    });
  } catch (_) {}
}

export const PosWompiLinksDashboard: React.FC = () => {
  const [enlaces, setEnlaces] = useState<AromaniakWompiEnlace[]>([]);
  const [stats, setStats] = useState({
    total_enlaces: 0,
    total_pagados: 0,
    total_pendientes: 0,
    monto_recaudado: 0,
  });
  const [loading, setLoading] = useState(false);
  const [verificandoId, setVerificandoId] = useState<number | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'PAGADO'>('TODOS');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // Formulario para crear enlace de pago
  const [monto, setMonto] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('Productos Aromaniak');
  const [generando, setGenerando] = useState(false);

  // Enlace recién generado, modal QR y avisos en vivo
  const [enlaceReciente, setEnlaceReciente] = useState<AromaniakWompiEnlace | null>(null);
  const [qrModalEnlace, setQrModalEnlace] = useState<AromaniakWompiEnlace | null>(null);
  const [qrUseFallback, setQrUseFallback] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [paidAlerts, setPaidAlerts] = useState<AromaniakWompiEnlace[]>([]);

  // Mapa para detectar transición PENDIENTE -> PAGADO en tiempo real
  const statusMapRef = useRef<Map<number, string>>(new Map());
  const isFirstLoadRef = useRef(true);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }, []);

  const fetchEnlaces = useCallback(
    async (silent = false, syncWithWompi = false) => {
      try {
        if (!silent) setLoading(true);
        const staffToken = await getStaffToken().catch(() => null);
        const params = new URLSearchParams();
        if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado);
        if (filtroBusqueda.trim()) params.append('q', filtroBusqueda.trim());
        if (syncWithWompi) params.append('sync', '1');

        const res = await fetch(`/api/wompi/enlaces?${params.toString()}`, {
          headers: staffToken ? { 'x-staff-token': staffToken } : {},
        });
        const data = await res.json();
        if (data.success) {
          const fetched: AromaniakWompiEnlace[] = data.enlaces || [];

          // Detectar si algún enlace acaba de cambiar de PENDIENTE a PAGADO
          const newlyPaid: AromaniakWompiEnlace[] = [];
          fetched.forEach((item) => {
            const prevStatus = statusMapRef.current.get(item.id);
            if (!isFirstLoadRef.current && prevStatus === 'PENDIENTE' && item.estado === 'PAGADO') {
              newlyPaid.push(item);
            }
            statusMapRef.current.set(item.id, item.estado);
          });
          isFirstLoadRef.current = false;

          if (newlyPaid.length > 0) {
            playPaymentApprovedSound();
            setPaidAlerts((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              return [...newlyPaid.filter((n) => !existingIds.has(n.id)), ...prev];
            });
            // Actualizar también la tarjeta de enlace reciente o el modal QR si están abiertos
            setEnlaceReciente((prev) => {
              if (!prev) return null;
              const match = newlyPaid.find((n) => n.id === prev.id);
              return match ? match : prev;
            });
            setQrModalEnlace((prev) => {
              if (!prev) return null;
              const match = newlyPaid.find((n) => n.id === prev.id);
              return match ? match : prev;
            });
          }

          setEnlaces(fetched);
          if (data.stats) {
            setStats(data.stats);
          }
        } else if (!silent) {
          showToast(data.error || 'Error al cargar enlaces de pago', 'error');
        }
      } catch (err) {
        if (!silent) {
          showToast('Error de red al consultar enlaces de pago', 'error');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filtroEstado, filtroBusqueda, showToast]
  );

  // Carga inicial
  useEffect(() => {
    fetchEnlaces(false, true);
  }, [fetchEnlaces]);

  // Monitoreo inteligente: solo consulta si la pestaña está visible y existe algún enlace PENDIENTE por cobrar
  const hasPendingLinks = useMemo(
    () =>
      enlaces.some((e) => e.estado === 'PENDIENTE') ||
      enlaceReciente?.estado === 'PENDIENTE' ||
      qrModalEnlace?.estado === 'PENDIENTE',
    [enlaces, enlaceReciente, qrModalEnlace]
  );

  useEffect(() => {
    if (!hasPendingLinks) return;
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchEnlaces(true, true);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchEnlaces, hasPendingLinks]);

  const handleGenerarEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      showToast('Ingresa un monto válido mayor a $0.00', 'error');
      return;
    }

    try {
      setGenerando(true);
      const staffToken = await getStaffToken().catch(() => null);
      const sessionUser = getActiveSessionUI();

      const res = await fetch('/api/wompi/enlaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          monto: parsedMonto,
          clienteNombre: clienteNombre.trim() || undefined,
          clienteTelefono: clienteTelefono.trim() || undefined,
          concepto: concepto.trim() || 'Productos Aromaniak',
          creadoPor: sessionUser?.name || 'Caja Aromaniak',
        }),
      });

      const data = await res.json();
      if (data.success && data.enlace) {
        statusMapRef.current.set(data.enlace.id, data.enlace.estado);
        setEnlaceReciente(data.enlace);
        setMonto('');
        setClienteNombre('');
        setClienteTelefono('');
        setConcepto('Productos Aromaniak');
        showToast('¡Enlace de pago generado con éxito!', 'success');
        fetchEnlaces(true, false);
      } else {
        showToast(data.error || 'No se pudo generar el enlace de Wompi', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al generar enlace de pago', 'error');
    } finally {
      setGenerando(false);
    }
  };

  const handleCopiarTexto = (texto: string, id: string, mensaje = 'Enlace copiado al portapapeles') => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    showToast(mensaje, 'success');
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleCompartirWhatsApp = (enlace: AromaniakWompiEnlace) => {
    const telefono = enlace.cliente_telefono ? enlace.cliente_telefono.replace(/\D/g, '') : '';
    const nombre = enlace.cliente_nombre ? ` ${enlace.cliente_nombre}` : '';
    const desc = enlace.concepto || 'Productos Aromaniak';
    const texto = `¡Hola${nombre}! ✨ Te compartimos tu enlace seguro de pago de *Aromaniak* (${desc}) por *$${Number(
      enlace.monto
    ).toFixed(2)}*:\n\n${enlace.url_enlace}\n\nPuedes realizar tu pago con tarjeta de crédito o débito mediante Wompi.`;

    const waUrl =
      telefono.length >= 8
        ? `https://wa.me/503${telefono.slice(-8)}?text=${encodeURIComponent(texto)}`
        : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    window.open(waUrl, '_blank');
  };

  const handleVerificarEstado = async (id: number) => {
    try {
      setVerificandoId(id);
      const staffToken = await getStaffToken().catch(() => null);
      const res = await fetch('/api/wompi/enlaces', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success && data.enlace) {
        const updated: AromaniakWompiEnlace = data.enlace;
        const prevStatus = statusMapRef.current.get(updated.id);
        statusMapRef.current.set(updated.id, updated.estado);

        setEnlaces((prev) => prev.map((item) => (item.id === id ? updated : item)));
        if (qrModalEnlace?.id === id) setQrModalEnlace(updated);
        if (enlaceReciente?.id === id) setEnlaceReciente(updated);
        if (updated.estado === 'PAGADO') {
          if (prevStatus !== 'PAGADO') {
            playPaymentApprovedSound();
            setPaidAlerts((prev) => [updated, ...prev.filter((p) => p.id !== updated.id)]);
          }
          showToast(
            `¡Pago confirmado en Wompi! Auto: #${updated.codigo_autorizacion || 'Aprobado'}`,
            'success'
          );
          fetchEnlaces(true, false);
        } else {
          showToast('El enlace aún aparece pendiente de pago en Wompi', 'info');
        }
      }
    } catch (_) {
      showToast('Error al verificar el estado del enlace', 'error');
    } finally {
      setVerificandoId(null);
    }
  };

  const handleAbrirQr = (enlace: AromaniakWompiEnlace) => {
    setQrUseFallback(false);
    setQrModalEnlace(enlace);
  };

  const handleEliminarEnlace = async (id: number) => {
    if (!confirm('¿Deseas eliminar este enlace del historial?')) return;
    try {
      const staffToken = await getStaffToken().catch(() => null);
      const res = await fetch(`/api/wompi/enlaces?id=${id}`, {
        method: 'DELETE',
        headers: staffToken ? { 'x-staff-token': staffToken } : {},
      });
      const data = await res.json();
      if (data.success) {
        showToast('Enlace eliminado', 'info');
        setEnlaces((prev) => prev.filter((item) => item.id !== id));
        if (enlaceReciente?.id === id) setEnlaceReciente(null);
        if (qrModalEnlace?.id === id) setQrModalEnlace(null);
        fetchEnlaces(true, false);
      } else {
        showToast(data.error || 'No se pudo eliminar', 'error');
      }
    } catch (_) {
      showToast('Error al eliminar enlace', 'error');
    }
  };

  const montosRapidos = [11, 14, 15, 20, 25, 35, 50];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Flotante */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-black flex items-center gap-2 animate-in slide-in-from-bottom-4 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toastMsg.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* BANNER DE AVISO EN TIEMPO REAL CUANDO UN ENLACE ES PAGADO */}
      {paidAlerts.length > 0 && (
        <div className="space-y-2">
          {paidAlerts.map((alertItem) => (
            <div
              key={alertItem.id}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/20 border border-emerald-300 flex flex-wrap items-center justify-between gap-3 animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5 text-white animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white text-emerald-800 px-2 py-0.5 rounded-full">
                      ¡PAGO CONFIRMADO EN WOMPI!
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-100">
                      Ref: {alertItem.referencia}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-black mt-0.5">
                    {alertItem.cliente_nombre || 'Cliente Aromaniak'} pagó{' '}
                    <span className="underline decoration-2">
                      ${Number(alertItem.monto).toFixed(2)}
                    </span>{' '}
                    — {alertItem.concepto || 'Productos Aromaniak'}
                  </p>
                  {alertItem.codigo_autorizacion && (
                    <p className="text-xs font-mono font-bold text-emerald-100">
                      Código de Autorización Wompi: #{alertItem.codigo_autorizacion}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {alertItem.codigo_autorizacion && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopiarTexto(
                        alertItem.codigo_autorizacion!,
                        `alert-auto-${alertItem.id}`,
                        'Número de autorización copiado'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black font-mono cursor-pointer shadow-xs"
                  >
                    Copiar Auto #{alertItem.codigo_autorizacion}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setPaidAlerts((prev) => prev.filter((item) => item.id !== alertItem.id))
                  }
                  className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                  title="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. TARJETAS DE MÉTRICAS DEL DASHBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-indigo-500">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Enlaces Generados
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {stats.total_enlaces}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Historial en Caja</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Link2 className="w-5 h-5" />
          </div>
        </div>

        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-emerald-500">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Enlaces Pagados
            </span>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
              {stats.total_pagados}
            </div>
            <span className="text-[10px] text-emerald-800 font-medium">Aprobados por Wompi</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-amber-500">
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Pendientes de Pago
            </span>
            <div className="text-2xl font-black text-amber-600 font-mono mt-0.5">
              {stats.total_pendientes}
            </div>
            <span className="text-[10px] text-amber-800 font-medium">Monitoreando en vivo</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-purple-500">
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
              Total Cobrado (Links)
            </span>
            <div className="text-2xl font-black text-purple-700 font-mono mt-0.5">
              ${stats.monto_recaudado.toFixed(2)}
            </div>
            <span className="text-[10px] text-purple-800 font-medium">Recaudado con tarjeta</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. FORMULARIO PARA CREAR NUEVO ENLACE DE PAGO */}
      <div className="clay-card p-5 sm:p-6 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 border border-indigo-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Crear Nuevo Enlace de Pago Wompi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Escribe para quién es el enlace, la descripción y el monto a cobrar. El sistema te avisará automáticamente en cuanto quede pagado.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Aviso de Pago en Vivo Activo</span>
            </span>
            <button
              type="button"
              onClick={() => {
                fetchEnlaces(false, true);
                showToast('Verificando pagos en Wompi...', 'info');
              }}
              disabled={loading}
              className="clay-btn px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleGenerarEnlace} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            {/* Monto a cobrar */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase">
                Monto a Cobrar ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-base">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="clay-input w-full pl-8 pr-3 py-2.5 text-base font-black font-mono text-indigo-900 bg-white border-indigo-300 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Para quién es (Nombre del Cliente) */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Nombre del Cliente (Para quién)</span>
              </label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Andrea Martínez"
                className="clay-input w-full py-2.5 text-xs font-semibold bg-white"
              />
            </div>

            {/* Descripción / Concepto (Por defecto: Productos Aromaniak) */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Descripción</span>
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Productos Aromaniak"
                className="clay-input w-full py-2.5 text-xs font-semibold bg-white"
              />
            </div>

            {/* WhatsApp + Botón Generar */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp (Opcional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  placeholder="7788-9900"
                  className="clay-input w-full py-2.5 text-xs font-medium bg-white"
                />
                <button
                  type="submit"
                  disabled={generando || !monto || parseFloat(monto) <= 0}
                  className="clay-btn clay-btn-primary px-4 py-2.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50 shrink-0 rounded-xl"
                >
                  {generando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>Generar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Botones de Montos Rápidos */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
                Montos Rápidos:
              </span>
              {montosRapidos.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonto(m.toFixed(2))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    parseFloat(monto) === m
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  ${m.toFixed(2)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pasarela oficial Wompi El Salvador (Tarjeta Crédito / Débito)</span>
            </div>
          </div>
        </form>

        {/* TARJETA DEL ENLACE RECIÉN GENERADO */}
        {enlaceReciente && (
          <div
            className={`p-4 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
              enlaceReciente.estado === 'PAGADO'
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-indigo-50/70 border-indigo-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 ${
                    enlaceReciente.estado === 'PAGADO' ? 'text-emerald-600' : 'text-indigo-600'
                  }`}
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                    {enlaceReciente.estado === 'PAGADO'
                      ? `¡Enlace Pagado! ($${Number(enlaceReciente.monto).toFixed(2)})`
                      : `¡Enlace Listo para Compartir! ($${Number(enlaceReciente.monto).toFixed(2)})`}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">
                    Para: <strong>{enlaceReciente.cliente_nombre || 'Cliente Aromaniak'}</strong> •{' '}
                    Descripción: <strong>{enlaceReciente.concepto || 'Productos Aromaniak'}</strong> •{' '}
                    Ref: <span className="font-mono">{enlaceReciente.referencia}</span>
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border ${
                  enlaceReciente.estado === 'PAGADO'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {enlaceReciente.estado === 'PAGADO'
                  ? `PAGADO ${
                      enlaceReciente.codigo_autorizacion
                        ? `• AUTO #${enlaceReciente.codigo_autorizacion}`
                        : ''
                    }`
                  : 'PENDIENTE DE PAGO'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                readOnly
                value={enlaceReciente.url_enlace}
                className="flex-1 min-w-[220px] text-xs font-mono bg-white border border-indigo-200 rounded-xl px-3 py-2 text-slate-800 select-all font-medium"
              />

              <button
                type="button"
                onClick={() => handleAbrirQr(enlaceReciente)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-200 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Ver QR</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopiarTexto(enlaceReciente.url_enlace, `reciente-${enlaceReciente.id}`)
                }
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {copiadoId === `reciente-${enlaceReciente.id}` ? '¡Copiado!' : 'Copiar Enlace'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCompartirWhatsApp(enlaceReciente)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>

              <a
                href={enlaceReciente.url_enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3. LISTADO DE ENLACES GENERADOS Y SU ESTADO DE PAGO */}
      <div className="clay-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs sm:text-sm font-black uppercase text-slate-800 tracking-wider">
              Enlaces de Pago Generados ({enlaces.length})
            </h3>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              {(['TODOS', 'PENDIENTE', 'PAGADO'] as const).map((est) => (
                <button
                  key={est}
                  type="button"
                  onClick={() => setFiltroEstado(est)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filtroEstado === est
                      ? 'bg-white text-indigo-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {est === 'TODOS'
                    ? 'Todos'
                    : est === 'PENDIENTE'
                    ? `Pendientes (${stats.total_pendientes})`
                    : `Pagados (${stats.total_pagados})`}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              placeholder="Buscar por cliente, monto, referencia..."
              className="clay-input w-full pl-8 pr-3 py-1.5 text-xs bg-white"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Monto</th>
                  <th className="py-3 px-3">Para Quién (Cliente)</th>
                  <th className="py-3 px-3">Descripción</th>
                  <th className="py-3 px-3">Enlace de Pago</th>
                  <th className="py-3 px-3">Fecha / Creado por</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enlaces.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Link2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm text-slate-600">
                        Aún no hay enlaces de pago generados
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Usa el formulario de arriba para crear tu primer enlace de pago Wompi.
                      </p>
                    </td>
                  </tr>
                ) : (
                  enlaces.map((item) => {
                    const esPagado = item.estado === 'PAGADO';
                    const fechaFmt = new Date(item.created_at).toLocaleDateString('es-SV', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const fechaPagoFmt = item.fecha_pago
                      ? new Date(item.fecha_pago).toLocaleTimeString('es-SV', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : null;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          esPagado ? 'bg-emerald-50/25' : ''
                        }`}
                      >
                        {/* 1. Estado */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {esPagado ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>PAGADO</span>
                              </span>
                              {item.codigo_autorizacion && (
                                <div className="text-[10px] font-mono font-bold text-emerald-900 pl-1">
                                  Auto: #{item.codigo_autorizacion}
                                </div>
                              )}
                              {fechaPagoFmt && (
                                <div className="text-[10px] text-emerald-700 pl-1">
                                  Pagado {fechaPagoFmt}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>PENDIENTE</span>
                            </span>
                          )}
                        </td>

                        {/* 2. Monto */}
                        <td className="py-3 px-3 font-mono font-black text-sm text-slate-900 whitespace-nowrap">
                          ${Number(item.monto).toFixed(2)}
                        </td>

                        {/* 3. Para quién (Cliente & WhatsApp) */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {item.cliente_nombre || (
                              <span className="text-slate-400 font-normal">Cliente General</span>
                            )}
                          </div>
                          {item.cliente_telefono && (
                            <button
                              type="button"
                              onClick={() => handleCompartirWhatsApp(item)}
                              className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-mono mt-0.5 cursor-pointer"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>{item.cliente_telefono}</span>
                            </button>
                          )}
                        </td>

                        {/* 4. Descripción */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">
                            {item.concepto || 'Productos Aromaniak'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {item.referencia}
                          </span>
                        </td>

                        {/* 5. Enlace directo */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 max-w-[230px]">
                            <input
                              type="text"
                              readOnly
                              value={item.url_enlace}
                              className="w-full text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 select-all"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleCopiarTexto(item.url_enlace, `row-${item.id}`, 'Enlace copiado')
                              }
                              title="Copiar enlace"
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer transition-colors flex items-center gap-1 ${
                                copiadoId === `row-${item.id}`
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-900 hover:bg-black text-white'
                              }`}
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiadoId === `row-${item.id}` ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        </td>

                        {/* 6. Fecha y Usuario */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="text-[11px] font-mono text-slate-600">{fechaFmt}</div>
                          <div className="text-[10px] font-bold text-indigo-600">
                            {item.creado_por || 'Caja Aromaniak'}
                          </div>
                        </td>

                        {/* 7. Acciones */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAbrirQr(item)}
                              title="Ver QR ampliado en pantalla para escanear"
                              className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Ver QR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCompartirWhatsApp(item)}
                              title="Enviar por WhatsApp"
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={item.url_enlace}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir enlace de pago"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {!esPagado && (
                              <button
                                type="button"
                                onClick={() => handleVerificarEstado(item.id)}
                                disabled={verificandoId === item.id}
                                title="Verificar si ya fue pagado en Wompi"
                                className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${
                                    verificandoId === item.id ? 'animate-spin' : ''
                                  }`}
                                />
                                <span>Verificar</span>
                              </button>
                            )}

                            {esPagado && item.codigo_autorizacion && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopiarTexto(
                                    item.codigo_autorizacion!,
                                    `auto-${item.id}`,
                                    'Autorización copiada'
                                  )
                                }
                                title="Copiar código de autorización"
                                className="px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-black cursor-pointer font-mono"
                              >
                                Auto #{item.codigo_autorizacion}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleEliminarEnlace(item.id)}
                              title="Eliminar enlace"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      </div>

      {/* MODAL DE QR AMPLIADO PARA ESCANEAR DIRECTO EN EL MONITOR */}
      {qrModalEnlace && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setQrModalEnlace(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrModalEnlace(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                <QrCode className="w-3.5 h-3.5" />
                <span>Escanea con tu cámara para pagar</span>
              </span>
              <h3 className="text-3xl font-black font-mono text-slate-900 pt-1">
                ${Number(qrModalEnlace.monto).toFixed(2)}
              </h3>
              <p className="text-xs font-bold text-slate-600">
                {qrModalEnlace.cliente_nombre || 'Cliente Aromaniak'} •{' '}
                <span className="text-indigo-600">
                  {qrModalEnlace.concepto || 'Productos Aromaniak'}
                </span>
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                Ref: {qrModalEnlace.referencia}
              </p>
            </div>

            {qrModalEnlace.estado === 'PAGADO' ? (
              <div className="py-8 px-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-2 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                <div className="text-lg font-black text-emerald-900 uppercase">
                  ¡Pago Confirmado!
                </div>
                {qrModalEnlace.codigo_autorizacion && (
                  <div className="text-xs font-mono font-bold text-emerald-800">
                    Código de Autorización: #{qrModalEnlace.codigo_autorizacion}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-inner inline-flex flex-col items-center justify-center">
                <img
                  src={
                    !qrUseFallback && qrModalEnlace.url_qr_enlace
                      ? qrModalEnlace.url_qr_enlace
                      : `https://api.qrserver.com/v1/create-qr-code/?size=380x380&margin=10&data=${encodeURIComponent(
                          qrModalEnlace.url_enlace
                        )}`
                  }
                  alt={`QR de pago ${qrModalEnlace.referencia}`}
                  onError={() => setQrUseFallback(true)}
                  className="w-72 h-72 sm:w-80 sm:h-80 object-contain select-none"
                />
                <span className="text-[11px] font-semibold text-slate-500 mt-2">
                  Pasarela segura Wompi El Salvador
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-1">
              {qrModalEnlace.estado !== 'PAGADO' && (
                <button
                  type="button"
                  onClick={() => handleVerificarEstado(qrModalEnlace.id)}
                  disabled={verificandoId === qrModalEnlace.id}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      verificandoId === qrModalEnlace.id ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Verificar Pago Ahora</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setQrModalEnlace(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
