// src/lib/store.ts

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number; // Precio con IVA incluido o neto
  cost: number;
  stock: number;
  minStock: number;
  imageUrl: string;
  isAvailableOnline: boolean;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface SaleRecord {
  id: string;
  saleNumber: string;
  createdAt: string;
  total: number;
  subtotal: number;
  ivaTotal: number;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'BITCOIN';
  cashReceived?: number;
  cashChange?: number;
  tipoComprobante: 'TICKET' | '01' | '03'; // Ticket, Factura 01, Crédito Fiscal 03
  cliente: {
    nombre: string;
    numDocumento?: string;
    nrc?: string;
    correo?: string;
    direccion?: string;
  };
  dteInfo?: {
    codigoGeneracion?: string;
    numeroControl?: string;
    selloRecepcion?: string;
    estado?: string;
    simulated?: boolean;
    mensaje?: string;
  };
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    sku: 'AUD-BT-001',
    barcode: '741001234501',
    name: 'Audífonos Inalámbricos Pro ANC',
    category: 'Audio',
    price: 35.00,
    cost: 18.00,
    stock: 24,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    isAvailableOnline: true
  },
  {
    id: 'prod-2',
    sku: 'TEC-MEC-RGB',
    barcode: '741001234502',
    name: 'Teclado Mecánico RGB Switch Red',
    category: 'Periféricos',
    price: 55.00,
    cost: 30.00,
    stock: 12,
    minStock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    isAvailableOnline: true
  },
  {
    id: 'prod-3',
    sku: 'CARG-GAN-65W',
    barcode: '741001234503',
    name: 'Cargador Rápido GaN 65W USB-C',
    category: 'Accesorios',
    price: 24.50,
    cost: 11.00,
    stock: 45,
    minStock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80',
    isAvailableOnline: true
  },
  {
    id: 'prod-4',
    sku: 'MOU-ERG-01',
    barcode: '741001234504',
    name: 'Mouse Ergonómico Inalámbrico Silent',
    category: 'Periféricos',
    price: 19.99,
    cost: 9.50,
    stock: 18,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80',
    isAvailableOnline: true
  },
  {
    id: 'prod-5',
    sku: 'SMART-WATCH-GT',
    barcode: '741001234505',
    name: 'Smartwatch Fitness AMOLED IP68',
    category: 'Wearables',
    price: 68.00,
    cost: 38.00,
    stock: 4, // Alerta de stock bajo!
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    isAvailableOnline: true
  },
  {
    id: 'prod-6',
    sku: 'HUB-USB-7IN1',
    barcode: '741001234506',
    name: 'Adaptador Hub USB-C 7 en 1 HDMI 4K',
    category: 'Accesorios',
    price: 29.00,
    cost: 14.00,
    stock: 15,
    minStock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
    isAvailableOnline: true
  },
  {
    id: 'prod-7',
    sku: 'CAM-WEB-1080P',
    barcode: '741001234507',
    name: 'Cámara Web Full HD 1080p con Micrófono',
    category: 'Video',
    price: 32.50,
    cost: 16.00,
    stock: 2, // Alerta stock crítico
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80',
    isAvailableOnline: true
  },
  {
    id: 'prod-8',
    sku: 'SOP-LAP-ALUM',
    barcode: '741001234508',
    name: 'Soporte Plegable de Aluminio para Laptop',
    category: 'Accesorios',
    price: 16.00,
    cost: 7.50,
    stock: 30,
    minStock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
    isAvailableOnline: true
  }
];
