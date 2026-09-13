'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  FileText,
  Send,
  Building,
  AlertCircle,
  Store,
  AlertTriangle,
  Droplets,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { DEPARTAMENTOS_SV, CustomerRecord, getStoredCustomers, saveStoredCustomers } from '@/lib/customers';
import { DEPARTAMENTOS_CATALOG, getMunicipiosByDepartamento } from '@/lib/svTerritory';
import { SaleRecord } from '@/lib/store';
import { getProductImage } from '@/lib/perfumeImages';
import { getOriginalPerfumeName } from '@/lib/perfumeNames';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, totalItems, clearCart } = useEcommerceCart();
  const { customer, isLoggedIn, openAuthModal } = useCustomerAuth();

  // Método de entrega: Envío a domicilio o Retiro en sucursal
  const [metodoEntrega, setMetodoEntrega] = useState<'ENVIO' | 'RETIRO'>('ENVIO');

  // Datos de Envío y Contacto
  const [nombre, setNombre] = useState(customer?.name || '');
  const [telefono, setTelefono] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [departamento, setDepartamento] = useState(customer?.department || 'San Salvador');
  const [municipio, setMunicipio] = useState('San Salvador');
  const [direccion, setDireccion] = useState(customer?.address || '');
  const [referencia, setReferencia] = useState('');

  // Estado para copiar cuenta bancaria
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const handleCopyAccount = (text: string, bankKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bankKey);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  // Actualizar si el cliente inicia sesión mientras está en la página
  React.useEffect(() => {
    if (customer) {
      if (!nombre && customer.name) setNombre(customer.name);
      if (!email && customer.email) setEmail(customer.email);
      if (!telefono && customer.phone) setTelefono(customer.phone);
      if (customer.department) setDepartamento(customer.department);
      if (!direccion && customer.address) setDireccion(customer.address);
    }
  }, [customer]);

  // Método de pago: Tarjeta de Crédito/Débito o Transferencia Bancaria
  const [metodoPago, setMetodoPago] = useState<'CARD' | 'TRANSFER'>('CARD');

  // Tipo de comprobante
  const [tipoComprobante, setTipoComprobante] = useState<'TICKET' | '01' | '03'>('01');
  const [numDoc, setNumDoc] = useState('');
  const [nrc, setNrc] = useState('');
  const [giro, setGiro] = useState('');

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<SaleRecord | null>(null);

  // Desplazar al inicio cuando se complete el pedido
  React.useEffect(() => {
    if (completedOrder && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [completedOrder]);

  // Cálculo del costo de envío: $0 si retira en local; $3.50 SS/La Libertad o $5.00 otros
  const shippingCost = metodoEntrega === 'RETIRO' ? 0 : (departamento === 'San Salvador' || departamento === 'La Libertad' ? 3.50 : 5.00);
  const totalConEnvio = Number((subtotal + (cart.length > 0 ? shippingCost : 0)).toFixed(2));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !telefono.trim()) {
      alert('Por favor completa tu Nombre y Teléfono.');
      return;
    }

    // Validación de teléfono de El Salvador (8 dígitos)
    const rawPhoneDigits = telefono.replace(/\D/g, '');
    const cleanPhoneDigits = rawPhoneDigits.startsWith('503') && rawPhoneDigits.length === 11 ? rawPhoneDigits.slice(3) : rawPhoneDigits;
    if (cleanPhoneDigits.length !== 8) {
      alert('Por favor ingresa un número de teléfono válido de El Salvador de 8 dígitos (ej. 7000-0000).');
      return;
    }

    if (metodoEntrega === 'ENVIO' && !direccion.trim()) {
      alert('Por favor completa tu Dirección exacta de entrega.');
      return;
    }

    if (cart.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = `WEB-${Math.floor(1000 + Math.random() * 9000)}`;
      const saleId = `sale-${Date.now()}`;
      const now = new Date().toISOString();
      const direccionFinal = metodoEntrega === 'RETIRO' 
        ? 'Retiro en Local San Salvador - Aromaniak' 
        : `${direccion}, ${municipio}, ${departamento}`;

      const newOrder: SaleRecord = {
        id: saleId,
        saleNumber: orderNumber,
        orderNumber,
        createdAt: now,
        total: totalConEnvio,
        subtotal: subtotal,
        ivaTotal: Number((subtotal - (subtotal / 1.13)).toFixed(2)),
        paymentMethod: metodoPago,
        tipoComprobante,
        channel: 'ONLINE',
        shippingCost,
        deliveryNotes: metodoEntrega === 'RETIRO'
          ? 'Retiro en Sucursal / Local San Salvador'
          : `Envío a domicilio - Departamento: ${departamento}, Municipio: ${municipio}. Ref: ${referencia || 'Sin referencias específicas'}`,
        status: 'PENDING_PREPARATION', // Llega directo a Bodega para preparar
        vendedor: 'Tienda Online Aromaniak',
        cliente: {
          nombre,
          telefono,
          correo: email || undefined,
          direccion: direccionFinal,
          numDocumento: numDoc || undefined,
          nrc: nrc || undefined,
          actividadEconomica: giro || undefined
        },
        items: cart.map((it) => ({
          productId: it.product.id,
          name: `${it.product.name} (${it.presentationName})`,
          quantity: it.quantity,
          price: it.unitPrice,
          total: it.totalPrice,
          unit: it.presentation,
          puesto: it.product.puesto
        }))
      };


      // 2. Intentar registrar cliente en la lista
      try {
        const existingCustomers = getStoredCustomers();
        const exists = existingCustomers.find(c => c.phone === telefono || (numDoc && c.numDocumento === numDoc));
        if (!exists) {
          const newCust: CustomerRecord = {
            id: `cli-${Date.now()}`,
            tipoPersona: tipoComprobante === '03' ? 'JURIDICA' : 'NATURAL',
            name: nombre,
            tipoDocumento: tipoComprobante === '03' ? 'NIT' : 'DUI',
            numDocumento: numDoc || '00000000-0',
            email: email || '',
            phone: telefono,
            departamento: metodoEntrega === 'RETIRO' ? 'San Salvador' : departamento,
            municipio: metodoEntrega === 'RETIRO' ? 'San Salvador' : municipio,
            direccion: direccionFinal,
            documentoPreferido: tipoComprobante,
            nrc: nrc || undefined,
            actividadEconomica: giro || undefined,
            createdAt: now
          };
          saveStoredCustomers([newCust, ...existingCustomers]);
        }
      } catch (e) {}

      // Guardar pedido permanentemente en Supabase y descontar inventario
      const orderRes = await fetch('/api/ecommerce/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customerId: customer?.id || null,
          customerName: nombre,
          customerEmail: email || null,
          customerPhone: telefono,
          department: metodoEntrega === 'RETIRO' ? 'San Salvador' : departamento,
          municipality: metodoEntrega === 'RETIRO' ? 'San Salvador' : municipio,
          shippingAddress: direccionFinal,
          deliveryReference: metodoEntrega === 'RETIRO' ? 'Retiro en Sucursal' : (referencia || 'N/A'),
          subtotal,
          shippingCost,
          total: totalConEnvio,
          paymentMethod: metodoPago,
          items: cart.map(it => ({
            productId: it.product.id,
            productName: it.product.name,
            presentation: it.presentationName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            total: it.totalPrice,
          })),
          notes: `Entrega: ${metodoEntrega === 'RETIRO' ? 'Retiro en Local San Salvador' : 'Envío a Domicilio'} - Doc: ${tipoComprobante}`,
          numDoc: numDoc || null,
          nrc: nrc || null,
          giro: giro || null,
          tipoComprobante: tipoComprobante || '01',
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'No fue posible confirmar el pedido');
      }

      // Si el cliente paga con Tarjeta, generamos el enlace bancario de Wompi y lo redireccionamos
      if (metodoPago === 'CARD') {
        const wompiRes = await fetch('/api/wompi/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.order?.id,
            orderNumber: orderNumber,
            amount: totalConEnvio,
            customerEmail: email || customer?.email,
            customerName: nombre,
            customerPhone: telefono,
          }),
        });

        const wompiData = await wompiRes.json();
        if (!wompiRes.ok || !wompiData.success || !wompiData.urlEnlace) {
          // Si falló la creación del enlace de Wompi, marcamos o cancelamos el pedido huérfano
          if (orderData.order?.id) {
            try {
              await fetch('/api/ecommerce/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderData.order.id,
                  orderStatus: 'CANCELADO',
                  paymentStatus: 'REJECTED',
                }),
              });
            } catch (cleanupErr) {
              console.error('Error limpiando pedido fallido:', cleanupErr);
            }
          }
          throw new Error(wompiData.error || 'No se pudo generar la pasarela segura de Wompi');
        }

        clearCart();
        // Redireccionar al usuario a la pantalla oficial de pago de Wompi / Banco Agrícola
        window.location.href = wompiData.urlEnlace;
        return;
      }

      // Limpiar carrito del cliente para pedidos por transferencia
      clearCart();
      setCompletedOrder(newOrder);
    } catch (error: any) {
      console.error('Error procesando pedido online:', error);
      alert(error.message || 'Hubo un inconveniente al procesar tu pedido. Por favor verifica las existencias o escríbenos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de Pedido Confirmado / Pendiente de Transferencia
  if (completedOrder) {
    const isTransfer = completedOrder.paymentMethod === 'TRANSFER';

    const whatsappTransferMessage = encodeURIComponent(
      `👋 ¡Hola Aromaniak!\n\n` +
      `Acabo de realizar mi pedido en línea y pagaré por *Transferencia Bancaria*:\n\n` +
      `📦 *Orden:* #${completedOrder.orderNumber}\n` +
      `👤 *Cliente:* ${completedOrder.cliente.nombre}\n` +
      `📱 *Teléfono:* ${completedOrder.cliente.telefono}\n` +
      `📍 *Modalidad:* ${metodoEntrega === 'RETIRO' ? 'Retiro en Sucursal' : 'Envío a Domicilio'}\n` +
      `🏠 *Destino:* ${completedOrder.cliente.direccion}\n\n` +
      `🛍️ *Detalle del Pedido:*\n` +
      completedOrder.items.map(it => `• ${it.quantity}x ${it.name} - $${it.total.toFixed(2)}`).join('\n') +
      `\n\n` +
      `*Total a Transferir:* $${completedOrder.total.toFixed(2)}\n\n` +
      `📎 *Adjunto mi comprobante de transferencia bancaria para validación.* ¡Muchas gracias!`
    );

    const whatsappCardMessage = encodeURIComponent(
      `👋 ¡Hola Aromaniak!\n\n` +
      `Acabo de realizar mi pedido con *Tarjeta*:\n\n` +
      `📦 *Orden:* #${completedOrder.orderNumber}\n` +
      `👤 *Cliente:* ${completedOrder.cliente.nombre}\n` +
      `📱 *Teléfono:* ${completedOrder.cliente.telefono}\n` +
      `📍 *Modalidad:* ${metodoEntrega === 'RETIRO' ? 'Retiro en Sucursal' : 'Envío a Domicilio'}\n` +
      `🏠 *Destino:* ${completedOrder.cliente.direccion}\n\n` +
      `🛍️ *Productos:*\n` +
      completedOrder.items.map(it => `• ${it.quantity}x ${it.name} - $${it.total.toFixed(2)}`).join('\n') +
      `\n\n*Total:* $${completedOrder.total.toFixed(2)}\n\n` +
      `¡Quedo atento a la entrega!`
    );

    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 space-y-5 animate-in fade-in duration-300">
        
        {/* Barra superior a la altura normal del inicio de página */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la tienda</span>
          </Link>
          <span className="clay-badge text-xs font-mono font-black text-indigo-700 bg-white">
            Orden #{completedOrder.orderNumber}
          </span>
        </div>

        {/* Encabezado y Acción Principal */}
        <div className="clay-card p-6 sm:p-8 text-center space-y-4 bg-white/95">
          
          <div className="flex justify-center">
            <span className={`clay-badge text-xs font-extrabold px-3.5 py-1.5 rounded-full ${
              isTransfer 
                ? 'text-amber-800 bg-amber-100/90' 
                : 'text-emerald-800 bg-emerald-100/90'
            }`}>
              {isTransfer ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Pedido Pendiente de Verificación</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pedido Confirmado</span>
                </>
              )}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isTransfer ? '¡Pedido Registrado!' : '¡Pedido Recibido con Éxito!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-medium leading-relaxed">
              {isTransfer ? (
                <>
                  Transfiere <strong className="text-indigo-700 font-black">${completedOrder.total.toFixed(2)}</strong> y envía tu comprobante por WhatsApp para preparar y despachar tu orden.
                </>
              ) : (
                <>
                  Gracias por tu compra, <strong>{completedOrder.cliente.nombre}</strong>. Tu comanda ya está en preparación.
                </>
              )}
            </p>
          </div>

          {/* BOTÓN DE WHATSAPP ARRIBA - CENTRADO Y CON ESTILO CLAYMORFISTA */}
          <div className="pt-2 pb-1 flex flex-col items-center justify-center gap-2">
            {isTransfer ? (
              <a
                href={`https://wa.me/50378339470?text=${whatsappTransferMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="clay-btn clay-btn-success px-7 py-3 rounded-2xl font-black text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>ENVIAR COMPROBANTE POR WHATSAPP</span>
              </a>
            ) : (
              <a
                href={`https://wa.me/50378339470?text=${whatsappCardMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="clay-btn clay-btn-success px-7 py-3 rounded-2xl font-black text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Notificar por WhatsApp (7833-9470)</span>
              </a>
            )}
            <p className="text-[11px] text-slate-500 font-medium">
              WhatsApp oficial de validación: <strong className="text-slate-700 font-bold">7833-9470</strong>
            </p>
          </div>

          {/* Cuentas Bancarias Disponibles si es transferencia */}
          {isTransfer && (
            <div className="pt-3 border-t border-slate-100 text-left space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cuentas para Transferir</span>
                </span>
                <span className="text-[10.5px] font-bold text-slate-500">
                  Titular: <strong className="text-slate-800">Aromaniak El Salvador</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Banco Agrícola */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between gap-2 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(0,0,0,0.03)]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-700">Banco Agrícola</span>
                      <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">Ahorro</span>
                    </div>
                    <p className="font-mono font-black text-slate-900 text-xs mt-1 select-all">
                      300-478921-0
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount('300-478921-0', 'agricola')}
                    className="clay-btn clay-btn-light w-full py-1 text-[11px] font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedBank === 'agricola' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copiar cuenta</span>
                      </>
                    )}
                  </button>
                </div>

                {/* BAC Credomatic */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between gap-2 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(0,0,0,0.03)]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-rose-600">BAC Credomatic</span>
                      <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">Ahorro</span>
                    </div>
                    <p className="font-mono font-black text-slate-900 text-xs mt-1 select-all">
                      201-839210
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount('201-839210', 'bac')}
                    className="clay-btn clay-btn-light w-full py-1 text-[11px] font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedBank === 'bac' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copiar cuenta</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Banco Cuscatlán */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between gap-2 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(0,0,0,0.03)]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-700">Banco Cuscatlán</span>
                      <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">Corriente</span>
                    </div>
                    <p className="font-mono font-black text-slate-900 text-xs mt-1 select-all">
                      024-109283-7
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount('024-109283-7', 'cuscatlan')}
                    className="clay-btn clay-btn-light w-full py-1 text-[11px] font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedBank === 'cuscatlan' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copiar cuenta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resumen Compacto */}
          <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-left">
            <div className="flex justify-between text-slate-600">
              <span>Entrega:</span>
              <span className="font-bold text-slate-900 truncate max-w-xs">{completedOrder.cliente.direccion}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Forma de pago:</span>
              <span className="font-bold text-slate-900">
                {isTransfer ? 'Transferencia Bancaria' : 'Tarjeta de Crédito / Débito'}
              </span>
            </div>
            <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-100">
              <span>Total:</span>
              <span className="text-indigo-700 font-mono font-black text-sm">${completedOrder.total.toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* Botón inferior Volver a la Tienda */}
        <div className="text-center pt-1">
          <Link
            href="/"
            className="clay-btn clay-btn-light px-5 py-2 text-xs font-bold rounded-xl active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </Link>
        </div>

      </div>
    );
  }

  // Si el carrito está vacío
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Tu carrito está vacío</h2>
        <p className="text-xs text-slate-500">
          Agrega tus fragancias favoritas antes de proceder al pago seguro.
        </p>
        <Link
          href="/"
          className="clay-btn clay-btn-primary px-6 py-2.5 text-xs font-black rounded-xl inline-flex items-center gap-2 mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explorar Catálogo</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 space-y-6">
      
      {/* Botón de volver */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Seguir comprando</span>
        </Link>
        <span className="text-xs font-bold text-slate-400">
          Paso 2 de 2 • Pago Seguro
        </span>
      </div>

      {/* Banner de Estado de Autenticación / Google Login (delgado y compacto) */}
      {isLoggedIn && customer ? (
        <div className="clay-card py-2 px-3.5 sm:px-4 bg-emerald-50/80 border border-emerald-200/80 shadow-2xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              ✓
            </div>
            <p className="text-xs font-bold text-slate-800 truncate">
              Sesión iniciada como <span className="text-emerald-700 font-extrabold">{customer.name}</span>
            </p>
          </div>
          <span className="clay-badge bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0">
            {customer.authProvider === 'google' ? 'Google' : 'Registrado'}
          </span>
        </div>
      ) : (
        <div className="clay-card py-2 px-3.5 sm:px-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/60 border border-indigo-100/70 shadow-2xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center shadow-xs border border-slate-100 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-800 truncate">
              ¿Tienes cuenta? <span className="font-medium text-slate-500 hidden sm:inline">Inicia sesión para autocompletar tus datos</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="clay-btn clay-btn-primary px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            Continuar con Google
          </button>
        </div>
      )}

      {/* Símbolos de Pago Seguro, Visa y Mastercard (abajo, uno a la par de otro) */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 py-1">
        {/* 1. Símbolo de Pago Seguro */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-800 text-xs font-bold shadow-2xs h-[34px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pago 100% Seguro</span>
        </div>

        {/* 2. Símbolo de Visa */}
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs h-[34px]" title="Visa">
          <svg className="h-3.5 sm:h-4 w-auto" viewBox="0 0 66 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24.5 1.5L16.2 18.5H10.8L6.6 4.8C6.3 3.8 6.1 3.4 5.3 3C4.1 2.3 2.1 1.7 0.5 1.4L0.6 0.8H9.2C10.3 0.8 11.3 1.5 11.5 2.8L13.6 13.7L18.8 0.8H24.5V1.5ZM45.8 12.8C45.8 8 39 7.7 39 5.5C39 4.8 39.7 4.1 41.1 3.9C41.8 3.8 43.8 3.7 45.8 4.7L46.6 0.9C45.5 0.5 44 0 42.2 0C37.1 0 33.5 2.7 33.5 6.6C33.5 9.5 36.1 11.1 38 12.1C40 13.1 40.7 13.7 40.7 14.6C40.7 15.9 39.1 16.5 37.7 16.5C35.1 16.5 33.5 15.8 32.3 15.2L31.4 19.3C32.7 19.9 35 20.4 37.3 20.4C42.8 20.4 45.8 17.7 45.8 12.8ZM59.5 18.5H64.3L60.1 0.8H55.9C54.9 0.8 54.1 1.4 53.8 2.2L46 18.5H51.2L52.2 15.7H58.6L59.5 18.5ZM53.6 11.8L56.3 4.5L57.8 11.8H53.6ZM32.4 0.8L28.2 18.5H23.3L27.5 0.8H32.4Z" fill="#1434CB"/>
          </svg>
        </div>

        {/* 3. Símbolo de Mastercard */}
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs h-[34px]" title="Mastercard">
          <svg className="h-4 sm:h-5 w-auto" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#EB001B"/>
            <circle cx="24" cy="12" r="10" fill="#F79E1B"/>
            <path d="M18 4.8A9.95 9.95 0 0 0 14.5 12c0 2.8 1.1 5.3 2.9 7.1a9.95 9.95 0 0 0 7.1-7.1c0-2.8-1.1-5.3-2.9-7.1C18.4 4.6 18.2 4.7 18 4.8Z" fill="#FF5F00"/>
          </svg>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= COLUMNA IZQUIERDA: FORMULARIOS ================= */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. Modalidad de Entrega, Datos de Contacto y Dirección */}
            <div className="clay-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Modalidad de Entrega y Contacto
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Cobertura 100% El Salvador
                </span>
              </div>

              {/* Selector de Método de Entrega Claymórfico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Botón Envío a Domicilio */}
                <button
                  type="button"
                  onClick={() => setMetodoEntrega('ENVIO')}
                  className={`relative p-3.5 sm:p-4 rounded-2xl text-left flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-all duration-300 ease-out active:scale-[0.97] ${
                    metodoEntrega === 'ENVIO'
                      ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border-2 border-indigo-500 shadow-[5px_7px_18px_rgba(99,102,241,0.25),-4px_-4px_12px_rgba(255,255,255,0.95),inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),inset_-2px_-2px_5px_rgba(99,102,241,0.15)] scale-[1.01]'
                      : 'bg-slate-50/90 border border-white/80 shadow-[4px_6px_14px_rgba(164,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.95),inset_1px_1px_2px_rgba(255,255,255,0.9)] hover:bg-white hover:border-slate-200/80 hover:shadow-[6px_8px_18px_rgba(164,177,198,0.32),-5px_-5px_12px_rgba(255,255,255,1)] hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        metodoEntrega === 'ENVIO'
                          ? 'bg-indigo-600 text-white shadow-[2px_3px_8px_rgba(99,102,241,0.45),inset_1px_1px_2px_rgba(255,255,255,0.4)] scale-110'
                          : 'bg-white text-indigo-600 shadow-[2px_3px_6px_rgba(164,177,198,0.3),inset_1px_1px_2px_rgba(255,255,255,0.9)]'
                      }`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-xs block">Envío a Domicilio</span>
                        <span className="text-[10px] font-bold text-indigo-600">Cobertura Nacional C807</span>
                      </div>
                    </div>

                    {/* Indicador de Selección Claymórfico */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      metodoEntrega === 'ENVIO'
                        ? 'bg-indigo-600 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.2)]'
                        : 'border-2 border-slate-300 bg-white shadow-inner'
                    }`}>
                      {metodoEntrega === 'ENVIO' && (
                        <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50 duration-200" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Entregamos en <strong className="text-slate-800 font-bold">absolutamente todas partes de El Salvador</strong> (C807).
                  </p>
                </button>

                {/* Botón Retiro en Sucursal */}
                <button
                  type="button"
                  onClick={() => setMetodoEntrega('RETIRO')}
                  className={`relative p-3.5 sm:p-4 rounded-2xl text-left flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-all duration-300 ease-out active:scale-[0.97] ${
                    metodoEntrega === 'RETIRO'
                      ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 border-2 border-emerald-500 shadow-[5px_7px_18px_rgba(16,185,129,0.25),-4px_-4px_12px_rgba(255,255,255,0.95),inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),inset_-2px_-2px_5px_rgba(16,185,129,0.15)] scale-[1.01]'
                      : 'bg-slate-50/90 border border-white/80 shadow-[4px_6px_14px_rgba(164,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.95),inset_1px_1px_2px_rgba(255,255,255,0.9)] hover:bg-white hover:border-slate-200/80 hover:shadow-[6px_8px_18px_rgba(164,177,198,0.32),-5px_-5px_12px_rgba(255,255,255,1)] hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        metodoEntrega === 'RETIRO'
                          ? 'bg-emerald-600 text-white shadow-[2px_3px_8px_rgba(16,185,129,0.45),inset_1px_1px_2px_rgba(255,255,255,0.4)] scale-110'
                          : 'bg-white text-emerald-600 shadow-[2px_3px_6px_rgba(164,177,198,0.3),inset_1px_1px_2px_rgba(255,255,255,0.9)]'
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-xs block">Retiro en Sucursal</span>
                        <span className="text-[10px] font-bold text-emerald-600">Local San Salvador • ¡Gratis!</span>
                      </div>
                    </div>

                    {/* Indicador de Selección Claymórfico */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      metodoEntrega === 'RETIRO'
                        ? 'bg-emerald-600 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.2)]'
                        : 'border-2 border-slate-300 bg-white shadow-inner'
                    }`}>
                      {metodoEntrega === 'RETIRO' && (
                        <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50 duration-200" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Pasa a retirar gratis en nuestro local en <strong className="text-slate-800 font-bold">San Salvador</strong>.
                  </p>
                </button>
              </div>

              {/* Cuadro de Tiempos de Envío y Despacho (únicamente si seleccionó Envío a Domicilio) */}
              {metodoEntrega === 'ENVIO' && (
                <div className="py-2.5 px-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100/80 text-xs text-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(99,102,241,0.06)]">
                  <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <p className="text-[11.5px] text-slate-600 leading-snug">
                    <strong className="text-slate-900 font-bold">Entrega de 24 a 48 horas</strong> a todo el país (C807).
                    <span className="text-slate-500 text-[11px] ml-1">Despachos de lunes a sábado (domingos no laborables).</span>
                  </p>
                </div>
              )}

              {/* Formulario de contacto y destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carmen Santos de López"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="clay-input w-full font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Teléfono / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="7000-0000"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="clay-input w-full font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="carmen@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="clay-input w-full font-medium"
                  />
                </div>

                {metodoEntrega === 'ENVIO' ? (
                  <>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Departamento <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={departamento}
                        onChange={(e) => {
                          const newDept = e.target.value;
                          setDepartamento(newDept);
                          const munis = getMunicipiosByDepartamento(newDept);
                          if (munis.length > 0) {
                            setMunicipio(munis[0].nombre);
                          }
                        }}
                        className="clay-input w-full font-bold"
                      >
                        {DEPARTAMENTOS_CATALOG.map((dep) => (
                          <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Municipio / Distrito <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={municipio}
                        onChange={(e) => setMunicipio(e.target.value)}
                        className="clay-input w-full font-bold"
                      >
                        {getMunicipiosByDepartamento(departamento).map((m) => (
                          <option key={m.id} value={m.nombre}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">
                        Dirección Exacta de Entrega <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Colonia, Calle, Pasaje, Número de Casa o Edificio..."
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="clay-input w-full font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">
                        Puntos de Referencia para el Repartidor
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Frente a parque infantil, portón negro con timbre blanco..."
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        className="clay-input w-full font-medium"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <p className="font-black flex items-center gap-1.5 text-emerald-800">
                      <Store className="w-4 h-4" />
                      <span>Retiro en Local Aromaniak (San Salvador)</span>
                    </p>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Tu pedido será preparado en nuestro punto de San Salvador sin costo de envío. Te notificaremos vía WhatsApp al <strong>{telefono || 'número proporcionado'}</strong> en cuanto esté listo para retirar.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Método de Pago */}
            <div className="clay-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Forma de Pago
                  </h3>
                </div>
                <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Pago seguro en línea o transferencia
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Botón Tarjeta */}
                <button
                  type="button"
                  onClick={() => setMetodoPago('CARD')}
                  className={`relative p-3.5 sm:p-4 rounded-2xl text-left flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-all duration-300 ease-out active:scale-[0.97] ${
                    metodoPago === 'CARD'
                      ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border-2 border-indigo-500 shadow-[5px_7px_18px_rgba(99,102,241,0.25),-4px_-4px_12px_rgba(255,255,255,0.95),inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),inset_-2px_-2px_5px_rgba(99,102,241,0.15)] scale-[1.01]'
                      : 'bg-slate-50/90 border border-white/80 shadow-[4px_6px_14px_rgba(164,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.95),inset_1px_1px_2px_rgba(255,255,255,0.9)] hover:bg-white hover:border-slate-200/80 hover:shadow-[6px_8px_18px_rgba(164,177,198,0.32),-5px_-5px_12px_rgba(255,255,255,1)] hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        metodoPago === 'CARD'
                          ? 'bg-indigo-600 text-white shadow-[2px_3px_8px_rgba(99,102,241,0.45),inset_1px_1px_2px_rgba(255,255,255,0.4)] scale-110'
                          : 'bg-white text-indigo-600 shadow-[2px_3px_6px_rgba(164,177,198,0.3),inset_1px_1px_2px_rgba(255,255,255,0.9)]'
                      }`}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-xs block">Tarjeta Crédito / Débito (Wompi)</span>
                        <span className="text-[10px] font-bold text-indigo-600">Visa, Mastercard, Puntos y Cuotas</span>
                      </div>
                    </div>

                    {/* Indicador de Selección Claymórfico */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      metodoPago === 'CARD'
                        ? 'bg-indigo-600 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.2)]'
                        : 'border-2 border-slate-300 bg-white shadow-inner'
                    }`}>
                      {metodoPago === 'CARD' && (
                        <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50 duration-200" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Pasarela segura de <strong className="text-slate-800 font-bold">Wompi / Banco Agrícola</strong> con protección 3D Secure.
                  </p>
                </button>

                {/* Botón Transferencia Bancaria */}
                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFER')}
                  className={`relative p-3.5 sm:p-4 rounded-2xl text-left flex flex-col justify-between gap-2.5 cursor-pointer select-none transition-all duration-300 ease-out active:scale-[0.97] ${
                    metodoPago === 'TRANSFER'
                      ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border-2 border-indigo-500 shadow-[5px_7px_18px_rgba(99,102,241,0.25),-4px_-4px_12px_rgba(255,255,255,0.95),inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),inset_-2px_-2px_5px_rgba(99,102,241,0.15)] scale-[1.01]'
                      : 'bg-slate-50/90 border border-white/80 shadow-[4px_6px_14px_rgba(164,177,198,0.25),-4px_-4px_10px_rgba(255,255,255,0.95),inset_1px_1px_2px_rgba(255,255,255,0.9)] hover:bg-white hover:border-slate-200/80 hover:shadow-[6px_8px_18px_rgba(164,177,198,0.32),-5px_-5px_12px_rgba(255,255,255,1)] hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        metodoPago === 'TRANSFER'
                          ? 'bg-indigo-600 text-white shadow-[2px_3px_8px_rgba(99,102,241,0.45),inset_1px_1px_2px_rgba(255,255,255,0.4)] scale-110'
                          : 'bg-white text-indigo-600 shadow-[2px_3px_6px_rgba(164,177,198,0.3),inset_1px_1px_2px_rgba(255,255,255,0.9)]'
                      }`}>
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-xs block">Transferencia Bancaria</span>
                        <span className="text-[10px] font-bold text-indigo-600">Agrícola, BAC o Cuscatlán</span>
                      </div>
                    </div>

                    {/* Indicador de Selección Claymórfico */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      metodoPago === 'TRANSFER'
                        ? 'bg-indigo-600 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5),inset_-1px_-1px_2px_rgba(0,0,0,0.2)]'
                        : 'border-2 border-slate-300 bg-white shadow-inner'
                    }`}>
                      {metodoPago === 'TRANSFER' && (
                        <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50 duration-200" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Envía tu comprobante por <strong className="text-slate-800 font-bold">WhatsApp al 7833-9470</strong> para procesar.
                  </p>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                🔒 Por tu seguridad y conveniencia, puedes realizar tu pago con <strong>Tarjeta de Crédito / Débito</strong> o mediante <strong>Transferencia Bancaria</strong> (Agrícola, BAC, Cuscatlán).
              </p>
            </div>

            {/* 3. Comprobante Fiscal */}
            <div className="clay-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Tipo de Comprobante
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">Factura Electrónica DTE</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipoComprobante('01')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tipoComprobante === '01' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Factura de Consumidor Final
                </button>
                <button
                  type="button"
                  onClick={() => setTipoComprobante('03')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tipoComprobante === '03' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Crédito Fiscal (Empresas)
                </button>
              </div>

              {tipoComprobante === '01' ? (
                <div className="text-xs">
                  <label className="font-bold text-slate-700 block mb-1">
                    Número de DUI (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="00000000-0"
                    value={numDoc}
                    onChange={(e) => setNumDoc(e.target.value)}
                    className="clay-input w-full font-mono"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      NRC <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123456-7"
                      value={nrc}
                      onChange={(e) => setNrc(e.target.value)}
                      className="clay-input w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      NIT / Documento <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0614-..."
                      value={numDoc}
                      onChange={(e) => setNumDoc(e.target.value)}
                      className="clay-input w-full font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Giro o Actividad Económica
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Venta de productos..."
                      value={giro}
                      onChange={(e) => setGiro(e.target.value)}
                      className="clay-input w-full"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ================= COLUMNA DERECHA: RESUMEN DEL PEDIDO ================= */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            
            <div className="clay-card p-5 sm:p-6 space-y-4 bg-white/80">
              <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Resumen del Pedido</span>
                <span className="clay-badge text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                  {totalItems} artículo{totalItems === 1 ? '' : 's'}
                </span>
              </h3>

              {/* Lista de productos en checkout */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
                {cart.map((it) => (
                  <div key={it.id} className="pt-2 first:pt-0 flex items-start gap-2.5 text-xs">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/70 shrink-0 flex items-center justify-center">
                      {it.kitDetails ? (
                        <div className="relative w-full h-full p-0.5 bg-gradient-to-br from-amber-50/60 to-purple-50/60">
                          <img
                            src={it.kitDetails.essenceImageUrl || (it.kitDetails.essenceSku ? `/images/esencias/esencia_${String(it.kitDetails.essenceSku).trim()}.webp?v=aroma_official_v3` : `/images/esencias/${it.kitDetails.essenceId}.webp?v=aroma_official_v3`)}
                            alt={it.kitDetails.essenceName || it.product.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = '/images/essence_bottle_blank.webp';
                            }}
                            className="absolute left-0.5 top-0.5 w-6 h-6 rounded object-cover border border-amber-300 z-10"
                          />
                          <img
                            src={it.kitDetails.bottleImageUrl || '/images/botes/bote_100ml_sauvage_degrade_negro.jpg'}
                            alt={it.kitDetails.bottleName}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = '/images/botes/bote_100ml_sauvage_degrade_negro.jpg';
                            }}
                            className="absolute right-0.5 bottom-0.5 w-6 h-6 rounded object-cover border border-slate-300 z-20"
                          />
                        </div>
                      ) : (
                        <img
                          src={getProductImage(it.product)}
                          alt={it.product.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = '/images/essence_bottle_blank.webp';
                          }}
                          className="w-full h-full object-cover object-center"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {it.product.officialName || it.product.name}
                      </p>
                      {it.product.category === 'Esencias para Perfume' && (
                        <p className="text-[10px] text-slate-500 truncate" title={`Inspirado en ${getOriginalPerfumeName(it.product)}`}>
                          Inspirado en {getOriginalPerfumeName(it.product)}
                        </p>
                      )}
                      <p className="text-[10.5px] text-indigo-600 font-semibold">
                        {it.quantity}x {it.presentationName}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      ${it.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cálculos */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos:</span>
                  <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <div className="flex items-center gap-1">
                    {metodoEntrega === 'RETIRO' ? (
                      <>
                        <Store className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Retiro en local (San Salvador):</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Envío nacional C807 ({departamento}):</span>
                      </>
                    )}
                  </div>
                  <span className={`font-bold ${metodoEntrega === 'RETIRO' ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {metodoEntrega === 'RETIRO' ? '¡Gratis!' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total a Pagar:</span>
                  <span className="text-indigo-700 text-lg font-black">${totalConEnvio.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón de Confirmación */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="clay-btn clay-btn-primary w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 !shadow-[3px_5px_15px_rgba(99,102,241,0.4)] disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <span>{metodoPago === 'CARD' ? 'Conectando con Wompi...' : 'Procesando comanda...'}</span>
                ) : (
                  <>
                    <span>
                      {metodoPago === 'CARD' 
                        ? `Pagar con Tarjeta ($${totalConEnvio.toFixed(2)})` 
                        : `Confirmar Pedido ($${totalConEnvio.toFixed(2)})`}
                    </span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Aviso de Maceración y Advertencias de Salud en Checkout (debajo del resumen de pedido) */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-2.5 text-xs text-slate-700 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(99,102,241,0.06)]">
                <Droplets className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Aviso: Nosotros no maceramos ningún perfume.</strong> Nuestras esencias se entregan 100% puras listas para ser combinadas con alcohol especial de perfumería.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-2 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),inset_-1px_-1px_2px_rgba(245,158,11,0.12)]">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Aviso Importante de Seguridad y Uso Responsable</span>
                </div>
                <ul className="space-y-1 pl-4 list-disc text-[11px] text-amber-900/90 font-medium leading-relaxed">
                  <li>
                    <strong>No usar directamente sobre la piel:</strong> Las esencias puras tienen que ser mezcladas sí o sí con alcohol especial de perfumería antes de cualquier aplicación. El máximo recomendado para 100ml es de una onza y una media onza, más de eso no es recomendado.
                  </li>
                  <li>
                    <strong>Bajo ningún motivo deben ser ingeridas, inhaladas directamente o tener contacto con los ojos.</strong>
                  </li>
                  <li>
                    <strong>Uso restringido ante alergias:</strong> No deben ser usadas por personas con antecedentes o experiencias previas de alergia a los perfumes, fragancias, alcohol o sus componentes.
                  </li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </form>

    </div>
  );
}
