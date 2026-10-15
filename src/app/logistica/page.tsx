'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Search,
  ExternalLink,
  Mail,
  FileText
} from 'lucide-react';
import { getStaffToken } from '@/lib/auth';

interface Shipment {
  id: string;
  orderNumber: string;
  trackingNumber: string | null;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  municipality: string;
  department: string;
  deliveryReference: string | null;
  carrier: string;
  status: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  paymentStatus: string;
  paymentMethod: string;
  orderTotal: number;
  createdAt: string;
}

export default function LogisticaPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        headers: {
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const valid = data.orders.filter((o: any) => {
          if (o.orderStatus === 'CANCELADO') return false;
          if (o.paymentMethod === 'CARD' && o.paymentStatus !== 'COMPLETED') return false;
          return true;
        });
        const mapped: Shipment[] = valid.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          trackingNumber: o.trackingNumber || null,
          customerName: o.customerName || 'Cliente Online',
          phone: o.customerPhone || '',
          email: o.customerEmail || null,
          address: o.shippingAddress || '',
          municipality: o.municipality || '',
          department: o.department || 'San Salvador',
          deliveryReference: o.deliveryReference || null,
          carrier: o.courierName || 'C807 Express',
          status:
            o.orderStatus === 'ENTREGADO'
              ? 'DELIVERED'
              : o.orderStatus === 'EN_RUTA'
              ? 'IN_TRANSIT'
              : 'PREPARING',
          paymentStatus: o.paymentStatus || 'PENDING',
          paymentMethod: o.paymentMethod || 'CARD',
          orderTotal: Number(o.total || 0),
          createdAt: o.createdAt,
        }));
        setShipments(mapped);
      }
    } catch (err) {
      console.error('Error cargando órdenes en logística:', err);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (id: string, newStatus: Shipment['status']) => {
    const dbStatus =
      newStatus === 'DELIVERED' ? 'ENTREGADO' : newStatus === 'IN_TRANSIT' ? 'EN_RUTA' : 'EN_PREPARACION';
    setShipments(prev => prev.map(s => (s.id === id ? { ...s, status: newStatus } : s)));
    try {
      const staffToken = await getStaffToken();
      await fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({ orderId: id, orderStatus: dbStatus }),
      });
    } catch (err) {
      console.error('Error actualizando estado logístico:', err);
    }
  };

  const handleGenerarGuiaC807 = async (shipment: Shipment) => {
    setGeneratingId(shipment.id);
    try {
      const staffToken = await getStaffToken();
      const res = await fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({
          orderId: shipment.id,
          orderNumber: shipment.orderNumber,
          generarGuiaC807: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.order?.trackingNumber) {
        setShipments(prev =>
          prev.map(s =>
            s.id === shipment.id
              ? {
                  ...s,
                  trackingNumber: data.order.trackingNumber,
                  carrier: data.order.courierName || 'C807 Express',
                  status: 'IN_TRANSIT',
                }
              : s
          )
        );
        alert(`✅ Guía C807 generada exitosamente: ${data.order.trackingNumber}`);
      } else {
        alert(`Error al generar guía C807: ${data.error || 'No se pudo generar guía'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión con C807: ${err?.message || 'Error desconocido'}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredShipments = shipments.filter(s =>
    s.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    (s.trackingNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    s.customerName.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 pb-12 w-full max-w-full overflow-x-hidden">
      
      {/* Botón Volver a POS */}
      <div>
        <Link
          href="/pos"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl shadow-2xs transition-all"
        >
          ← Volver a Punto de Venta (POS)
        </Link>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Preparación</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              {shipments.filter(s => s.status === 'PREPARING').length}
            </h3>
            <span className="text-xs text-slate-500 font-medium">Por empaquetar y despachar</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(245,158,11,0.2)]">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Ruta / Tránsito</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">
              {shipments.filter(s => s.status === 'IN_TRANSIT').length}
            </h3>
            <span className="text-xs text-slate-500 font-medium">Con mensajero en camino</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(99,102,241,0.2)]">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entregados Hoy</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {shipments.filter(s => s.status === 'DELIVERED').length}
            </h3>
            <span className="text-xs text-slate-500 font-medium">Entregas confirmadas</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="clay-card p-4 sm:p-5 flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar por pedido (#WEB-...), guía, cliente o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="clay-input has-icon w-full pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Lista de Envíos Claymórfica */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredShipments.map((shipment) => (
          <div key={shipment.id} className="clay-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    #{shipment.orderNumber}
                  </span>
                  {shipment.trackingNumber && (
                    <a
                      href={`https://c807xpress.com/tracking/?guia=${encodeURIComponent(shipment.trackingNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1"
                    >
                      <span>Guía: {shipment.trackingNumber}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <span className={`clay-badge text-[11px] py-0.5 px-2.5 ${
                  shipment.status === 'DELIVERED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : shipment.status === 'IN_TRANSIT'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {shipment.status === 'DELIVERED' ? 'Entregado' : shipment.status === 'IN_TRANSIT' ? 'En Ruta' : 'Preparando'}
                </span>
              </div>

              <h4 className="font-extrabold text-base text-slate-800 mb-1">{shipment.customerName}</h4>

              <div className="space-y-1.5 text-xs text-slate-600 my-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono font-bold text-slate-800">{shipment.phone}</span>
                </div>
                {shipment.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600">{shipment.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {[shipment.municipality, shipment.department].filter(Boolean).join(', ')}
                    </span>
                    <span className="leading-tight block text-slate-600">{shipment.address}</span>
                  </div>
                </div>
                {shipment.deliveryReference && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-tight text-amber-900 font-medium">
                      Ref: {shipment.deliveryReference}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{shipment.carrier}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="font-black text-slate-900 text-sm block">
                  Total: ${shipment.orderTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-emerald-700">
                  {shipment.paymentStatus === 'COMPLETED' ? 'Pagado (No cobrar envío)' : 'Contra Entrega'}
                </span>
              </div>

              {/* Botones de Guía C807 y cambio de estado */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {!shipment.trackingNumber && (
                  <button
                    type="button"
                    disabled={generatingId === shipment.id}
                    onClick={() => handleGenerarGuiaC807(shipment)}
                    className="clay-btn clay-btn-primary text-[11px] py-1.5 px-3 rounded-lg font-bold disabled:opacity-50"
                  >
                    {generatingId === shipment.id ? 'Generando...' : 'Generar Guía C807'}
                  </button>
                )}
                {shipment.status === 'PREPARING' && (
                  <button
                    onClick={() => handleUpdateStatus(shipment.id, 'IN_TRANSIT')}
                    className="clay-btn clay-btn-light text-[11px] py-1.5 px-2.5 rounded-lg"
                  >
                    Enviar a Ruta
                  </button>
                )}
                {shipment.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => handleUpdateStatus(shipment.id, 'DELIVERED')}
                    className="clay-btn clay-btn-success text-[11px] py-1.5 px-3 rounded-lg"
                  >
                    Marcar Entregado
                  </button>
                )}
                {shipment.status === 'DELIVERED' && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completado
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
