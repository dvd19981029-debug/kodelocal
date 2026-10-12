'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X, Search, Download, Eye, FileText, AlertTriangle, Tag, Loader2, RefreshCw } from 'lucide-react';
import { SaleRecord } from '@/lib/store';
import { getStaffToken } from '@/lib/auth';
import { downloadQuotePdf, QuotePriceChange, QuotePromotion } from '@/lib/quotePdf';
import type { CotizacionNotices } from '@/components/pos/CotizacionModal';

interface SavedQuote {
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
  validUntil: string;
  createdAt: string;
  items: Array<{
    productId?: string | null;
    name: string;
    quantity: number;
    price: number;
    total: number;
    unit?: string | null;
    puesto?: string | null;
  }>;
  priceChanges: QuotePriceChange[];
  isExpired: boolean;
}

interface CotizacionesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuote: (sale: SaleRecord, notices: CotizacionNotices) => void;
}

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function CotizacionesHistoryModal({ isOpen, onClose, onOpenQuote }: CotizacionesHistoryModalProps) {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [promotions, setPromotions] = useState<QuotePromotion[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadQuotes = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const staffToken = await getStaffToken();
      const res = await fetch(`/api/quotes?limit=100${term ? `&search=${encodeURIComponent(term)}` : ''}`, {
        cache: 'no-store',
        headers: { ...(staffToken ? { 'x-staff-token': staffToken } : {}) },
      });
      const data = await res.json();
      if (data.success) {
        setQuotes(data.quotes || []);
        setPromotions(data.promotions || []);
      } else {
        setError(data.error || 'No se pudieron cargar las cotizaciones');
      }
    } catch {
      setError('No se pudieron cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => loadQuotes(search.trim()), 300);
    return () => clearTimeout(t);
  }, [isOpen, search, loadQuotes]);

  if (!isOpen) return null;

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
    setDownloadingId(q.id);
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
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">

        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-800">Cotizaciones realizadas</h3>
              <p className="text-[10px] text-slate-400">
                {quotes.length} cotización{quotes.length === 1 ? '' : 'es'}
                {promotions.length > 0 ? ` • ${promotions.length} promoción(es) vigente(s)` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadQuotes(search.trim())}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, cliente o documento..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {error && (
            <p className="text-xs font-bold text-red-600 p-3 bg-red-50 rounded-xl">{error}</p>
          )}
          {!error && !loading && quotes.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-10">
              {search ? 'No se encontraron cotizaciones con esa búsqueda.' : 'Aún no hay cotizaciones guardadas.'}
            </p>
          )}
          {loading && quotes.length === 0 && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          )}

          {quotes.map((q) => (
            <div key={q.id} className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">
                    <span className="font-mono text-amber-700">{q.quoteNumber}</span> • {q.customerName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {fmtDate(q.createdAt)} • válida hasta {fmtDate(q.validUntil)} • {q.items.length} producto(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900">${q.total.toFixed(2)}</span>
                  <button
                    onClick={() => onOpenQuote(toSale(q), noticesFor(q))}
                    className="clay-btn px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>
                  <button
                    onClick={() => handleDownload(q)}
                    disabled={downloadingId === q.id}
                    className="clay-btn px-2.5 py-1.5 text-[11px] font-black text-white !bg-slate-900 flex items-center gap-1 disabled:opacity-60"
                  >
                    {downloadingId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {(q.isExpired || q.priceChanges.length > 0 || promotions.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {q.isExpired && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Vencida
                    </span>
                  )}
                  {q.priceChanges.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Precios cambiaron ({q.priceChanges.length})
                    </span>
                  )}
                  {promotions.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" /> Promoción vigente
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
