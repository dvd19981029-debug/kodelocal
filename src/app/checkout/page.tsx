'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Building,
  AlertCircle,
  Store,
  AlertTriangle,
  Droplets,
  ShieldCheck,
  Lock,
  Clock,
  Loader2,
  Package,
  ExternalLink,
  Send,
} from 'lucide-react';
import { useEcommerceCart } from '@/context/EcommerceCartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import {
  trackMetaInitiateCheckout,
  trackMetaAddPaymentInfo,
  trackMetaPurchase,
  resolveMetaCatalogId,
} from '@/components/analytics/MarketingScripts';
import { CustomerRecord, getStoredCustomers, saveStoredCustomers } from '@/lib/customers';
import { DEPARTAMENTOS_CATALOG, getMunicipiosByDepartamento } from '@/lib/svTerritory';
import { SaleRecord } from '@/lib/store';
import { getProductImage } from '@/lib/perfumeImages';
import { getInspiracionPerfumeName } from '@/lib/perfumeNames';
import { saveGuestOrder, saveGuestShippingProfile, getGuestShippingProfile } from '@/lib/guestOrderStorage';
import { GiroSearchSelect } from '@/components/common/GiroSearchSelect';
import { isHalloweenPromoProduct } from '@/lib/halloweenPromo';
import { BankAccountsCardsList, OrderTransferReceiptSection } from '@/components/ecommerce/TransferBankAccountsWidget';

type FieldKey =
  | 'nombre'
  | 'telefono'
  | 'email'
  | 'departamento'
  | 'municipio'
  | 'direccion'
  | 'razonSocial'
  | 'nrc'
  | 'numDoc'
  | 'giro'
  | 'direccionFiscal';

const FIELD_DOM_IDS: Record<FieldKey, string> = {
  nombre: 'checkout-nombre',
  telefono: 'checkout-telefono',
  email: 'checkout-email',
  departamento: 'checkout-departamento',
  municipio: 'checkout-municipio',
  direccion: 'checkout-direccion',
  razonSocial: 'checkout-razon-social',
  nrc: 'checkout-nrc',
  numDoc: 'checkout-num-doc',
  giro: 'checkout-giro-wrapper',
  direccionFiscal: 'checkout-direccion-fiscal',
};

export default function CheckoutPage() {
  const { cart, subtotal, rawSubtotal, discountTotal, totalItems, clearCart, syncCartWithLiveCatalog } = useEcommerceCart();
  const { customer, isLoggedIn, openAuthModal, openDrawer, updateCustomerProfile } = useCustomerAuth();

  const formRef = useRef<HTMLFormElement>(null);

  // Sincronizar inventario en vivo al entrar al checkout para depurar cualquier producto agotado
  React.useEffect(() => {
    syncCartWithLiveCatalog();
  }, [syncCartWithLiveCatalog]);

  // Método de entrega: Envío a domicilio o Retiro en sucursal
  const [metodoEntrega, setMetodoEntrega] = useState<'ENVIO' | 'RETIRO'>('ENVIO');

  // Datos de Envío y Contacto (Departamento y Municipio inician sin preseleccionar para evitar envíos erróneos)
  const [nombre, setNombre] = useState(customer?.name || '');
  const [telefono, setTelefono] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [departamento, setDepartamento] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [direccion, setDireccion] = useState(customer?.address || '');
  const [referencia, setReferencia] = useState('');

  // Tipo de comprobante y datos de Crédito Fiscal (CCF)
  const [tipoComprobante, setTipoComprobante] = useState<'TICKET' | '01' | '03'>(
    customer?.nrc || customer?.preferredDoc === '03' ? '03' : '01'
  );
  const [razonSocial, setRazonSocial] = useState(customer?.businessName || customer?.name || '');
  const [numDoc, setNumDoc] = useState(customer?.documentNum || '');
  const [nrc, setNrc] = useState(customer?.nrc || '');
  const [giro, setGiro] = useState(customer?.activityDesc || '');
  const [direccionFiscal, setDireccionFiscal] = useState(customer?.address || '');

  // Errores de validación en línea y anuncio accesible
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitErrorBanner, setSubmitErrorBanner] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const clearFieldError = (key: FieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Actualizar si el cliente inicia sesión o tiene datos guardados en su perfil (sin preseleccionar departamento/municipio)
  React.useEffect(() => {
    if (customer) {
      if (customer.name) setNombre(customer.name);
      if (customer.businessName || customer.name) setRazonSocial(customer.businessName || customer.name);
      if (customer.email) setEmail(customer.email);
      if (customer.phone) setTelefono(customer.phone);
      if (customer.address) {
        setDireccion(customer.address);
        setDireccionFiscal((prev) => prev || customer.address || '');
      }
      if (customer.documentNum) setNumDoc(customer.documentNum);
      if (customer.nrc || customer.preferredDoc === '03') {
        if (customer.nrc) setNrc(customer.nrc);
        setTipoComprobante('03');
      }
      if (customer.activityDesc) setGiro(customer.activityDesc);
    }
  }, [
    customer?.id,
    customer?.documentNum,
    customer?.nrc,
    customer?.activityDesc,
    customer?.businessName,
    customer?.address,
    customer?.phone,
    customer?.name,
    customer?.preferredDoc,
  ]);

  // Cargar datos de contacto guardados previamente si el usuario es invitado (sin preseleccionar departamento/municipio)
  React.useEffect(() => {
    if (!customer) {
      const guestProfile = getGuestShippingProfile();
      if (guestProfile.name) setNombre((prev) => prev || guestProfile.name || '');
      if (guestProfile.businessName || guestProfile.name) {
        setRazonSocial((prev) => prev || guestProfile.businessName || guestProfile.name || '');
      }
      if (guestProfile.phone) setTelefono((prev) => prev || guestProfile.phone || '');
      if (guestProfile.email) setEmail((prev) => prev || guestProfile.email || '');
      if (guestProfile.address) {
        setDireccion((prev) => prev || guestProfile.address || '');
        setDireccionFiscal((prev) => prev || guestProfile.address || '');
      }
      if (guestProfile.reference) setReferencia((prev) => prev || guestProfile.reference || '');
      if (guestProfile.documentNum) setNumDoc((prev) => prev || guestProfile.documentNum || '');
      if (guestProfile.tipoComprobante) {
        setTipoComprobante((prev) => (prev === '01' ? guestProfile.tipoComprobante || prev : prev));
      }
      if (guestProfile.nrc) setNrc((prev) => prev || guestProfile.nrc || '');
      if (guestProfile.activityDesc) setGiro((prev) => prev || guestProfile.activityDesc || '');
      if (guestProfile.metodoEntrega) {
        setMetodoEntrega((prev) => prev || guestProfile.metodoEntrega || 'ENVIO');
      }
    }
  }, [customer]);

  // Preconectar a los dominios de Wompi para acelerar la pasarela bancaria en segundo plano
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const wompiDomains = ['https://id.wompi.sv', 'https://api.wompi.sv', 'https://enlace.wompi.sv'];
      wompiDomains.forEach((domain) => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        document.head.appendChild(link);
      });
    } catch (_) {}
  }, []);

  // Disparar evento estándar Meta Pixel InitiateCheckout al entrar a /checkout con productos en el carrito
  const hasTrackedInitCheckout = React.useRef(false);
  React.useEffect(() => {
    if (!hasTrackedInitCheckout.current && cart.length > 0 && subtotal > 0) {
      hasTrackedInitCheckout.current = true;
      trackMetaInitiateCheckout(cart, subtotal);
    }
  }, [cart, subtotal]);

  // Método de pago: Tarjeta de Crédito/Débito o Transferencia Bancaria
  const [metodoPago, setMetodoPago] = useState<'CARD' | 'TRANSFER'>('CARD');

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wompiStatusText, setWompiStatusText] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<SaleRecord | null>(null);
  const [wompiCancelledNotice, setWompiCancelledNotice] = useState<string | null>(null);

  // Detectar si el usuario regresó de la pasarela de Wompi sin completar el pago
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const isCancelled = params.get('wompi_cancelled') === 'true';
    const num = params.get('orderNumber');
    const orderId = params.get('orderId');

    if (isCancelled && (orderId || num)) {
      fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId || undefined,
          orderNumber: num || undefined,
          orderStatus: 'CANCELADO',
          paymentStatus: 'CANCELLED',
          notes: '[Pago no completado: Usuario regresó de la pasarela de Wompi]',
          restock: true,
        }),
      }).catch((err) => console.error('Error cancelando orden abandonada:', err));

      setWompiCancelledNotice(num ? `Pedido #${num}` : 'Tu intento de pago');
      window.history.replaceState({}, '', '/checkout');
    }
  }, []);

  // Restablecer el botón si el usuario regresa con el botón de atrás del navegador (bfcache)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleReset = () => {
      setIsSubmitting(false);
      setWompiStatusText(null);
    };

    window.addEventListener('pageshow', handleReset);
    window.addEventListener('focus', handleReset);

    return () => {
      window.removeEventListener('pageshow', handleReset);
      window.removeEventListener('focus', handleReset);
    };
  }, []);

  // Desplazar al inicio cuando se complete el pedido
  React.useEffect(() => {
    if (completedOrder && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [completedOrder]);

  // Municipios disponibles únicamente cuando el usuario ya eligió un departamento
  const availableMunicipios = React.useMemo(
    () => (departamento ? getMunicipiosByDepartamento(departamento) : []),
    [departamento]
  );

  // Cálculo del costo de envío: $0 si retira en local; $2.90 envío a domicilio
  const shippingCost = metodoEntrega === 'RETIRO' ? 0 : 2.90;
  const totalConEnvio = Number((subtotal + (cart.length > 0 ? shippingCost : 0)).toFixed(2));

  const validateCheckoutForm = (): boolean => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const orderedKeys: FieldKey[] = [];

    const flag = (key: FieldKey, message: string) => {
      if (!errors[key]) {
        errors[key] = message;
        orderedKeys.push(key);
      }
    };

    if (!nombre.trim()) {
      flag('nombre', 'Ingresa tu nombre completo.');
    }

    const rawPhoneDigits = telefono.replace(/\D/g, '');
    const cleanPhoneDigits =
      rawPhoneDigits.startsWith('503') && rawPhoneDigits.length === 11
        ? rawPhoneDigits.slice(3)
        : rawPhoneDigits;
    if (!telefono.trim()) {
      flag('telefono', 'Ingresa tu número de teléfono o WhatsApp.');
    } else if (cleanPhoneDigits.length !== 8) {
      flag('telefono', 'Ingresa un número válido de El Salvador de 8 dígitos (ej. 7000-0000).');
    }

    if (tipoComprobante === '03' && !email.trim()) {
      flag('email', 'Ingresa tu correo electrónico para recibir tu Crédito Fiscal (CCF).');
    } else if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      flag('email', 'Revisa el formato de tu correo electrónico.');
    }

    if (metodoEntrega === 'ENVIO') {
      if (!departamento) {
        flag('departamento', 'Selecciona tu departamento de entrega.');
      }
      if (!municipio || !availableMunicipios.some((m) => m.nombre === municipio)) {
        flag('municipio', 'Selecciona tu municipio o distrito de entrega.');
      }
      if (!direccion.trim()) {
        flag('direccion', 'Ingresa tu dirección exacta de entrega.');
      }
    }

    if (tipoComprobante === '03') {
      if (!razonSocial.trim()) {
        flag('razonSocial', 'Ingresa la razón social o nombre del contribuyente.');
      }
      if (!nrc.trim()) {
        flag('nrc', 'Ingresa tu número de NRC.');
      }
      if (!numDoc.trim()) {
        flag('numDoc', 'Ingresa tu NIT o DUI de contribuyente.');
      }
      if (!giro.trim()) {
        flag('giro', 'Selecciona tu giro o actividad económica de Hacienda.');
      }
      if (metodoEntrega === 'RETIRO') {
        if (!departamento) {
          flag('departamento', 'Selecciona tu departamento fiscal.');
        }
        if (!municipio || !availableMunicipios.some((m) => m.nombre === municipio)) {
          flag('municipio', 'Selecciona tu municipio o distrito fiscal.');
        }
        if (!(direccionFiscal || direccion).trim()) {
          flag('direccionFiscal', 'Ingresa tu dirección fiscal registrada en Hacienda.');
        }
      }
    }

    setFieldErrors(errors);

    if (orderedKeys.length > 0) {
      const firstKey = orderedKeys[0];
      const firstMsg = errors[firstKey] || 'Por favor revisa los campos marcados.';
      setLiveAnnouncement(firstMsg);

      if (typeof document !== 'undefined') {
        const targetId =
          firstKey === 'departamento' && metodoEntrega === 'RETIRO'
            ? 'checkout-departamento-fiscal'
            : firstKey === 'municipio' && metodoEntrega === 'RETIRO'
            ? 'checkout-municipio-fiscal'
            : FIELD_DOM_IDS[firstKey];

        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const focusable =
            el.matches('input, select, textarea, button')
              ? (el as HTMLElement)
              : (el.querySelector('input, select, textarea, button') as HTMLElement | null);
          focusable?.focus({ preventScroll: true });
        }
      }
      return false;
    }

    return true;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErrorBanner(null);

    if (!validateCheckoutForm()) {
      return;
    }

    if (cart.length === 0) {
      setSubmitErrorBanner('Tu carrito está vacío.');
      return;
    }

    setIsSubmitting(true);
    let countdownTimer: NodeJS.Timeout | null = null;

    if (metodoPago === 'CARD') {
      setWompiStatusText('Redirigiendo a Wompi, por favor espere (5s)...');
      let elapsedMs = 0;
      countdownTimer = setInterval(() => {
        elapsedMs += 500;
        const elapsedSec = elapsedMs / 1000;
        if (elapsedSec < 1) {
          setWompiStatusText('Redirigiendo a Wompi, por favor espere (5s)...');
        } else if (elapsedSec < 2) {
          setWompiStatusText('Redirigiendo a Wompi, por favor espere (4s)...');
        } else if (elapsedSec < 3) {
          setWompiStatusText('Redirigiendo a Wompi, por favor espere (3s)...');
        } else if (elapsedSec < 4) {
          setWompiStatusText('Redirigiendo a Wompi, por favor espere (2s)...');
        } else if (elapsedSec < 5) {
          setWompiStatusText('Redirigiendo a Wompi, por favor espere (1s)...');
        } else if (elapsedSec < 7.5) {
          setWompiStatusText('Cargando ahora...');
        } else {
          setWompiStatusText('Redirigiendo...');
        }
      }, 500);
    }

    try {
      const orderNumber = `WEB-${Math.floor(100000 + Math.random() * 900000)}`;
      const saleId = `sale-${Date.now()}`;
      const now = new Date().toISOString();
      const resolvedDepto =
        metodoEntrega === 'RETIRO' && tipoComprobante !== '03' ? 'San Salvador' : departamento;
      const resolvedMuni =
        metodoEntrega === 'RETIRO' && tipoComprobante !== '03' ? 'San Salvador Centro' : municipio;
      const direccionFinal =
        metodoEntrega === 'RETIRO'
          ? 'Retiro en Local San Salvador (Centro Comercial El Rosal, Calle El Progreso) - Aromaniak'
          : `${direccion}, ${municipio}, ${departamento}`;
      const effectiveClientName =
        tipoComprobante === '03' && razonSocial.trim() ? razonSocial.trim() : nombre.trim();
      const effectiveFiscalAddress = direccionFiscal.trim() || direccion.trim() || direccionFinal;

      const newOrder: SaleRecord = {
        id: saleId,
        saleNumber: orderNumber,
        orderNumber,
        createdAt: now,
        total: totalConEnvio,
        subtotal: subtotal,
        ivaTotal: Number((subtotal - subtotal / 1.13).toFixed(2)),
        paymentMethod: metodoPago,
        tipoComprobante,
        channel: 'ONLINE',
        shippingCost,
        deliveryNotes:
          metodoEntrega === 'RETIRO'
            ? 'Retiro en Sucursal / Centro Comercial El Rosal, Calle El Progreso, San Salvador'
            : `Envío a domicilio - Departamento: ${departamento}, Municipio: ${municipio}. Ref: ${referencia || 'Sin referencias específicas'}`,
        status: 'PENDING_PREPARATION',
        vendedor: 'Tienda Online Aromaniak',
        cliente: {
          nombre: effectiveClientName,
          telefono,
          correo: email.trim().toLowerCase() || undefined,
          direccion: tipoComprobante === '03' ? effectiveFiscalAddress : direccionFinal,
          departamento: resolvedDepto,
          municipio: resolvedMuni,
          numDocumento: numDoc || undefined,
          nrc: nrc || undefined,
          actividadEconomica: giro || undefined,
        },
        items: cart.map((it) => ({
          productId: it.kitDetails?.essenceId || it.product.id,
          name: `${it.product.name} (${it.presentationName})`,
          quantity: it.quantity,
          price: it.unitPrice,
          total: it.totalPrice,
          unit: it.presentationName || it.presentation,
          puesto: it.kitDetails?.essencePuesto || it.product.puesto,
          kitDetails: it.kitDetails || undefined,
          selectedBottle: it.selectedBottle || undefined,
        })),
      };

      // Sincronizar cliente localmente en POS
      try {
        const existingCustomers = getStoredCustomers();
        const normMail = email.trim().toLowerCase();
        const matchIdx = existingCustomers.findIndex(
          (c) =>
            (normMail && c.email && c.email.toLowerCase().trim() === normMail) ||
            (telefono && c.phone === telefono) ||
            (numDoc && c.numDocumento === numDoc)
        );
        const custRecordData: CustomerRecord = {
          id: matchIdx >= 0 ? existingCustomers[matchIdx].id : customer?.id || `cli-${Date.now()}`,
          tipoPersona: tipoComprobante === '03' ? 'JURIDICA' : 'NATURAL',
          name: effectiveClientName,
          nombreComercial: tipoComprobante === '03' ? razonSocial.trim() || nombre.trim() : undefined,
          tipoDocumento: tipoComprobante === '03' ? 'NIT' : 'DUI',
          numDocumento: numDoc || '00000000-0',
          email: normMail || '',
          phone: telefono,
          departamento: resolvedDepto,
          municipio: resolvedMuni,
          direccion: effectiveFiscalAddress,
          documentoPreferido: tipoComprobante,
          nrc: nrc || undefined,
          actividadEconomica: giro || undefined,
          createdAt: matchIdx >= 0 ? existingCustomers[matchIdx].createdAt : now,
        };
        if (matchIdx >= 0) {
          const updatedList = [...existingCustomers];
          updatedList[matchIdx] = { ...updatedList[matchIdx], ...custRecordData };
          saveStoredCustomers(updatedList);
        } else {
          saveStoredCustomers([custRecordData, ...existingCustomers]);
        }
      } catch (_) {}

      // Si el cliente tiene sesión iniciada, actualizar su perfil de cuenta
      if (customer?.id) {
        updateCustomerProfile({
          name: nombre.trim(),
          phone: telefono.trim(),
          documentType: tipoComprobante === '03' ? 'NIT' : 'DUI',
          documentNum: numDoc.trim() || customer.documentNum,
          department: departamento || customer.department,
          municipality: municipio || customer.municipality,
          address: effectiveFiscalAddress,
          businessName:
            tipoComprobante === '03'
              ? razonSocial.trim() || nombre.trim()
              : customer.businessName || '',
          nrc: tipoComprobante === '03' ? nrc.trim() : customer.nrc || '',
          activityDesc: tipoComprobante === '03' ? giro.trim() : customer.activityDesc || '',
          preferredDoc: tipoComprobante,
        }).catch(() => {});
      }

      // Guardar pedido permanentemente en Supabase y descontar inventario
      const orderRes = await fetch('/api/ecommerce/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customer?.sessionToken ? { Authorization: `Bearer ${customer.sessionToken}` } : {}),
        },
        body: JSON.stringify({
          orderNumber,
          sessionToken: customer?.sessionToken || undefined,
          customerId: customer?.id || null,
          customerName: effectiveClientName,
          businessName: tipoComprobante === '03' ? razonSocial.trim() || nombre.trim() : null,
          customerEmail: email.trim().toLowerCase() || null,
          customerPhone: telefono,
          department: resolvedDepto,
          municipality: resolvedMuni,
          shippingAddress: direccionFinal,
          fiscalAddress: effectiveFiscalAddress,
          deliveryReference: metodoEntrega === 'RETIRO' ? 'Retiro en Sucursal' : referencia || 'N/A',
          subtotal,
          shippingCost,
          total: totalConEnvio,
          paymentMethod: metodoPago,
          items: cart.map((it) => {
            const origPrice = it.originalUnitPrice ?? it.unitPrice;
            const finalPrice = it.unitPrice;
            const discountAmt = Number(Math.max(0, origPrice - finalPrice).toFixed(4));
            return {
              productId: it.product.id,
              productName: it.product.name,
              presentation: it.presentationName,
              listPrice: origPrice,
              unitPrice: finalPrice,
              discountAmt: discountAmt,
              quantity: it.quantity,
              total: Number((finalPrice * it.quantity).toFixed(2)),
              kitDetails: it.kitDetails || undefined,
              selectedBottle: it.selectedBottle || undefined,
            };
          }),
          notes: `Entrega: ${
            metodoEntrega === 'RETIRO' ? 'Retiro en Local San Salvador' : 'Envío a Domicilio'
          } - Doc: ${tipoComprobante}`,
          numDoc: numDoc || null,
          nrc: nrc || null,
          giro: giro || null,
          tipoComprobante: tipoComprobante || '01',
        }),
      });

      let orderData: any = null;
      try {
        orderData = await orderRes.json();
      } catch {
        try {
          const verifyRes = await fetch(
            `/api/ecommerce/orders?orderNumber=${encodeURIComponent(orderNumber)}`
          );
          const verifyData = await verifyRes.json();
          const savedMatch = Array.isArray(verifyData?.orders)
            ? verifyData.orders.find((o: any) => o.orderNumber === orderNumber)
            : null;
          if (savedMatch) {
            orderData = { success: true, order: savedMatch };
          }
        } catch (_) {}
      }
      if (!orderData || !orderData.success) {
        throw new Error(orderData?.error || 'No fue posible confirmar el pedido');
      }

      const finalOrderTotal = Number(orderData.order?.total ?? totalConEnvio);
      const finalOrderSubtotal = Number(orderData.order?.subtotal ?? subtotal);
      newOrder.total = finalOrderTotal;
      newOrder.subtotal = finalOrderSubtotal;
      newOrder.ivaTotal = Number((finalOrderSubtotal - finalOrderSubtotal / 1.13).toFixed(2));

      // Propagar inmediatamente el pedido a comanda local
      try {
        const currentSalesRaw = localStorage.getItem('kodelocal_sales');
        const currentSales = currentSalesRaw ? JSON.parse(currentSalesRaw) : [];
        if (!currentSales.some((s: any) => s.saleNumber === newOrder.saleNumber)) {
          const updatedSales = [newOrder, ...currentSales];
          localStorage.setItem('kodelocal_sales', JSON.stringify(updatedSales));
          window.dispatchEvent(new Event('kodelocal_sales_updated'));
        }
      } catch (_) {}

      // Guardar perfil de envío del invitado
      const prevGuest = getGuestShippingProfile();
      saveGuestShippingProfile({
        name: nombre,
        phone: telefono,
        email: email.trim().toLowerCase() || customer?.email,
        department: departamento || prevGuest.department,
        municipality: municipio || prevGuest.municipality,
        address: effectiveFiscalAddress,
        reference: referencia || undefined,
        metodoEntrega,
        documentType: tipoComprobante === '03' ? 'NIT' : 'DUI',
        documentNum: numDoc || undefined,
        tipoComprobante,
        businessName: tipoComprobante === '03' ? razonSocial.trim() || nombre.trim() : undefined,
        nrc: nrc || undefined,
        activityDesc: giro || undefined,
      });

      const finalOrderNumber = orderData.order?.orderNumber || orderNumber;
      const metaItems = cart.map((it) => ({
        productId: resolveMetaCatalogId(it),
        quantity: it.quantity,
        price: it.unitPrice,
      }));

      trackMetaAddPaymentInfo(cart, finalOrderTotal, metodoPago);

      try {
        sessionStorage.setItem(
          `aromaniak_pending_meta_order_${finalOrderNumber}`,
          JSON.stringify({
            orderNumber: finalOrderNumber,
            totalValue: finalOrderTotal,
            items: metaItems,
          })
        );
      } catch (_) {}

      saveGuestOrder({
        orderNumber: finalOrderNumber,
        createdAt: now,
        total: finalOrderTotal,
        subtotal: finalOrderSubtotal,
        shippingCost: shippingCost,
        paymentMethod: metodoPago,
        paymentStatus: 'PENDING',
        orderStatus: 'NUEVO',
        customerName: nombre,
        customerEmail: email || customer?.email,
        customerPhone: telefono,
        shippingAddress: direccionFinal,
        department: resolvedDepto,
        municipality: resolvedMuni,
        deliveryReference: referencia || undefined,
        items: cart.map((it) => ({
          productName: it.product.name,
          inspiredBy: getInspiracionPerfumeName(it.product) || null,
          presentation: it.presentationName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.totalPrice,
        })),
      });

      if (metodoPago === 'CARD') {
        const wompiRes = await fetch('/api/wompi/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.order?.id,
            orderNumber: orderNumber,
            amount: finalOrderTotal,
            customerEmail: email || customer?.email,
            customerName: nombre,
            customerPhone: telefono,
          }),
        });

        const wompiData = await wompiRes.json();
        if (!wompiRes.ok || !wompiData.success || !wompiData.urlEnlace) {
          if (orderData.order?.id) {
            try {
              await fetch('/api/ecommerce/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderData.order.id,
                  orderStatus: 'CANCELADO',
                  paymentStatus: 'CANCELLED',
                  restock: true,
                }),
              });
            } catch (cleanupErr) {
              console.error('Error limpiando pedido fallido:', cleanupErr);
            }
          }
          throw new Error(wompiData.error || 'No se pudo generar la pasarela segura de Wompi');
        }

        if (countdownTimer) clearInterval(countdownTimer);
        setWompiStatusText('Redirigiendo...');

        window.location.href = wompiData.urlEnlace;

        setTimeout(() => {
          setIsSubmitting(false);
          setWompiStatusText(null);
        }, 2500);
        return;
      }

      trackMetaPurchase({
        orderNumber: finalOrderNumber,
        totalValue: totalConEnvio,
        items: metaItems,
      });

      clearCart();
      setCompletedOrder(newOrder);
      setIsSubmitting(false);
      setWompiStatusText(null);
    } catch (error: any) {
      if (countdownTimer) clearInterval(countdownTimer);
      setWompiStatusText(null);
      setIsSubmitting(false);
      console.error('Error procesando pedido online:', error);
      const errMsg = String(error?.message || '');
      if (errMsg.includes('INSUFFICIENT_STOCK')) {
        await syncCartWithLiveCatalog();
        const cleanMsg = errMsg.replace(/^INSUFFICIENT_STOCK:\s*/i, '');
        setSubmitErrorBanner(
          `${cleanMsg} Hemos actualizado tu carrito con las existencias reales disponibles para que puedas continuar.`
        );
      } else {
        setSubmitErrorBanner(
          errMsg || 'Hubo un inconveniente al procesar tu pedido. Por favor verifica tus datos o escríbenos.'
        );
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Pantalla de Pedido Confirmado / Pendiente de Transferencia
  if (completedOrder) {
    const isTransfer = completedOrder.paymentMethod === 'TRANSFER';

    const whatsappCardMessage = encodeURIComponent(
      `👋 ¡Hola Aromaniak!\n\n` +
        `Acabo de realizar mi pedido con *Tarjeta*:\n\n` +
        `📦 *Orden:* #${completedOrder.orderNumber}\n` +
        `👤 *Cliente:* ${completedOrder.cliente.nombre}\n` +
        `📱 *Teléfono:* ${completedOrder.cliente.telefono}\n` +
        `📍 *Modalidad:* ${metodoEntrega === 'RETIRO' ? 'Retiro en Sucursal' : 'Envío a Domicilio'}\n` +
        `🏠 *Destino:* ${completedOrder.cliente.direccion}\n\n` +
        `🛍️ *Productos:*\n` +
        completedOrder.items.map((it) => `• ${it.quantity}x ${it.name} - $${it.total.toFixed(2)}`).join('\n') +
        `\n\n*Total:* $${completedOrder.total.toFixed(2)}\n\n` +
        `¡Quedo atento a la entrega!`
    );

    return (
      <div className="max-w-3xl mx-auto py-4 sm:py-6 space-y-5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la tienda</span>
          </Link>
          <span className="text-xs font-mono font-extrabold text-slate-900 bg-white border border-slate-300 px-3 py-1 rounded-lg">
            Orden #{completedOrder.orderNumber}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border ${
                  isTransfer
                    ? 'text-amber-900 bg-amber-50 border-amber-300'
                    : 'text-emerald-900 bg-emerald-50 border-emerald-300'
                }`}
              >
                {isTransfer ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Pendiente de verificación de transferencia</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pedido confirmado</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {isTransfer ? '¡Pedido registrado!' : '¡Pedido recibido con éxito!'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-800 max-w-lg mx-auto leading-relaxed">
              {isTransfer ? (
                <>
                  Transfiere{' '}
                  <strong className="text-indigo-700 font-extrabold">
                    ${completedOrder.total.toFixed(2)}
                  </strong>{' '}
                  a cualquiera de nuestras cuentas corrientes y envía tu comprobante por{' '}
                  <strong className="text-slate-950">WhatsApp (6043-7496)</strong> o súbelo directamente aquí.
                </>
              ) : (
                <>
                  Gracias por tu compra, <strong className="text-slate-950">{completedOrder.cliente.nombre}</strong>. Tu comanda ya está en preparación.
                </>
              )}
            </p>
          </div>

          {isTransfer ? (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="space-y-2.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-700" />
                  <span>Cuentas empresariales autorizadas</span>
                </h2>
                <BankAccountsCardsList />
              </div>

              <OrderTransferReceiptSection
                orderId={completedOrder.id}
                orderNumber={completedOrder.saleNumber}
                total={completedOrder.total}
                customerName={completedOrder.cliente.nombre}
                initialReceiptUrl={completedOrder.transferReceiptUrl}
                orderNotes={completedOrder.notes}
              />
            </div>
          ) : (
            <div className="pt-2 flex flex-col items-center justify-center gap-2">
              <a
                href={`https://wa.me/50360437496?text=${whatsappCardMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Notificar por WhatsApp (6043-7496)</span>
              </a>
              <p className="text-xs text-slate-700">
                WhatsApp oficial de atención: <strong className="text-slate-950">6043-7496</strong>
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 text-xs space-y-2">
            <div className="flex justify-between gap-4 text-slate-800">
              <span className="shrink-0 font-semibold">Destino:</span>
              <span className="font-bold text-slate-950 text-right">{completedOrder.cliente.direccion}</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-800">
              <span className="font-semibold">Forma de pago:</span>
              <span className="font-bold text-slate-950">
                {isTransfer ? 'Transferencia bancaria' : 'Tarjeta de crédito / débito'}
              </span>
            </div>
            <div className="flex justify-between text-slate-950 font-extrabold pt-2 border-t border-slate-200 text-sm">
              <span>Total:</span>
              <span className="font-mono font-black text-indigo-700 tabular-nums">
                ${completedOrder.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => openDrawer('orders')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Ver mi pedido y envío</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Seguir comprando</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si el carrito está vacío y no se está procesando una redirección a Wompi
  if (cart.length === 0 && !isSubmitting) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-300 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-950">Tu carrito está vacío</h1>
        <p className="text-xs sm:text-sm text-slate-700 font-medium">
          Agrega tus esencias, frascos o insumos antes de continuar al pago.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 mt-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explorar catálogo</span>
        </Link>
      </div>
    );
  }

  const maxDir = referencia.trim() ? Math.max(120, 242 - referencia.trim().length) : 250;
  const maxRef = Math.max(40, Math.min(120, 242 - direccion.trim().length));

  return (
    <div className="max-w-6xl mx-auto py-2 sm:py-4 space-y-6">
      {/* Región accesible para anunciar validaciones sin intrusión visual */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* ================= CABECERA INTEGRADA EN LA PÁGINA (SIN BURBUJAS PASTILLA) ================= */}
      <header className="space-y-3 pb-4 border-b border-slate-300">
        {/* Fila superior: navegación de retorno + sesión de cuenta */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Seguir comprando</span>
          </Link>

          {isLoggedIn && customer ? (
            <div className="inline-flex items-center gap-2 text-xs text-slate-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[220px] sm:max-w-xs">
                Sesión activa: <strong className="font-extrabold text-slate-950">{customer.name}</strong>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 shadow-2xs transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Autocompletar con Google</span>
            </button>
          )}
        </div>

        {/* Título de Checkout + Respaldo Bancario Integrado Directamente en el Lienzo */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pt-1">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              Finalizar compra
            </h1>
            <p className="text-xs sm:text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>
                Pago seguro protegido con 3D Secure y cuentas empresariales verificadas
              </span>
            </p>
          </div>

          {/* Logotipos oficiales directos sobre la página (sin pastillas ni contenedores flotantes) */}
          <div
            className="flex flex-wrap items-center gap-x-3.5 sm:gap-x-4 gap-y-2 pt-0.5"
            aria-label="Medios de pago y bancos respaldados"
          >
            {/* Visa */}
            <svg
              className="h-3.5 sm:h-4 w-auto shrink-0"
              viewBox="0 0 66 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Visa"
            >
              <path
                d="M24.5 1.5L16.2 18.5H10.8L6.6 4.8C6.3 3.8 6.1 3.4 5.3 3C4.1 2.3 2.1 1.7 0.5 1.4L0.6 0.8H9.2C10.3 0.8 11.3 1.5 11.5 2.8L13.6 13.7L18.8 0.8H24.5V1.5ZM45.8 12.8C45.8 8 39 7.7 39 5.5C39 4.8 39.7 4.1 41.1 3.9C41.8 3.8 43.8 3.7 45.8 4.7L46.6 0.9C45.5 0.5 44 0 42.2 0C37.1 0 33.5 2.7 33.5 6.6C33.5 9.5 36.1 11.1 38 12.1C40 13.1 40.7 13.7 40.7 14.6C40.7 15.9 39.1 16.5 37.7 16.5C35.1 16.5 33.5 15.8 32.3 15.2L31.4 19.3C32.7 19.9 35 20.4 37.3 20.4C42.8 20.4 45.8 17.7 45.8 12.8ZM59.5 18.5H64.3L60.1 0.8H55.9C54.9 0.8 54.1 1.4 53.8 2.2L46 18.5H51.2L52.2 15.7H58.6L59.5 18.5ZM53.6 11.8L56.3 4.5L57.8 11.8H53.6ZM32.4 0.8L28.2 18.5H23.3L27.5 0.8H32.4Z"
                fill="#1434CB"
              />
            </svg>

            {/* Mastercard */}
            <svg
              className="h-4 sm:h-[18px] w-auto shrink-0"
              viewBox="0 0 36 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Mastercard"
            >
              <circle cx="12" cy="12" r="10" fill="#EB001B" />
              <circle cx="24" cy="12" r="10" fill="#F79E1B" />
              <path
                d="M18 4.8A9.95 9.95 0 0 0 14.5 12c0 2.8 1.1 5.3 2.9 7.1a9.95 9.95 0 0 0 7.1-7.1c0-2.8-1.1-5.3-2.9-7.1C18.4 4.6 18.2 4.7 18 4.8Z"
                fill="#FF5F00"
              />
            </svg>

            <span className="h-3.5 w-px bg-slate-400 shrink-0" aria-hidden="true" />

            {/* Wompi */}
            <img
              src="/images/banks/wompi.svg"
              alt="Wompi El Salvador"
              className="h-4 sm:h-[17px] w-auto object-contain shrink-0"
            />

            <span className="h-3.5 w-px bg-slate-400 shrink-0" aria-hidden="true" />

            {/* Bancoagrícola (Identidad oficial moderna monocromática) */}
            <img
              src="/images/banks/bancoagricola.svg?v=2026"
              alt="Bancoagrícola"
              className="h-3.5 sm:h-4 w-auto object-contain shrink-0"
            />

            <span className="h-3.5 w-px bg-slate-400 shrink-0" aria-hidden="true" />

            {/* BAC Credomatic */}
            <img
              src="/images/banks/bac.svg"
              alt="BAC Credomatic"
              className="h-3.5 sm:h-4 w-auto object-contain shrink-0"
            />
          </div>
        </div>
      </header>

      {/* Aviso si el usuario regresó de Wompi sin completar pago */}
      {wompiCancelledNotice && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <p className="font-bold text-amber-950">Pago no completado en Wompi</p>
              <p className="text-amber-950 leading-relaxed">
                No se realizó ningún cargo a tu tarjeta y la orden anterior ({wompiCancelledNotice}) fue anulada. Tus productos siguen intactos en el carrito.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWompiCancelledNotice(null)}
            className="text-amber-800 hover:text-amber-950 p-1 rounded text-xs font-bold cursor-pointer shrink-0"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Aviso de error de servidor o inventario */}
      {submitErrorBanner && (
        <div
          role="alert"
          className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs text-rose-950">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{submitErrorBanner}</p>
          </div>
          <button
            type="button"
            onClick={() => setSubmitErrorBanner(null)}
            className="text-rose-700 hover:text-rose-950 p-1 rounded text-xs font-bold cursor-pointer shrink-0"
            aria-label="Cerrar error"
          >
            ✕
          </button>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmitOrder} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ================= COLUMNA IZQUIERDA: SECCIONES DEL CHECKOUT ================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* SECCIÓN 1: ENTREGA, CONTACTO Y DIRECCIÓN */}
            <section className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
              <div className="px-5 sm:px-6 py-4 bg-slate-100/80 border-b border-slate-300/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                    1
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-950">
                    Entrega y datos de contacto
                  </h2>
                </div>
                <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md hidden sm:inline">
                  Cobertura en los 14 departamentos
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {/* Bloque 1A: Modalidad de Entrega */}
                <div className="p-5 sm:p-6 space-y-3.5">
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-900">
                    Modalidad de entrega
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Modalidad de entrega">
                    {/* Opción: Envío a Domicilio */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={metodoEntrega === 'ENVIO'}
                      onClick={() => setMetodoEntrega('ENVIO')}
                      className={`p-4 rounded-xl text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer ${
                        metodoEntrega === 'ENVIO'
                          ? 'border-2 border-indigo-600 bg-indigo-50/45'
                          : 'border border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div className="flex items-center gap-2.5">
                          <Truck
                            className={`w-4 h-4 shrink-0 ${
                              metodoEntrega === 'ENVIO' ? 'text-indigo-700' : 'text-slate-800'
                            }`}
                          />
                          <div>
                            <span className="font-extrabold text-slate-950 text-sm block leading-tight">
                              Envío a domicilio
                            </span>
                            <span className="text-xs font-bold text-indigo-700">
                              Tarifa estándar $2.90
                            </span>
                          </div>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            metodoEntrega === 'ENVIO'
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-slate-400 bg-white'
                          }`}
                        >
                          {metodoEntrega === 'ENVIO' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        Entrega de <strong className="font-bold text-slate-950">24 a 48 horas hábiles</strong> en todo El Salvador (lunes a sábado).
                      </p>
                    </button>

                    {/* Opción: Retiro en Sucursal */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={metodoEntrega === 'RETIRO'}
                      onClick={() => setMetodoEntrega('RETIRO')}
                      className={`p-4 rounded-xl text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer ${
                        metodoEntrega === 'RETIRO'
                          ? 'border-2 border-indigo-600 bg-indigo-50/45'
                          : 'border border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div className="flex items-center gap-2.5">
                          <Store
                            className={`w-4 h-4 shrink-0 ${
                              metodoEntrega === 'RETIRO' ? 'text-indigo-700' : 'text-slate-800'
                            }`}
                          />
                          <div>
                            <span className="font-extrabold text-slate-950 text-sm block leading-tight">
                              Retiro en sucursal
                            </span>
                            <span className="text-xs font-bold text-emerald-700">
                              Sin costo de envío (Gratis)
                            </span>
                          </div>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            metodoEntrega === 'RETIRO'
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-slate-400 bg-white'
                          }`}
                        >
                          {metodoEntrega === 'RETIRO' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        Retira personalmente o envía <strong className="font-bold text-slate-950">PedidosYa / Uber</strong> a C.C. El Rosal, San Salvador.
                      </p>
                    </button>
                  </div>

                  {metodoEntrega === 'RETIRO' && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-300 text-xs text-slate-900 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="font-extrabold text-slate-950">
                          Punto de retiro: Centro Comercial El Rosal, Calle El Progreso, San Salvador
                        </p>
                        <a
                          href="https://maps.app.goo.gl/shtetXTGcPZQpBwY6"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0"
                        >
                          <span>Ver en Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        Te avisaremos desde nuestro WhatsApp oficial (<strong className="font-extrabold text-slate-950">6043-7496</strong>) al teléfono de contacto que ingreses abajo en cuanto tu orden esté lista para retirar. Si envías un repartidor de PedidosYa o Uber, solo indícale el nombre del titular del pedido.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bloque 1B: Datos de Contacto */}
                <div className="p-5 sm:p-6 space-y-4">
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-900">
                    Datos de quien recibe
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="checkout-nombre"
                        className="block text-xs font-bold text-slate-900 mb-1.5"
                      >
                        Nombre completo <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="checkout-nombre"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={75}
                        aria-invalid={fieldErrors.nombre ? 'true' : 'false'}
                        aria-describedby={fieldErrors.nombre ? 'error-nombre' : undefined}
                        placeholder="Ej. Carmen Santos de López"
                        value={nombre}
                        onChange={(e) => {
                          setNombre(e.target.value.slice(0, 75));
                          clearFieldError('nombre');
                        }}
                        className="checkout-field font-semibold"
                      />
                      {fieldErrors.nombre && (
                        <p id="error-nombre" className="mt-1 text-xs font-bold text-rose-700">
                          {fieldErrors.nombre}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-telefono"
                        className="block text-xs font-bold text-slate-900 mb-1.5"
                      >
                        Teléfono / WhatsApp <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="checkout-telefono"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        maxLength={25}
                        aria-invalid={fieldErrors.telefono ? 'true' : 'false'}
                        aria-describedby={fieldErrors.telefono ? 'error-telefono' : undefined}
                        placeholder="7000-0000"
                        value={telefono}
                        onChange={(e) => {
                          setTelefono(e.target.value.slice(0, 25));
                          clearFieldError('telefono');
                        }}
                        className="checkout-field font-semibold"
                      />
                      {fieldErrors.telefono && (
                        <p id="error-telefono" className="mt-1 text-xs font-bold text-rose-700">
                          {fieldErrors.telefono}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-email"
                        className="block text-xs font-bold text-slate-900 mb-1.5"
                      >
                        Correo electrónico{' '}
                        {tipoComprobante === '03' ? (
                          <span className="text-rose-600">*</span>
                        ) : (
                          <span className="font-semibold text-slate-600">(recomendado)</span>
                        )}
                      </label>
                      <input
                        id="checkout-email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required={tipoComprobante === '03'}
                        maxLength={75}
                        aria-invalid={fieldErrors.email ? 'true' : 'false'}
                        aria-describedby={fieldErrors.email ? 'error-email' : undefined}
                        placeholder="carmen@ejemplo.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value.slice(0, 75));
                          clearFieldError('email');
                        }}
                        className="checkout-field font-semibold"
                      />
                      {fieldErrors.email && (
                        <p id="error-email" className="mt-1 text-xs font-bold text-rose-700">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloque 1C: Dirección de Envío (Solo cuando es Envío a Domicilio) */}
                {metodoEntrega === 'ENVIO' && (
                  <div className="p-5 sm:p-6 space-y-4">
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-900">
                      Dirección de entrega
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="checkout-departamento"
                          className="block text-xs font-bold text-slate-900 mb-1.5"
                        >
                          Departamento <span className="text-rose-600">*</span>
                        </label>
                        <select
                          id="checkout-departamento"
                          name="department"
                          required
                          aria-invalid={fieldErrors.departamento ? 'true' : 'false'}
                          aria-describedby={
                            fieldErrors.departamento
                              ? 'checkout-location-warning error-departamento'
                              : 'checkout-location-warning'
                          }
                          value={departamento}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            setDepartamento(newDept);
                            setMunicipio('');
                            clearFieldError('departamento');
                            clearFieldError('municipio');
                          }}
                          className={`checkout-field ${
                            !departamento ? 'text-slate-800 font-semibold' : 'text-slate-950 font-bold'
                          }`}
                        >
                          <option value="" disabled>
                            Selecciona tu departamento
                          </option>
                          {DEPARTAMENTOS_CATALOG.map((dep) => (
                            <option key={dep.id} value={dep.nombre} className="text-slate-950 font-semibold">
                              {dep.nombre}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.departamento && (
                          <p id="error-departamento" className="mt-1 text-xs font-bold text-rose-700">
                            {fieldErrors.departamento}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="checkout-municipio"
                          className="block text-xs font-bold text-slate-900 mb-1.5"
                        >
                          Municipio / Distrito <span className="text-rose-600">*</span>
                        </label>
                        <select
                          id="checkout-municipio"
                          name="municipality"
                          required
                          disabled={!departamento}
                          aria-invalid={fieldErrors.municipio ? 'true' : 'false'}
                          aria-describedby={
                            fieldErrors.municipio
                              ? 'checkout-location-warning error-municipio'
                              : 'checkout-location-warning'
                          }
                          value={municipio}
                          onChange={(e) => {
                            setMunicipio(e.target.value);
                            clearFieldError('municipio');
                          }}
                          className={`checkout-field ${
                            !municipio ? 'text-slate-800 font-semibold' : 'text-slate-950 font-bold'
                          }`}
                        >
                          <option value="" disabled>
                            {departamento
                              ? 'Selecciona tu municipio o distrito'
                              : 'Elige primero tu departamento'}
                          </option>
                          {availableMunicipios.map((m) => (
                            <option key={m.id} value={m.nombre} className="text-slate-950 font-semibold">
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.municipio && (
                          <p id="error-municipio" className="mt-1 text-xs font-bold text-rose-700">
                            {fieldErrors.municipio}
                          </p>
                        )}
                      </div>

                      <div
                        id="checkout-location-warning"
                        role="note"
                        className="sm:col-span-2 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950"
                      >
                        <AlertTriangle
                          className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <p className="font-medium leading-relaxed">
                          <strong className="font-extrabold">Importante:</strong> Verifica que tu departamento y municipio sean correctos. Los paquetes podrían no llegar o retrasarse de ingresarse departamentos o municipios incorrectos en la dirección.
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="checkout-direccion"
                            className="text-xs font-bold text-slate-900"
                          >
                            Dirección exacta de entrega <span className="text-rose-600">*</span>
                          </label>
                          {direccion.length > maxDir - 40 && (
                            <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
                              {direccion.length}/{maxDir}
                            </span>
                          )}
                        </div>
                        <input
                          id="checkout-direccion"
                          name="street-address"
                          type="text"
                          autoComplete="street-address"
                          required
                          maxLength={maxDir}
                          aria-invalid={fieldErrors.direccion ? 'true' : 'false'}
                          aria-describedby={fieldErrors.direccion ? 'error-direccion' : undefined}
                          placeholder="Colonia, calle, pasaje, número de casa o edificio..."
                          value={direccion}
                          onChange={(e) => {
                            setDireccion(e.target.value.slice(0, maxDir));
                            clearFieldError('direccion');
                          }}
                          className="checkout-field font-semibold"
                        />
                        {fieldErrors.direccion && (
                          <p id="error-direccion" className="mt-1 text-xs font-bold text-rose-700">
                            {fieldErrors.direccion}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="checkout-referencia"
                            className="text-xs font-bold text-slate-900"
                          >
                            Puntos de referencia para el repartidor{' '}
                            <span className="font-semibold text-slate-600">(opcional)</span>
                          </label>
                          {referencia.length > maxRef - 30 && (
                            <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
                              {referencia.length}/{maxRef}
                            </span>
                          )}
                        </div>
                        <input
                          id="checkout-referencia"
                          name="address-line2"
                          type="text"
                          autoComplete="address-line2"
                          maxLength={maxRef}
                          placeholder="Ej. Frente a parque infantil, portón negro..."
                          value={referencia}
                          onChange={(e) => setReferencia(e.target.value.slice(0, maxRef))}
                          className="checkout-field font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SECCIÓN 2: FORMA DE PAGO */}
            <section className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
              <div className="px-5 sm:px-6 py-4 bg-slate-100/80 border-b border-slate-300/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                    2
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-950">Forma de pago</h2>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md hidden sm:inline">
                  Transacción protegida
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Forma de pago">
                  {/* Opción: Tarjeta */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={metodoPago === 'CARD'}
                    onClick={() => {
                      setMetodoPago('CARD');
                      trackMetaAddPaymentInfo(cart, totalConEnvio, 'CARD');
                    }}
                    className={`p-4 rounded-xl text-left flex flex-col justify-between gap-2.5 transition-colors cursor-pointer ${
                      metodoPago === 'CARD'
                        ? 'border-2 border-indigo-600 bg-indigo-50/45'
                        : 'border border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5">
                        <CreditCard
                          className={`w-4 h-4 shrink-0 ${
                            metodoPago === 'CARD' ? 'text-indigo-700' : 'text-slate-800'
                          }`}
                        />
                        <div>
                          <span className="font-extrabold text-slate-950 text-sm block leading-tight">
                            Tarjeta crédito o débito
                          </span>
                          <span className="text-xs font-bold text-indigo-700">
                            Visa, Mastercard, puntos y cuotas
                          </span>
                        </div>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          metodoPago === 'CARD'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {metodoPago === 'CARD' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed">
                      Pago inmediato en línea mediante <strong className="font-bold text-slate-950">Wompi (Bancoagrícola)</strong>.
                    </p>
                  </button>

                  {/* Opción: Transferencia */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={metodoPago === 'TRANSFER'}
                    onClick={() => {
                      setMetodoPago('TRANSFER');
                      trackMetaAddPaymentInfo(cart, totalConEnvio, 'TRANSFER');
                    }}
                    className={`p-4 rounded-xl text-left flex flex-col justify-between gap-2.5 transition-colors cursor-pointer ${
                      metodoPago === 'TRANSFER'
                        ? 'border-2 border-indigo-600 bg-indigo-50/45'
                        : 'border border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2.5">
                        <Building
                          className={`w-4 h-4 shrink-0 ${
                            metodoPago === 'TRANSFER' ? 'text-indigo-700' : 'text-slate-800'
                          }`}
                        />
                        <div>
                          <span className="font-extrabold text-slate-950 text-sm block leading-tight">
                            Transferencia bancaria
                          </span>
                          <span className="text-xs font-bold text-indigo-700">
                            Bancoagrícola o BAC Credomatic
                          </span>
                        </div>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          metodoPago === 'TRANSFER'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {metodoPago === 'TRANSFER' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 leading-relaxed">
                      Envía tu comprobante al <strong className="font-bold text-slate-950">6043-7496</strong> o súbelo al confirmar tu orden.
                    </p>
                  </button>
                </div>

                {metodoPago === 'CARD' ? (
                  <div className="flex items-start gap-2.5 pt-3 border-t border-slate-200 text-xs text-slate-800 font-medium leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p>
                      Serás redirigido a la pasarela oficial de <strong className="font-bold text-slate-950">Wompi</strong> (propiedad de <strong className="font-bold text-slate-950">Bancoagrícola</strong>). Aromaniak no almacena ni tiene acceso a los datos de tu tarjeta.
                    </p>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      Puedes transferir a cualquiera de nuestras cuentas corrientes oficiales. Al confirmar el pedido podrás adjuntar la captura o enviarla por WhatsApp.
                    </p>
                    <BankAccountsCardsList />
                  </div>
                )}
              </div>
            </section>

            {/* SECCIÓN 3: COMPROBANTE FISCAL */}
            <section className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
              <div className="px-5 sm:px-6 py-4 bg-slate-100/80 border-b border-slate-300/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                    3
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-950">
                    Tipo de comprobante
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Factura electrónica DTE
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Tipo de comprobante fiscal">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={tipoComprobante === '01'}
                    onClick={() => setTipoComprobante('01')}
                    className={`px-4 py-3 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      tipoComprobante === '01'
                        ? 'border-2 border-indigo-600 bg-indigo-50/45'
                        : 'border border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-slate-950 text-xs sm:text-sm block">
                        Factura Consumidor Final
                      </span>
                      <span className="text-xs font-medium text-slate-700">Persona natural</span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        tipoComprobante === '01'
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-400 bg-white'
                      }`}
                    >
                      {tipoComprobante === '01' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={tipoComprobante === '03'}
                    onClick={() => setTipoComprobante('03')}
                    className={`px-4 py-3 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      tipoComprobante === '03'
                        ? 'border-2 border-indigo-600 bg-indigo-50/45'
                        : 'border border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-slate-950 text-xs sm:text-sm block">
                        Crédito Fiscal (CCF)
                      </span>
                      <span className="text-xs font-medium text-slate-700">Contribuyente inscrito con NRC</span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        tipoComprobante === '03'
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-400 bg-white'
                      }`}
                    >
                      {tipoComprobante === '03' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </button>
                </div>

                {tipoComprobante === '01' ? (
                  <div>
                    <label
                      htmlFor="checkout-dui-opcional"
                      className="block text-xs font-bold text-slate-900 mb-1.5"
                    >
                      Número de DUI <span className="font-semibold text-slate-600">(opcional)</span>
                    </label>
                    <input
                      id="checkout-dui-opcional"
                      name="dui"
                      type="text"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={75}
                      placeholder="00000000-0"
                      value={numDoc}
                      onChange={(e) => setNumDoc(e.target.value.slice(0, 75))}
                      className="checkout-field font-mono font-semibold"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="checkout-razon-social"
                        className="block text-xs font-bold text-slate-900 mb-1.5"
                      >
                        Razón social o nombre según tarjeta de contribuyente{' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="checkout-razon-social"
                        name="organization"
                        type="text"
                        autoComplete="organization"
                        required
                        maxLength={75}
                        aria-invalid={fieldErrors.razonSocial ? 'true' : 'false'}
                        aria-describedby={fieldErrors.razonSocial ? 'error-razon-social' : undefined}
                        placeholder="Ej. Distribuidora Las Fragancias S.A. de C.V."
                        value={razonSocial}
                        onChange={(e) => {
                          setRazonSocial(e.target.value.slice(0, 75));
                          clearFieldError('razonSocial');
                        }}
                        className="checkout-field font-bold"
                      />
                      {fieldErrors.razonSocial && (
                        <p id="error-razon-social" className="mt-1 text-xs font-bold text-rose-700">
                          {fieldErrors.razonSocial}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-nrc"
                        className="block text-xs font-bold text-slate-900 mb-1.5"
                      >
                        NRC <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="checkout-nrc"
                        name="nrc"
                        type="text"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        maxLength={25}
                        aria-invalid={fieldErrors.nrc ? 'true' : 'false'}
                        aria-describedby={fieldErrors.nrc ? 'error-nrc' : undefined}
                        placeholder="123456-7"
                        value={nrc}
                        onChange={(e) => {
                          setNrc(e.target.value.slice(0, 25));
                          clearFieldError('nrc');
                        }}
                        className="checkout-field font-mono font-semibold"
                      />
                      {fieldErrors.nrc && (
                        <p id="error-nrc" className="mt-1 text-xs font-bold text-rose-700">
                          {fieldErrors.nrc}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-num-doc"
                        className="block text-xs font-bold text-slate-900 mb-1.5"
                      >
                        NIT / DUI de contribuyente <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="checkout-num-doc"
                        name="tax-id"
                        type="text"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        maxLength={75}
                        aria-invalid={fieldErrors.numDoc ? 'true' : 'false'}
                        aria-describedby={fieldErrors.numDoc ? 'error-num-doc' : undefined}
                        placeholder="0614-000000-000-0"
                        value={numDoc}
                        onChange={(e) => {
                          setNumDoc(e.target.value.slice(0, 75));
                          clearFieldError('numDoc');
                        }}
                        className="checkout-field font-mono font-semibold"
                      />
                      {fieldErrors.numDoc && (
                        <p id="error-num-doc" className="mt-1 text-xs font-bold text-rose-700">
                          {fieldErrors.numDoc}
                        </p>
                      )}
                    </div>

                    <div id="checkout-giro-wrapper" className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Giro o actividad económica (Catálogo MH CAT-019){' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <GiroSearchSelect
                        value={giro}
                        onChange={(val) => {
                          setGiro(val);
                          clearFieldError('giro');
                        }}
                        required
                        variant="checkout"
                        placeholder="Buscar giro por código o actividad (ej. 47722, cosméticos...)"
                      />
                      {fieldErrors.giro && (
                        <p className="mt-1 text-xs font-bold text-rose-700">{fieldErrors.giro}</p>
                      )}
                    </div>

                    {metodoEntrega === 'RETIRO' && (
                      <>
                        <div>
                          <label
                            htmlFor="checkout-departamento-fiscal"
                            className="block text-xs font-bold text-slate-900 mb-1.5"
                          >
                            Departamento fiscal <span className="text-rose-600">*</span>
                          </label>
                          <select
                            id="checkout-departamento-fiscal"
                            name="fiscal-department"
                            required
                            aria-invalid={fieldErrors.departamento ? 'true' : 'false'}
                            aria-describedby={
                              fieldErrors.departamento ? 'error-depto-fiscal' : undefined
                            }
                            value={departamento}
                            onChange={(e) => {
                              const newDept = e.target.value;
                              setDepartamento(newDept);
                              setMunicipio('');
                              clearFieldError('departamento');
                              clearFieldError('municipio');
                            }}
                            className={`checkout-field ${
                              !departamento ? 'text-slate-800 font-semibold' : 'text-slate-950 font-bold'
                            }`}
                          >
                            <option value="" disabled>
                              Selecciona tu departamento
                            </option>
                            {DEPARTAMENTOS_CATALOG.map((dep) => (
                              <option key={dep.id} value={dep.nombre} className="text-slate-950 font-semibold">
                                {dep.nombre}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.departamento && (
                            <p id="error-depto-fiscal" className="mt-1 text-xs font-bold text-rose-700">
                              {fieldErrors.departamento}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="checkout-municipio-fiscal"
                            className="block text-xs font-bold text-slate-900 mb-1.5"
                          >
                            Municipio / Distrito fiscal <span className="text-rose-600">*</span>
                          </label>
                          <select
                            id="checkout-municipio-fiscal"
                            name="fiscal-municipality"
                            required
                            disabled={!departamento}
                            aria-invalid={fieldErrors.municipio ? 'true' : 'false'}
                            aria-describedby={fieldErrors.municipio ? 'error-muni-fiscal' : undefined}
                            value={municipio}
                            onChange={(e) => {
                              setMunicipio(e.target.value);
                              clearFieldError('municipio');
                            }}
                            className={`checkout-field ${
                              !municipio ? 'text-slate-800 font-semibold' : 'text-slate-950 font-bold'
                            }`}
                          >
                            <option value="" disabled>
                              {departamento
                                ? 'Selecciona tu municipio o distrito'
                                : 'Elige primero tu departamento'}
                            </option>
                            {availableMunicipios.map((m) => (
                              <option key={m.id} value={m.nombre} className="text-slate-950 font-semibold">
                                {m.nombre}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.municipio && (
                            <p id="error-muni-fiscal" className="mt-1 text-xs font-bold text-rose-700">
                              {fieldErrors.municipio}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="checkout-direccion-fiscal"
                        className="block text-xs font-bold text-slate-900 mb-1.5"
                      >
                        Dirección fiscal (según tarjeta NRC) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="checkout-direccion-fiscal"
                        name="fiscal-address"
                        type="text"
                        required={metodoEntrega === 'RETIRO'}
                        maxLength={250}
                        aria-invalid={fieldErrors.direccionFiscal ? 'true' : 'false'}
                        aria-describedby={
                          fieldErrors.direccionFiscal ? 'error-direccion-fiscal' : undefined
                        }
                        placeholder="Colonia, calle, número de local o casa registrada en Hacienda"
                        value={direccionFiscal || direccion}
                        onChange={(e) => {
                          setDireccionFiscal(e.target.value.slice(0, 250));
                          clearFieldError('direccionFiscal');
                        }}
                        className="checkout-field font-semibold"
                      />
                      {fieldErrors.direccionFiscal && (
                        <p
                          id="error-direccion-fiscal"
                          className="mt-1 text-xs font-bold text-rose-700"
                        >
                          {fieldErrors.direccionFiscal}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ================= COLUMNA DERECHA: RESUMEN DEL PEDIDO ================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <aside className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
              <div className="px-5 sm:px-6 py-4 bg-slate-100/80 border-b border-slate-300/80 flex items-center justify-between">
                <h2 className="font-extrabold text-sm sm:text-base text-slate-950">
                  Resumen del pedido
                </h2>
                <span className="text-xs font-extrabold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md tabular-nums">
                  {totalItems} artículo{totalItems === 1 ? '' : 's'}
                </span>
              </div>

              {/* Lista de productos */}
              <div className="px-5 sm:px-6 py-4 max-h-72 overflow-y-auto divide-y divide-slate-200">
                {cart.map((it) => (
                  <div
                    key={it.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 text-xs"
                  >
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-50 border border-slate-300 shrink-0 flex items-center justify-center">
                      {it.kitDetails ? (
                        <div className="relative w-full h-full p-0.5 bg-slate-50">
                          <img
                            src="/images/essence_bottle_blank.webp"
                            alt={it.kitDetails.essenceName || it.product.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = '/images/essence_bottle_blank.webp';
                            }}
                            className="absolute left-0.5 top-0.5 w-6 h-6 rounded object-cover border border-slate-300 z-10"
                          />
                          <img
                            src={
                              it.kitDetails.bottleImageUrl ||
                              '/images/botes/bote_100ml_degrade_azul_noche.jpg'
                            }
                            alt={it.kitDetails.bottleName}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src =
                                '/images/botes/bote_100ml_degrade_azul_noche.jpg';
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
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-extrabold text-slate-950 truncate">
                        {it.product.officialName || it.product.name}
                      </p>
                      {it.product.category === 'Esencias para Perfume' && (
                        <p
                          className="text-xs text-slate-700 font-medium truncate"
                          title={`Inspirado en ${getInspiracionPerfumeName(it.product)}`}
                        >
                          Inspirado en{' '}
                          <strong className="font-bold text-slate-950">
                            {getInspiracionPerfumeName(it.product)}
                          </strong>
                        </p>
                      )}
                      <p className="text-xs text-indigo-700 font-bold">
                        {it.quantity} × {it.presentationName}
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-950 tabular-nums shrink-0">
                      ${it.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desglose y botón principal */}
              <div className="px-5 sm:px-6 py-5 bg-slate-50 border-t border-slate-300/80 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-800 font-semibold">
                    <span>Subtotal productos</span>
                    <span
                      className={`tabular-nums ${
                        discountTotal > 0
                          ? 'font-semibold text-slate-500 line-through'
                          : 'font-extrabold text-slate-950'
                      }`}
                    >
                      ${rawSubtotal.toFixed(2)}
                    </span>
                  </div>

                  {discountTotal > 0 &&
                    (() => {
                      let halloweenPromoDiscount = 0;
                      let vipDiscount = 0;
                      for (const it of cart) {
                        const orig = it.originalUnitPrice ?? it.unitPrice;
                        const itemDisc = Number(
                          (Math.max(0, orig - it.unitPrice) * it.quantity).toFixed(2)
                        );
                        if (!it.kitDetails && isHalloweenPromoProduct(it.product)) {
                          halloweenPromoDiscount = Number(
                            (halloweenPromoDiscount + itemDisc).toFixed(2)
                          );
                        } else {
                          vipDiscount = Number((vipDiscount + itemDisc).toFixed(2));
                        }
                      }

                      const activeTierLabels: string[] = [];
                      const fmtTier = (label: string, t: any, cPct: any) => {
                        if (t?.name === 'Personalizado' && cPct) return `${label}: ${cPct}%`;
                        if (t?.name)
                          return `${label}: ${t.name}${t.discountPct ? ` ${t.discountPct}%` : ''}`;
                        if (cPct && Number(cPct) > 0) return `${label}: ${cPct}%`;
                        return null;
                      };
                      const essLbl = fmtTier('Esencias', customer?.tier, customer?.customDiscountPct);
                      const botLbl = fmtTier(
                        'Botes',
                        customer?.bottleTier,
                        customer?.bottleCustomDiscountPct
                      );
                      const supLbl = fmtTier(
                        'Insumos',
                        customer?.suppliesTier,
                        customer?.suppliesCustomDiscountPct
                      );
                      if (essLbl) activeTierLabels.push(essLbl);
                      if (botLbl) activeTierLabels.push(botLbl);
                      if (supLbl) activeTierLabels.push(supLbl);
                      const discountLabel =
                        activeTierLabels.length > 0
                          ? activeTierLabels.join(' • ')
                          : 'Tarifa Preferencial';
                      return (
                        <>
                          {halloweenPromoDiscount > 0 && (
                            <div className="flex items-center justify-between text-[#c2410c] font-bold">
                              <span>Descuento Promo Halloween (Precio fijo)</span>
                              <span className="tabular-nums">
                                -${halloweenPromoDiscount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {vipDiscount > 0 && (
                            <div className="flex items-center justify-between text-indigo-700 font-bold">
                              <span>Descuento VIP ({discountLabel})</span>
                              <span className="tabular-nums">-${vipDiscount.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}

                  {discountTotal > 0 && (
                    <div className="flex items-center justify-between text-slate-950 font-bold">
                      <span>Subtotal con descuento</span>
                      <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-800 font-semibold">
                    <span>
                      {metodoEntrega === 'RETIRO'
                        ? 'Retiro en sucursal (San Salvador)'
                        : departamento
                        ? `Envío a domicilio (${departamento})`
                        : 'Envío a domicilio'}
                    </span>
                    <span
                      className={`font-extrabold tabular-nums ${
                        metodoEntrega === 'RETIRO' ? 'text-emerald-700' : 'text-slate-950'
                      }`}
                    >
                      {metodoEntrega === 'RETIRO' ? 'Gratis' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-3 border-t border-slate-300">
                    <span className="text-sm font-extrabold text-slate-950">Total a pagar</span>
                    <span className="text-xl font-black text-indigo-700 tabular-nums">
                      ${totalConEnvio.toFixed(2)}
                    </span>
                  </div>

                  {discountTotal > 0 &&
                    (() => {
                      const hasHalloweenItems = cart.some(
                        (it) => !it.kitDetails && isHalloweenPromoProduct(it.product)
                      );
                      const hasVipItems = cart.some((it) => {
                        const orig = it.originalUnitPrice ?? it.unitPrice;
                        return (
                          orig > it.unitPrice &&
                          (it.kitDetails || !isHalloweenPromoProduct(it.product))
                        );
                      });
                      const savingsLabel =
                        hasHalloweenItems && hasVipItems
                          ? 'Ahorro aplicado (Promo + Nivel VIP)'
                          : hasHalloweenItems
                          ? 'Ahorro aplicado con Promo Halloween'
                          : `Ahorro aplicado (${
                              customer?.tier?.name ||
                              customer?.bottleTier?.name ||
                              customer?.suppliesTier?.name ||
                              'Preferencial'
                            })`;
                      return (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-950">
                          <span className="font-bold">{savingsLabel}</span>
                          <span className="font-extrabold text-emerald-800 tabular-nums">
                            ${discountTotal.toFixed(2)}
                          </span>
                        </div>
                      );
                    })()}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>
                        {metodoPago === 'CARD'
                          ? wompiStatusText || 'Redirigiendo a Wompi, por favor espere (5s)...'
                          : 'Procesando pedido...'}
                      </span>
                    </span>
                  ) : (
                    <>
                      {metodoPago === 'CARD' ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>
                        {metodoPago === 'CARD'
                          ? `Pagar con tarjeta • $${totalConEnvio.toFixed(2)}`
                          : `Confirmar pedido • $${totalConEnvio.toFixed(2)}`}
                      </span>
                    </>
                  )}
                </button>

                <p className="text-xs font-semibold text-slate-700 text-center leading-snug">
                  {metodoPago === 'CARD'
                    ? 'Conexión cifrada 3D Secure procesada por Wompi • Bancoagrícola'
                    : 'Tu pedido quedará reservado al confirmar para que envíes tu comprobante'}
                </p>
              </div>
            </aside>

            {/* Notas informativas de producto y uso responsable con tipografía nítida y alto contraste */}
            <div className="bg-white rounded-2xl border border-slate-300 p-4 sm:p-5 divide-y divide-slate-200 text-xs text-slate-800">
              <div className="pb-3 flex items-start gap-2.5">
                <Droplets className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="font-medium leading-relaxed">
                  <strong className="font-extrabold text-slate-950">
                    Esencias 100% puras sin macerar:
                  </strong>{' '}
                  Nosotros no maceramos ningún perfume; nuestras esencias se entregan puras listas para combinarse con alcohol especial de perfumería.
                </p>
              </div>

              <div className="pt-3 space-y-1.5">
                <p className="font-extrabold text-slate-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>Uso responsable de materias primas</span>
                </p>
                <ul className="space-y-1 pl-4 list-disc text-xs font-medium text-slate-800 leading-relaxed">
                  <li>
                    <strong className="font-bold text-slate-950">No aplicar puras sobre la piel:</strong>{' '}
                    deben diluirse previamente en alcohol de perfumería (máximo recomendado para 100 ml: 1.5 oz de esencia).
                  </li>
                  <li>
                    No ingerir, inhalar directamente ni permitir el contacto con los ojos.
                  </li>
                  <li>
                    Evitar su uso en caso de antecedentes de alergia a fragancias, alcohol o sus componentes.
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
