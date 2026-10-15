'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { getStaffToken } from '@/lib/auth';

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
  /retiro/i.test(o.deliveryReference || '') || /^retiro/i.test(o.shippingAddress || '');

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' });

export default function EcommerceOrdersPanel() {
  const [orders, setOrders] = useState<EcoOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<EcoOrder | null>(null);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.orderStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone || '').includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

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
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{o.orderNumber}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
      <h4 className="text-[11px] font-black uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
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

function OrderDetailModal({ order: o, onClose }: { order: EcoOrder; onClose: () => void }) {
  const pickup = isPickup(o);
  const dte = o.sale?.dteDocument;
  const isCcf = o.sale?.tipoComprobante === '03' || Boolean(o.customer?.nrc);

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
          >
            <Row label="Tipo de entrega" value={pickup ? 'Retiro en sucursal' : 'Envío a domicilio'} />
            <Row label="Departamento" value={o.department} />
            <Row label="Municipio" value={o.municipality} />
            <Row label="Dirección" value={o.shippingAddress} />
            <Row label="Referencia" value={o.deliveryReference} />
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

          <Section icon={<Truck className="w-3.5 h-3.5" />} title="Seguimiento">
            <Row label="Estado" value={ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus} />
            <Row label="Mensajero / courier" value={o.courierName} />
            <Row label="N° de guía" value={o.trackingNumber} />
            <Row label="WhatsApp notificado" value={o.whatsappNotified ? 'Sí' : 'No'} />
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
