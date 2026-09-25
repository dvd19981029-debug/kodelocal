/**
 * POS Aromaniak - Tipos Maestros
 */

export type {
  ProductItem,
  CartItem,
  SaleRecord,
} from '@/lib/store';

export type {
  CustomerRecord,
  TipoPersona,
  TipoDocumentoCliente,
  CategoriaContribuyente,
} from '@/lib/customers';

export type PosTab =
  | 'nueva_orden'
  | 'caja_facturacion'
  | 'clientes'
  | 'ventas'
  | 'bodega_ordenes'
  | 'pos';

export type CajaSubTab = 'listas_facturar' | 'dtes_emitidos';

export type DteFilterType = 'ALL' | '01' | '03' | 'TICKET';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'BITCOIN';

export type TipoComprobante = 'TICKET' | '01' | '03';

export type BodegaOrdenesFilter = 'ALL' | 'PENDING' | 'READY' | 'COMPLETED';

export type CustomerFilterType = 'TODOS' | 'NATURAL' | 'JURIDICA';

export interface PosCustomerFormState {
  tipoPersona: import('@/lib/customers').TipoPersona;
  name: string;
  nombreComercial: string;
  tipoDocumento: import('@/lib/customers').TipoDocumentoCliente;
  numDocumento: string;
  nrc: string;
  giro: string;
  categoria: import('@/lib/customers').CategoriaContribuyente;
  documentoPreferido: '01' | '03' | 'TICKET';
  email: string;
  phone: string;
  departamento: string;
  municipio: string;
  direccion: string;
  notas: string;
}

export interface DteClientPayload {
  nombre: string;
  numDocumento?: string;
  nrc?: string;
  email?: string;
  giro?: string;
  telefono?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
}

export interface DteItemPayload {
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  unit?: string;
  tipoItem?: number;
}

export interface DteEmissionPayload {
  tipoDte: TipoComprobante;
  saleId: string;
  cliente: DteClientPayload;
  items: DteItemPayload[];
  total: number;
  subtotal: number;
  iva: number;
  metodoPago: PaymentMethod;
}

export interface DteEmissionResponse {
  success?: boolean;
  dte?: {
    codigoGeneracion: string;
    numeroControl?: string;
    selloRecepcion?: string;
    estado: 'PROCESADO' | 'RECHAZADO' | 'SIMULADO' | string;
    mensaje?: string;
    mhDteUrl?: string;
    fhProcesamiento?: string;
  };
  error?: string;
}
