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
  ExternalLink 
} from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

function CheckoutResultadoContent() {
  const searchParams = useSearchParams();
  const { openDrawer } = useCustomerAuth();

  const idTransaccion = searchParams.get('idTransaccion');
  const monto = searchParams.get('monto');
  const identificador = searchParams.get('identificadorEnlaceComercio');
  const esAprobada = searchParams.get('esAprobada');
  const mensaje = searchParams.get('mensaje');

  // En Wompi 'esAprobada' puede venir como 'True' o no venir si es enlace de pago
  // Si no viene 'esAprobada', la presencia de 'idTransaccion' y 'monto' con hash indica transacción procesada
  const isApproved = esAprobada === 'True' || (!esAprobada && Boolean(idTransaccion));

  // Confirmar pago en la base de datos inmediatamente al volver de Wompi
  useEffect(() => {
    if (isApproved && identificador) {
      fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: identificador,
          paymentStatus: 'COMPLETED',
          notes: `[Pago Aprobado Wompi Tx: ${idTransaccion || 'N/A'}]`,
        }),
      }).catch((err) => console.error('Error actualizando estado de pago:', err));
    }
  }, [isApproved, identificador, idTransaccion]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
        
        {isApproved ? (
          <>
            {/* Icono de Éxito */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Pago Confirmado con Wompi
              </span>
              <h1 className="text-2xl font-black text-slate-900">
                ¡Gracias por tu compra!
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Tu transacción ha sido procesada exitosamente y estamos preparando tu paquete en bodega.
              </p>
            </div>

            {/* Ficha de Detalles del Cobro */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-left space-y-2.5 text-xs">
              {identificador && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Número de Pedido:</span>
                  <span className="font-mono font-black text-indigo-700">#{identificador}</span>
                </div>
              )}
              {monto && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Monto Pagado:</span>
                  <span className="font-mono font-black text-slate-900">${Number(monto).toFixed(2)} USD</span>
                </div>
              )}
              {idTransaccion && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Ref. Transacción:</span>
                  <span className="font-mono text-[10px] text-slate-600 truncate max-w-[170px]" title={idTransaccion}>
                    {idTransaccion}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-500 font-medium">Método:</span>
                <span className="font-bold text-slate-800">Tarjeta (Banco Agrícola / Wompi)</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => openDrawer('orders')}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Package className="w-4 h-4" />
                <span>Ver Mi Pedido y Envío</span>
              </button>

              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Volver a la Tienda</span>
              </Link>
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
