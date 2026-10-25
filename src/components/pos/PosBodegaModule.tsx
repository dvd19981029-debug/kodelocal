'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ReceiptText, 
  Search, 
  Eye,
  X,
  User,
  Phone,
  ZoomIn,
  RotateCcw
} from 'lucide-react';
import { CustomerRecord } from '@/lib/customers';
import { SaleRecord, ProductItem, getOrderPaymentDisplayInfo } from '@/lib/store';
import { getOriginalFragranceInfo, parseKitOrderItem, resolveBottleImageInfo } from '@/lib/perfumeNames';

export interface PosBodegaModuleProps {
  sales: SaleRecord[];
  products: ProductItem[];
  readyInWindowCount: number;
  pendingPreparationCount: number;
  completedOrdersCount: number;
  bodegaOrdenesFilter: 'ALL' | 'READY' | 'PENDING' | 'COMPLETED';
  setBodegaOrdenesFilter: (filter: 'ALL' | 'READY' | 'PENDING' | 'COMPLETED') => void;
  bodegaOrdenesSearch: string;
  setBodegaOrdenesSearch: (search: string) => void;
  filteredBodegaOrders: SaleRecord[];
  setSelectedSaleDetail: (sale: SaleRecord) => void;
  handleMarkOrderReadyFromPos: (orderId: string) => void;
  handleCancelReadyOrder?: (order: SaleRecord) => void;
  handleEditOrderInPos?: (order: SaleRecord) => void;
  handleMarkOrderDeliveredFromPos: (orderId: string) => void;
  customers?: CustomerRecord[];
}

export const PosBodegaModule: React.FC<PosBodegaModuleProps> = React.memo(({
  sales,
  products,
  readyInWindowCount,
  pendingPreparationCount,
  completedOrdersCount,
  bodegaOrdenesFilter,
  setBodegaOrdenesFilter,
  bodegaOrdenesSearch,
  setBodegaOrdenesSearch,
  filteredBodegaOrders,
  setSelectedSaleDetail,
  handleMarkOrderReadyFromPos,
  handleCancelReadyOrder,
  handleEditOrderInPos,
  handleMarkOrderDeliveredFromPos,
  customers,
}) => {
  const [zoomedBottle, setZoomedBottle] = useState<{ imageUrl: string; name: string; puesto?: string } | null>(null);

  const resolveCustomerName = (order: SaleRecord) => {
    if (order.cliente?.nombre && order.cliente.nombre.trim() !== '' && order.cliente.nombre.toLowerCase().trim() !== 'consumidor final') {
      return order.cliente.nombre;
    }
    const custId = (order.cliente as any)?.id || (order as any).customerId;
    if (custId && customers) {
      const found = customers.find(c => c.id === custId);
      if (found?.name) return found.name;
    }
    return order.cliente?.nombre || 'Consumidor Final';
  };

  const resolveCustomerPhone = (order: SaleRecord) => {
    const direct =
      order.cliente?.telefono ||
      (order as any).customerPhone ||
      order.domicilio?.customerPhone;
    if (direct && String(direct).trim()) return String(direct).trim();
    const custId = (order.cliente as any)?.id || (order as any).customerId;
    if (custId && customers) {
      const found = customers.find(c => c.id === custId);
      if (found?.phone) return found.phone;
    }
    return '';
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Cabecera & Métricas de Órdenes */}
      <div
        className="clay-card-dark p-5 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #4338ca 100%)' }}
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Box className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
                📦 Seguimiento Operativo
              </span>
              <span className="text-xs text-amber-100">Bodega & Preparación</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">
              Estado de Comandas y Pedidos en Bodega
            </h2>
            <p className="text-xs text-amber-100/90 mt-1 max-w-xl">
              Supervisa en tiempo real qué órdenes están siendo preparadas en estantería (📍 puestos) y cuáles ya están listas en ventanilla para entrega al cliente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-4 rounded-2xl border backdrop-blur-md text-center ${
              readyInWindowCount > 0 
                ? 'bg-emerald-500/90 border-emerald-300 text-white animate-bounce' 
                : 'bg-white/10 border-white/20 text-white'
            }`}>
              <span className="text-[10.5px] uppercase font-black block tracking-wider">
                Listos en Ventanilla
              </span>
              <div className="text-3xl md:text-4xl font-black font-mono mt-0.5">
                {readyInWindowCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-amber-500">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Preparación</p>
            <h3 className="text-2xl font-black text-amber-600 font-mono mt-0.5">{pendingPreparationCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
            <Clock className="w-5 h-5" />
          </span>
        </div>

        <div className={`clay-card p-4 flex items-center justify-between border-l-4 border-emerald-500 ${readyInWindowCount > 0 ? 'bg-emerald-50/50 ring-2 ring-emerald-400' : ''}`}>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Listos en Ventanilla</p>
            <h3 className="text-2xl font-black text-emerald-700 font-mono mt-0.5">{readyInWindowCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>

        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-blue-500">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregados al Cliente</p>
            <h3 className="text-2xl font-black text-blue-600 font-mono mt-0.5">{completedOrdersCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
            <Truck className="w-5 h-5" />
          </span>
        </div>

        <div className="clay-card p-4 flex items-center justify-between border-l-4 border-indigo-500">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Comandas Hoy</p>
            <h3 className="text-2xl font-black text-indigo-600 font-mono mt-0.5">{sales.length}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
            <ReceiptText className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="clay-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBodegaOrdenesFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              bodegaOrdenesFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({readyInWindowCount + pendingPreparationCount})
          </button>
          <button
            type="button"
            onClick={() => setBodegaOrdenesFilter('READY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              bodegaOrdenesFilter === 'READY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Listos en Ventanilla ({readyInWindowCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setBodegaOrdenesFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              bodegaOrdenesFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En Preparación ({pendingPreparationCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setBodegaOrdenesFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              bodegaOrdenesFilter === 'COMPLETED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Entregados ({completedOrdersCount})</span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar comanda, cliente o fragancia..."
            value={bodegaOrdenesSearch}
            onChange={(e) => setBodegaOrdenesSearch(e.target.value)}
            className="clay-input has-icon w-full pr-3 py-1.5 text-xs font-bold"
          />
        </div>
      </div>

      {/* Listado de Tarjetas de Órdenes */}
      {filteredBodegaOrders.length === 0 ? (
        <div className="clay-card p-12 text-center text-slate-400">
          <Box className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No hay órdenes con este filtro</h3>
          <p className="text-xs text-slate-500 mt-1">
            Las ventas procesadas en el Punto de Venta se envían automáticamente a Bodega y su estado se sincroniza en vivo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBodegaOrders.map(order => {
            const isPending = order.status === 'PENDING_PREPARATION' || !order.status;
            const isReady = order.status === 'READY_AT_WINDOW';
            const isCompleted = order.status === 'COMPLETED';
            const paymentInfo = getOrderPaymentDisplayInfo(order);
            const isOnlineOrder =
              order.channel === 'ONLINE' ||
              String(order.saleNumber || order.orderNumber || '').toUpperCase().startsWith('WEB-');
            const customerPhone = resolveCustomerPhone(order);

            return (
              <div 
                key={order.id} 
                className={`clay-card p-4 flex flex-col justify-between transition-all ${
                  isReady 
                    ? 'border-l-4 border-emerald-500 bg-emerald-50/20 shadow-md ring-1 ring-emerald-200' 
                    : isPending 
                    ? 'border-l-4 border-amber-500 bg-amber-50/10' 
                    : 'border-l-4 border-slate-300 bg-white'
                }`}
              >
                <div>
                  {/* Fila Superior: Comanda & Estado */}
                  <div className="pb-3 border-b border-slate-100 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                          #{order.saleNumber}
                        </span>
                        {isOnlineOrder && (
                          <span className={`clay-badge text-[10px] font-black py-0.5 px-2.5 ${
                            paymentInfo.isPaid
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}>
                            Tienda Online
                          </span>
                        )}
                        <span className={`clay-badge text-[10px] font-black py-0.5 px-2 ${
                          (order.tipoComprobante || (order.cliente?.nrc ? '03' : '01')) === '03'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : order.tipoComprobante === 'TICKET'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {(order.tipoComprobante || (order.cliente?.nrc ? '03' : '01')) === '03' ? 'Crédito Fiscal (CCF)' : order.tipoComprobante === 'TICKET' ? 'Ticket' : 'Factura (FC)'}
                        </span>
                        <span className={`clay-badge text-[10px] font-black py-0.5 px-2.5 ${
                          isReady 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : isPending 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isReady ? 'Listo en Ventanilla' : isPending ? 'En Preparación' : 'Entregado'}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-semibold ml-0.5">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-black uppercase block ${
                          paymentInfo.isPaid ? 'text-green-700' : 'text-amber-700'
                        }`}>
                          {paymentInfo.isPaid ? 'Ya Pagó' : 'Por Cancelar'}
                        </span>
                        <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg inline-block mt-0.5 ${
                          paymentInfo.isPaid
                            ? 'text-green-800 bg-green-100/80 border border-green-200'
                            : 'text-amber-950 bg-amber-50 border border-amber-300'
                        }`}>
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Bloque de Cliente (Nombre + Teléfono) */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-800">
                          <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="text-slate-500 font-semibold">Cliente:</span>
                          <strong className="font-black text-slate-900">{resolveCustomerName(order)}</strong>
                        </div>
                        {customerPhone && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                            <Phone className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>Tel: {customerPhone}</span>
                          </span>
                        )}
                      </div>
                      {order.deliveryNotes && (
                        <p className="text-[10.5px] text-indigo-800 font-semibold bg-indigo-50/70 px-2 py-1 rounded-lg border border-indigo-100 leading-snug">
                          {order.deliveryNotes}
                        </p>
                      )}
                    </div>

                    {/* Burbuja y Detalle de Pago */}
                    <div
                      className={`px-2.5 py-2 rounded-xl border text-[10.5px] font-bold flex flex-wrap items-center justify-between gap-2 ${
                        paymentInfo.isPaid
                          ? 'bg-green-50/90 text-green-900 border-green-200'
                          : paymentInfo.tone === 'orange'
                          ? 'bg-orange-50/90 text-orange-950 border-orange-200'
                          : 'bg-amber-50/90 text-amber-950 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          paymentInfo.isPaid
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : paymentInfo.tone === 'orange'
                            ? 'bg-orange-100 text-orange-900 border border-orange-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {paymentInfo.badgeText}
                        </span>
                        <span className="text-slate-700 font-semibold">{paymentInfo.detailText}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <span className="font-mono font-black px-2 py-0.5 rounded bg-white border border-slate-200/80 text-slate-900 shadow-2xs">
                          {paymentInfo.isPaid
                            ? `Pagado: $${Number(order.total || 0).toFixed(2)}`
                            : `Por cobrar: $${Number(order.total || 0).toFixed(2)}`}
                        </span>
                        {!paymentInfo.isPaid &&
                          (order.paymentMethod === 'TRANSFER' || order.paymentMethod === 'TRANSFERENCIA') && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `¿Confirmar que el cliente ${resolveCustomerName(order)} ya realizó la transferencia bancaria por $${Number(order.total || 0).toFixed(2)} para el pedido #${order.saleNumber}?`
                                  )
                                ) {
                                  return;
                                }
                                try {
                                  const { getStaffToken } = await import('@/lib/auth');
                                  const staffToken = await getStaffToken();
                                  const isOnline =
                                    order.channel === 'ONLINE' ||
                                    String(order.saleNumber || '').toUpperCase().startsWith('WEB-');
                                  if (isOnline) {
                                    await fetch('/api/ecommerce/orders', {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(staffToken ? { 'x-staff-token': staffToken } : {}),
                                      },
                                      body: JSON.stringify({
                                        orderId: order.id,
                                        orderNumber: order.orderNumber || order.saleNumber,
                                        paymentStatus: 'COMPLETED',
                                      }),
                                    });
                                  } else {
                                    await fetch('/api/sales', {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(staffToken ? { 'x-staff-token': staffToken } : {}),
                                      },
                                      body: JSON.stringify({
                                        id: order.id,
                                        saleNumber: order.saleNumber,
                                        paymentStatus: 'COMPLETED',
                                      }),
                                    });
                                  }
                                  if (typeof window !== 'undefined') {
                                    const raw = localStorage.getItem('kodelocal_sales');
                                    if (raw) {
                                      const saved = JSON.parse(raw);
                                      if (Array.isArray(saved)) {
                                        const updated = saved.map((s: any) =>
                                          s.id === order.id ||
                                          (order.saleNumber && s.saleNumber === order.saleNumber)
                                            ? { ...s, paymentStatus: 'COMPLETED' }
                                            : s
                                        );
                                        localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
                                        window.dispatchEvent(new Event('kodelocal_sales_updated'));
                                      }
                                    }
                                  }
                                } catch (err) {
                                  console.error('Error confirmando transferencia en POS Bodega:', err);
                                }
                              }}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-black inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirmar Transferencia</span>
                            </button>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Stepper Visual de Estado */}
                  <div className="my-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">1</span>
                        <span>Caja</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className={`flex items-center gap-1 ${isPending ? 'text-amber-600 font-black animate-pulse' : 'text-emerald-600'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isPending ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>2</span>
                        <span>Bodega</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className={`flex items-center gap-1 ${isReady ? 'text-emerald-700 font-black' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isReady ? 'bg-emerald-600 text-white animate-bounce' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}>3</span>
                        <span>Ventanilla</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className={`flex items-center gap-1 ${isCompleted ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>4</span>
                        <span>Entregado</span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Ítems y Puesto en Estantería */}
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                      Productos en Comanda ({order.items.length}):
                    </span>
                    {order.items.map((it, idx) => {
                      const origInfo = getOriginalFragranceInfo(it, products);
                      const kitInfo = parseKitOrderItem(it, products);
                      if (kitInfo) {
                        return (
                          <div key={idx} className="p-2.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="font-black text-purple-900 block">
                                  Arma tu propio perfume: {kitInfo.fragranceName} (×{it.quantity})
                                </span>
                                {(kitInfo.originalName || origInfo?.originalName) && (
                                  <span className="text-[10px] text-slate-600 font-medium block mt-0.5">
                                    Original: <strong className="text-slate-900 font-black">{kitInfo.originalName || origInfo?.originalName}</strong>
                                    {(kitInfo.brand || origInfo?.brand) && <span className="text-slate-400"> ({kitInfo.brand || origInfo?.brand})</span>}
                                  </span>
                                )}
                              </div>
                              <span className="clay-badge text-[9.5px] font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 border border-amber-300 shrink-0">
                                Esencia: {kitInfo.essencePuesto}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                              <span className="px-2 py-0.5 rounded bg-white border border-purple-200 text-purple-800">
                                {kitInfo.isPlus ? '1.5 Oz PLUS (1 Oz + ½ Oz)' : '1 Oz Estándar'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  kitInfo.bottleImageUrl &&
                                  setZoomedBottle({
                                    imageUrl: kitInfo.bottleImageUrl,
                                    name: kitInfo.bottleName,
                                    puesto: kitInfo.bottlePuesto,
                                  })
                                }
                                title="Click para ver imagen del bote en mayor tamaño"
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-purple-200 text-slate-800 hover:border-purple-400 cursor-zoom-in transition-all"
                              >
                                {kitInfo.bottleImageUrl && (
                                  <img
                                    src={kitInfo.bottleImageUrl}
                                    alt={kitInfo.bottleName}
                                    className="w-5 h-5 object-contain rounded"
                                  />
                                )}
                                <span>{kitInfo.bottleName} (Estante: {kitInfo.bottlePuesto})</span>
                              </button>
                              <span className="px-2 py-0.5 rounded bg-white border border-purple-200 text-emerald-800">
                                {kitInfo.hasLabel ? 'Con Etiqueta' : 'Sin Etiqueta'}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      const bottleInfo = resolveBottleImageInfo(it, products);
                      const resolvedPuesto = it.puesto || products.find(p => p.id === it.productId)?.puesto || bottleInfo?.puesto || 'A1';
                      return (
                        <div key={idx} className="p-2 rounded-xl bg-white border border-slate-200 text-xs flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                            {bottleInfo && (
                              <button
                                type="button"
                                onClick={() =>
                                  setZoomedBottle({
                                    imageUrl: bottleInfo.imageUrl,
                                    name: bottleInfo.bottleName,
                                    puesto: resolvedPuesto,
                                  })
                                }
                                title="Click para ver imagen del bote en mayor tamaño"
                                className="relative w-11 h-11 rounded-lg border border-indigo-200 bg-white p-0.5 shrink-0 shadow-2xs hover:ring-2 hover:ring-indigo-500 transition-all cursor-zoom-in group"
                              >
                                <img
                                  src={bottleInfo.imageUrl}
                                  alt={bottleInfo.bottleName}
                                  className="w-full h-full object-contain rounded"
                                />
                                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                                  <ZoomIn className="w-2 h-2" />
                                </span>
                              </button>
                            )}
                            <div className="truncate min-w-0 flex-1">
                              <span className="font-bold text-slate-800 block truncate">{it.name}</span>
                              {origInfo?.originalName && (
                                <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                                  Original: <strong className="text-slate-900 font-black">{origInfo.originalName}</strong>
                                  {origInfo.brand && <span className="text-slate-400"> ({origInfo.brand})</span>}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">
                                Cant: <strong className="text-indigo-700">{it.quantity} {/^\d/.test(String(it.unit || '').trim()) ? `× ${it.unit}` : (it.unit || 'Oz')}</strong>
                              </span>
                            </div>
                          </div>
                          <span className="clay-badge text-[9.5px] font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 border border-amber-300 shrink-0">
                            Puesto: {resolvedPuesto}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botones de Acción para la Cajera */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSaleDetail(order)}
                    className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Ticket</span>
                  </button>

                  {isReady && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {handleCancelReadyOrder && (
                        <button
                          type="button"
                          onClick={() => handleCancelReadyOrder(order)}
                          className="clay-btn clay-btn-light px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200"
                          title="Anular comanda"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Anular</span>
                        </button>
                      )}
                      {handleEditOrderInPos && order.channel !== 'ONLINE' && (
                        <button
                          type="button"
                          onClick={() => handleEditOrderInPos(order)}
                          className="clay-btn clay-btn-light px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border border-amber-200"
                          title="Devolver al Cotizador para modificar productos"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleMarkOrderDeliveredFromPos(order.id)}
                        className="clay-btn clay-btn-primary px-4 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-emerald-600 !shadow-[3px_4px_12px_rgba(16,185,129,0.4)] animate-pulse"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entregar al Cliente</span>
                      </button>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Bodega preparando...</span>
                      </span>
                      {handleEditOrderInPos && order.channel !== 'ONLINE' && (
                        <button
                          type="button"
                          onClick={() => handleEditOrderInPos(order)}
                          className="clay-btn clay-btn-light px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border border-amber-200"
                          title="Devolver al Cotizador para modificar productos"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleMarkOrderReadyFromPos(order.id)}
                        className="clay-btn clay-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-amber-500 !shadow-[3px_4px_12px_rgba(245,158,11,0.4)]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marcar Lista</span>
                      </button>
                    </div>
                  )}


                  {isCompleted && (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Entregado</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {zoomedBottle && (
        <div
          onClick={() => setZoomedBottle(null)}
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="clay-card bg-white max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                  Vista Ampliada de Frasco / Bote
                </span>
                <h3 className="font-black text-sm text-slate-900 truncate">
                  {zoomedBottle.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {zoomedBottle.puesto && (
                  <span className="clay-badge text-xs font-mono font-black px-2.5 py-1 bg-amber-100 text-amber-950 border border-amber-300">
                    📍 Puesto: {zoomedBottle.puesto}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setZoomedBottle(null)}
                  className="p-1.5 rounded-xl bg-slate-200/80 hover:bg-rose-100 text-slate-700 hover:text-rose-700 transition-colors cursor-pointer"
                  title="Cerrar vista ampliada"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-white flex flex-col items-center justify-center">
              <img
                src={zoomedBottle.imageUrl}
                alt={zoomedBottle.name}
                className="w-full max-h-[65vh] object-contain rounded-xl"
              />
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Verifica el diseño y tapa del bote
              </span>
              <button
                type="button"
                onClick={() => setZoomedBottle(null)}
                className="clay-btn clay-btn-primary px-4 py-1.5 text-xs font-black rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PosBodegaModule.displayName = 'PosBodegaModule';
export default PosBodegaModule;
