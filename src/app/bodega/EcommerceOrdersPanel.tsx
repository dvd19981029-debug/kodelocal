'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  RefreshCw,
  Search,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  Package,
  FileText,
  Printer,
  Store,
  ExternalLink,
  Pencil,
  Check,
} from 'lucide-react';
import { getStaffToken } from '@/lib/auth';
import { parseKitOrderItem } from '@/lib/perfumeNames';
import {
  DEPARTAMENTOS_CATALOG,
  MUNICIPIOS_CATALOG,
  getMunicipiosByDepartamento,
  resolveDepartamentoCode,
} from '@/lib/svTerritory';

interface EcoItem {
  id: string;
  productName: string;
  inspiredBy?: string | null;
  presentation: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface EcoOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  department: string;
  municipality: string;
  shippingAddress: string;
  deliveryReference?: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  whatsappNotified?: boolean;
  notes?: string | null;
  createdAt: string;
  customer?: {
    documentType?: string | null;
    documentNum?: string | null;
    nrc?: string | null;
    businessName?: string | null;
    activityDesc?: string | null;
  } | null;
  sale?: {
    saleNumber?: string | null;
    tipoComprobante?: string | null;
    dteDocument?: { status?: string | null; controlNumber?: string | null; generationCode?: string | null } | null;
  } | null;
  items: EcoItem[];
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo (contra entrega)',
  CARD: 'Tarjeta (Wompi)',
  TRANSFER: 'Transferencia bancaria',
  BITCOIN: 'Bitcoin',
  OTHER: 'Otro',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Pagado',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelado',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  NUEVO: 'Nuevo',
  CONFIRMADO: 'Confirmado',
  EN_PREPARACION: 'En preparación',
  PROCESANDO: 'Procesando',
  LISTO_ENTREGA: 'Listo para entrega',
  EN_RUTA: 'En ruta',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  NUEVO: 'bg-sky-100 text-sky-800',
  CONFIRMADO: 'bg-indigo-100 text-indigo-800',
  EN_PREPARACION: 'bg-amber-100 text-amber-800',
  PROCESANDO: 'bg-amber-100 text-amber-800',
  LISTO_ENTREGA: 'bg-emerald-100 text-emerald-800',
  EN_RUTA: 'bg-blue-100 text-blue-800',
  ENTREGADO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-rose-100 text-rose-800',
};

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

const isPickup = (o: EcoOrder) =>
  /retiro/i.test(o.deliveryReference || '') ||
  /retiro/i.test(o.shippingAddress || '') ||
  /retiro/i.test(o.notes || '') ||
  Number(o.shippingCost ?? 1) === 0;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' });

// Pedido real = no cancelado y, si es con tarjeta, con pago confirmado.
// Misma regla que usa la pestaña "Por preparar" de Bodega.
const isRealOrder = (o: EcoOrder) => {
  if (o.orderStatus === 'CANCELADO' || o.paymentStatus === 'CANCELLED') return false;
  if (o.paymentMethod === 'CARD' && o.paymentStatus !== 'COMPLETED') return false;
  return true;
};

// Busca un pedido real del mismo cliente, mismo total y dentro de 24 h (intento previo del mismo carrito)
const findRealTwin = (o: EcoOrder, all: EcoOrder[]): EcoOrder | null => {
  const t = new Date(o.createdAt).getTime();
  return (
    all.find(
      (x) =>
        x.id !== o.id &&
        isRealOrder(x) &&
        x.customerPhone === o.customerPhone &&
        Math.abs(Number(x.total) - Number(o.total)) < 0.01 &&
        Math.abs(new Date(x.createdAt).getTime() - t) < 24 * 60 * 60 * 1000
    ) || null
  );
};

function ReadinessBadge({ order: o, twin }: { order: EcoOrder; twin: EcoOrder | null }) {
  let text: string;
  let cls: string;
  if (o.orderStatus === 'CANCELADO' || o.paymentStatus === 'CANCELLED') {
    text = 'Cancelado';
    cls = 'bg-rose-100 text-rose-800';
  } else if (!isRealOrder(o)) {
    text = twin ? `Intento previo de ${twin.orderNumber}` : 'Sin pagar';
    cls = 'bg-slate-200 text-slate-700';
  } else if (o.orderStatus === 'ENTREGADO') {
    text = 'Ya entregado';
    cls = 'bg-slate-100 text-slate-600';
  } else if (o.orderStatus === 'EN_RUTA') {
    text = 'En camino';
    cls = 'bg-blue-100 text-blue-800';
  } else {
    text = 'Listo para preparar';
    cls = 'bg-emerald-100 text-emerald-800';
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black font-sans ${cls}`}>{text}</span>
  );
}

function ReadinessBanner({ order: o, twin }: { order: EcoOrder; twin: EcoOrder | null }) {
  if (o.orderStatus === 'CANCELADO' || o.paymentStatus === 'CANCELLED') {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800">
        Pedido cancelado. No se debe preparar ni enviar.
      </div>
    );
  }
  if (!isRealOrder(o)) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
        <div className="font-black">No preparar: el pago con tarjeta no se ha confirmado.</div>
        <div className="mt-0.5">
          {twin
            ? `Es un intento previo. El pedido que sí está pagado es ${twin.orderNumber}.`
            : 'Solo se atiende si más adelante aparece como "Pagado". Puede ser un pago abandonado.'}
        </div>
      </div>
    );
  }
  if (o.orderStatus === 'ENTREGADO') {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-bold text-slate-700">
        Pedido ya entregado.
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-black text-emerald-800">
      Pedido válido: preparar y enviar.
    </div>
  );
}

export default function EcommerceOrdersPanel() {
  const [orders, setOrders] = useState<EcoOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<EcoOrder | null>(null);
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloadingBatch, setDownloadingBatch] = useState(false);

  const handleConfirmTransfer = async (o: EcoOrder) => {
    if (
      !confirm(
        `¿Confirmar que el cliente ${o.customerName} ya realizó la transferencia bancaria por ${money(o.total)} para el pedido #${o.orderNumber}?`
      )
    ) {
      return;
    }
    setVerifyingId(o.id);
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          orderId: o.id,
          orderNumber: o.orderNumber,
          paymentStatus: 'COMPLETED',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((item) => (item.id === o.id ? { ...item, paymentStatus: 'COMPLETED' } : item))
        );
        setSelected((prev) => (prev && prev.id === o.id ? { ...prev, paymentStatus: 'COMPLETED' } : prev));
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('kodelocal_sales');
            if (raw) {
              const saved = JSON.parse(raw);
              if (Array.isArray(saved)) {
                const updated = saved.map((s: any) =>
                  s.id === o.id || s.saleNumber === o.orderNumber || s.orderNumber === o.orderNumber
                    ? { ...s, paymentStatus: 'COMPLETED' }
                    : s
                );
                localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
                window.dispatchEvent(new Event('kodelocal_sales_updated'));
              }
            }
          } catch (_) {}
        }
      } else {
        alert(data.error || 'No se pudo confirmar la transferencia');
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err?.message || 'Error desconocido'}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        headers: { ...(staffToken ? { 'x-staff-token': staffToken } : {}) },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudieron cargar los pedidos');
      // Mostrar solo pedidos web (excluye ventas POS que la API agrega al consultar por cliente)
      setOrders((data.orders as any[]).filter((o) => o.channel !== 'POS'));
    } catch (e: any) {
      setError(e.message || 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hiddenCount = useMemo(() => orders.filter((o) => !isRealOrder(o)).length, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!showUnpaid && !isRealOrder(o)) return false;
      if (statusFilter !== 'ALL' && o.orderStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone || '').includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter, showUnpaid]);

  const selectableOrdersWithGuide = useMemo(
    () => filtered.filter((o) => Boolean(o.trackingNumber && o.trackingNumber.trim())),
    [filtered]
  );

  const selectedOrdersWithGuide = useMemo(
    () =>
      orders.filter(
        (o) =>
          selectedIds.includes(o.id) &&
          Boolean(o.trackingNumber && o.trackingNumber.trim())
      ),
    [orders, selectedIds]
  );

  const allVisibleWithGuideSelected =
    selectableOrdersWithGuide.length > 0 &&
    selectableOrdersWithGuide.every((o) => selectedIds.includes(o.id));

  const toggleSelectOrder = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAllWithGuide = () => {
    if (allVisibleWithGuideSelected) {
      const visibleIds = new Set(selectableOrdersWithGuide.map((o) => o.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const merged = new Set([
        ...selectedIds,
        ...selectableOrdersWithGuide.map((o) => o.id),
      ]);
      setSelectedIds(Array.from(merged));
    }
  };

  const handleBatchPdfAction = async (mode: 'download' | 'print') => {
    const guias = Array.from(
      new Set(
        selectedOrdersWithGuide
          .map((o) => String(o.trackingNumber || '').trim())
          .filter(Boolean)
      )
    );
    if (guias.length === 0) {
      alert('Selecciona al menos un pedido que ya tenga guía C807 generada.');
      return;
    }

    if (mode === 'print' && guias.length <= 25) {
      const url = `/api/c807/pdf?guias=${encodeURIComponent(guias.join(','))}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    setDownloadingBatch(true);
    try {
      const res = await fetch('/api/c807/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guias,
          download: mode === 'download',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        alert(errData?.error || 'No se pudo generar el PDF unificado de las guías seleccionadas.');
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (mode === 'print') {
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download =
          guias.length === 1
            ? `Guia-C807-${guias[0]}.pdf`
            : `Guias-C807-Aromaniak-${guias.length}-ordenes.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      }
    } catch (err: any) {
      alert(`Error al descargar guías unificadas: ${err?.message || 'Error de red'}`);
    } finally {
      setDownloadingBatch(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="clay-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-violet-600" />
            <span>Pedidos Ecommerce</span>
            <span className="clay-badge bg-violet-100 text-violet-800 text-xs font-bold px-2.5 py-0.5">
              {filtered.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Todos los pedidos que han ingresado desde la tienda en línea.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="clay-btn px-3 py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="clay-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por pedido, cliente, teléfono o correo"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-bold"
        >
          <option value="ALL">Todos los estados</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 bg-white cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showUnpaid}
            onChange={(e) => setShowUnpaid(e.target.checked)}
          />
          Mostrar intentos sin pagar y cancelados
          {hiddenCount > 0 && !showUnpaid && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {hiddenCount} ocultos
            </span>
          )}
        </label>
      </div>

      {error && (
        <div className="clay-card p-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200">
          {error}
        </div>
      )}

      {/* Tabla de Pedidos Ecommerce con Barra de Selección Integrada */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {(selectedOrdersWithGuide.length > 0 || selectableOrdersWithGuide.length > 0) && (
          <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allVisibleWithGuideSelected}
                  onChange={toggleSelectAllWithGuide}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span>
                  Seleccionar guías ({selectableOrdersWithGuide.length})
                </span>
              </label>
              {selectedOrdersWithGuide.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold whitespace-nowrap">
                    {selectedOrdersWithGuide.length}{' '}
                    {selectedOrdersWithGuide.length === 1 ? 'seleccionada' : 'seleccionadas'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            {selectedOrdersWithGuide.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={downloadingBatch}
                  onClick={() => handleBatchPdfAction('print')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {downloadingBatch
                      ? 'Preparando...'
                      : `Imprimir (${selectedOrdersWithGuide.length})`}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={downloadingBatch}
                  onClick={() => handleBatchPdfAction('download')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {downloadingBatch
                      ? 'Generando...'
                      : `Descargar PDF (${selectedOrdersWithGuide.length})`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 border-b border-slate-200/80">
                <th className="py-3 px-3.5 w-9 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleWithGuideSelected}
                    disabled={selectableOrdersWithGuide.length === 0}
                    onChange={toggleSelectAllWithGuide}
                    title="Seleccionar todas las órdenes visibles con guía C807"
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-40"
                  />
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Pedido / Guía</th>
                <th className="py-3 px-3 whitespace-nowrap">Fecha</th>
                <th className="py-3 px-3 whitespace-nowrap">Cliente</th>
                <th className="py-3 px-3 whitespace-nowrap">Entrega</th>
                <th className="py-3 px-3 whitespace-nowrap">Pago</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Total</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Estado</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                    {loading ? 'Cargando pedidos…' : 'No hay pedidos ecommerce para mostrar'}
                  </td>
                </tr>
              )}
              {filtered.map((o) => {
                const real = isRealOrder(o);
                const twin = real ? null : findRealTwin(o, orders);
                const hasGuide = Boolean(o.trackingNumber && o.trackingNumber.trim());
                const isChecked = selectedIds.includes(o.id);
                const d = new Date(o.createdAt);
                const dateLine = d.toLocaleDateString('es-SV', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const timeLine = d.toLocaleTimeString('es-SV', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const pickup = isPickup(o);

                let statusLabel = ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus;
                let statusCls = STATUS_COLORS[o.orderStatus] || 'bg-slate-100 text-slate-700';
                if (o.orderStatus === 'CANCELADO' || o.paymentStatus === 'CANCELLED') {
                  statusLabel = 'Cancelado';
                  statusCls = 'bg-rose-50 text-rose-700 border border-rose-200';
                } else if (!real) {
                  statusLabel = twin ? `Intento (${twin.orderNumber})` : 'Sin pagar';
                  statusCls = 'bg-slate-100 text-slate-600 border border-slate-200';
                } else if (o.orderStatus === 'NUEVO') {
                  statusLabel = 'Listo para preparar';
                  statusCls = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                }

                return (
                  <tr
                    key={o.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isChecked ? 'bg-indigo-50/40' : ''
                    } ${real ? '' : 'opacity-60'}`}
                  >
                    <td className="py-3 px-3.5 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!hasGuide}
                        onChange={() => toggleSelectOrder(o.id)}
                        title={
                          hasGuide
                            ? `Seleccionar guía ${o.trackingNumber}`
                            : 'Esta orden aún no tiene guía C807 generada'
                        }
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="py-3 px-3 align-middle whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{o.orderNumber}</div>
                      {hasGuide && (
                        <div className="text-[11px] font-mono font-medium text-indigo-600 mt-0.5">
                          {o.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 align-middle whitespace-nowrap">
                      <div className="font-medium text-slate-700">{dateLine}</div>
                      <div className="text-[11px] text-slate-400">{timeLine}</div>
                    </td>
                    <td className="py-3 px-3 align-middle">
                      <div className="font-bold text-slate-800 leading-snug max-w-[180px] truncate" title={o.customerName}>
                        {o.customerName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                        {o.customerPhone}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-middle">
                      {pickup ? (
                        <span className="font-medium text-slate-600 whitespace-nowrap">
                          Retiro en sucursal
                        </span>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                            <span>Domicilio</span>
                            {Number(o.shippingCost || 0) > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-[10px]">
                                Envío: {money(o.shippingCost)}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={o.municipality}>
                            {o.municipality}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 font-medium">
                          {o.paymentMethod === 'TRANSFER'
                            ? 'Transferencia'
                            : PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            o.paymentStatus === 'COMPLETED'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : o.paymentStatus === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
                        </span>
                      </div>
                      {(o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'TRANSFERENCIA') &&
                        o.paymentStatus !== 'COMPLETED' &&
                        o.orderStatus !== 'CANCELADO' && (
                          <button
                            type="button"
                            disabled={verifyingId === o.id}
                            onClick={() => handleConfirmTransfer(o)}
                            className="mt-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>{verifyingId === o.id ? 'Confirmando...' : 'Confirmar pago'}</span>
                          </button>
                        )}
                    </td>
                    <td className="py-3 px-3 align-middle text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {money(o.total)}
                    </td>
                    <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {o.trackingNumber && (
                          <>
                            <a
                              href={`/api/c807/pdf?guia=${encodeURIComponent(o.trackingNumber)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                              title={`Imprimir guía ${o.trackingNumber}`}
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Imprimir</span>
                            </a>
                            <a
                              href={`/api/c807/pdf?guia=${encodeURIComponent(o.trackingNumber)}&download=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                              title={`Descargar PDF guía ${o.trackingNumber}`}
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-600" />
                              <span>PDF</span>
                            </a>
                          </>
                        )}
                        <button
                          onClick={() => setSelected(o)}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <OrderDetailModal
          order={selected}
          twin={isRealOrder(selected) ? null : findRealTwin(selected, orders)}
          onClose={() => setSelected(null)}
          onOrderUpdated={(updatedOrder) => {
            setOrders((prev) => prev.map((item) => (item.id === updatedOrder.id ? { ...item, ...updatedOrder } : item)));
            setSelected((prev) => (prev && prev.id === updatedOrder.id ? { ...prev, ...updatedOrder } : prev));
          }}
        />
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
          {icon}
          {title}
        </h4>
        {action}
      </div>
      <div className="text-xs text-slate-800 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}

function OrderDetailModal({
  order: o,
  twin,
  onClose,
  onOrderUpdated,
}: {
  order: EcoOrder;
  twin: EcoOrder | null;
  onClose: () => void;
  onOrderUpdated: (updated: Partial<EcoOrder> & { id: string }) => void;
}) {
  const pickup = isPickup(o);
  const dte = o.sale?.dteDocument;
  const isCcf = o.sale?.tipoComprobante === '03' || Boolean(o.customer?.nrc);
  const [generatingGuide, setGeneratingGuide] = useState(false);

  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [editDepartment, setEditDepartment] = useState(o.department || 'San Salvador');
  const [editMunicipality, setEditMunicipality] = useState(o.municipality || 'San Salvador');
  const [editAddress, setEditAddress] = useState(o.shippingAddress || '');
  const [editReference, setEditReference] = useState(o.deliveryReference || '');
  const [savingDelivery, setSavingDelivery] = useState(false);

  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [manualGuide, setManualGuide] = useState(o.trackingNumber || '');
  const [savingManualGuide, setSavingManualGuide] = useState(false);

  const handleSaveManualGuide = async () => {
    const cleanGuide = manualGuide.trim();
    if (!cleanGuide) {
      alert('Por favor pega o ingresa el N° de guía.');
      return;
    }
    setSavingManualGuide(true);
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          orderId: o.id,
          orderNumber: o.orderNumber,
          trackingNumber: cleanGuide,
          courierName: o.courierName || 'C807 Express',
          orderStatus: o.orderStatus === 'ENTREGADO' ? 'ENTREGADO' : 'EN_RUTA',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onOrderUpdated({
          id: o.id,
          trackingNumber: cleanGuide,
          courierName: o.courierName || 'C807 Express',
          orderStatus: data.order?.orderStatus || (o.orderStatus === 'ENTREGADO' ? 'ENTREGADO' : 'EN_RUTA'),
        });
        setIsEditingGuide(false);
      } else {
        alert(data.error || 'No se pudo guardar el N° de guía');
      }
    } catch (err: any) {
      alert(`Error al guardar la guía: ${err?.message || 'Error de conexión'}`);
    } finally {
      setSavingManualGuide(false);
    }
  };

  useEffect(() => {
    setEditDepartment(o.department || 'San Salvador');
    setEditMunicipality(o.municipality || 'San Salvador');
    setEditAddress(o.shippingAddress || '');
    setEditReference(o.deliveryReference || '');
  }, [o.id, o.department, o.municipality, o.shippingAddress, o.deliveryReference]);

  const departamentosList = useMemo(
    () => DEPARTAMENTOS_CATALOG.filter((d) => d.id !== '00').map((d) => d.nombre),
    []
  );

  const municipioOptions = useMemo(() => {
    const deptCode = resolveDepartamentoCode(editDepartment);
    const c807Munis = getMunicipiosByDepartamento(editDepartment).map((m) => m.nombre);
    const mhMunis = MUNICIPIOS_CATALOG.filter((m) => m.departamentoId === deptCode).map((m) => m.nombre);
    const unique = Array.from(new Set([...c807Munis, ...mhMunis]));
    if (editMunicipality && !unique.includes(editMunicipality)) {
      return [editMunicipality, ...unique];
    }
    return unique;
  }, [editDepartment, editMunicipality]);

  const handleSaveDelivery = async () => {
    setSavingDelivery(true);
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          orderId: o.id,
          orderNumber: o.orderNumber,
          department: editDepartment.trim(),
          municipality: editMunicipality.trim(),
          shippingAddress: editAddress.trim(),
          deliveryReference: editReference.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        onOrderUpdated({
          id: o.id,
          department: data.order.department,
          municipality: data.order.municipality,
          shippingAddress: data.order.shippingAddress,
          deliveryReference: data.order.deliveryReference,
        });
        setIsEditingDelivery(false);
      } else {
        alert(`Error al actualizar datos de entrega: ${data.error || 'No se pudo guardar'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err?.message || 'Error desconocido'}`);
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleGenerateGuide = async () => {
    if (pickup) return;
    setGeneratingGuide(true);
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          orderId: o.id,
          orderNumber: o.orderNumber,
          ...(isEditingDelivery
            ? {
                department: editDepartment.trim(),
                municipality: editMunicipality.trim(),
                shippingAddress: editAddress.trim(),
                deliveryReference: editReference.trim() || null,
              }
            : {}),
          generarGuiaC807: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.order?.trackingNumber) {
        onOrderUpdated({
          id: o.id,
          department: data.order.department || o.department,
          municipality: data.order.municipality || o.municipality,
          shippingAddress: data.order.shippingAddress || o.shippingAddress,
          deliveryReference: data.order.deliveryReference ?? o.deliveryReference,
          trackingNumber: data.order.trackingNumber,
          courierName: data.order.courierName || 'C807 Express',
          orderStatus: data.order.orderStatus || 'EN_RUTA',
        });
        setIsEditingDelivery(false);
        if (typeof window !== 'undefined') {
          window.open(
            `/api/c807/pdf?guia=${encodeURIComponent(data.order.trackingNumber)}`,
            '_blank',
            'noopener,noreferrer'
          );
        }
        alert(`✅ Guía C807 generada exitosamente: ${data.order.trackingNumber}\nSe abrió el PDF de la guía listo para imprimir.`);
      } else {
        alert(`Error al generar guía C807: ${data.error || 'No se pudo generar la guía'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión con C807: ${err?.message || 'Error desconocido'}`);
    } finally {
      setGeneratingGuide(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-sm font-black text-slate-800">Pedido {o.orderNumber}</h3>
            <p className="text-[11px] text-slate-500">{fmtDate(o.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                STATUS_COLORS[o.orderStatus] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pt-4">
          <ReadinessBanner order={o} twin={twin} />
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Section icon={<User className="w-3.5 h-3.5" />} title="Cliente">
            <Row label="Nombre" value={o.customerName} />
            <Row
              label="Teléfono"
              value={
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {o.customerPhone}
                </span>
              }
            />
            <Row
              label="Correo"
              value={
                o.customerEmail ? (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {o.customerEmail}
                  </span>
                ) : undefined
              }
            />
            <Row label="Razón social" value={o.customer?.businessName} />
            <Row
              label={o.customer?.documentType || 'Documento'}
              value={o.customer?.documentNum && o.customer.documentNum !== '00000000-0' ? o.customer.documentNum : undefined}
            />
            <Row label="NRC" value={o.customer?.nrc} />
            <Row label="Giro" value={o.customer?.activityDesc} />
          </Section>

          <Section
            icon={pickup ? <Store className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            title="Entrega"
            action={
              !isEditingDelivery ? (
                <button
                  type="button"
                  onClick={() => setIsEditingDelivery(true)}
                  title="Editar datos de entrega"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              ) : null
            }
          >
            <Row label="Tipo de entrega" value={pickup ? 'Retiro en sucursal' : 'Envío a domicilio'} />
            {isEditingDelivery ? (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                    Departamento
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => {
                      const nextDept = e.target.value;
                      setEditDepartment(nextDept);
                      const nextMunis = getMunicipiosByDepartamento(nextDept);
                      if (nextMunis.length > 0) {
                        setEditMunicipality(nextMunis[0].nombre);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {departamentosList.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                    Municipio
                  </label>
                  <select
                    value={editMunicipality}
                    onChange={(e) => setEditMunicipality(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {municipioOptions.map((muni) => (
                      <option key={muni} value={muni}>
                        {muni}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">
                      Dirección
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {editAddress.length}/250
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value.slice(0, 250))}
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500">
                      Referencia
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {editReference.length}/120
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    value={editReference}
                    onChange={(e) => setEditReference(e.target.value.slice(0, 120))}
                    placeholder="Punto de referencia (opcional)"
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={savingDelivery}
                    onClick={() => {
                      setEditDepartment(o.department || 'San Salvador');
                      setEditMunicipality(o.municipality || 'San Salvador');
                      setEditAddress(o.shippingAddress || '');
                      setEditReference(o.deliveryReference || '');
                      setIsEditingDelivery(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={savingDelivery}
                    onClick={handleSaveDelivery}
                    className="clay-btn-primary px-3 py-1 text-[11px] font-black inline-flex items-center gap-1 rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>{savingDelivery ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Row label="Departamento" value={o.department} />
                <Row label="Municipio" value={o.municipality} />
                <Row label="Dirección" value={o.shippingAddress} />
                <Row label="Referencia" value={o.deliveryReference} />
              </>
            )}
            <Row label="Costo de envío" value={money(o.shippingCost)} />
          </Section>

          <Section icon={<CreditCard className="w-3.5 h-3.5" />} title="Pago y facturación">
            <Row label="Forma de pago" value={PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod} />
            <Row
              label="Estado del pago"
              value={
                <span className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                  <span
                    className={
                      o.paymentStatus === 'COMPLETED'
                        ? 'text-emerald-700 font-black'
                        : 'text-amber-700 font-black'
                    }
                  >
                    {PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
                  </span>
                </span>
              }
            />
            {(o.paymentMethod === 'TRANSFER' || o.paymentMethod === 'TRANSFERENCIA') &&
              o.paymentStatus !== 'COMPLETED' &&
              o.orderStatus !== 'CANCELADO' && (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !confirm(
                          `¿Confirmar que el cliente ${o.customerName} ya realizó la transferencia bancaria por ${money(o.total)} para el pedido #${o.orderNumber}?`
                        )
                      ) {
                        return;
                      }
                      try {
                        const staffToken = await getStaffToken();
                        const res = await fetch('/api/ecommerce/orders', {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(staffToken ? { 'x-staff-token': staffToken } : {}),
                          },
                          body: JSON.stringify({
                            orderId: o.id,
                            orderNumber: o.orderNumber,
                            paymentStatus: 'COMPLETED',
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          onOrderUpdated({ id: o.id, paymentStatus: 'COMPLETED' });
                          if (typeof window !== 'undefined') {
                            try {
                              const raw = localStorage.getItem('kodelocal_sales');
                              if (raw) {
                                const saved = JSON.parse(raw);
                                if (Array.isArray(saved)) {
                                  const updated = saved.map((s: any) =>
                                    s.id === o.id || s.saleNumber === o.orderNumber || s.orderNumber === o.orderNumber
                                      ? { ...s, paymentStatus: 'COMPLETED' }
                                      : s
                                  );
                                  localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
                                  window.dispatchEvent(new Event('kodelocal_sales_updated'));
                                }
                              }
                            } catch (_) {}
                          }
                        } else {
                          alert(data.error || 'No se pudo confirmar la transferencia');
                        }
                      } catch (err: any) {
                        alert(`Error de conexión: ${err?.message || 'Error desconocido'}`);
                      }
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Transferencia Verificada</span>
                  </button>
                </div>
              )}
            <Row
              label="Comprobante"
              value={o.sale?.tipoComprobante ? (isCcf ? 'Crédito Fiscal (CCF)' : 'Factura (FC)') : undefined}
            />
            <Row label="N° de venta" value={o.sale?.saleNumber} />
            <Row label="DTE" value={dte?.status} />
            <Row label="N° de control" value={dte?.controlNumber} />
          </Section>

          <Section
            icon={<Truck className="w-3.5 h-3.5" />}
            title="Seguimiento"
            action={
              !pickup && isRealOrder(o) ? (
                <button
                  type="button"
                  onClick={() => {
                    setManualGuide(o.trackingNumber || '');
                    setIsEditingGuide((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                  title="Pegar o editar N° de guía manualmente"
                >
                  <Pencil className="w-3 h-3" />
                  <span>{isEditingGuide ? 'Cancelar' : 'Editar guía'}</span>
                </button>
              ) : null
            }
          >
            <Row label="Estado" value={ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus} />
            <Row label="Mensajero / courier" value={o.courierName || (!pickup ? 'C807 Express' : undefined)} />
            {isEditingGuide ? (
              <div className="pt-1 space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    N° de guía C807 (Pegar manualmente)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={manualGuide}
                      onChange={(e) => setManualGuide(e.target.value)}
                      placeholder="Ej. SV12000334..."
                      autoFocus
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-indigo-300 bg-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      disabled={savingManualGuide}
                      onClick={handleSaveManualGuide}
                      className="clay-btn-primary px-3 py-1.5 text-xs font-black rounded-lg inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{savingManualGuide ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Row
                label="N° de guía"
                value={
                  !pickup && isRealOrder(o) ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{o.trackingNumber || 'Pendiente de generar'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setManualGuide(o.trackingNumber || '');
                          setIsEditingGuide(true);
                        }}
                        className="p-0.5 rounded hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                        title="Pegar o editar guía manualmente"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </span>
                  ) : (
                    o.trackingNumber
                  )
                }
              />
            )}
            <Row label="WhatsApp notificado" value={o.whatsappNotified ? 'Sí' : 'No'} />
            {!pickup && isRealOrder(o) && (
              <div className="pt-2 mt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                {o.trackingNumber ? (
                  <>
                    <a
                      href={`/api/c807/pdf?guia=${encodeURIComponent(o.trackingNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-[11px] font-black rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Guía</span>
                    </a>
                    <a
                      href={`/api/c807/pdf?guia=${encodeURIComponent(o.trackingNumber)}&download=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-[11px] font-black rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Descargar PDF Guía</span>
                    </a>
                    <Link
                      href={`/rastreo?guia=${encodeURIComponent(o.trackingNumber)}`}
                      target="_blank"
                      className="clay-btn clay-btn-light px-3 py-1.5 text-[11px] font-bold text-indigo-700 inline-flex items-center gap-1.5 rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Rastrear Guía {o.trackingNumber}</span>
                    </Link>
                    <Link
                      href="/logistica"
                      className="clay-btn-primary px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 rounded-lg"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Ir a Logística</span>
                    </Link>
                  </>
                ) : (
                  <>
                    {!isEditingGuide && (
                      <button
                        type="button"
                        disabled={generatingGuide}
                        onClick={handleGenerateGuide}
                        className="clay-btn-primary px-3.5 py-2 text-xs font-black inline-flex items-center gap-1.5 rounded-xl disabled:opacity-50"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{generatingGuide ? 'Generando Guía C807...' : 'Generar Guía C807 y Enviar a Logística'}</span>
                      </button>
                    )}
                    <Link
                      href="/logistica"
                      className="clay-btn clay-btn-light px-2.5 py-2 text-[11px] font-bold text-slate-700 inline-flex items-center gap-1 rounded-xl"
                    >
                      <span>Ver Logística</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </Section>

          <div className="md:col-span-2">
            {(() => {
              const hasEnvioRow = o.items.some(
                (it) =>
                  String(it.productName || '').toLowerCase().includes('envío a domicilio') ||
                  String(it.id || '').includes('ENVIO-DOM')
              );
              const displayItems: EcoItem[] = [
                ...o.items,
                ...(Number(o.shippingCost || 0) > 0 && !hasEnvioRow
                  ? [
                      {
                        id: `${o.id}-ENVIO-DOM`,
                        productName: 'Envío a Domicilio',
                        inspiredBy: null,
                        presentation: 'Servicio',
                        unitPrice: Number(o.shippingCost),
                        quantity: 1,
                        total: Number(o.shippingCost),
                      },
                    ]
                  : []),
              ];
              return (
                <Section icon={<Package className="w-3.5 h-3.5" />} title={`Productos (${displayItems.length})`}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="py-1">Producto</th>
                        <th className="py-1">Presentación</th>
                        <th className="py-1 text-center">Cant.</th>
                        <th className="py-1 text-right">P. unit.</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((it) => {
                        const kitInfo = parseKitOrderItem(it);
                        const isShippingRow =
                          String(it.id || '').includes('ENVIO-DOM') ||
                          String(it.productName || '').toLowerCase().includes('envío a domicilio');
                        return (
                          <tr
                            key={it.id}
                            className={`border-t border-slate-200 align-top ${
                              isShippingRow ? 'bg-blue-50/60 text-blue-950' : ''
                            }`}
                          >
                            <td className="py-2 font-bold">
                              {kitInfo ? (
                                <div className="space-y-0.5">
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                                    ✨ Arma tu propio perfume (100 ml)
                                  </span>
                                  <div className="text-slate-900 font-black">
                                    Fragancia: {kitInfo.fragranceName}
                                  </div>
                                  {(kitInfo.originalName || it.inspiredBy) && (
                                    <div className="text-[10.5px] font-bold text-amber-900">
                                      Original: {kitInfo.originalName || it.inspiredBy}
                                      {kitInfo.brand ? ` • ${kitInfo.brand}` : ''}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{it.productName}</span>
                                    {isShippingRow && (
                                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200 text-[9.5px] font-mono font-black">
                                        SKU: ENVIO-DOM
                                      </span>
                                    )}
                                  </div>
                                  {it.inspiredBy && (
                                    <div className="text-[10px] font-medium text-slate-500">Inspirado en: {it.inspiredBy}</div>
                                  )}
                                </>
                              )}
                            </td>
                            <td className="py-2">
                              {kitInfo ? (
                                <div className="space-y-1 text-[11px]">
                                  <div>
                                    <span className="text-slate-500">Concentración: </span>
                                    <strong className={kitInfo.isPlus ? 'text-purple-700 font-black' : 'text-slate-800 font-bold'}>
                                      {kitInfo.isPlus ? '1.5 Oz PLUS (1 Oz + ½ Oz)' : '1 Oz Estándar'}
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Bote 100ml: </span>
                                    <strong className="text-slate-900 font-black">
                                      {kitInfo.bottleName} (📍 {kitInfo.bottlePuesto})
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Etiqueta: </span>
                                    <strong className={kitInfo.hasLabel ? 'text-emerald-700 font-black' : 'text-slate-600 font-bold'}>
                                      {kitInfo.hasLabel ? 'Con Etiqueta' : 'Sin Etiqueta'}
                                    </strong>
                                  </div>
                                </div>
                              ) : (
                                it.presentation
                              )}
                            </td>
                            <td className="py-2 text-center font-mono">{it.quantity}</td>
                            <td className="py-2 text-right font-mono">{money(it.unitPrice)}</td>
                            <td className="py-2 text-right font-mono font-bold">{money(it.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="border-t border-slate-300 pt-2 mt-2 space-y-0.5">
                    <Row label="Subtotal" value={money(o.subtotal)} />
                    <Row label="Envío a Domicilio" value={money(o.shippingCost)} />
                    <div className="flex justify-between text-sm font-black">
                      <span>Total</span>
                      <span>{money(o.total)}</span>
                    </div>
                  </div>
                </Section>
              );
            })()}
          </div>

          {o.notes && (
            <div className="md:col-span-2">
              <Section icon={<FileText className="w-3.5 h-3.5" />} title="Notas">
                <p className="whitespace-pre-wrap">{o.notes}</p>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
