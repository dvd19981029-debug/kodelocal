'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  RefreshCw,
  Search,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Package,
  FileText,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Check,
} from 'lucide-react';
import { getStaffToken } from '@/lib/auth';
import { DEPARTAMENTOS_CATALOG, getMunicipiosByDepartamento } from '@/lib/svTerritory';

interface PosDomicilioItem {
  id: string;
  productId: string;
  productName: string;
  presentation: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface PosDomicilioOrder {
  id: string;
  saleNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  customerDoc?: string | null;
  customerNrc?: string | null;
  customerGiro?: string | null;
  department: string;
  municipality: string;
  shippingAddress: string;
  deliveryReference?: string | null;
  subtotal: number;
  ivaTotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  c807PaymentMode: 'CONTRA_ENTREGA' | 'TARJETA' | 'TRANSFERENCIA';
  c807ServiceType: 'CCE' | 'SER';
  bodegaStatus: string;
  domicilioStatus: 'PENDIENTE_GUIA' | 'EN_RUTA' | 'ENTREGADO' | 'CANCELADO';
  trackingNumber?: string | null;
  courierName?: string | null;
  tipoComprobante?: string | null;
  dteControlNumber?: string | null;
  dteStatus?: string | null;
  notesText?: string | null;
  createdAt: string;
  items: PosDomicilioItem[];
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta (POS)',
  TRANSFER: 'Transferencia bancaria',
  WOMPI: 'Wompi',
  CONTRA_ENTREGA: 'Contra Entrega',
  BITCOIN: 'Bitcoin',
  OTHER: 'Otro',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Pagado',
  PENDING: 'Pendiente de cobro',
  CANCELLED: 'Cancelado',
};

const DOMICILIO_STATUS_LABELS: Record<string, string> = {
  PENDIENTE_GUIA: 'Pendiente de guía',
  EN_RUTA: 'Guía generada · En ruta',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const DOMICILIO_STATUS_COLORS: Record<string, string> = {
  PENDIENTE_GUIA: 'bg-amber-100 text-amber-800',
  EN_RUTA: 'bg-blue-100 text-blue-800',
  ENTREGADO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-rose-100 text-rose-800',
};

const BODEGA_STATUS_LABELS: Record<string, string> = {
  PENDING_PREPARATION: 'Por preparar en Bodega',
  READY_AT_WINDOW: 'Listo en Ventanilla / Despacho',
  COMPLETED: 'Facturado / Despachado',
  CANCELLED: 'Cancelado',
};

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' });

export function isDeliveryDataReady(o: PosDomicilioOrder): boolean {
  return Boolean(
    o.customerName &&
      o.customerName.trim() !== '' &&
      o.customerPhone &&
      o.customerPhone.replace(/\D/g, '').length >= 7 &&
      o.department &&
      o.municipality &&
      o.shippingAddress &&
      o.shippingAddress.trim().length >= 3
  );
}

export function mapSaleToDomicilioOrder(s: any): PosDomicilioOrder | null {
  if (s.channel === 'ONLINE' || String(s.saleNumber || '').startsWith('WEB-')) return null;

  let pNotes: any = null;
  if (s.notes && typeof s.notes === 'string' && s.notes.trim().startsWith('{')) {
    try {
      const lastBrace = s.notes.lastIndexOf('}');
      const jsonPart = lastBrace !== -1 ? s.notes.slice(0, lastBrace + 1) : s.notes;
      pNotes = JSON.parse(jsonPart);
    } catch (_) {}
  }

  const itemsRaw: any[] = Array.isArray(s.items) ? s.items : [];
  const hasEnvioItem = itemsRaw.some(
    (it) =>
      it.productId === 'ENVIO-DOM' ||
      String(it.productName || it.name || '').toLowerCase().includes('envío a domicilio')
  );
  const hasShipment = Array.isArray(s.shipments) && s.shipments.length > 0;
  const isDomicilioFlag = Boolean(
    s.isDomicilio ||
      pNotes?.isDomicilio ||
      pNotes?.domicilio?.isDomicilio ||
      hasEnvioItem ||
      hasShipment
  );

  if (!isDomicilioFlag) return null;

  const dom = pNotes?.domicilio || s.domicilio || {};
  const cli = pNotes?.cliente || s.cliente || {};
  const cust = s.customer || {};
  const shipment = Array.isArray(s.shipments) && s.shipments.length > 0 ? s.shipments[0] : null;

  const trackingNumber = dom.trackingNumber || shipment?.trackingNumber || null;
  const courierName = dom.courierName || shipment?.carrier || (trackingNumber ? 'C807 Express' : null);

  const isCancelled = ['CANCELLED', 'CANCELADO', 'ANULADA'].includes(
    String(s.orderStatus || s.status || '').toUpperCase()
  );

  let domicilioStatus: PosDomicilioOrder['domicilioStatus'] = 'PENDIENTE_GUIA';
  if (isCancelled) {
    domicilioStatus = 'CANCELADO';
  } else if (dom.domicilioStatus === 'ENTREGADO' || shipment?.status === 'DELIVERED') {
    domicilioStatus = 'ENTREGADO';
  } else if (trackingNumber || dom.domicilioStatus === 'EN_RUTA' || shipment?.status === 'IN_TRANSIT') {
    domicilioStatus = 'EN_RUTA';
  }

  const envioItem = itemsRaw.find(
    (it) =>
      it.productId === 'ENVIO-DOM' ||
      String(it.productName || it.name || '').toLowerCase().includes('envío a domicilio')
  );
  const shippingCost = envioItem ? Number(envioItem.total || 2.90) : Number(s.shippingCost || 0);

  const rawDept = String(
    dom.department || cli.departamento || cust.department || 'San Salvador'
  ).trim();
  const normText = (v: string) =>
    v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const matchedDept = DEPARTAMENTOS_CATALOG.find(
    (d) => normText(d.nombre) === normText(rawDept)
  );
  const department = matchedDept?.nombre || rawDept || 'San Salvador';

  const munisForDept = getMunicipiosByDepartamento(department);
  const rawMuni = String(
    dom.municipality || cli.municipio || cust.municipality || ''
  ).trim();
  const exactMuni = munisForDept.find(
    (m) => normText(m.nombre) === normText(rawMuni)
  );
  const municipality =
    exactMuni?.nombre || rawMuni || munisForDept[0]?.nombre || 'San Salvador';

  const rawMethod = String(s.paymentMethod || 'CASH').toUpperCase();
  const explicitC807Mode = String(dom.c807PaymentMode || '').toUpperCase();
  const explicitC807Service = String(dom.c807ServiceType || '').toUpperCase();

  let c807PaymentMode: 'CONTRA_ENTREGA' | 'TARJETA' | 'TRANSFERENCIA' = 'CONTRA_ENTREGA';
  if (explicitC807Mode === 'TARJETA' || explicitC807Mode === 'YA_PAGADO_TARJETA') {
    c807PaymentMode = 'TARJETA';
  } else if (explicitC807Mode === 'TRANSFERENCIA' || explicitC807Mode === 'YA_PAGADO_TRANSFERENCIA') {
    c807PaymentMode = 'TRANSFERENCIA';
  } else if (explicitC807Mode === 'CONTRA_ENTREGA' || explicitC807Mode === 'CONTRAENTREGA' || explicitC807Service === 'CCE') {
    c807PaymentMode = 'CONTRA_ENTREGA';
  } else if (explicitC807Service === 'SER') {
    c807PaymentMode = rawMethod === 'CARD' ? 'TARJETA' : 'TRANSFERENCIA';
  } else if (rawMethod === 'CARD' || rawMethod === 'WOMPI') {
    c807PaymentMode = 'TARJETA';
  } else if (rawMethod === 'TRANSFER') {
    c807PaymentMode = 'TRANSFERENCIA';
  } else {
    c807PaymentMode = 'CONTRA_ENTREGA';
  }

  const c807ServiceType: 'CCE' | 'SER' = c807PaymentMode === 'CONTRA_ENTREGA' ? 'CCE' : 'SER';

  return {
    id: s.id,
    saleNumber: s.saleNumber || s.orderNumber,
    customerName: String(dom.customerName || cli.nombre || cust.name || 'Consumidor Final').trim(),
    customerEmail: dom.customerEmail || cli.correo || cust.email || null,
    customerPhone: String(dom.customerPhone || cli.telefono || cust.phone || '').trim(),
    customerDoc: cli.numDocumento || cust.documentNum || null,
    customerNrc: cli.nrc || cust.nrc || null,
    customerGiro: cli.actividadEconomica || cust.activityDesc || null,
    department,
    municipality,
    shippingAddress: String(dom.shippingAddress || cli.direccion || cust.address || '').trim(),
    deliveryReference: dom.deliveryReference || cli.referencia || cust.notes || null,
    subtotal: Number(s.subtotal || 0),
    ivaTotal: Number(s.ivaTotal || 0),
    shippingCost,
    total: Number(s.total || 0),
    paymentMethod: s.paymentMethod || 'CASH',
    paymentStatus: s.dteDocument?.estado === 'PROCESADO' ? 'COMPLETED' : (s.paymentStatus || 'PENDING'),
    c807PaymentMode,
    c807ServiceType,
    bodegaStatus: s.orderStatus || s.status || 'PENDING_PREPARATION',
    domicilioStatus,
    trackingNumber,
    courierName,
    tipoComprobante:
      s.tipoComprobante && s.tipoComprobante !== 'TICKET'
        ? s.tipoComprobante
        : pNotes?.tipoComprobante || (cli.nrc || cust.nrc ? '03' : '01'),
    dteControlNumber: s.dteDocument?.numeroControl || s.dteInfo?.numeroControl || null,
    dteStatus: s.dteDocument?.estado || s.dteInfo?.estado || null,
    notesText: pNotes?.desc || null,
    createdAt: s.createdAt,
    items: itemsRaw.map((it: any, idx: number) => ({
      id: it.id || `${s.id}-it-${idx}`,
      productId: it.productId || '',
      productName: it.productName || it.name || 'Producto',
      presentation:
        it.unit && !(String(it.productName || it.name || '').toLowerCase().includes('litro') && it.unit === '½ Onza')
          ? it.unit
          : (String(it.productName || it.name || '').toLowerCase().includes('½ oz') || String(it.productName || it.name || '').toLowerCase().includes('media onza')
              ? '½ Onza'
              : 'Unidad'),
      unitPrice: Number(it.unitPrice ?? it.price ?? 0),
      quantity: Number(it.quantity || 1),
      total: Number(it.total || 0),
    })),
  };
}

export default function PosDomicilioPanel({ onOrderChanged }: { onOrderChanged?: () => void }) {
  const [orders, setOrders] = useState<PosDomicilioOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<PosDomicilioOrder | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const staffToken = await getStaffToken();
      const res = await fetch('/api/sales?limit=200', {
        headers: { ...(staffToken ? { 'x-staff-token': staffToken } : {}) },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudieron cargar los pedidos a domicilio');
      const mapped = (data.sales as any[])
        .map(mapSaleToDomicilioOrder)
        .filter((o): o is PosDomicilioOrder => o !== null && o.domicilioStatus !== 'CANCELADO');
      setOrders(mapped);
    } catch (e: any) {
      setError(e.message || 'Error al cargar pedidos a domicilio');
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
      if (statusFilter !== 'ALL' && o.domicilioStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        o.saleNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone || '').includes(q) ||
        (o.municipality || '').toLowerCase().includes(q) ||
        (o.shippingAddress || '').toLowerCase().includes(q) ||
        (o.trackingNumber || '').toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="clay-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Pedidos a Domicilio (POS)</span>
            <span className="clay-badge bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5">
              {filtered.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Pedidos tomados en Punto de Venta marcados para envío a domicilio. Revisa el resumen de datos y genera su Guía C807.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/logistica"
            className="clay-btn clay-btn-light px-3 py-2 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Ver Logística</span>
          </Link>
          <button
            onClick={load}
            disabled={loading}
            className="clay-btn px-3 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="clay-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por comanda, cliente, teléfono, municipio o N° de guía..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-bold"
        >
          <option value="ALL">Todos los estados</option>
          <option value="PENDIENTE_GUIA">Pendientes de Guía</option>
          <option value="EN_RUTA">Guía generada · En ruta</option>
          <option value="ENTREGADO">Entregados</option>
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
              <th className="py-2.5 px-3">Pedido / Comanda</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3">Destino (Entrega)</th>
              <th className="py-2.5 px-3">Pago / DTE</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-center">Estado / Guía</th>
              <th className="py-2.5 px-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                  {loading
                    ? 'Cargando pedidos a domicilio…'
                    : 'No hay pedidos POS marcados como Domicilio para mostrar'}
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const ready = isDeliveryDataReady(o);
              return (
                <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                    {o.saleNumber}
                    <div className="mt-1">
                      {o.trackingNumber ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black font-sans bg-blue-100 text-blue-800">
                          Guía: {o.trackingNumber}
                        </span>
                      ) : ready ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black font-sans bg-emerald-100 text-emerald-800">
                          Datos OK · Listo para guía
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black font-sans bg-amber-100 text-amber-800">
                          ⚠️ Completar dirección/tel.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{fmtDate(o.createdAt)}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-800">{o.customerName}</div>
                    <div className="text-[11px] text-slate-500">
                      {o.customerPhone || <span className="text-amber-600 font-bold">Sin teléfono</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-[230px]">
                    <div className="font-bold text-slate-800 truncate">
                      {o.department} · {o.municipality}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate" title={o.shippingAddress}>
                      {o.shippingAddress || <span className="text-amber-600 font-bold">Sin dirección detallada</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div>{PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod}</div>
                    <div className="text-[11px] font-bold flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {o.c807ServiceType === 'CCE' ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9.5px] font-black">
                          💵 C807 Contra Entrega (CCE · {money(o.total)})
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9.5px] font-black">
                          ✅ C807 Regular (SER · Sin cobro)
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {o.tipoComprobante === '03' ? 'CCF (03)' : 'FC (01)'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-800">{money(o.total)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        DOMICILIO_STATUS_COLORS[o.domicilioStatus] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {DOMICILIO_STATUS_LABELS[o.domicilioStatus] || o.domicilioStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      {o.trackingNumber && (
                        <>
                          <a
                            href={`/api/c807/pdf?guia=${encodeURIComponent(o.trackingNumber)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 text-[11px] font-black rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1 transition-colors"
                            title={`Abrir e Imprimir Guía ${o.trackingNumber}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimir Guía</span>
                          </a>
                          <a
                            href={`/api/c807/pdf?guia=${encodeURIComponent(o.trackingNumber)}&download=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 text-[11px] font-black rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 transition-colors"
                            title={`Descargar PDF Guía ${o.trackingNumber}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDF Guía</span>
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => setSelected(o)}
                        className="clay-btn-primary px-3 py-1.5 text-[11px] font-bold rounded-lg inline-flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" />
                        <span>{o.trackingNumber ? 'Ver resumen' : 'Ver / Generar Guía'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <PosDomicilioDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onOrderUpdated={(updatedOrder) => {
            setOrders((prev) =>
              prev.map((item) => (item.id === updatedOrder.id ? { ...item, ...updatedOrder } : item))
            );
            setSelected((prev) =>
              prev && prev.id === updatedOrder.id ? { ...prev, ...updatedOrder } : prev
            );
            if (onOrderChanged) onOrderChanged();
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

function PosDomicilioDetailModal({
  order: o,
  onClose,
  onOrderUpdated,
}: {
  order: PosDomicilioOrder;
  onClose: () => void;
  onOrderUpdated: (updated: Partial<PosDomicilioOrder> & { id: string }) => void;
}) {
  const ready = isDeliveryDataReady(o);
  const isCcf = o.tipoComprobante === '03' || Boolean(o.customerNrc);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [isEditingDelivery, setIsEditingDelivery] = useState(!ready && !o.trackingNumber);
  const [savingDelivery, setSavingDelivery] = useState(false);

  const [editName, setEditName] = useState(o.customerName);
  const [editPhone, setEditPhone] = useState(o.customerPhone);
  const [editDept, setEditDept] = useState(o.department || 'San Salvador');
  const [editMuni, setEditMuni] = useState(o.municipality || 'San Salvador');
  const [editAddress, setEditAddress] = useState(o.shippingAddress);
  const [editRef, setEditRef] = useState(o.deliveryReference || '');
  const [editC807Mode, setEditC807Mode] = useState<'CONTRA_ENTREGA' | 'TARJETA' | 'TRANSFERENCIA'>(
    o.c807PaymentMode || 'CONTRA_ENTREGA'
  );

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
      const res = await fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          id: o.id,
          saleNumber: o.saleNumber,
          isDomicilio: true,
          domicilio: {
            isDomicilio: true,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerEmail: o.customerEmail || undefined,
            department: o.department,
            municipality: o.municipality,
            shippingAddress: o.shippingAddress,
            deliveryReference: o.deliveryReference || undefined,
            trackingNumber: cleanGuide,
            courierName: o.courierName || 'C807 Express',
            domicilioStatus: o.domicilioStatus === 'ENTREGADO' ? 'ENTREGADO' : 'EN_RUTA',
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'No se pudo guardar el N° de guía');
        return;
      }
      onOrderUpdated({
        id: o.id,
        trackingNumber: cleanGuide,
        courierName: o.courierName || 'C807 Express',
        domicilioStatus: data.domicilioStatus || (o.domicilioStatus === 'ENTREGADO' ? 'ENTREGADO' : 'EN_RUTA'),
      });
      setIsEditingGuide(false);
    } catch (err: any) {
      alert(`Error al guardar la guía: ${err?.message || 'Error de conexión'}`);
    } finally {
      setSavingManualGuide(false);
    }
  };

  const handleSaveDeliveryData = async (): Promise<boolean> => {
    if (!editName.trim() || !editPhone.trim() || !editAddress.trim()) {
      alert('Por favor completa Nombre, Teléfono y Dirección detallada de entrega.');
      return false;
    }
    setSavingDelivery(true);
    try {
      const staffToken = await getStaffToken();
      const resolvedServiceType: 'CCE' | 'SER' = editC807Mode === 'CONTRA_ENTREGA' ? 'CCE' : 'SER';
      const resolvedPayMethod =
        editC807Mode === 'TARJETA'
          ? 'CARD'
          : editC807Mode === 'TRANSFERENCIA'
          ? 'TRANSFER'
          : 'CONTRA_ENTREGA';
      const res = await fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          id: o.id,
          saleNumber: o.saleNumber,
          paymentMethod: resolvedPayMethod,
          isDomicilio: true,
          domicilio: {
            isDomicilio: true,
            customerName: editName.trim(),
            customerPhone: editPhone.trim(),
            customerEmail: o.customerEmail || undefined,
            department: editDept,
            municipality: editMuni,
            shippingAddress: editAddress.trim(),
            deliveryReference: editRef.trim() || undefined,
            c807PaymentMode: editC807Mode,
            c807ServiceType: resolvedServiceType,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'No se pudieron guardar los datos de entrega');
        return false;
      }
      onOrderUpdated({
        id: o.id,
        customerName: editName.trim(),
        customerPhone: editPhone.trim(),
        department: editDept,
        municipality: editMuni,
        shippingAddress: editAddress.trim(),
        deliveryReference: editRef.trim() || null,
        paymentMethod: resolvedPayMethod,
        c807PaymentMode: editC807Mode,
        c807ServiceType: resolvedServiceType,
      });
      setIsEditingDelivery(false);
      return true;
    } catch (err: any) {
      alert(`Error al guardar datos de entrega: ${err?.message || 'Error de conexión'}`);
      return false;
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleGenerateGuide = async () => {
    const finalName = isEditingDelivery ? editName.trim() : o.customerName;
    const finalPhone = isEditingDelivery ? editPhone.trim() : o.customerPhone;
    const finalDept = isEditingDelivery ? editDept : o.department;
    const finalMuni = isEditingDelivery ? editMuni : o.municipality;
    const finalAddress = isEditingDelivery ? editAddress.trim() : o.shippingAddress;
    const finalRef = isEditingDelivery ? editRef.trim() : (o.deliveryReference || '');

    if (!finalPhone || !finalAddress) {
      setIsEditingDelivery(true);
      alert('Completa el Teléfono y la Dirección detallada antes de generar la guía C807.');
      return;
    }

    setGeneratingGuide(true);
    try {
      const resolvedServiceType: 'CCE' | 'SER' = editC807Mode === 'CONTRA_ENTREGA' ? 'CCE' : 'SER';
      const resolvedPayMethod =
        editC807Mode === 'TARJETA'
          ? 'CARD'
          : editC807Mode === 'TRANSFERENCIA'
          ? 'TRANSFER'
          : 'CONTRA_ENTREGA';
      const staffToken = await getStaffToken();
      const res = await fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          id: o.id,
          saleNumber: o.saleNumber,
          paymentMethod: resolvedPayMethod,
          isDomicilio: true,
          domicilio: {
            isDomicilio: true,
            customerName: finalName,
            customerPhone: finalPhone,
            customerEmail: o.customerEmail || undefined,
            department: finalDept,
            municipality: finalMuni,
            shippingAddress: finalAddress,
            deliveryReference: finalRef || undefined,
            c807PaymentMode: editC807Mode,
            c807ServiceType: resolvedServiceType,
          },
          generarGuiaC807: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.trackingNumber) {
        onOrderUpdated({
          id: o.id,
          customerName: finalName,
          customerPhone: finalPhone,
          department: finalDept,
          municipality: finalMuni,
          shippingAddress: finalAddress,
          deliveryReference: finalRef || null,
          paymentMethod: resolvedPayMethod,
          c807PaymentMode: editC807Mode,
          c807ServiceType: resolvedServiceType,
          trackingNumber: data.trackingNumber,
          courierName: 'C807 Express',
          domicilioStatus: 'EN_RUTA',
        });
        setIsEditingDelivery(false);
        alert(`✅ Guía C807 generada exitosamente: ${data.trackingNumber}\nEl pedido fue enviado a la vista de Logística.`);
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
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-sm font-black text-slate-800">Pedido Domicilio #{o.saleNumber}</h3>
            <p className="text-[11px] text-slate-500">{fmtDate(o.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                DOMICILIO_STATUS_COLORS[o.domicilioStatus] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {DOMICILIO_STATUS_LABELS[o.domicilioStatus] || o.domicilioStatus}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Banner de validación de datos de envío */}
        <div className="px-5 pt-4">
          {o.trackingNumber ? (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-black text-blue-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Guía C807 generada ({o.trackingNumber}). Lista para despacho con el recolector.</span>
            </div>
          ) : ready ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-black text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Datos de entrega completos: verifica que el municipio y dirección estén OK y genera la Guía C807.</span>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-black">Faltan datos obligatorios para generar la Guía C807</div>
                <div className="mt-0.5">
                  Completa el teléfono y la dirección detallada del cliente en la tarjeta de Entrega antes de generar la guía.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Section icon={<User className="w-3.5 h-3.5" />} title="Cliente">
            <Row label="Nombre" value={o.customerName} />
            <Row
              label="Teléfono"
              value={
                o.customerPhone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {o.customerPhone}
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold">Falta teléfono</span>
                )
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
            <Row
              label="Documento"
              value={o.customerDoc && o.customerDoc !== '00000000-0' ? o.customerDoc : undefined}
            />
            <Row label="NRC" value={o.customerNrc} />
            <Row label="Giro" value={o.customerGiro} />
          </Section>

          <Section
            icon={<MapPin className="w-3.5 h-3.5" />}
            title="Entrega a Domicilio"
            action={
              !o.trackingNumber && (
                <button
                  type="button"
                  onClick={() => setIsEditingDelivery(!isEditingDelivery)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  <span>{isEditingDelivery ? 'Cancelar edición' : 'Editar datos'}</span>
                </button>
              )
            }
          >
            {isEditingDelivery ? (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Nombre quien recibe *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="7000-0000"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Departamento *
                    </label>
                    <select
                      value={editDept}
                      onChange={(e) => {
                        const d = e.target.value;
                        setEditDept(d);
                        const munis = getMunicipiosByDepartamento(d);
                        if (munis.length > 0) setEditMuni(munis[0].nombre);
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      {DEPARTAMENTOS_CATALOG.map((dep) => (
                        <option key={dep.id} value={dep.nombre}>
                          {dep.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Municipio (262 Tradicional) *
                    </label>
                    <select
                      value={editMuni}
                      onChange={(e) => setEditMuni(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      {getMunicipiosByDepartamento(editDept).map((m) => (
                        <option key={m.id} value={m.nombre}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Dirección detallada de entrega *
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Colonia, calle, pasaje, # de casa o local..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Punto de referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editRef}
                    onChange={(e) => setEditRef(e.target.value)}
                    placeholder="Ej. Frente a parque, portón negro..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={savingDelivery}
                  onClick={handleSaveDeliveryData}
                  className="clay-btn-primary w-full py-1.5 text-xs font-black rounded-lg inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingDelivery ? 'Guardando...' : 'Guardar datos de entrega'}</span>
                </button>
              </div>
            ) : (
              <>
                <Row label="Tipo de entrega" value="Envío a domicilio (POS)" />
                <Row label="Departamento" value={o.department} />
                <Row label="Municipio" value={o.municipality} />
                <Row
                  label="Dirección"
                  value={
                    o.shippingAddress || (
                      <span className="text-amber-600 font-bold">Falta dirección detallada</span>
                    )
                  }
                />
                <Row label="Referencia" value={o.deliveryReference} />
                <Row label="Costo de envío" value={money(o.shippingCost)} />
              </>
            )}
          </Section>

          <Section icon={<CreditCard className="w-3.5 h-3.5" />} title="Pago y facturación">
            <Row label="Forma de pago" value={PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod} />
            <Row label="Estado del pago" value={PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus} />
            <Row
              label="Estado en Bodega"
              value={BODEGA_STATUS_LABELS[o.bodegaStatus] || o.bodegaStatus}
            />
            <Row
              label="Comprobante"
              value={isCcf ? 'Crédito Fiscal (CCF-03)' : 'Factura Consumidor Final (FC-01)'}
            />
            <Row label="N° de venta / comanda" value={o.saleNumber} />
            <Row label="Estado DTE" value={o.dteStatus} />
            <Row label="N° de control" value={o.dteControlNumber} />
          </Section>

          <Section
            icon={<Truck className="w-3.5 h-3.5" />}
            title="Seguimiento C807"
            action={
              <button
                type="button"
                onClick={() => {
                  setManualGuide(o.trackingNumber || '');
                  setIsEditingGuide((prev) => !prev);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                title="Pegar o editar N° de guía manualmente"
              >
                <Pencil className="w-3 h-3" />
                <span>{isEditingGuide ? 'Cancelar' : 'Editar guía'}</span>
              </button>
            }
          >
            <Row
              label="Estado de envío"
              value={DOMICILIO_STATUS_LABELS[o.domicilioStatus] || o.domicilioStatus}
            />
            <Row label="Mensajero / courier" value={o.courierName || 'C807 Express'} />
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
                }
              />
            )}

            {!o.trackingNumber && !isEditingGuide && (
              <div className="pt-2 mt-2 border-t border-slate-200 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wide text-slate-600 block">
                  Modalidad de Cobro para Guía C807:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditC807Mode('CONTRA_ENTREGA')}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                      editC807Mode === 'CONTRA_ENTREGA'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>💵 Contra Entrega en Efectivo (CCE)</span>
                    <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded ${
                      editC807Mode === 'CONTRA_ENTREGA' ? 'bg-amber-700/60 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      Cobrar {money(o.total)}
                    </span>
                  </button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditC807Mode('TARJETA')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                        editC807Mode === 'TARJETA'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>💳 Ya Pagó · Tarjeta</div>
                      <div className={`text-[10px] font-mono font-black ${
                        editC807Mode === 'TARJETA' ? 'text-emerald-100' : 'text-emerald-700'
                      }`}>
                        Regular (SER) • $0.00
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditC807Mode('TRANSFERENCIA')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                        editC807Mode === 'TRANSFERENCIA'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>🏦 Ya Pagó · Transferencia</div>
                      <div className={`text-[10px] font-mono font-black ${
                        editC807Mode === 'TRANSFERENCIA' ? 'text-emerald-100' : 'text-emerald-700'
                      }`}>
                        Regular (SER) • $0.00
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                      <span>
                        {generatingGuide
                          ? 'Generando Guía C807...'
                          : 'Generar Guía C807 y Enviar a Logística'}
                      </span>
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
                      <td className="py-1.5 font-bold">{it.productName}</td>
                      <td className="py-1.5">{it.presentation}</td>
                      <td className="py-1.5 text-center font-mono">{it.quantity}</td>
                      <td className="py-1.5 text-right font-mono">{money(it.unitPrice)}</td>
                      <td className="py-1.5 text-right font-mono font-bold">{money(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-300 pt-2 mt-2 space-y-0.5">
                <Row label="Subtotal Neto" value={money(o.subtotal)} />
                <Row label="IVA (13%)" value={money(o.ivaTotal)} />
                <div className="flex justify-between text-sm font-black pt-1">
                  <span>Total</span>
                  <span>{money(o.total)}</span>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
