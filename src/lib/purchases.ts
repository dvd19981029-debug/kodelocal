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

export const INITIAL_PURCHASES: PurchaseRecord[] = [
  {
    id: 'pur-101',
    purchaseNumber: 'CMP-0042',
    tipoDte: 'CCF',
    supplierId: 'prov-1',
    supplierName: 'Fragrance Oils & Essences de Centroamérica S.A. de C.V.',
    purchaseDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 24 * 86400000).toISOString().split('T')[0],
    creditDays: 30,
    docNumber: 'E9F12A88-51B4-4822-B83A-32D9A74E612B',
    controlNumber: 'DTE-03-M001P001-000000000000452',
    condicion: 'CONTADO',
    paymentMethod: 'TRANSFERENCIA',
    paymentStatus: 'PAGADO',
    subtotalNeto: 380.00,
    iva: 49.40,
    total: 429.40,
    saldoPendiente: 0.00,
    items: [
      {
        productId: 'esencia-100',
        productName: '1 Million Elixir H',
        productSku: '100',
        unit: 'Onza',
        quantity: 100,
        costPrice: 1.95,
        subtotal: 195.00
      },
      {
        productId: 'esencia-102',
        productName: '1 Million H',
        productSku: '102',
        unit: 'Onza',
        quantity: 95,
        costPrice: 1.95,
        subtotal: 185.00
      }
    ],
    payments: [
      {
        id: 'pay-01',
        purchaseId: 'pur-101',
        date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
        amount: 429.40,
        paymentMethod: 'TRANSFERENCIA',
        reference: 'TRANSF-BAC-884210',
        notes: 'Pago liquidado mediante transferencia Banco de América Central.'
      }
    ],
    notes: 'Importación de esencias puras para reabastecimiento de mostrador.',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'pur-102',
    purchaseNumber: 'CMP-0043',
    tipoDte: 'CCF',
    supplierId: 'prov-2',
    supplierName: 'Envases & Cristalería de El Salvador S.A.',
    purchaseDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 13 * 86400000).toISOString().split('T')[0],
    creditDays: 15,
    docNumber: '7C34D8A1-19BE-44D7-9002-1209AF456B78',
    controlNumber: 'DTE-03-M001P001-000000000000491',
    condicion: 'CREDITO',
    paymentStatus: 'PENDIENTE',
    subtotalNeto: 260.00,
    iva: 33.80,
    total: 293.80,
    saldoPendiente: 193.80,
    items: [
      {
        productId: 'bot-100-lujo',
        productName: 'Bote de Vidrio 100ml Cilindro con Atomizador Dorado',
        productSku: 'BOT-100-LUX',
        unit: 'Unidad',
        quantity: 200,
        costPrice: 0.75,
        subtotal: 150.00
      },
      {
        productId: 'bot-50-clasico',
        productName: 'Bote de Vidrio 50ml Cuadrado Clásico con Atomizador Plata',
        productSku: 'BOT-050-CLA',
        unit: 'Unidad',
        quantity: 200,
        costPrice: 0.55,
        subtotal: 110.00
      }
    ],
    payments: [
      {
        id: 'pay-02',
        purchaseId: 'pur-102',
        date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        amount: 100.00,
        paymentMethod: 'TRANSFERENCIA',
        reference: 'ANTICIPO-BANCO-4412',
        notes: 'Abono inicial a la recepción del lote de envases.'
      }
    ],
    notes: 'Lote de envases para presentaciones de 100ml y 50ml con atomizador de lujo.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

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
