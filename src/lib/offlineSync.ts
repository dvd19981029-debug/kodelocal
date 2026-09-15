/**
 * 🔄 Motor de Cola de Sincronización Offline (Offline Sync Queue)
 * Permite que el POS complete ventas, imprima tickets y registre operaciones
 * de manera ininterrumpida incluso durante caídas de internet en el local.
 * Reenvía automáticamente las ventas pendientes a /api/sales tan pronto
 * como se restablece la conexión a la red.
 */

export interface OfflineSalePayload {
  saleNumber: string;
  channel?: 'POS' | 'ONLINE';
  subtotal: number;
  ivaTotal: number;
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  cashChange?: number;
  notes?: string;
  tipoComprobante?: string;
  codigoGeneracion?: string;
  cashierName?: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    presentation?: string;
    unit?: string;
  }>;
  enqueuedAt: string;
  attempts: number;
  lastError?: string;
}

const OFFLINE_QUEUE_KEY = 'kodelocal_offline_sales_queue';

/**
 * Obtiene la lista de ventas pendientes de sincronizar en localStorage.
 */
export function getOfflineSalesQueue(): OfflineSalePayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error leyendo cola offline de localStorage:', err);
    return [];
  }
}

/**
 * Retorna la cantidad de ventas pendientes en la cola.
 */
export function getOfflineQueueCount(): number {
  return getOfflineSalesQueue().length;
}

/**
 * Notifica a los componentes de la interfaz que la cola ha cambiado.
 */
function notifyQueueChange(count: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('kodelocal_offline_queue_updated', {
      detail: { count },
    })
  );
}

/**
 * Agrega una venta a la cola de reintentos offline.
 */
export function enqueueOfflineSale(
  sale: Omit<OfflineSalePayload, 'enqueuedAt' | 'attempts'>
): void {
  if (typeof window === 'undefined') return;
  try {
    const currentQueue = getOfflineSalesQueue();
    // Evitar duplicados si ya está encolada la misma venta
    const exists = currentQueue.some((item) => item.saleNumber === sale.saleNumber);
    if (exists) return;

    const newRecord: OfflineSalePayload = {
      ...sale,
      channel: sale.channel || 'POS',
      enqueuedAt: new Date().toISOString(),
      attempts: 0,
    };

    const updatedQueue = [...currentQueue, newRecord];
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    notifyQueueChange(updatedQueue.length);
    console.warn(`📦 [OfflineSync] Venta #${sale.saleNumber} guardada en cola offline.`);
  } catch (err) {
    console.error('Error encolando venta offline en localStorage:', err);
  }
}

/**
 * Remueve una venta de la cola tras ser sincronizada exitosamente.
 */
export function removeOfflineSale(saleNumber: string): void {
  if (typeof window === 'undefined') return;
  try {
    const currentQueue = getOfflineSalesQueue();
    const updatedQueue = currentQueue.filter((item) => item.saleNumber !== saleNumber);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    notifyQueueChange(updatedQueue.length);
  } catch (err) {
    console.error('Error removiendo venta de la cola offline:', err);
  }
}

/**
 * Limpia la cola completa de reintentos.
 */
export function clearOfflineQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  notifyQueueChange(0);
}

/**
 * Procesa y vacía la cola de ventas pendientes enviándolas a /api/sales.
 */
export async function flushOfflineQueue(
  onProductsUpdated?: (products: any[]) => void
): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getOfflineSalesQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  console.log(`🚀 [OfflineSync] Procesando ${queue.length} ventas pendientes en segundo plano...`);

  for (const item of queue) {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleNumber: item.saleNumber,
          channel: item.channel || 'POS',
          subtotal: item.subtotal,
          ivaTotal: item.ivaTotal,
          total: item.total,
          paymentMethod: item.paymentMethod,
          cashReceived: item.cashReceived,
          cashChange: item.cashChange,
          notes: item.notes,
          tipoComprobante: item.tipoComprobante,
          codigoGeneracion: item.codigoGeneracion,
          cashierName: item.cashierName || 'Caja 1',
          items: item.items,
        }),
      });

      const data = await response.json().catch(() => ({}));

      // Si fue exitoso o si el servidor indica que la venta ya existía (idempotencia)
      const isAlreadyRecorded =
        !data.success &&
        (String(data.error || '').includes('Unique constraint') ||
         String(data.error || '').includes('saleNumber'));

      if (data.success || isAlreadyRecorded) {
        removeOfflineSale(item.saleNumber);
        synced++;
        console.log(`✅ [OfflineSync] Venta #${item.saleNumber} sincronizada exitosamente.`);
      } else {
        item.attempts += 1;
        item.lastError = data.error || 'Error en servidor';
        failed++;
      }
    } catch (networkErr: any) {
      item.attempts += 1;
      item.lastError = networkErr?.message || 'Fallo de conexión';
      failed++;
      // Si la red se volvió a caer durante el bucle, detener reintentos
      break;
    }
  }

  // Si se sincronizó al menos una venta, actualizar el catálogo de productos fresco
  if (synced > 0) {
    try {
      const pRes = await fetch('/api/products?fresh=true');
      const pData = await pRes.json();
      if (pData.success && Array.isArray(pData.products) && onProductsUpdated) {
        onProductsUpdated(pData.products);
        localStorage.setItem('kodelocal_products', JSON.stringify(pData.products));
      }
    } catch (_) {}
    window.dispatchEvent(new Event('kodelocal_sales_updated'));
  }

  return { synced, failed };
}

/**
 * Envía una venta en vivo a Supabase; si falla la red o el servidor, la encola automáticamente.
 */
export async function syncSaleOnlineOrQueue(
  sale: Omit<OfflineSalePayload, 'enqueuedAt' | 'attempts'>,
  onProductsUpdated?: (products: any[]) => void
): Promise<{ success: boolean; offline: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, offline: false };
  }

  // 1. Si el navegador reporta sin internet de antemano, encolar de inmediato
  if (!navigator.onLine) {
    enqueueOfflineSale(sale);
    return { success: true, offline: true, error: 'Sin conexión a internet. Venta guardada localmente.' };
  }

  // 2. Intentar envío en vivo
  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saleNumber: sale.saleNumber,
        channel: sale.channel || 'POS',
        subtotal: sale.subtotal,
        ivaTotal: sale.ivaTotal,
        total: sale.total,
        paymentMethod: sale.paymentMethod || 'CASH',
        cashReceived: sale.cashReceived,
        cashChange: sale.cashChange,
        notes: sale.notes,
        tipoComprobante: sale.tipoComprobante,
        codigoGeneracion: sale.codigoGeneracion,
        cashierName: sale.cashierName || 'Caja 1',
        items: sale.items,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (data.success) {
      // Actualizar catálogo de productos tras descuento exitoso
      try {
        const pRes = await fetch('/api/products?fresh=true');
        const pData = await pRes.json();
        if (pData.success && Array.isArray(pData.products) && onProductsUpdated) {
          onProductsUpdated(pData.products);
          localStorage.setItem('kodelocal_products', JSON.stringify(pData.products));
        }
      } catch (_) {}
      return { success: true, offline: false };
    }

    // Si el error es 409 (stock insuficiente) u otro error de validación de negocio, reportarlo
    if (res.status === 409) {
      return { success: false, offline: false, error: data.error || 'Stock insuficiente' };
    }

    // Si fue un error 5xx o de servidor, encolar para reintentar más tarde
    enqueueOfflineSale(sale);
    return { success: true, offline: true, error: data.error || 'Error temporal de servidor. Guardado en cola.' };
  } catch (netErr: any) {
    // Si la petición lanzó excepción por desconexión de red o timeout
    enqueueOfflineSale(sale);
    return { success: true, offline: true, error: 'Fallo de red. Venta resguardada en cola offline.' };
  }
}

/**
 * Inicializa los escuchadores globales de reanudación de red y el temporizador periódico.
 */
export function initOfflineSync(onProductsUpdated?: (products: any[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    console.log('🌐 [OfflineSync] Red reestablecida. Verificando cola de ventas...');
    flushOfflineQueue(onProductsUpdated);
  };

  window.addEventListener('online', handleOnline);

  // Verificación periódica cada 30 segundos
  const intervalId = setInterval(() => {
    if (navigator.onLine && getOfflineQueueCount() > 0) {
      flushOfflineQueue(onProductsUpdated);
    }
  }, 30000);

  // Ejecución inicial por si habían ventas pendientes de sesiones previas
  if (navigator.onLine && getOfflineQueueCount() > 0) {
    setTimeout(() => {
      flushOfflineQueue(onProductsUpdated);
    }, 1500);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
}
