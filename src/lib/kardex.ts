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
  dteTipo?: string; // CCF, FAC, FSE, TICKET, AJUSTE
  sourceCategory?: 'COMPRA' | 'VENTA' | 'AJUSTE';
  notes?: string;
  user?: string; // Vendedor o Administrador
  createdAt: string; // ISO 8601 o YYYY-MM-DD HH:mm
}

export const INITIAL_KARDEX: KardexMovement[] = [];

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
