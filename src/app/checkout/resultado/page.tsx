'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  ArrowRight, 
  ShoppingBag, 
  Home, 
  Loader2, 
  ShieldCheck,
  ExternalLink,
  Truck,
  MapPin,
  Phone,
  User,
  Clock,
  Check,
  Copy
} from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { addGuestOrderNumber, getGuestOrders, saveGuestOrder } from '@/lib/guestOrderStorage';

function CheckoutResultadoContent() {
  const searchParams = useSearchParams();
  const { openDrawer } = useCustomerAuth();
  const { clearCart } = useEcommerceCart();

  // Parámetros tolerantes a mayúsculas/minúsculas y variaciones de Wompi SV
  const idTransaccion = searchParams.get('idTransaccion') 
    || searchParams.get('IdTransaccion') 
    || searchParams.get('id') 
    || searchParams.get('transactionId');

  const monto = searchParams.get('monto') 
    || searchParams.get('Monto') 
    || searchParams.get('amount');

  const rawIdentificador = searchParams.get('identificadorEnlaceComercio') 
    || searchParams.get('IdentificadorEnlaceComercio') 
    || searchParams.get('orderNumber') 
    || searchParams.get('order_number') 
    || searchParams.get('idEnlace');

  const esAprobada = searchParams.get('esAprobada') 
    || searchParams.get('EsAprobada') 
    || searchParams.get('resultadoTransaccion') 
    || searchParams.get('ResultadoTransaccion');

  const mensaje = searchParams.get('mensaje') 
    || searchParams.get('Mensaje');

  // Fallback para identificador si no viene en searchParams (última orden local del invitado)
  const [identificador, setIdentificador] = useState<string | null>(rawIdentificador);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    if (!identificador) {
      const guestList = getGuestOrders();
      if (guestList.length > 0 && guestList[0].orderNumber) {
        setIdentificador(guestList[0].orderNumber);
      }
    }
  }, [identificador]);

  // En Wompi 'esAprobada' puede venir como 'True', 'true' o no venir si es enlace de pago
  const esAprobadaLower = (esAprobada || '').trim().toLowerCase();
  const isApproved = esAprobadaLower === 'true' 
    || esAprobadaLower === 'exitosaaprobada' 
    || (!esAprobada && Boolean(idTransaccion)) 
    || (!esAprobada && Boolean(identificador));

  // 1. Confirmar pago en la base de datos inmediatamente y vaciar carrito
  useEffect(() => {
    if (isApproved) {
      clearCart();
      if (identificador) {
        addGuestOrderNumber(identificador, {
          total: monto ? Number(monto) : undefined,
          paymentMethod: 'CARD',
          paymentStatus: 'COMPLETED',
        });

        // Notificar al servidor el éxito del pago
        fetch('/api/ecommerce/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: identificador,
            paymentStatus: 'COMPLETED',
            transactionId: idTransaccion || undefined,
            notes: `[Pago Aprobado Wompi Tx: ${idTransaccion || 'N/A'}]`,
          }),
        }).catch((err) => console.error('Error actualizando estado de pago:', err));
      }
    }
  }, [isApproved, identificador, idTransaccion, monto, clearCart]);

  // 2. Cargar detalles completos de la orden y su envío
  useEffect(() => {
    if (!identificador) {
      setIsLoadingOrder(false);
      return;
    }

    let isMounted = true;
    setIsLoadingOrder(true);

    fetch(`/api/ecommerce/orders?orderNumber=${encodeURIComponent(identificador)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.orders && data.orders.length > 0) {
          const found = data.orders[0];
          setOrderData(found);

          // Guardar orden enriquecida en el historial local del invitado
          saveGuestOrder({
            orderNumber: found.orderNumber,
            createdAt: found.createdAt,
            total: found.total,
            subtotal: found.subtotal,
            shippingCost: found.shippingCost,
            paymentMethod: found.paymentMethod,
            paymentStatus: found.paymentStatus,
            orderStatus: found.orderStatus,
            customerName: found.customerName,
            customerEmail: found.customerEmail,
            customerPhone: found.customerPhone,
            shippingAddress: found.shippingAddress,
            department: found.department,
            municipality: found.municipality,
            deliveryReference: found.deliveryReference,
            courierName: found.courierName,
            trackingNumber: found.trackingNumber,
            items: found.items?.map((it: any) => ({
              productName: it.productName,
              inspiredBy: it.inspiredBy,
              presentation: it.presentation,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              total: it.total,
            })),
          });
        }
      })
      .catch((err) => console.error('Error cargando detalles del pedido:', err))
      .finally(() => {
        if (isMounted) setIsLoadingOrder(false);
      });

    return () => {
      isMounted = false;
    };
  }, [identificador]);

  const handleCopyTracking = (trackNum: string) => {
    if (!trackNum) return;
    navigator.clipboard.writeText(trackNum);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleViewMyOrder = () => {
    openDrawer('orders');
  };

  const isRetiro = orderData?.shippingAddress?.toLowerCase().includes('retiro') ||
                   orderData?.deliveryReference?.toLowerCase().includes('retiro');

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-5 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
        
        {isApproved ? (
          <>
            {/* Icono de Éxito */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Pago Confirmado con Wompi
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                ¡Gracias por tu compra!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto">
                Tu orden <strong className="font-mono text-indigo-700 font-black">#{identificador || 'N/A'}</strong> ha sido registrada y estamos preparando tus esencias en bodega.
              </p>
            </div>

            {/* Línea de Progreso de Envío */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Estado del Envío y Preparación</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-indigo-100 text-indigo-800">
                  <Clock className="w-3 h-3" />
                  {orderData?.orderStatus === 'ENTREGADO' 
                    ? 'Entregado' 
                    : orderData?.orderStatus === 'EN_RUTA' 
                    ? 'En Camino' 
                    : 'En Preparación'}
                </span>
              </div>

              {/* Barra de Pasos */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 pt-1 text-center">
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-extrabold text-emerald-700 block leading-tight">1. Pagado</span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-[10px] font-extrabold text-indigo-700 block leading-tight">2. Bodega</span>
                </div>
                <div className="space-y-1">
                  <div className={`h-2 rounded-full ${['EN_RUTA', 'ENTREGADO'].includes(orderData?.orderStatus) ? 'bg-purple-500' : 'bg-slate-200'}`}></div>
                  <span className={`text-[10px] font-bold block leading-tight ${['EN_RUTA', 'ENTREGADO'].includes(orderData?.orderStatus) ? 'text-purple-700 font-extrabold' : 'text-slate-400'}`}>3. En Ruta</span>
                </div>
                <div className="space-y-1">
                  <div className={`h-2 rounded-full ${orderData?.orderStatus === 'ENTREGADO' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                  <span className={`text-[10px] font-bold block leading-tight ${orderData?.orderStatus === 'ENTREGADO' ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}`}>4. Entregado</span>
                </div>
              </div>
            </div>

            {/* Ficha Completa de Envío y Destino */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 text-left space-y-3 text-xs">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Datos de Entrega {isRetiro ? '(Retiro en Sucursal)' : '(Envío a Domicilio)'}</span>
              </h4>

              {isLoadingOrder ? (
                <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Cargando datos de envío...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Destinatario:</span>
                    <strong className="text-slate-800 font-bold text-xs">{orderData?.customerName || 'Cliente Invitado'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Teléfono de Contacto:</span>
                    <strong className="text-slate-800 font-mono font-bold text-xs">{orderData?.customerPhone || 'N/A'}</strong>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10.5px]">Dirección de Entrega:</span>
                    <p className="text-slate-700 font-medium text-xs leading-relaxed">
                      {orderData?.shippingAddress || (isRetiro ? 'Retiro en Local San Salvador - Aromaniak' : 'Dirección registrada en orden')}
                    </p>
                  </div>

                  {orderData?.deliveryReference && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10.5px]">Referencia de Ubicación:</span>
                      <p className="text-slate-600 text-[11px] italic">
                        {orderData.deliveryReference}
                      </p>
                    </div>
                  )}

                  {/* Transportista y Guía si ya fue despachado */}
                  {(orderData?.courierName || orderData?.trackingNumber) && (
                    <div className="sm:col-span-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-purple-700 font-bold uppercase block">Transportista Asignado:</span>
                        <strong className="text-purple-900 text-xs">{orderData.courierName || 'Mensajería Express'}</strong>
                      </div>
                      {orderData.trackingNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopyTracking(orderData.trackingNumber)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 font-mono font-bold text-[11px] flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <span>Guía: {orderData.trackingNumber}</span>
                          {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Artículos del Pedido si están disponibles */}
            {orderData?.items && orderData.items.length > 0 && (
              <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 text-left space-y-2.5 text-xs">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Productos Comprados ({orderData.items.length})</span>
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderData.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between gap-2 text-xs border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                      <div className="min-w-0 pr-1">
                        <p className="font-bold text-slate-800 text-[11.5px] truncate">
                          {it.quantity}x {it.productName}
                        </p>
                        {it.inspiredBy && (
                          <p className="text-[10.5px] text-indigo-600 font-medium pl-3">
                            Inspirado en: <span className="text-slate-600">{it.inspiredBy}</span>
                          </p>
                        )}
                        {it.presentation && (
                          <span className="text-[9.5px] text-slate-400 pl-3">
                            Presentación: {it.presentation}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        ${Number(it.total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between font-black text-slate-900 text-xs">
                  <span>Total Pagado:</span>
                  <span className="text-indigo-700 font-mono text-sm">${Number(orderData.total || monto || 0).toFixed(2)} USD</span>
                </div>
              </div>
            )}

            {/* Ficha de Transacción Wompi */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3.5 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Método de Pago:</span>
                <span className="font-bold text-slate-800">Tarjeta (Banco Agrícola / Wompi)</span>
              </div>
              {idTransaccion && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Ref. Transacción:</span>
                  <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]" title={idTransaccion}>
                    {idTransaccion}
                  </span>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleViewMyOrder}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Package className="w-4 h-4" />
                <span>Ver Mi Pedido y Envío</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/"
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Ir a la Tienda</span>
                </Link>

                <a
                  href={`https://wa.me/50378339470?text=${encodeURIComponent(`Hola Aromaniak, acabo de pagar la orden #${identificador || ''} con tarjeta y deseo consultar el envío.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200/80 transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Icono de Fallo */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-100">
              <AlertCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-slate-900">
                El pago no fue completado
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {mensaje || 'La transacción no pudo ser autorizada por el banco o fue cancelada.'}
              </p>
            </div>

            <div className="pt-4 space-y-2.5">
              <Link
                href="/checkout"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Volver al Checkout e Intentar de Nuevo</span>
              </Link>

              <a
                href="https://wa.me/50378339470?text=Hola%20Aromaniak,%20tuve%20un%20problema%20con%20el%20pago%20de%20mi%20pedido"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-indigo-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Solicitar Asistencia por WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default function CheckoutResultadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <CheckoutResultadoContent />
    </Suspense>
  );
}
