// src/lib/kardex.ts

export type KardexMovementType = 
  | 'IN_PURCHASE'   // Entrada por Compra a Proveedor
  | 'OUT_SALE'      // Salida por Venta en Punto de Venta (POS)
  | 'ADJUSTMENT'    // Ajuste de Conteo Físico / Inventario Inicial
  | 'OUT_DAMAGE'    // Merma / Rotura de Frasco / Evaporación
  | 'RETURN';       // Devolución

export interface KardexMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  puesto?: string;
  unit: string;
  type: KardexMovementType;
  quantity: number; // Cantidad del movimiento
  previousStock: number;
  newStock: number;
  costPrice?: number;
  unitPrice?: number;
  reference: string; // Ej: Factura CMP-0042, DTE-01-M001P001-..., Conteo Mensual
  dteNumber?: string; // Número oficial DTE o UUID si aplica
  notes?: string;
  user?: string; // Vendedor o Administrador
  createdAt: string; // ISO 8601 o YYYY-MM-DD HH:mm
}

export const INITIAL_KARDEX: KardexMovement[] = [
  {
    id: 'kdx-001',
    productId: 'esencia-100',
    productName: '1 Million Elixir H',
    productSku: '100',
    puesto: 'A1',
    unit: 'Onza',
    type: 'IN_PURCHASE',
    quantity: 100,
    previousStock: 0,
    newStock: 100,
    costPrice: 1.95,
    unitPrice: 3.25,
    reference: 'Factura Compra CMP-0042',
    dteNumber: 'DTE-03-M001P001-000000000000452',
    notes: 'Ingreso inicial de lote desde Fragrance Oils S.A.',
    user: 'Gerente General',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'kdx-002',
    productId: 'esencia-102',
    productName: '1 Million H',
    productSku: '102',
    puesto: 'A2',
    unit: 'Onza',
    type: 'IN_PURCHASE',
    quantity: 95,
    previousStock: 5,
    newStock: 100,
    costPrice: 1.95,
    unitPrice: 3.25,
    reference: 'Factura Compra CMP-0042',
    dteNumber: 'DTE-03-M001P001-000000000000452',
    notes: 'Reabastecimiento de esencia contratipo Paco Rabanne',
    user: 'Gerente General',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'kdx-003',
    productId: 'bot-100-lujo',
    productName: 'Bote de Vidrio 100ml Cilindro con Atomizador Dorado',
    productSku: 'BOT-100-LUX',
    puesto: 'E1',
    unit: 'Unidad',
    type: 'IN_PURCHASE',
    quantity: 200,
    previousStock: 50,
    newStock: 250,
    costPrice: 0.75,
    unitPrice: 1.50,
    reference: 'Factura Compra CMP-0043',
    dteNumber: 'DTE-03-M001P001-000000000000491',
    notes: 'Entrada de envases de cristal de 100ml de lujo',
    user: 'Gerente General',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'kdx-004',
    productId: 'esencia-100',
    productName: '1 Million Elixir H',
    productSku: '100',
    puesto: 'A1',
    unit: 'Onza',
    type: 'OUT_SALE',
    quantity: 3,
    previousStock: 100,
    newStock: 97,
    unitPrice: 3.25,
    reference: 'Venta Mostrador VTA-0015',
    dteNumber: 'DTE-01-M001P001-000000000001089',
    notes: 'Venta mostrador fragancia 3 Oz con preparación de pedido',
    user: 'Carlos Flores (Caja 1)',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'kdx-005',
    productId: 'bot-100-lujo',
    productName: 'Bote de Vidrio 100ml Cilindro con Atomizador Dorado',
    productSku: 'BOT-100-LUX',
    puesto: 'E1',
    unit: 'Unidad',
    type: 'OUT_SALE',
    quantity: 1,
    previousStock: 250,
    newStock: 249,
    unitPrice: 1.50,
    reference: 'Venta Mostrador VTA-0015',
    dteNumber: 'DTE-01-M001P001-000000000001089',
    notes: 'Envase para fragancia de 100ml despachado',
    user: 'Carlos Flores (Caja 1)',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'kdx-006',
    productId: 'ins-alc-gal',
    productName: 'Alcohol de Perfumería Desodorizado 96° (Galón)',
    productSku: 'INS-ALC-GAL',
    puesto: 'Q1',
    unit: 'Galón',
    type: 'ADJUSTMENT',
    quantity: 2,
    previousStock: 38,
    newStock: 40,
    costPrice: 11.50,
    reference: 'Ajuste de Conteo Físico',
    notes: 'Auditoría mensual de insumos químicos en bodega',
    user: 'Gerente General',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];

export function getStoredKardex(): KardexMovement[] {
  if (typeof window === 'undefined') return INITIAL_KARDEX;
  const saved = localStorage.getItem('kodelocal_kardex');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing kodelocal_kardex:', e);
    }
  }
  localStorage.setItem('kodelocal_kardex', JSON.stringify(INITIAL_KARDEX));
  return INITIAL_KARDEX;
}

export function saveStoredKardex(movements: KardexMovement[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kodelocal_kardex', JSON.stringify(movements));
}

/**
 * Registra un nuevo movimiento en el Kárdex de inventario
 */
export function addKardexMovement(
  movement: Omit<KardexMovement, 'id' | 'createdAt'>
): KardexMovement {
  const newEntry: KardexMovement = {
    ...movement,
    id: `kdx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    const current = getStoredKardex();
    const updated = [newEntry, ...current];
    saveStoredKardex(updated);
  }

  return newEntry;
}
