'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  FileText,
  Send,
  Building,
  AlertCircle
} from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { DEPARTAMENTOS_SV, CustomerRecord, getStoredCustomers, saveStoredCustomers } from '@/lib/customers';
import { SaleRecord } from '@/lib/store';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, totalItems, clearCart } = useEcommerceCart();
  const { customer, isLoggedIn, openAuthModal } = useCustomerAuth();

  // Datos de Envío
  const [nombre, setNombre] = useState(customer?.name || '');
  const [telefono, setTelefono] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [departamento, setDepartamento] = useState(customer?.department || 'San Salvador');
  const [municipio, setMunicipio] = useState('San Salvador');
  const [direccion, setDireccion] = useState(customer?.address || '');
  const [referencia, setReferencia] = useState('');

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

  // Método de pago
  const [metodoPago, setMetodoPago] = useState<'CASH' | 'TRANSFER' | 'BITCOIN'>('CASH');

  // Tipo de comprobante
  const [tipoComprobante, setTipoComprobante] = useState<'TICKET' | '01' | '03'>('01');
  const [numDoc, setNumDoc] = useState('');
  const [nrc, setNrc] = useState('');
  const [giro, setGiro] = useState('');

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<SaleRecord | null>(null);

  // Cálculo del costo de envío
  const shippingCost = departamento === 'San Salvador' || departamento === 'La Libertad' ? 3.50 : 5.00;
  const totalConEnvio = Number((subtotal + (cart.length > 0 ? shippingCost : 0)).toFixed(2));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      alert('Por favor completa los campos obligatorios: Nombre, Teléfono y Dirección de entrega.');
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
        deliveryNotes: `Departamento: ${departamento}, Municipio: ${municipio}. Ref: ${referencia || 'Sin referencias específicas'}`,
        status: 'PENDING_PREPARATION', // Llega directo a Bodega para preparar
        vendedor: 'Tienda Online Aromaniak',
        cliente: {
          nombre,
          telefono,
          correo: email || undefined,
          direccion: `${direccion}, ${municipio}, ${departamento}`,
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

      // 1. Guardar en localStorage para disponibilidad inmediata en el POS y Bodega
      try {
        const existingSales: SaleRecord[] = JSON.parse(localStorage.getItem('kodelocal_sales') || '[]');
        localStorage.setItem('kodelocal_sales', JSON.stringify([newOrder, ...existingSales]));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Error guardando comanda en storage:', err);
      }

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
            departamento,
            municipio,
            direccion,
            documentoPreferido: tipoComprobante,
            nrc: nrc || undefined,
            actividadEconomica: giro || undefined,
            createdAt: now
          };
          saveStoredCustomers([newCust, ...existingCustomers]);
        }
      } catch (e) {}

      // Guardar pedido permanentemente en Supabase
      try {
        await fetch('/api/ecommerce/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            customerId: customer?.id || null,
            customerName: nombre,
            customerEmail: email || null,
            customerPhone: telefono,
            department: departamento,
            municipality: municipio,
            shippingAddress: direccion,
            deliveryReference: referencia,
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
            notes: `Doc: ${tipoComprobante} - Ref: ${referencia || 'N/A'}`
          })
        });
      } catch (err) {
        console.error('Error guardando pedido en Supabase:', err);
      }

      // Limpiar carrito del cliente
      clearCart();
      setCompletedOrder(newOrder);
    } catch (error) {
      console.error('Error procesando pedido online:', error);
      alert('Hubo un inconveniente al procesar tu pedido. Por favor intenta de nuevo o escríbenos a WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de Pedido Confirmado con Éxito
  if (completedOrder) {
    const whatsappMessage = encodeURIComponent(
      `👋 ¡Hola Aromaniak SV!\n\nAcabo de realizar mi pedido en línea:\n*Orden: #${completedOrder.orderNumber}*\n\n` +
      `*Cliente:* ${completedOrder.cliente.nombre}\n` +
      `*Teléfono:* ${completedOrder.cliente.telefono}\n` +
      `*Dirección:* ${completedOrder.cliente.direccion}\n\n` +
      `*Productos:*\n` +
      completedOrder.items.map(it => `• ${it.quantity}x ${it.name} - $${it.total.toFixed(2)}`).join('\n') +
      `\n\n*Subtotal:* $${completedOrder.subtotal.toFixed(2)}\n` +
      `*Envío:* $${completedOrder.shippingCost?.toFixed(2)}\n` +
      `*Total a Pagar:* $${completedOrder.total.toFixed(2)}\n` +
      `*Método de Pago:* ${completedOrder.paymentMethod === 'CASH' ? 'Pago contra entrega (Efectivo)' : completedOrder.paymentMethod === 'TRANSFER' ? 'Transferencia Bancaria' : 'Bitcoin / Chivo'}\n\n` +
      `Quedo atento a la confirmación de la entrega. ¡Muchas gracias!`
    );

    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4">
        <div className="clay-card p-6 sm:p-10 text-center space-y-6 bg-white/90">
          
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="clay-badge text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
              Comanda #{completedOrder.orderNumber}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              ¡Pedido Recibido con Éxito!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-medium">
              Gracias por tu compra, <strong>{completedOrder.cliente.nombre}</strong>. Tu pedido ya ingresó a nuestra <strong>Bodega</strong> para ser preparado y empaquetado.
            </p>
          </div>

          {/* Resumen del pedido */}
          <div className="clay-card p-4 text-left space-y-2.5 text-xs bg-slate-50/70">
            <div className="flex justify-between font-bold text-slate-700 border-b border-slate-200/70 pb-2">
              <span>Entrega en:</span>
              <span className="text-slate-900 text-right max-w-xs">{completedOrder.cliente.direccion}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-700">
              <span>Forma de pago:</span>
              <span className="text-slate-900">
                {completedOrder.paymentMethod === 'CASH' ? 'Efectivo al recibir' : completedOrder.paymentMethod === 'TRANSFER' ? 'Transferencia bancaria' : 'Chivo Wallet'}
              </span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-2 border-t border-slate-200/70">
              <span>Total a pagar:</span>
              <span className="text-indigo-700 font-mono text-base">${completedOrder.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Botón para abrir WhatsApp con la orden lista */}
          <div className="space-y-3 pt-2">
            <a
              href={`https://wa.me/50370000000?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="clay-btn bg-emerald-600 hover:bg-emerald-700 text-white w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 !shadow-[3px_5px_15px_rgba(16,185,129,0.4)] transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Confirmación por WhatsApp</span>
            </a>

            <Link
              href="/"
              className="clay-btn clay-btn-light w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Tienda</span>
            </Link>
          </div>

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
          Agrega tus fragancias favoritas antes de proceder al checkout.
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
          Paso 2 de 2 • Checkout Seguro
        </span>
      </div>

      {/* Banner de Estado de Autenticación / Google Login */}
      {isLoggedIn && customer ? (
        <div className="clay-card p-4 bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              ✓
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">
                Sesión iniciada como <span className="text-emerald-700">{customer.name}</span> ({customer.email})
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                Tus datos de entrega guardados han sido autocompletados automáticamente.
              </p>
            </div>
          </div>
          <span className="clay-badge bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 hidden sm:inline">
            {customer.authProvider === 'google' ? 'Conectado con Google' : 'Cliente Registrado'}
          </span>
        </div>
      ) : (
        <div className="clay-card p-4 bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/70 border border-indigo-100/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-slate-700 flex items-center justify-center shadow-xs border border-slate-100 shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                ¿Quieres comprar en 1 clic sin llenar formularios?
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Inicia sesión con Google o crea tu cuenta para guardar tus direcciones.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="clay-btn clay-btn-primary px-4 py-2 text-xs font-black rounded-xl whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
          >
            Continuar con Google / Correo
          </button>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= COLUMNA IZQUIERDA: FORMULARIOS ================= */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. Datos de Envío y Contacto */}
            <div className="clay-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Datos de Contacto y Entrega
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Departamento <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    className="clay-input w-full font-bold"
                  >
                    {DEPARTAMENTOS_SV.map((dep) => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Municipio / Distrito <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Santa Tecla, San Salvador..."
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="clay-input w-full font-medium"
                  />
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
              </div>
            </div>

            {/* 2. Método de Pago */}
            <div className="clay-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Forma de Pago
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <label className={`clay-card p-3 flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                  metodoPago === 'CASH' ? 'border-2 border-indigo-500 bg-indigo-50/50' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800">Contra Entrega</span>
                    <input
                      type="radio"
                      name="metodoPago"
                      checked={metodoPago === 'CASH'}
                      onChange={() => setMetodoPago('CASH')}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Paga en efectivo en mano al recibir tu paquete.
                  </p>
                </label>

                <label className={`clay-card p-3 flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                  metodoPago === 'TRANSFER' ? 'border-2 border-indigo-500 bg-indigo-50/50' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800">Transferencia</span>
                    <input
                      type="radio"
                      name="metodoPago"
                      checked={metodoPago === 'TRANSFER'}
                      onChange={() => setMetodoPago('TRANSFER')}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Banco Agrícola, BAC o Cuscatlán al enviar comprobante.
                  </p>
                </label>

                <label className={`clay-card p-3 flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                  metodoPago === 'BITCOIN' ? 'border-2 border-indigo-500 bg-indigo-50/50' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800">Chivo / Bitcoin</span>
                    <input
                      type="radio"
                      name="metodoPago"
                      checked={metodoPago === 'BITCOIN'}
                      onChange={() => setMetodoPago('BITCOIN')}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Pago mediante Lightning Network o Chivo Wallet.
                  </p>
                </label>
              </div>
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
                  {totalItems} items
                </span>
              </h3>

              {/* Lista de productos en checkout */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
                {cart.map((it) => (
                  <div key={it.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {it.product.name}
                      </p>
                      <p className="text-[10.5px] text-indigo-600 font-semibold">
                        {it.quantity}x {it.presentationName}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      ${it.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cálculos */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos:</span>
                  <span className="font-mono font-bold text-slate-800">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <div className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Envío a domicilio ({departamento}):</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">${shippingCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total a Pagar:</span>
                  <span className="font-mono text-indigo-700 text-lg">${totalConEnvio.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón de Confirmación */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="clay-btn clay-btn-primary w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 !shadow-[3px_5px_15px_rgba(99,102,241,0.4)] disabled:opacity-50 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <span>Procesando comanda...</span>
                ) : (
                  <>
                    <span>Confirmar Pedido (${totalConEnvio.toFixed(2)})</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Garantía de satisfacción y fijación Aromaniak</span>
              </div>
            </div>

          </div>

        </div>
      </form>

    </div>
  );
}
