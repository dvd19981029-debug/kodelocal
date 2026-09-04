'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  User, 
  Navigation,
  Search,
  ExternalLink
} from 'lucide-react';

interface Shipment {
  id: string;
  trackingNumber: string;
  customerName: string;
  phone: string;
  address: string;
  department: string;
  carrier: string; // Mensajero Propio, Cargo Expreso, etc.
  status: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  orderTotal: number;
  createdAt: string;
}

export default function LogisticaPage() {
  const [shipments, setShipments] = useState<Shipment[]>([
    {
      id: 'shp-1',
      trackingNumber: 'ENV-SV-8801',
      customerName: 'Beatriz Morales',
      phone: '7722-1133',
      address: 'Colonia Escalón, Calle El Mirador #42',
      department: 'San Salvador',
      carrier: 'Mensajero Moto #1',
      status: 'IN_TRANSIT',
      orderTotal: 49.50,
      createdAt: new Date().toISOString()
    },
    {
      id: 'shp-2',
      trackingNumber: 'ENV-SV-8802',
      customerName: 'Roberto Fuentes',
      phone: '7890-4411',
      address: 'Santa Tecla, Residencial Pinares de Suiza Pol. C',
      department: 'La Libertad',
      carrier: 'Cargo Expreso',
      status: 'PREPARING',
      orderTotal: 68.00,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'shp-3',
      trackingNumber: 'ENV-SV-8799',
      customerName: 'Ingrid Castillo',
      phone: '7123-9988',
      address: 'Soyapango, Bosques del Río Senda 3',
      department: 'San Salvador',
      carrier: 'Mensajero Moto #2',
      status: 'DELIVERED',
      orderTotal: 35.00,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);

  const [search, setSearch] = useState('');

  const handleUpdateStatus = (id: string, newStatus: Shipment['status']) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const filteredShipments = shipments.filter(s =>
    s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.customerName.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      
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
            placeholder="Buscar por guía de envío, cliente o dirección..."
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
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  {shipment.trackingNumber}
                </span>
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
                  <span className="font-medium">{shipment.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{shipment.address}, {shipment.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{shipment.carrier}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm">
                Cobro: ${shipment.orderTotal.toFixed(2)}
              </span>

              {/* Botones de cambio de estado */}
              <div className="flex items-center gap-1.5">
                {shipment.status === 'PREPARING' && (
                  <button
                    onClick={() => handleUpdateStatus(shipment.id, 'IN_TRANSIT')}
                    className="clay-btn clay-btn-primary text-[11px] py-1.5 px-3 rounded-lg"
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
