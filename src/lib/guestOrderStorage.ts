// src/lib/guestOrderStorage.ts

export interface GuestOrderItem {
  productName: string;
  inspiredBy?: string | null;
  presentation?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface GuestOrderSummary {
  orderNumber: string;
  createdAt: string;
  total?: number;
  subtotal?: number;
  shippingCost?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  department?: string;
  municipality?: string;
  deliveryReference?: string;
  courierName?: string;
  trackingNumber?: string;
  items?: GuestOrderItem[];
}

export interface GuestShippingProfile {
  name?: string;
  phone?: string;
  email?: string;
  department?: string;
  municipality?: string;
  address?: string;
  reference?: string;
  metodoEntrega?: 'ENVIO' | 'RETIRO';
  documentType?: string;
  documentNum?: string;
  tipoComprobante?: '01' | '03' | 'TICKET';
  businessName?: string;
  nrc?: string;
  activityDesc?: string;
  updatedAt?: string;
}

const GUEST_ORDERS_KEY = 'aromaniak_guest_orders';
const GUEST_SHIPPING_KEY = 'aromaniak_guest_shipping';

/**
 * Guarda o actualiza el perfil de envío predeterminado para compradores invitados.
 */
export function saveGuestShippingProfile(profile: Partial<GuestShippingProfile>): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getGuestShippingProfile();
    const updated: GuestShippingProfile = {
      ...existing,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(GUEST_SHIPPING_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('No se pudo guardar el perfil de envío de invitado en localStorage:', err);
  }
}

/**
 * Recupera el perfil de envío guardado localmente para invitados en este dispositivo.
 */
export function getGuestShippingProfile(): GuestShippingProfile {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(GUEST_SHIPPING_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.warn('Error leyendo perfil de envío de invitado de localStorage:', err);
    return {};
  }
}

/**
 * Guarda una orden realizada como invitado en el almacenamiento local del navegador.
 * Deduplica por número de orden y mantiene hasta 30 pedidos recientes.
 */
export function saveGuestOrder(order: GuestOrderSummary): void {
  if (typeof window === 'undefined' || !order?.orderNumber) return;

  try {
    const existing = getGuestOrders();
    const prevOrder = existing.find(
      (o) => o.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
    );

    // Fusionar con datos existentes si ya existía para no perder campos
    const mergedOrder: GuestOrderSummary = {
      ...(prevOrder || {}),
      ...order,
      orderNumber: order.orderNumber.trim().toUpperCase(),
    };

    const filtered = existing.filter(
      (o) => o.orderNumber.toUpperCase() !== mergedOrder.orderNumber
    );

    const updated = [mergedOrder, ...filtered].slice(0, 30);
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(updated));

    // Si la orden incluye datos de envío, actualizar también el perfil del invitado
    if (order.customerName || order.shippingAddress || order.customerPhone) {
      saveGuestShippingProfile({
        name: order.customerName || undefined,
        email: order.customerEmail || undefined,
        phone: order.customerPhone || undefined,
        address: order.shippingAddress || undefined,
        department: order.department || undefined,
        municipality: order.municipality || undefined,
        reference: order.deliveryReference || undefined,
      });
    }
  } catch (err) {
    console.warn('No se pudo guardar el pedido de invitado en localStorage:', err);
  }
}

/**
 * Obtiene la lista de pedidos guardados como invitado en este dispositivo.
 */
export function getGuestOrders(): GuestOrderSummary[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(GUEST_ORDERS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item.orderNumber === 'string');
    }
    return [];
  } catch (err) {
    console.warn('Error leyendo pedidos de invitado de localStorage:', err);
    return [];
  }
}

/**
 * Agrega o asegura un número de orden en los pedidos de invitado.
 */
export function addGuestOrderNumber(orderNumber: string, extraData?: Partial<GuestOrderSummary>): void {
  if (!orderNumber) return;
  saveGuestOrder({
    orderNumber: orderNumber.trim(),
    createdAt: new Date().toISOString(),
    ...extraData,
  });
}
