'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  User, 
  Building2, 
  FileText, 
  ReceiptText, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  Tag, 
  Store, 
  Globe, 
  Edit3, 
  Plus, 
  Loader2,
  CheckCircle2,
  Package
} from 'lucide-react';
import { CustomerRecord } from '@/lib/customers';

export interface PosCustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerRecord | null;
  onEditCustomer: (customer: CustomerRecord) => void;
  onStartSale: (customer: CustomerRecord) => void;
}

export const PosCustomerDetailModal: React.FC<PosCustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEditCustomer,
  onStartSale,
}) => {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<{ totalSpent: number; totalPurchases: number; posCount: number; ecommerceCount: number } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    if (!isOpen || !customer?.id) return;

    let isMounted = true;
    setIsLoadingHistory(true);
    setHistoryError('');

    fetch(`/api/customers/${customer.id}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success) {
            setHistoryData(data.history || []);
            setMetrics(data.metrics || null);
          } else {
            setHistoryError(data.error || 'No se pudo cargar el historial.');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setHistoryError(err.message || 'Error al conectar con el servidor.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, customer?.id]);

  if (!isOpen || !customer) return null;

  const isCCF = customer.tipoPersona === 'JURIDICA' || customer.documentoPreferido === '03' || Boolean(customer.nrc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="clay-card w-full max-w-3xl p-5 sm:p-6 relative bg-white animate-in zoom-in-95 max-h-[92vh] overflow-y-auto flex flex-col space-y-4">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          title="Cerrar ficha"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado del Perfil */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 pr-8">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm ${
              isCCF ? 'bg-purple-600' : 'bg-indigo-600'
            }`}>
              {customer.name
                ? customer.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : 'CL'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {customer.name}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isCCF ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {isCCF ? 'CCF (03) • Contribuyente' : 'FC (01) • Consumidor Final'}
                </span>
                {customer.tier && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                    VIP: {customer.tier.name}
                  </span>
                )}
              </div>
              {customer.nombreComercial && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Nombre Comercial: <strong>{customer.nombreComercial}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditCustomer(customer);
              }}
              className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold flex items-center gap-1 text-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartSale(customer);
              }}
              className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Orden POS</span>
            </button>
          </div>
        </div>

        {/* Precios Especiales Fijos y Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Precio Esencias</p>
            <p className="text-sm font-black text-indigo-950 mt-0.5">
              {customer.specialEssencePrice != null
                ? `$${Number(customer.specialEssencePrice).toFixed(2)} / oz`
                : 'Estándar ($3.25)'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Precio Botes</p>
            <p className="text-sm font-black text-purple-950 mt-0.5">
              {customer.specialBottlePrice != null
                ? `$${Number(customer.specialBottlePrice).toFixed(2)} / un.`
                : 'Estándar'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Comprado</p>
            <p className="text-sm font-black text-slate-900 mt-0.5 font-mono">
              ${(metrics?.totalSpent ?? 0).toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compras Realizadas</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {metrics?.totalPurchases ?? 0} ({metrics?.posCount ?? 0} POS • {metrics?.ecommerceCount ?? 0} Web)
            </p>
          </div>
        </div>

        {/* Datos Fiscales y de Contacto */}
        <div className="clay-card p-3.5 bg-slate-50/80 space-y-2 border border-slate-200/80">
          <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Datos Fiscales & Ubicación (Hacienda El Salvador)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Documento ({customer.tipoDocumento || 'DUI'}):</span>
              <span className="font-mono font-bold text-slate-900">{customer.numDocumento || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold">NRC (Contribuyente):</span>
              <span className="font-mono font-bold text-purple-700">{customer.nrc || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Categoría Tributaria:</span>
              <span className="font-semibold text-slate-800">{customer.categoriaContribuyente || 'OTRO'}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[10px] font-bold">Giro / Actividad Económica:</span>
              <span className="font-medium text-slate-800 truncate block">
                {customer.actividadEconomica || 'Consumidor Final / General'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Doc. Preferido:</span>
              <span className="font-bold text-slate-900">
                {customer.documentoPreferido === '03' ? '03 - Crédito Fiscal' : '01 - Factura'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Correo Electrónico:</span>
              <span className="font-mono text-slate-800 break-all">{customer.email || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Teléfono / WhatsApp:</span>
              <span className="font-mono text-slate-800">{customer.phone || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold">Ubicación / Dirección:</span>
              <span className="text-slate-800 block truncate">
                {customer.municipio ? `${customer.municipio}, ` : ''}{customer.departamento || 'El Salvador'}
                {customer.direccion ? ` • ${customer.direccion}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Historial Unificado de Compras (POS + Web) */}
        <div className="space-y-2 flex-1 min-h-[160px]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Historial Unificado de Compras ({historyData.length})</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              Ventas de mostrador POS y pedidos online sincronizados
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Cargando historial unificado...</p>
            </div>
          ) : historyError ? (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
              {historyError}
            </p>
          ) : historyData.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200/80">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-600">Sin compras registradas aún</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Las ventas en mostrador o pedidos web de este cliente aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {historyData.map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString('es-SV', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isPos = order.channel === 'POS';

                return (
                  <div
                    key={order.id || order.orderNumber}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase flex items-center gap-1 ${
                          isPos
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isPos ? <Store className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                          <span>{order.originLabel || (isPos ? 'Tienda Física' : 'Online Web')}</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {dateStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900">
                          ${order.total.toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>

                    {/* Detalle de items comprados */}
                    <div className="space-y-1">
                      {order.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="truncate pr-2">
                            <strong>{it.quantity}x</strong> {it.productName}
                          </span>
                          <span className="font-mono font-medium shrink-0">
                            ${(it.total || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Nota fiscal si existe */}
                    {order.dteNumeroControl && (
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span>DTE Oficial MH: <strong>{order.dteNumeroControl}</strong></span>
                        <span className="text-indigo-600 font-medium">Emitido</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosCustomerDetailModal;
