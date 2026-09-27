'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  PlusCircle,
  DollarSign,
  TrendingUp,
  FileText,
  User,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { WompiEnlaceItem, Vendedora } from '../../types';

interface WompiEnlacesViewProps {
  vendedoras: Vendedora[];
  vendedoraSeleccionada: string;
  onVolver: () => void;
  onCrearPedidoConPago?: (pagoData: {
    clienteNombre?: string;
    clienteTelefono?: string;
    monto: number;
    codigoAutorizacion?: string;
  }) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const WompiEnlacesView: React.FC<WompiEnlacesViewProps> = ({
  vendedoras,
  vendedoraSeleccionada,
  onVolver,
  onCrearPedidoConPago,
  showToast,
}) => {
  // Lista de enlaces y métricas
  const [enlaces, setEnlaces] = useState<WompiEnlaceItem[]>([]);
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

  // Formulario rápido para generar enlace
  const [monto, setMonto] = useState<string>('20.00');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('Perfumes Kode');
  const [vendedoraId, setVendedoraId] = useState<string>(vendedoraSeleccionada || '');
  const [generando, setGenerando] = useState(false);

  // Enlace recién generado para destacar
  const [enlaceReciente, setEnlaceReciente] = useState<WompiEnlaceItem | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Cargar enlaces desde API
  const fetchEnlaces = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado);
      if (filtroBusqueda.trim()) params.append('q', filtroBusqueda.trim());

      const res = await fetch(`/api/kode/wompi/enlaces?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEnlaces(data.enlaces || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        showToast(data.error || 'Error al cargar enlaces', 'error');
      }
    } catch (err: any) {
      console.error('Error fetching Wompi enlaces:', err);
      showToast('Error de red al conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroBusqueda, showToast]);

  useEffect(() => {
    fetchEnlaces();
  }, [fetchEnlaces]);

  // Mantener sincronizada la asesora si cambia en la barra lateral
  useEffect(() => {
    if (vendedoraSeleccionada) {
      setVendedoraId(vendedoraSeleccionada);
    }
  }, [vendedoraSeleccionada]);

  // Generar nuevo enlace
  const handleGenerarEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      showToast('Ingresa un monto válido para generar el enlace ($)', 'error');
      return;
    }

    try {
      setGenerando(true);
      const activeVendedoraId = vendedoraId || vendedoraSeleccionada;
      const vendedoraObj = vendedoras.find((v) => v.id === activeVendedoraId) || vendedoras[0];

      const res = await fetch('/api/kode/wompi/enlaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: parsedMonto,
          clienteNombre: clienteNombre.trim() || undefined,
          clienteTelefono: clienteTelefono.trim() || undefined,
          concepto: concepto.trim() || undefined,
          vendedoraId: activeVendedoraId || undefined,
          vendedoraNombre: vendedoraObj?.nombre || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.enlace) {
        showToast('¡Enlace de pago Wompi generado con éxito!', 'success');
        setEnlaceReciente(data.enlace);
        // Limpiar campos secundarios pero mantener concepto
        setClienteNombre('');
        setClienteTelefono('');
        // Recargar tabla
        fetchEnlaces();
      } else {
        showToast(data.error || 'No se pudo generar el enlace', 'error');
      }
    } catch (err: any) {
      console.error('Error generando enlace Wompi:', err);
      showToast(err.message || 'Error al generar enlace Wompi', 'error');
    } finally {
      setGenerando(false);
    }
  };

  // Copiar al portapapeles
  const handleCopiarTexto = (texto: string, id: string, mensaje = 'Enlace copiado') => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    showToast(mensaje, 'success');
    setTimeout(() => setCopiadoId(null), 3000);
  };

  // Compartir por WhatsApp
  const handleCompartirWhatsApp = (enlace: WompiEnlaceItem) => {
    const telefono = enlace.cliente_telefono ? enlace.cliente_telefono.replace(/\D/g, '') : '';
    const nombre = enlace.cliente_nombre ? ` ${enlace.cliente_nombre}` : '';
    const texto = `Hola${nombre}! Te compartimos tu enlace seguro de pago de KÖDE por un monto de $${Number(enlace.monto).toFixed(2)}:\n\n${enlace.url_enlace}\n\nPuedes pagar de forma segura con tarjeta de crédito o débito mediante Wompi. ¡Avísanos en cuanto lo realices para procesar tu pedido de inmediato!`;

    const waUrl = telefono
      ? `https://wa.me/503${telefono.slice(-8)}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    window.open(waUrl, '_blank');
  };

  // Verificar estado del enlace
  const handleVerificarEstado = async (id: number) => {
    try {
      setVerificandoId(id);
      const res = await fetch('/api/kode/wompi/enlaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success && data.enlace) {
        setEnlaces((prev) => prev.map((item) => (item.id === id ? data.enlace : item)));
        if (data.enlace.estado === 'PAGADO') {
          showToast(`¡Pago confirmado! Auto: ${data.enlace.codigo_autorizacion || 'N/A'}`, 'success');
        } else {
          showToast('El enlace sigue pendiente de pago', 'info');
        }
      }
    } catch (e) {
      showToast('Error al verificar estado', 'error');
    } finally {
      setVerificandoId(null);
    }
  };

  // Eliminar enlace
  const handleEliminarEnlace = async (id: number) => {
    if (!confirm('¿Estás segura de eliminar este enlace de cobro?')) return;
    try {
      const res = await fetch(`/api/kode/wompi/enlaces?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Enlace eliminado con éxito', 'info');
        setEnlaces((prev) => prev.filter((item) => item.id !== id));
        fetchEnlaces();
      } else {
        showToast(data.error || 'No se pudo eliminar el enlace', 'error');
      }
    } catch (e) {
      showToast('Error al eliminar enlace', 'error');
    }
  };

  // Montos rápidos sugeridos
  const montosRapidos = [15, 20, 25, 35, 40, 50];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. CABECERA & NAVEGACIÓN */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            ← Volver a Ventas
          </button>
          <span className="text-xs text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 tracking-wide flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>PASARELA DE COBROS WOMPI</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
              Wompi El Salvador
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchEnlaces();
            showToast('Actualizando enlaces y pagos...', 'info');
          }}
          disabled={loading}
          className="clay-btn px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 border border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Enlaces */}
        <div className="clay-card p-4 flex items-center gap-3 border-l-4 border-l-indigo-500">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Enlaces</span>
            <span className="text-xl font-black text-slate-900 font-mono">{stats.total_enlaces}</span>
          </div>
        </div>

        {/* Pagados */}
        <div className="clay-card p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 block uppercase">Cobros Pagados</span>
            <span className="text-xl font-black text-emerald-700 font-mono">{stats.total_pagados}</span>
          </div>
        </div>

        {/* Pendientes */}
        <div className="clay-card p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 block uppercase">Pendientes</span>
            <span className="text-xl font-black text-amber-700 font-mono">{stats.total_pendientes}</span>
          </div>
        </div>

        {/* Monto Recaudado */}
        <div className="clay-card p-4 flex items-center gap-3 border-l-4 border-l-violet-500">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-violet-700 block uppercase">Monto Pagado</span>
            <span className="text-xl font-black text-violet-700 font-mono">
              ${stats.monto_recaudado.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. GENERADOR RÁPIDO DE ENLACE */}
      <div className="clay-card p-5 sm:p-6 bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/30 border border-indigo-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Generar Nuevo Enlace de Pago</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Solo ingresa el monto a cobrar y genera al instante el enlace seguro de Wompi para tu clienta.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pago Seguro Wompi Tarjeta SV</span>
          </div>
        </div>

        <form onSubmit={handleGenerarEnlace} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
            {/* Monto Principal */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase flex items-center justify-between">
                <span>Monto a Cobrar ($) *</span>
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

            {/* Nombre de la Clienta */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Clienta (Opcional)</span>
              </label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Carmen Rodríguez"
                className="clay-input w-full py-2.5 text-xs font-medium bg-white"
              />
            </div>

            {/* Teléfono WhatsApp */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>WhatsApp (Opcional)</span>
              </label>
              <input
                type="text"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="Ej. 7788-9900"
                className="clay-input w-full py-2.5 text-xs font-medium bg-white"
              />
            </div>

            {/* Botón de Generar */}
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={generando || !monto || parseFloat(monto) <= 0}
                className="clay-btn clay-btn-primary w-full py-2.5 text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
              >
                {generando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>⚡ Generar Enlace</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Atajos de montos y campos adicionales */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Montos Rápidos:</span>
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
                  ${m}
                </button>
              ))}
            </div>

            {/* Asesora & Concepto expandibles */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Asesora:</span>
                <select
                  value={vendedoraId}
                  onChange={(e) => setVendedoraId(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer"
                >
                  <option value="">(Sin asignar)</option>
                  {vendedoras.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Concepto:</span>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 w-44"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Tarjeta de Éxito / Recién Generado */}
        {enlaceReciente && (
          <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                    ¡Enlace de Pago Listo para Enviar! (${Number(enlaceReciente.monto).toFixed(2)})
                  </h4>
                  <span className="text-[11px] text-emerald-800">
                    Ref: <strong>{enlaceReciente.referencia}</strong>
                    {enlaceReciente.cliente_nombre && ` • Clienta: ${enlaceReciente.cliente_nombre}`}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white border border-emerald-300 px-2 py-0.5 rounded-full">
                ESTADO: PENDIENTE DE PAGO
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                readOnly
                value={enlaceReciente.url_enlace}
                className="flex-1 min-w-[220px] text-xs font-mono bg-white border border-emerald-200 rounded-lg px-3 py-2 text-slate-800 select-all font-medium"
              />

              <button
                type="button"
                onClick={() => handleCopiarTexto(enlaceReciente.url_enlace, `reciente-${enlaceReciente.id}`)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiadoId === `reciente-${enlaceReciente.id}` ? '¡Copiado!' : 'Copiar Enlace'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCompartirWhatsApp(enlaceReciente)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>

              <a
                href={enlaceReciente.url_enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Enlace</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 4. TABLA DE ENLACES GENERADOS */}
      <div className="space-y-3">
        {/* Barra de Controles y Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Historial de Enlaces ({enlaces.length})
            </h3>

            {/* Píldoras de Filtro */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 ml-2">
              {(['TODOS', 'PENDIENTE', 'PAGADO'] as const).map((est) => (
                <button
                  key={est}
                  type="button"
                  onClick={() => setFiltroEstado(est)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filtroEstado === est
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {est === 'TODOS' ? 'Todos' : est === 'PENDIENTE' ? 'Pendientes' : 'Pagados'}
                </button>
              ))}
            </div>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              placeholder="Buscar por cliente, ref, auto..."
              className="clay-input w-full pl-8 pr-3 py-1.5 text-xs bg-white"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Monto</th>
                  <th className="py-3 px-3">Referencia / ID</th>
                  <th className="py-3 px-3">Clienta & WhatsApp</th>
                  <th className="py-3 px-3">Generado Por (Usuario)</th>
                  <th className="py-3 px-3">Concepto</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enlaces.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Link2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-sm">No hay enlaces de pago generados</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Utiliza el generador de arriba para crear un enlace de cobro de Wompi.
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

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          esPagado ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        {/* 1. Estado */}
                        <td className="py-3 px-3">
                          {esPagado ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>PAGADO</span>
                              </span>
                              {item.codigo_autorizacion && (
                                <div className="text-[10px] font-mono font-bold text-emerald-900 block pl-1">
                                  Auto: #{item.codigo_autorizacion}
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
                        <td className="py-3 px-3 font-mono font-black text-sm text-slate-900">
                          ${Number(item.monto).toFixed(2)}
                        </td>

                        {/* 3. Referencia */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          <span className="font-bold text-slate-800 block">{item.referencia}</span>
                          {item.id_enlace && (
                            <span className="text-[10px] text-slate-400">ID Wompi: {item.id_enlace}</span>
                          )}
                        </td>

                        {/* 4. Clienta */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {item.cliente_nombre || <span className="text-slate-400 font-normal">Sin nombre</span>}
                          </div>
                          {item.cliente_telefono && (
                            <a
                              href={`https://wa.me/503${item.cliente_telefono.replace(/\D/g, '').slice(-8)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-mono mt-0.5"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>{item.cliente_telefono}</span>
                            </a>
                          )}
                        </td>

                        {/* 5. Generado Por (Usuario / Asesora) */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {item.vendedora_nombre ? item.vendedora_nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block text-xs">
                                {item.vendedora_nombre || 'Sistema / Sin asignar'}
                              </span>
                              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                                Asesora
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 6. Concepto */}
                        <td className="py-3 px-3">
                          <span
                            className="text-slate-700 font-medium text-xs block truncate max-w-[170px]"
                            title={item.concepto || 'Perfumes Kode'}
                          >
                            {item.concepto || 'Perfumes Kode'}
                          </span>
                        </td>

                        {/* 7. Fecha */}
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {fechaFmt}
                        </td>

                        {/* 7. Acciones */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copiar enlace */}
                            <button
                              type="button"
                              onClick={() => handleCopiarTexto(item.url_enlace, `tbl-${item.id}`, 'Enlace copiado')}
                              title="Copiar enlace de pago"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Enviar WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleCompartirWhatsApp(item)}
                              title="Compartir por WhatsApp"
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>

                            {/* Abrir Link */}
                            <a
                              href={item.url_enlace}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir enlace en pestaña nueva"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {/* Verificar estado si sigue pendiente */}
                            {!esPagado && (
                              <button
                                type="button"
                                onClick={() => handleVerificarEstado(item.id)}
                                disabled={verificandoId === item.id}
                                title="Verificar si la clienta ya pagó"
                                className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                              >
                                <RefreshCw className={`w-3 h-3 ${verificandoId === item.id ? 'animate-spin' : ''}`} />
                                <span>Verificar</span>
                              </button>
                            )}

                            {/* Si ya está pagado: Copiar auto y Crear pedido */}
                            {esPagado && (
                              <>
                                {item.codigo_autorizacion && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopiarTexto(
                                        item.codigo_autorizacion!,
                                        `auto-${item.id}`,
                                        'Autorización copiada'
                                      )
                                    }
                                    title="Copiar número de autorización"
                                    className="px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-black cursor-pointer font-mono"
                                  >
                                    Auto: {item.codigo_autorizacion}
                                  </button>
                                )}

                                {onCrearPedidoConPago && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onCrearPedidoConPago({
                                        clienteNombre: item.cliente_nombre,
                                        clienteTelefono: item.cliente_telefono,
                                        monto: Number(item.monto),
                                        codigoAutorizacion: item.codigo_autorizacion,
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                                  >
                                    <span>Crear Pedido</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </>
                            )}

                            {/* Eliminar enlace */}
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
    </div>
  );
};
