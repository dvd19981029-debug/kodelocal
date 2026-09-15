// src/lib/guestOrderStorage.ts

export interface GuestOrderSummary {
  orderNumber: string;
  createdAt: string;
  total?: number;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
}

const GUEST_ORDERS_KEY = 'aromaniak_guest_orders';

/**
 * Guarda una orden realizada como invitado en el almacenamiento local del navegador.
 * Deduplica por número de orden y mantiene hasta 20 pedidos recientes.
 */
export function saveGuestOrder(order: GuestOrderSummary): void {
  if (typeof window === 'undefined' || !order?.orderNumber) return;

  try {
    const existing = getGuestOrders();
    const filtered = existing.filter(
      (o) => o.orderNumber.toUpperCase() !== order.orderNumber.toUpperCase()
    );
    const updated = [order, ...filtered].slice(0, 20);
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(updated));
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
