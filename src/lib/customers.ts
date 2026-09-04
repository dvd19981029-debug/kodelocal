// src/lib/customers.ts

export type TipoPersona = 'NATURAL' | 'JURIDICA';
export type TipoDocumentoCliente = 'DUI' | 'NIT' | 'PASAPORTE' | 'CARNET_RESIDENCIA' | 'OTRO';
export type CategoriaContribuyente = 'OTRO' | 'MEDIANO' | 'GRANDE';

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
  email: string;
  phone: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  notas?: string;
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

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cli-001',
    tipoPersona: 'NATURAL',
    name: 'Consumidor Final',
    tipoDocumento: 'DUI',
    numDocumento: '00000000-0',
    email: 'ventas@kodelocal.com',
    phone: '2200-0000',
    departamento: 'San Salvador',
    municipio: 'San Salvador Centro',
    direccion: 'Venta de Mostrador Local',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    id: 'cli-002',
    tipoPersona: 'NATURAL',
    name: 'Beatriz Morales',
    tipoDocumento: 'DUI',
    numDocumento: '04589214-3',
    email: 'beatriz.morales@gmail.com',
    phone: '7722-1133',
    departamento: 'San Salvador',
    municipio: 'San Salvador',
    direccion: 'Colonia Escalón, Calle El Mirador #42',
    createdAt: '2026-09-02T10:30:00.000Z'
  },
  {
    id: 'cli-003',
    tipoPersona: 'JURIDICA',
    name: 'Boutique & Perfumería Elegance S.A. de C.V.',
    nombreComercial: 'Elegance Perfumes SV',
    tipoDocumento: 'NIT',
    numDocumento: '0614-120521-102-4',
    nrc: '289410-5',
    actividadEconomica: 'Venta al por menor de productos cosméticos y de tocador en comercios especializados',
    categoriaContribuyente: 'MEDIANO',
    email: 'facturacion@eleganceperfumes.sv',
    phone: '2288-4455',
    departamento: 'La Libertad',
    municipio: 'Santa Tecla',
    direccion: 'Centro Comercial Multiplaza, Nivel 2, Local 45',
    notas: 'Cliente corporativo de fragancias en onzas al por mayor para reenvase.',
    createdAt: '2026-09-03T14:15:00.000Z'
  },
  {
    id: 'cli-004',
    tipoPersona: 'NATURAL',
    name: 'Roberto Fuentes',
    tipoDocumento: 'DUI',
    numDocumento: '01984523-7',
    email: 'roberto.fuentes@hotmail.com',
    phone: '7890-4411',
    departamento: 'La Libertad',
    municipio: 'Santa Tecla',
    direccion: 'Residencial Santa Teresa, Senda 4, Polígono B, Casa #15',
    createdAt: '2026-09-03T16:20:00.000Z'
  }
];

export function getStoredCustomers(): CustomerRecord[] {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;
  const saved = localStorage.getItem('kodelocal_customers');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
