// src/lib/purchases.ts
import { ProductItem } from './store';

export type TipoDteCompra = 'CCF' | 'FAC' | 'FSE' | 'NC';

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  nit?: string;
  nrc?: string;
  phone?: string;
  email?: string;
  address?: string;
  category: 'Esencias & Fragancias' | 'Envases & Botes' | 'Química & Alcohol' | 'Empaque' | 'General';
  creditDays: number; // 0 = Contado, 15, 30, 45 días
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  productSku?: string;
  unit: string; // Onza, Unidad, Galón, etc.
  quantity: number;
  costPrice: number;
  subtotal: number;
}

export interface PurchasePayment {
  id: string;
  purchaseId: string;
  date: string;
  amount: number;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE';
  reference?: string;
  notes?: string;
}

export interface PurchaseItemReception {
  productId: string;
  expectedQty: number;
  receivedQty: number;
  matched: boolean;
  notes?: string;
}

export interface PurchaseRecord {
  id: string;
  purchaseNumber: string; // Ej: CMP-0012
  tipoDte: TipoDteCompra;
  supplierId: string;
  supplierName: string;
  purchaseDate: string; // YYYY-MM-DD
  dueDate?: string; // Fecha de vencimiento si es a crédito
  creditDays: number;
  docNumber: string; // Código de generación DTE o # factura física
  controlNumber?: string; // Número de control Hacienda (ej. DTE-03-M001P001-...)
  condicion: 'CONTADO' | 'CREDITO';
  paymentMethod?: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE';
  paymentStatus: 'PAGADO' | 'PENDIENTE' | 'ANULADO';
  subtotalNeto: number;
  iva: number; // 13% en CCF
  total: number;
  saldoPendiente: number;
  items: PurchaseItem[];
  payments?: PurchasePayment[];
  notes?: string;
  createdAt: string;
  // Recepción en Bodega (confrontación física vs sistema)
  receptionStatus?: 'PENDIENTE' | 'RECIBIDO' | 'PARCIAL';
  receivedAt?: string;
  receivedBy?: string;
  receivedNotes?: string;
  receivedItems?: PurchaseItemReception[];
}

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'prov-1',
    name: 'Fragrance Oils & Essences de Centroamérica S.A. de C.V.',
    contactPerson: 'Carlos Menjívar',
    nit: '0614-120590-101-2',
    nrc: '245678-9',
    phone: '+503 2245-8800',
    email: 'pedidos@fragranceoils.com.sv',
    address: 'Zona Industrial Merliot, Antiguo Cuscatlán',
    category: 'Esencias & Fragancias',
    creditDays: 30,
    notes: 'Proveedor principal de concentrados de perfume puro grado cosmético.'
  },
  {
    id: 'prov-2',
    name: 'Envases & Cristalería de El Salvador S.A.',
    contactPerson: 'Lic. Mariana Rivera',
    nit: '0614-230485-102-5',
    nrc: '189345-2',
    phone: '+503 2298-4422',
    email: 'ventas@envaseselsalvador.com',
    address: 'Bulevar del Ejército Km 4.5, San Salvador',
    category: 'Envases & Botes',
    creditDays: 15,
    notes: 'Frascos de 30ml, 50ml, 100ml, atomizadores de lujo y tapas magnéticas.'
  },
  {
    id: 'prov-3',
    name: 'Soluciones Químicas & Alcoholes Industriales S.A.',
    contactPerson: 'Ing. Roberto Alas',
    nit: '0614-050892-103-8',
    nrc: '304912-1',
    phone: '+503 2271-9000',
    email: 'quimica.alassv@gmail.com',
    address: 'Plaza Suiza, Alameda Manuel Enrique Araujo, San Salvador',
    category: 'Química & Alcohol',
    creditDays: 0,
    notes: 'Alcohol etílico desodorizado 96° neutro y fijadores Galaxolide.'
  },
  {
    id: 'prov-4',
    name: 'Empaques de Lujo & Cajas Kraft Kode',
    contactPerson: 'Elena Guardado',
    nit: '0614-150995-104-1',
    nrc: '450123-8',
    phone: '+503 2223-1199',
    email: 'contacto@empaqueskode.sv',
    address: 'Calle El Mirador, Colonia Escalón',
    category: 'Empaque',
    creditDays: 30,
    notes: 'Cajas rígidas cilíndricas, bolsas boutique y etiquetas holográficas.'
  }
];

export const INITIAL_PURCHASES: PurchaseRecord[] = [];

// Helper functions for LocalStorage persistence
export function getStoredSuppliers(): Supplier[] {
  if (typeof window === 'undefined') return INITIAL_SUPPLIERS;
  const saved = localStorage.getItem('kodelocal_suppliers');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing kodelocal_suppliers:', e);
    }
  }
  localStorage.setItem('kodelocal_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
  return INITIAL_SUPPLIERS;
}

export function saveStoredSuppliers(suppliers: Supplier[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kodelocal_suppliers', JSON.stringify(suppliers));
}

export function getStoredPurchases(): PurchaseRecord[] {
  if (typeof window === 'undefined') return INITIAL_PURCHASES;
  const currentVersion = localStorage.getItem('kodelocal_data_version');
  if (currentVersion !== '2026_zero_stock_v3') {
    return [];
  }
  const saved = localStorage.getItem('kodelocal_purchases');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error parsing kodelocal_purchases:', e);
    }
  }
  localStorage.setItem('kodelocal_purchases', JSON.stringify(INITIAL_PURCHASES));
  return INITIAL_PURCHASES;
}

export function saveStoredPurchases(purchases: PurchaseRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kodelocal_purchases', JSON.stringify(purchases));
  window.dispatchEvent(new Event('kodelocal_purchases_updated'));
}

/**
 * Aplica el ingreso de una compra al inventario de productos:
 * 1. Incrementa el stock disponible.
 * 2. Actualiza el costo de adquisición (cost) del producto.
 */
export function applyPurchaseToProducts(purchase: PurchaseRecord, currentProducts: ProductItem[]): ProductItem[] {
  const isNC = purchase.tipoDte === 'NC';

  return currentProducts.map(prod => {
    const matchedItem = purchase.items.find(it => it.productId === prod.id);
    if (!matchedItem) return prod;

    const newStock = isNC 
      ? Math.max(0, prod.stock - matchedItem.quantity)
      : prod.stock + matchedItem.quantity;

    // Solo actualizamos costo si no es nota de crédito y el costo es válido
    const newCost = (!isNC && matchedItem.costPrice > 0) 
      ? matchedItem.costPrice 
      : prod.cost;

    return {
      ...prod,
      stock: newStock,
      cost: newCost
    };
  });
}

/**
 * Aplica el ingreso de mercadería confrontada físicamente en bodega al stock de productos.
 * Utiliza las cantidades reales recibidas que confirmó el bodeguero.
 */
export function applyBodegaReceptionToProducts(
  purchase: PurchaseRecord,
  receivedQuantities: Record<string, number>,
  currentProducts: ProductItem[]
): ProductItem[] {
  const isNC = purchase.tipoDte === 'NC';

  return currentProducts.map(prod => {
    if (receivedQuantities[prod.id] !== undefined) {
      const qtyReceived = receivedQuantities[prod.id];
      const matchedItem = purchase.items.find(it => it.productId === prod.id);

      const newStock = isNC
        ? Math.max(0, (prod.stock || 0) - qtyReceived)
        : (prod.stock || 0) + qtyReceived;

      const newCost = (!isNC && matchedItem && matchedItem.costPrice > 0)
        ? matchedItem.costPrice
        : prod.cost;

      return {
        ...prod,
        stock: newStock,
        cost: newCost
      };
    }
    return prod;
  });
}

