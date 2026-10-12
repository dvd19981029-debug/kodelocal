// src/lib/customers.ts

export type TipoPersona = 'NATURAL' | 'JURIDICA';
export type TipoDocumentoCliente = 'DUI' | 'NIT' | 'PASAPORTE' | 'CARNET_RESIDENCIA' | 'OTRO';
export type CategoriaContribuyente = 'OTRO' | 'MEDIANO' | 'GRANDE';

export interface CustomerTier {
  id: string;
  name: string;
  discountPct: string | number;
  badgeColor?: string;
}

export interface CustomerRecord {
  id: string;
  tipoPersona: TipoPersona;
  name: string; // Nombre o Razón Social
  nombreComercial?: string;
  tipoDocumento: TipoDocumentoCliente;
  numDocumento: string; // DUI o NIT
  nrc?: string; // Número de Registro de Contribuyente (Requerido para CCF)
  actividadEconomica?: string; // Giro o Actividad Comercial según Hacienda
  categoriaContribuyente?: CategoriaContribuyente;
  documentoPreferido?: '01' | '03' | 'TICKET'; // Documento preferido para facturar: 01 (Factura), 03 (CCF), TICKET
  email: string;
  phone: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  notas?: string;
  specialEssencePrice?: number | null;
  specialBottlePrice?: number | null;
  tierId?: string | null;
  tier?: CustomerTier | null;
  createdAt: string;
}

export const DEPARTAMENTOS_SV = [
  'San Salvador',
  'La Libertad',
  'Santa Ana',
  'San Miguel',
  'Sonsonate',
  'Usulután',
  'Ahuachapán',
  'La Paz',
  'Chalatenango',
  'Cuscatlán',
  'Morazán',
  'San Vicente',
  'Cabañas',
  'La Unión'
];

export const GIROS_COMUNES_SV = [
  'Venta al por menor de productos cosméticos y de tocador en comercios especializados',
  'Comercio al por menor de otros productos nuevos en comercios especializados',
  'Servicios de peluquería y otros tratamientos de belleza',
  'Venta de productos medicinales, cosméticos y artículos de tocador',
  'Comercio al por mayor de perfumería y cosméticos',
  'Servicios personales diversos',
  'Venta al por menor por correo o por internet',
  'Consumidor Final / Particular'
];

export const INITIAL_CUSTOMERS: CustomerRecord[] = [];

export function getStoredCustomers(): CustomerRecord[] {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
  const saved = localStorage.getItem('kodelocal_customers');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error parsing kodelocal_customers:', e);
    }
  }
  localStorage.setItem('kodelocal_customers', JSON.stringify(INITIAL_CUSTOMERS));
  return INITIAL_CUSTOMERS;
}

export function saveStoredCustomers(customers: CustomerRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kodelocal_customers', JSON.stringify(customers));
}
