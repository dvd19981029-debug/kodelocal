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
  codActividad?: string; // Código CAT-019 Hacienda (ej. 47722)
  actividadEconomica?: string; // Giro o Actividad Comercial según Hacienda (CAT-019)
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
  customDiscountPct?: number | null;

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
  '47722 - Venta al por menor de productos cosméticos y de tocador',
  '46491 - Venta al por mayor de productos medicinales, cosméticos, perfumería y productos de limpieza',
  '20232 - Fabricación de perfumes, cosméticos y productos de higiene y cuidado personal, incluyendo tintes, champú, etc.',
  '47892 - Venta al por menor de productos medicinales, cosméticos, de tocador y de limpieza en puestos de ferias y mercados',
  '96020 - Peluquería y otros tratamientos de belleza',
  '47711 - Venta al por menor de prendas de vestir y accesorios de vestir',
  '47739 - Venta al por menor de otros productos n.c.p.',
  '47910 - Venta al por menor por correo o internet',
  '10006 - Comerciante',
  '10001 - Empleados',
  '10005 - Otros'
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
