'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Package,
  Camera,
  PenTool,
  RotateCw,
  X,
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
} from 'lucide-react';

interface TrackingEvaluation {
  pregunta: string;
  respuesta: string;
}

interface TrackingPhoto {
  nombre: string;
  url: string;
  esFirma: boolean;
}

interface TrackingStep {
  codigo: string;
  descripcion: string;
  completado: boolean;
  esIncidencia: boolean;
  ocultar: boolean;
}

interface TrackingEvent {
  codigo: string;
  fecha: string;
  titulo: string;
  estatusOriginal: string;
  observaciones: string;
  esIncidencia: boolean;
  esEntregado: boolean;
  esDevolucion: boolean;
  etdMin?: string | null;
  etdMax?: string | null;
  fechaProgramada?: string | null;
  destinatario?: string | null;
  evaluacion: TrackingEvaluation[];
  fotos: TrackingPhoto[];
  firmas: TrackingPhoto[];
}

interface DetailedTracking {
  found: boolean;
  guia: string;
  estatusActual: string;
  codigoActual: string;
  esEntregado: boolean;
  esDevolucion: boolean;
  tieneIncidencia: boolean;
  destinatario: string | null;
  direccion: string | null;
  fechaEntrega: string | null;
  etdMin: string | null;
  etdMax: string | null;
  indicaciones: string | null;
  flujo: TrackingStep[];
  bitacora: TrackingEvent[];
  todasLasFotos: TrackingPhoto[];
}

interface OrderSummary {
  orderNumber: string;
  customerName: string;
  department?: string | null;
  municipality?: string | null;
  shippingAddress?: string | null;
  orderStatus: string;
  paymentStatus?: string | null;
  createdAt: string;
  trackingNumber?: string | null;
  courierName?: string | null;
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatEventDateTime(raw: string): { dateLabel: string; timeLabel: string } {
  if (!raw) return { dateLabel: '', timeLabel: '' };
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    const parts = raw.split(' ');
    return { dateLabel: parts[0] || raw, timeLabel: parts.slice(1).join(' ') };
  }
  const dia = d.getDate();
  const mes = MESES[d.getMonth()] || '';
  const ano = d.getFullYear();

  const rawHours = d.getHours();
  const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
  const amPm = rawHours >= 12 ? 'PM' : 'AM';
  const hh = String(hours12).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return {
    dateLabel: `${dia} de ${mes}, ${ano}`,
    timeLabel: `${hh}:${mm}:${ss} ${amPm}`,
  };
}

function RastreoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery =
    searchParams.get('guia') ||
    searchParams.get('pedido') ||
    searchParams.get('q') ||
    '';

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<DetailedTracking | null>(null);
  const [orderInfo, setOrderInfo] = useState<OrderSummary | null>(null);
  const [searchedCode, setSearchedCode] = useState<string>('');

  // Modal de imágenes / firma con rotación
  const [lightboxPhotos, setLightboxPhotos] = useState<TrackingPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);

  const openLightbox = (photos: TrackingPhoto[], startIndex = 0) => {
    if (!photos || photos.length === 0) return;
    setLightboxPhotos(photos);
    setLightboxIndex(startIndex);
    setRotation(0);
  };

  const closeLightbox = () => {
    setLightboxPhotos([]);
    setLightboxIndex(0);
    setRotation(0);
  };

  const performSearch = useCallback(async (q: string) => {
    const clean = q.trim().replace(/^#/, '');
    if (!clean) return;

    setLoading(true);
    setError(null);
    setSearchedCode(clean);

    try {
      const res = await fetch(`/api/c807/tracking?q=${encodeURIComponent(clean)}`, {
        cache: 'no-store',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setTracking(null);
        setOrderInfo(null);
        setError(
          data.error ||
            'No se encontraron datos para este número de guía o pedido. Verifica que esté bien escrito.'
        );
        return;
      }

      setTracking(data.tracking || null);
      setOrderInfo(data.order || null);
    } catch {
      setError('No se pudo conectar con el servidor de rastreo. Intenta nuevamente en unos segundos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery.trim()) {
      setInputQuery(initialQuery.trim());
      performSearch(initialQuery.trim());
    }
  }, [initialQuery, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputQuery.trim().replace(/^#/, '');
    if (!clean) return;
    router.replace(`/rastreo?guia=${encodeURIComponent(clean)}`, { scroll: false });
    performSearch(clean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-purple-50/30 text-slate-900">
      {/* Cabecera Aromaniak */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Aromaniak"
              className="h-9 w-auto object-contain"
            />
            <span className="hidden sm:inline-block text-xs font-black uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
              Rastreo de Envíos
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-purple-200 bg-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la Tienda</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Buscador Principal */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="max-w-2xl mx-auto text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-black">
              <Truck className="w-3.5 h-3.5" />
              <span>Seguimiento en Tiempo Real • Aromaniak SV</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rastrea tu Pedido o Guía de Envío
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Ingresa tu <strong>N° de Guía</strong> o tu <strong>N° de Pedido Aromaniak (ej. WEB-...)</strong> para consultar el estado en vivo, bitácora de ruta, incidencias y fotos de entrega.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ingresa tu N° de Guía o Pedido (ej. WEB-1024 o código de guía)..."
                className="w-full pl-10 pr-4 py-3 text-sm font-mono font-bold rounded-2xl border border-slate-300 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-black shadow-md shadow-purple-200 inline-flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Rastrear Ahora</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Mensaje de Error / Sin Resultados */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-black">No encontramos información para &ldquo;{searchedCode}&rdquo;</p>
              <p className="text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Caso 1: Pedido existe en Aromaniak pero aún no tiene guía C807 generada */}
        {orderInfo && (!tracking || !tracking.found) && !loading && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 block">
                  Pedido Registrado en Aromaniak
                </span>
                <h2 className="text-lg font-black text-slate-900 font-mono">
                  #{orderInfo.orderNumber}
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                {orderInfo.orderStatus === 'ENTREGADO'
                  ? 'Entregado'
                  : orderInfo.orderStatus === 'EN_RUTA'
                  ? 'En Ruta'
                  : 'En Preparación en Bodega'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Cliente</span>
                <strong className="text-slate-800 text-sm block">{orderInfo.customerName}</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Destino de Entrega</span>
                <strong className="text-slate-800 block">
                  {[orderInfo.municipality, orderInfo.department].filter(Boolean).join(', ') || 'El Salvador'}
                </strong>
                {orderInfo.shippingAddress && (
                  <span className="text-slate-500 block">{orderInfo.shippingAddress}</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center gap-3 text-xs text-purple-900">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <strong>Tu pedido se está preparando en nuestro laboratorio/bodega.</strong>
                <p className="text-purple-700 mt-0.5">
                  En cuanto se genere tu guía de despacho, podrás ver aquí mismo todos los movimientos del motorista, hora estimada y fotos de entrega.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Caso 2: Guía con Rastreo en Vivo Completo */}
        {tracking && tracking.found && !loading && (
          <div className="space-y-6">
            {/* Encabezado Resumen de Guía */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Seguimiento de Guía:
                    </span>
                    <span className="font-mono font-black text-base sm:text-lg text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-xl">
                      {tracking.guia}
                    </span>
                    {orderInfo?.orderNumber && (
                      <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg">
                        Pedido #{orderInfo.orderNumber}
                      </span>
                    )}
                  </div>
                  {tracking.destinatario && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Destinatario: <strong className="text-slate-900">{tracking.destinatario}</strong>
                      </span>
                    </p>
                  )}
                  {(tracking.direccion || orderInfo?.shippingAddress) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{tracking.direccion || orderInfo?.shippingAddress}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border ${
                      tracking.esEntregado
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : tracking.tieneIncidencia
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}
                  >
                    {tracking.esEntregado ? (
                      <CheckCircle2 className="w-4 h-4 text-green-700" />
                    ) : tracking.tieneIncidencia ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Truck className="w-4 h-4 text-blue-700" />
                    )}
                    <span>
                      {tracking.esDevolucion
                        ? 'Retorno a Origen'
                        : tracking.estatusActual}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => performSearch(tracking.guia)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-purple-700 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Actualizar estado en vivo</span>
                  </button>
                </div>
              </div>

              {/* Barra de Progreso de Flujo (idéntica al flujo de C807) */}
              {tracking.flujo.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">
                    Progreso del Envío
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {tracking.flujo.map((step, idx) => {
                      const isAlert = step.esIncidencia && step.completado;
                      const isDone = step.completado && !step.esIncidencia;
                      return (
                        <div
                          key={`${step.codigo}-${idx}`}
                          className={`relative p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                            isAlert
                              ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                              : isDone
                              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                              isAlert
                                ? 'bg-rose-600 text-white'
                                : isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isAlert ? '!' : isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                              Paso {idx + 1}
                            </span>
                            <span className="text-xs font-black leading-tight block truncate">
                              {step.descripcion}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Galería Rápida si hay fotos de entrega o incidencias */}
              {tracking.todasLasFotos.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-purple-600" />
                      <span>
                        Evidencias Fotográficas y Firma ({tracking.todasLasFotos.length})
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Haz clic en cualquier imagen para ampliar o rotar
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {tracking.todasLasFotos.map((foto, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => openLightbox(tracking.todasLasFotos, fIdx)}
                        className="group relative w-24 h-24 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer"
                      >
                        <img
                          src={foto.url}
                          alt={foto.nombre}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 right-1 bg-slate-900/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded truncate">
                          {foto.esFirma ? 'Firma' : foto.nombre || 'Foto'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Bitácora Cronológica Detallada (Paso a Paso con Incidencias, Evaluaciones y Fotos) */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Historial y Bitácora del Paquete</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detalle cronológico de cada movimiento, comentarios de ruta, incidencias y comprobantes fotográficos.
                  </p>
                </div>
                {tracking.esEntregado && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                    Finalizado
                  </span>
                )}
              </div>

              <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 ml-2 sm:ml-4">
                {tracking.bitacora.map((ev, idx) => {
                  const { dateLabel, timeLabel } = formatEventDateTime(ev.fecha);
                  const allEventPhotos = [...ev.fotos, ...ev.firmas];

                  return (
                    <div key={`${ev.codigo}-${ev.fecha}-${idx}`} className="relative">
                      {/* Nodo de la línea de tiempo */}
                      <div
                        className={`absolute -left-[33px] sm:-left-[41px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-xs ${
                          ev.esIncidencia
                            ? 'bg-rose-600 border-rose-200 text-white'
                            : ev.esEntregado
                            ? 'bg-emerald-600 border-emerald-200 text-white'
                            : idx === 0
                            ? 'bg-purple-600 border-purple-200 text-white'
                            : 'bg-white border-slate-300 text-slate-500'
                        }`}
                      >
                        {ev.esIncidencia ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Tarjeta del Evento */}
                      <div
                        className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
                          ev.esIncidencia
                            ? 'bg-rose-50/70 border-rose-200'
                            : ev.esEntregado
                            ? 'bg-green-50/60 border-green-200'
                            : 'bg-slate-50/70 border-slate-200/90'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-black uppercase tracking-tight ${
                                ev.esIncidencia
                                  ? 'text-rose-800'
                                  : ev.esEntregado
                                  ? 'text-green-900'
                                  : 'text-slate-900'
                              }`}
                            >
                              {ev.titulo}
                            </span>
                            {ev.esIncidencia && (
                              <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-rose-200/80 text-rose-900 uppercase">
                                Incidencia Reportada
                              </span>
                            )}
                            {ev.esEntregado && (
                              <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-green-200/80 text-green-900 uppercase">
                                {ev.esDevolucion ? 'Retornado' : 'Entregado'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-500">
                            <strong className="text-slate-700">{dateLabel}</strong>
                            {timeLabel && <span> • {timeLabel}</span>}
                          </div>
                        </div>

                        {/* Observaciones del evento */}
                        {ev.observaciones && (
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {ev.observaciones}
                          </p>
                        )}

                        {/* Bloque especial código 14: programación de entrega */}
                        {ev.codigo === '14' && (ev.fechaProgramada || ev.etdMin || ev.etdMax) && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {ev.fechaProgramada && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Fecha programada
                                </span>
                                <strong className="text-slate-800">{ev.fechaProgramada}</strong>
                              </div>
                            )}
                            {(ev.etdMin || ev.etdMax) && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Hora estimada
                                </span>
                                <strong className="text-slate-800">
                                  {[ev.etdMin, ev.etdMax].filter(Boolean).join(' – ')}
                                </strong>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Sujeto a condiciones de tráfico/ruta
                                </span>
                              </div>
                            )}
                            {ev.destinatario && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                  Nombre de cliente
                                </span>
                                <strong className="text-slate-800">{ev.destinatario}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Preguntas y respuestas de Evaluación (Quién recibe, motivo de rechazo, etc.) */}
                        {ev.evaluacion.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {ev.evaluacion.map((item, eIdx) => (
                              <div
                                key={eIdx}
                                className="p-2.5 rounded-xl bg-white border border-slate-200/90 text-xs"
                              >
                                <span className="text-[10px] font-black uppercase text-slate-400 block">
                                  {item.pregunta}
                                </span>
                                <strong className="text-slate-900 font-bold block mt-0.5">
                                  {item.respuesta || '—'}
                                </strong>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fotos de evidencia del evento (Paquete entregado, Incidencia, Recolección) */}
                        {ev.fotos.length > 0 && (
                          <div className="pt-2 space-y-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-indigo-600" />
                              <span>
                                {ev.esEntregado
                                  ? 'Foto de Paquete Entregado'
                                  : ev.esIncidencia
                                  ? 'Fotos de Visita / Incidencia'
                                  : 'Fotos de Paquete'}
                              </span>
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {ev.fotos.map((foto, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => openLightbox(allEventPhotos, pIdx)}
                                  className="group relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-2xs hover:border-purple-600 transition-all cursor-pointer"
                                >
                                  <img
                                    src={foto.url}
                                    alt={foto.nombre}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Firma de recibido */}
                        {ev.firmas.length > 0 && (
                          <div className="pt-2 space-y-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                              <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Firma de Recibido</span>
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {ev.firmas.map((firma, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() =>
                                    openLightbox(allEventPhotos, ev.fotos.length + sIdx)
                                  }
                                  className="group relative w-40 h-24 rounded-2xl overflow-hidden border border-slate-300 bg-white p-2 shadow-2xs hover:border-emerald-600 transition-all cursor-pointer"
                                >
                                  <img
                                    src={firma.url}
                                    alt="Firma de entrega"
                                    loading="lazy"
                                    className="w-full h-full object-contain"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Visor Modal de Imágenes y Firma con Rotación */}
      {lightboxPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800">
                  {lightboxPhotos[lightboxIndex]?.esFirma
                    ? 'Firma de Recibido'
                    : lightboxPhotos[lightboxIndex]?.nombre || 'Evidencia Fotográfica'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({lightboxIndex + 1} / {lightboxPhotos.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  title="Rotar imagen 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotar</span>
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative bg-slate-900/95 h-[65vh] flex items-center justify-center overflow-hidden p-4">
              <img
                src={lightboxPhotos[lightboxIndex]?.url}
                alt={lightboxPhotos[lightboxIndex]?.nombre || 'Evidencia'}
                style={{ transform: `rotate(${rotation}deg)` }}
                className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg bg-white"
              />

              {lightboxPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRotation(0);
                      setLightboxIndex(
                        (i) => (i - 1 + lightboxPhotos.length) % lightboxPhotos.length
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRotation(0);
                      setLightboxIndex((i) => (i + 1) % lightboxPhotos.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-lg flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RastreoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">
          Cargando sistema de rastreo Aromaniak...
        </div>
      }
    >
      <RastreoContent />
    </Suspense>
  );
}
