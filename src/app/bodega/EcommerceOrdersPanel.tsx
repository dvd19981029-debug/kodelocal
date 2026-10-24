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
  Store,
  ExternalLink,
  Pencil,
  Check,
} from 'lucide-react';
import { getStaffToken } from '@/lib/auth';
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
        (o.customerEmail || '').toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter, showUnpaid]);

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

      <div className="clay-card p-0 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200">
              <th className="py-2.5 px-3">Pedido</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3">Entrega</th>
              <th className="py-2.5 px-3">Pago</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-center">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                  {loading ? 'Cargando pedidos…' : 'No hay pedidos ecommerce para mostrar'}
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const real = isRealOrder(o);
              const twin = real ? null : findRealTwin(o, orders);
              return (
              <tr
                key={o.id}
                className={`border-b border-slate-100 hover:bg-slate-50 ${real ? '' : 'opacity-60'}`}
              >
                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                  {o.orderNumber}
                  <div className="mt-1">
                    <ReadinessBadge order={o} twin={twin} />
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{fmtDate(o.createdAt)}</td>
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-800">{o.customerName}</div>
                  <div className="text-[11px] text-slate-500">{o.customerPhone}</div>
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  {isPickup(o) ? 'Retiro en sucursal' : `Domicilio · ${o.municipality}`}
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  {PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod}
                  <div className="text-[11px] font-bold">
                    {PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-black text-slate-800">{money(o.total)}</td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      STATUS_COLORS[o.orderStatus] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => setSelected(o)}
                    className="clay-btn-primary px-3 py-1.5 text-[11px] font-bold rounded-lg"
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
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
        alert(`✅ Guía C807 generada exitosamente: ${data.order.trackingNumber}\nEl pedido fue enviado a la vista de Logística.`);
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
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                    Dirección
                  </label>
                  <textarea
                    rows={2}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={editReference}
                    onChange={(e) => setEditReference(e.target.value)}
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
            <Row label="Estado del pago" value={PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus} />
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
                      href={`https://c807xpress.com/tracking/?guia=${encodeURIComponent(o.trackingNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="clay-btn clay-btn-light px-3 py-1.5 text-[11px] font-bold text-indigo-700 inline-flex items-center gap-1.5 rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Rastrear Guía {o.trackingNumber}</span>
                    </a>
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
            <Section icon={<Package className="w-3.5 h-3.5" />} title={`Productos (${o.items.length})`}>
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
                  {o.items.map((it) => (
                    <tr key={it.id} className="border-t border-slate-200">
                      <td className="py-1.5 font-bold">
                        {it.productName}
                        {it.inspiredBy && (
                          <div className="text-[10px] font-medium text-slate-500">Inspirado en: {it.inspiredBy}</div>
                        )}
                      </td>
                      <td className="py-1.5">{it.presentation}</td>
                      <td className="py-1.5 text-center font-mono">{it.quantity}</td>
                      <td className="py-1.5 text-right font-mono">{money(it.unitPrice)}</td>
                      <td className="py-1.5 text-right font-mono font-bold">{money(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-300 pt-2 mt-2 space-y-0.5">
                <Row label="Subtotal" value={money(o.subtotal)} />
                <Row label="Envío" value={money(o.shippingCost)} />
                <div className="flex justify-between text-sm font-black">
                  <span>Total</span>
                  <span>{money(o.total)}</span>
                </div>
              </div>
            </Section>
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
