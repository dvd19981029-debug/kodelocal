'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Download,
  Pencil,
  Box,
  Ban,
  Loader2,
  AlertTriangle,
  Tag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Store,
} from 'lucide-react';
import { SaleRecord } from '@/lib/store';
import { getStaffToken } from '@/lib/auth';
import { downloadQuotePdf, QuotePriceChange, QuotePromotion } from '@/lib/quotePdf';
import type { CotizacionNotices } from '@/components/pos/CotizacionModal';

export type QuoteStatus = 'PENDIENTE' | 'ENVIADA_BODEGA' | 'ANULADA';

export interface SavedQuote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerDoc?: string | null;
  customerNrc?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  tipoComprobante?: string | null;
  subtotal: number;
  ivaTotal: number;
  total: number;
  sellerName?: string | null;
  status: QuoteStatus;
  sentSaleNumber?: string | null;
  statusAt?: string | null;
  statusReason?: string | null;
  validUntil: string;
  createdAt: string;
  items: Array<{
    productId?: string | null;
    name: string;
    quantity: number;
    price: number;
    total: number;
    unit?: string | null;
    presentation?: string | null;
    puesto?: string | null;
  }>;
  priceChanges: QuotePriceChange[];
  isExpired: boolean;
}

interface PosPrefacturasModuleProps {
  /** Cambia cuando otra parte del POS modifica prefacturas (para recargar la lista) */
  refreshKey: number;
  onOpenQuote: (sale: SaleRecord, notices: CotizacionNotices) => void;
  onEdit: (quote: SavedQuote) => void;
  /** Debe devolver true si la comanda se creó y la prefactura quedó marcada como enviada */
  onSendToBodega: (quote: SavedQuote) => Promise<boolean>;
  /** Debe devolver true si la prefactura quedó anulada */
  onCancel: (quote: SavedQuote, reason: string) => Promise<boolean>;
  /** Avisa al POS que cambió algo (para refrescar el contador del menú) */
  onChanged: () => void;
  onGoToCotizador: () => void;
}

type StatusFilter = 'PENDIENTE' | 'ENVIADA_BODEGA' | 'ANULADA' | 'TODAS';

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' });

export default function PosPrefacturasModule({
  refreshKey,
  onOpenQuote,
  onEdit,
  onSendToBodega,
  onCancel,
  onChanged,
  onGoToCotizador,
}: PosPrefacturasModuleProps) {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [promotions, setPromotions] = useState<QuotePromotion[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('PENDIENTE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/quotes?limit=250', {
        cache: 'no-store',
        headers: { ...(staffToken ? { 'x-staff-token': staffToken } : {}) },
      });
      const data = await res.json();
      if (data.success) {
        setQuotes(data.quotes || []);
        setPromotions(data.promotions || []);
      } else {
        setError(data.error || 'No se pudieron cargar las prefacturas');
      }
    } catch {
      setError('No se pudieron cargar las prefacturas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const counts = useMemo(() => {
    const c = { PENDIENTE: 0, ENVIADA_BODEGA: 0, ANULADA: 0 };
    for (const q of quotes) c[q.status] = (c[q.status] || 0) + 1;
    return c;
  }, [quotes]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return quotes.filter((q) => {
      if (filter !== 'TODAS' && q.status !== filter) return false;
      if (!term) return true;
      return (
        q.quoteNumber.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term) ||
        (q.customerDoc || '').toLowerCase().includes(term) ||
        (q.customerPhone || '').toLowerCase().includes(term) ||
        q.items.some((it) => it.name.toLowerCase().includes(term))
      );
    });
  }, [quotes, filter, search]);

  const noticesFor = (q: SavedQuote): CotizacionNotices => ({
    validUntil: q.validUntil,
    priceChanges: q.priceChanges,
    promotions,
    isExpired: q.isExpired,
  });

  const toSale = (q: SavedQuote): SaleRecord => ({
    id: q.id,
    saleNumber: q.quoteNumber,
    orderNumber: q.quoteNumber,
    createdAt: q.createdAt,
    total: q.total,
    subtotal: q.subtotal,
    ivaTotal: q.ivaTotal,
    tipoComprobante: (q.tipoComprobante as SaleRecord['tipoComprobante']) || undefined,
    cliente: {
      nombre: q.customerName,
      numDocumento: q.customerDoc || undefined,
      nrc: q.customerNrc || undefined,
      correo: q.customerEmail || undefined,
      telefono: q.customerPhone || undefined,
      direccion: q.customerAddress || undefined,
    },
    status: 'PREFACTURA',
    vendedor: q.sellerName || undefined,
    items: q.items.map((it) => ({
      productId: it.productId || '',
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      total: it.total,
      unit: it.unit || undefined,
      puesto: it.puesto || undefined,
    })),
  });

  const handleDownload = async (q: SavedQuote) => {
    setBusyId(q.id);
    try {
      await downloadQuotePdf({
        quoteNumber: q.quoteNumber,
        createdAt: q.createdAt,
        validUntil: q.validUntil,
        customer: {
          nombre: q.customerName,
          numDocumento: q.customerDoc,
          nrc: q.customerNrc,
          correo: q.customerEmail,
          telefono: q.customerPhone,
          direccion: q.customerAddress,
        },
        vendedor: q.sellerName,
        items: q.items,
        subtotal: q.subtotal,
        ivaTotal: q.ivaTotal,
        total: q.total,
        priceChanges: q.priceChanges,
        promotions,
        isExpired: q.isExpired,
      });
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSend = async (q: SavedQuote) => {
    const lines: string[] = [`¿Enviar la prefactura ${q.quoteNumber} (${q.customerName}) a Bodega para prepararla?`];
    if (q.isExpired) {
      lines.push(`\n⚠ Esta prefactura está VENCIDA (válida hasta ${fmtDate(q.validUntil)}).`);
    }
    if (q.priceChanges.length > 0) {
      lines.push('\n⚠ Algunos precios de lista cambiaron desde que se cotizó:');
      for (const pc of q.priceChanges.slice(0, 6)) {
        lines.push(`  • ${pc.name}: cotizado $${pc.quotedListPrice.toFixed(2)} → hoy $${pc.currentListPrice.toFixed(2)}`);
      }
      lines.push('\nSe enviará con los PRECIOS COTIZADOS. Si necesitas actualizarlos, cancela y usa "Editar".');
    }
    if (!confirm(lines.join('\n'))) return;

    setBusyId(q.id);
    try {
      const ok = await onSendToBodega(q);
      if (ok) {
        await load();
        onChanged();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (q: SavedQuote) => {
    if (!confirm(`¿Anular la prefactura ${q.quoteNumber} (${q.customerName})?\nYa no aparecerá como pendiente.`)) return;
    setBusyId(q.id);
    try {
      const ok = await onCancel(q, 'Anulada por el cajero');
      if (ok) {
        await load();
        onChanged();
      }
    } finally {
      setBusyId(null);
    }
  };

  const chip = (value: StatusFilter, label: string, count?: number, color = 'bg-slate-900 text-white') => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
        filter === value ? color : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && <span className="font-mono">({count})</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="clay-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Prefacturas</span>
            <span className="clay-badge bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5">
              {counts.PENDIENTE} pendiente{counts.PENDIENTE === 1 ? '' : 's'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Cotizaciones a clientes. Cuando el cliente confirme, envíalas a Bodega para prepararlas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoToCotizador}
            className="clay-btn px-3 py-2 text-xs font-bold flex items-center gap-1.5 text-indigo-700"
          >
            <Store className="w-3.5 h-3.5" />
            Nueva prefactura
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="clay-btn px-3 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="clay-card p-3 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {chip('PENDIENTE', 'Pendientes', counts.PENDIENTE, 'bg-indigo-600 text-white')}
          {chip('ENVIADA_BODEGA', 'Enviadas a bodega', counts.ENVIADA_BODEGA, 'bg-emerald-600 text-white')}
          {chip('ANULADA', 'Anuladas', counts.ANULADA, 'bg-rose-600 text-white')}
          {chip('TODAS', 'Todas', quotes.length)}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente, documento, teléfono o producto"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {error && (
        <div className="clay-card p-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200">{error}</div>
      )}

      {!error && !loading && filtered.length === 0 && (
        <div className="clay-card p-10 text-center text-xs text-slate-400 font-medium">
          {search
            ? 'No se encontraron prefacturas con esa búsqueda.'
            : filter === 'PENDIENTE'
            ? 'No hay prefacturas pendientes. Crea una desde el Cotizador con "Enviar a prefactura".'
            : 'No hay prefacturas en esta categoría.'}
        </div>
      )}

      {loading && quotes.length === 0 && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2.5">
        {filtered.map((q) => {
          const busy = busyId === q.id;
          const pending = q.status === 'PENDIENTE';
          const expanded = expandedId === q.id;
          const totalQty = q.items.reduce((a, it) => a + Number(it.quantity || 0), 0);
          return (
            <div
              key={q.id}
              className={`clay-card p-3.5 space-y-2.5 ${q.status === 'ANULADA' ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-800 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-indigo-700">{q.quoteNumber}</span>
                    <span className="truncate">{q.customerName}</span>
                    {q.tipoComprobante && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                          q.tipoComprobante === '03' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {q.tipoComprobante === '03' ? 'CCF' : 'FC'}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {fmtDateTime(q.createdAt)} • válida hasta {fmtDate(q.validUntil)} • {q.items.length} producto
                    {q.items.length === 1 ? '' : 's'} ({totalQty} u.)
                    {q.customerPhone ? ` • ${q.customerPhone}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-lg text-slate-900">${q.total.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    neto ${q.subtotal.toFixed(2)} + IVA ${q.ivaTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Etiquetas de estado */}
              <div className="flex flex-wrap gap-1.5">
                {q.status === 'PENDIENTE' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Pendiente de confirmar
                  </span>
                )}
                {q.status === 'ENVIADA_BODEGA' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Enviada a bodega{q.sentSaleNumber ? ` (${q.sentSaleNumber})` : ''}
                    {q.statusAt ? ` • ${fmtDateTime(q.statusAt)}` : ''}
                  </span>
                )}
                {q.status === 'ANULADA' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                    <Ban className="w-3 h-3" />
                    Anulada{q.statusAt ? ` • ${fmtDateTime(q.statusAt)}` : ''}
                  </span>
                )}
                {pending && q.isExpired && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Vencida
                  </span>
                )}
                {pending && q.priceChanges.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Precios cambiaron ({q.priceChanges.length})
                  </span>
                )}
                {pending && promotions.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Tag className="w-3 h-3" /> Promoción vigente
                  </span>
                )}
              </div>

              {/* Detalle de productos */}
              {expanded && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="py-1">Producto</th>
                        <th className="py-1">Puesto</th>
                        <th className="py-1 text-center">Cant.</th>
                        <th className="py-1 text-right">P. unit.</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.items.map((it, idx) => (
                        <tr key={`${q.id}-${idx}`} className="border-t border-slate-200">
                          <td className="py-1.5 font-bold text-slate-800">
                            {it.name}
                            {it.unit ? <span className="ml-1 font-medium text-slate-400">({it.unit})</span> : null}
                          </td>
                          <td className="py-1.5 text-slate-600">{it.puesto || '-'}</td>
                          <td className="py-1.5 text-center font-mono">{it.quantity}</td>
                          <td className="py-1.5 text-right font-mono">${Number(it.price).toFixed(2)}</td>
                          <td className="py-1.5 text-right font-mono font-bold">${Number(it.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(q.customerEmail || q.customerAddress || q.customerNrc || q.customerDoc) && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                      {q.customerDoc && <span>Documento: <b>{q.customerDoc}</b></span>}
                      {q.customerNrc && <span>NRC: <b>{q.customerNrc}</b></span>}
                      {q.customerEmail && <span>Correo: <b>{q.customerEmail}</b></span>}
                      {q.customerAddress && <span>Dirección: <b>{q.customerAddress}</b></span>}
                      {q.sellerName && <span>Vendedor: <b>{q.sellerName}</b></span>}
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : q.id)}
                  className="clay-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1"
                >
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {expanded ? 'Ocultar productos' : 'Ver productos'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenQuote(toSale(q), noticesFor(q))}
                  className="clay-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1"
                  title="Ver la prefactura y compartirla por WhatsApp"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver / Compartir
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(q)}
                  disabled={busy}
                  className="clay-btn px-2.5 py-1.5 text-[11px] font-black text-white !bg-slate-900 flex items-center gap-1 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  PDF
                </button>

                {pending && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(q)}
                      disabled={busy}
                      className="clay-btn px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 disabled:opacity-60"
                      title="Cargar en el Cotizador para modificarla"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(q)}
                      disabled={busy}
                      className="clay-btn px-2.5 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 disabled:opacity-60"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Anular
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSend(q)}
                      disabled={busy}
                      className="clay-btn clay-btn-primary ml-auto px-3 py-1.5 text-[11px] font-black flex items-center gap-1.5 !bg-gradient-to-r !from-indigo-600 !to-indigo-800 text-white disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Box className="w-3.5 h-3.5 text-amber-300" />}
                      Enviar a Preparar (Bodega)
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
