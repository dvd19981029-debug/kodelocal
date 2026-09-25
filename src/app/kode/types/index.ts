// src/app/kode/types/index.ts
// Basado estrictamente en docs/DATABASE_DATA_DICTIONARY.md

export interface CatalogoItem {
  id: string;
  codigo: string;
  contratipo: string;
  marca_inspirada: string;
  genero: string;
  precio_normal: string | number;
  precio_extra_shot: string | number;
  activo?: boolean;
  imagen_url?: string;
}

export interface Vendedora {
  id: string;
  nombre: string;
  email: string;
}

export interface PedidoItem {
  id?: string;
  catalogo_id: string;
  codigo: string;
  contratipo: string;
  marca?: string;
  version: 'Normal' | 'Plus' | 'NORMAL' | 'EXTRA_SHOT' | string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  insumo_comprado?: boolean;
  comprado_por?: string;
  usuario?: string;
}

export interface ClienteItem {
  id: string;
  nombre_completo: string;
  telefono_whatsapp: string;
  direccion_entrega: string;
  departamento: string;
  municipio: string;
  punto_referencia?: string;
  tipo_documento?: string;
  numero_documento?: string;
  email?: string;
  pedidos_count?: number;
  total_gastado?: number;
}

export interface ClienteDirectorioItem {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  departamento: string;
  municipio: string;
  referencia?: string;
  tipo_documento?: string;
  numero_documento?: string;
  email?: string;
  pedidosCount?: number;
  totalGastado?: number;
}

export interface FormaPagoItem {
  id: string;
  nombre: string;
  tipo: string;
  activo: boolean;
  cuenta_numero?: string;
}

export type FormaPago = FormaPagoItem;


export interface PagoItem {
  id: string;
  pedido_id: string;
  cliente_id?: string;
  forma_pago_id: string;
  forma_pago_nombre?: string;
  forma_pago_tipo?: string;
  monto: number;
  fecha_pago: string;
  num_documento_auto?: string;
  comprobante_url?: string | null;
  estado_pago?: string;
  usuario?: string;
  observaciones?: string;
  created_at?: string;
}

export interface PagoRegistroItem {
  id: string;
  forma_pago_id: string;
  forma_pago_nombre: string;
  forma_pago_tipo?: string;
  monto: number;
  num_documento_auto?: string;
  comprobante_url?: string | null;
  observaciones?: string;
}

export interface Pedido {
  id: string;
  numero_pedido: string;
  estado: 'Registrado' | 'Insumos comprados' | 'Preparado' | 'Enviado' | 'Entregado' | 'Cancelado' | string;
  tipo_pago: string;
  estado_pago: string;
  subtotal: string | number;
  costo_envio: string | number;
  total: string | number;
  monto_cobrar_cce?: number | string;
  total_pagado?: number;
  pagos?: PagoItem[];
  c807_guia_numero?: string;
  c807_link_rastreo?: string;
  c807_estado?: string;
  c807_fecha_guia?: string;
  dte_estado?: string;
  dte_codigo_generacion?: string;
  dte_numero_control?: string;
  dte_pdf_url?: string;
  notas?: string;
  created_at: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  cliente_departamento: string;
  cliente_municipio: string;
  cliente_referencia?: string;
  cliente_tipo_documento?: string;
  cliente_numero_documento?: string;
  cliente_email?: string;
  vendedora_id?: string;
  vendedora_nombre?: string;
  vendedora_email?: string;
  items: PedidoItem[];
}

export interface InsumoItem {
  item_id: string;
  pedido_id: string;
  numero_pedido: string;
  pedido_estado?: string;
  cliente_nombre: string;
  fecha_registro: string;
  catalogo_id: string;
  codigo: string;
  contratipo: string;
  marca_inspirada?: string;
  genero?: string;
  version: 'Normal' | 'Plus' | string;
  cantidad: number;
}

export interface CompraGasto {
  id: string;
  fecha_compra: string;
  concepto: string;
  monto_total: number;
  proveedor: string;
  categoria: 'ESENCIAS' | 'CAJAS' | 'FRASCOS' | 'PAPEL' | 'OTROS INSUMOS' | string;
  estado_pago: string;
}

export type NavSection = 'VENTAS' | 'INVENTARIO' | 'FABRICACION' | 'LOGISTICA' | 'INTELIGENCIA_NEGOCIOS';

export type VentasView = 'hub' | 'nuevo_pedido' | 'nuevo_cliente' | 'clientes' | 'pedidos' | 'catalogo' | 'ficha_cliente';

export type FabView = 'hub' | 'compra_pendiente' | 'por_fabricar';

export type BiView = 'hub' | 'compras' | 'dashboard';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}
