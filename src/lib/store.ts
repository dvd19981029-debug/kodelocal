// src/lib/store.ts

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  officialName?: string; // Nombre comercial oficial (ej. Hombre Salvaje)
  brand?: string;
  gender?: string; // Caballero, Dama, Unisex
  category: string;
  unit: string; // Onza, Unidad, Paquete, Galón
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  imageUrl: string;
  description?: string;
  isAvailableOnline: boolean;
  puesto?: string; // Ubicación física en estante (Ej: A1 = Estante A, Nivel 1)
  supplier?: string; // Proveedor (ej. APAESA GUATEMALA)
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface SaleRecord {
  id: string;
  saleNumber: string;
  orderNumber?: string;
  createdAt: string;
  cotizacionDate?: string;
  invoicedAt?: string;
  total: number;
  subtotal: number;
  ivaTotal: number;
  paymentMethod?: 'CASH' | 'CARD' | 'TRANSFER' | 'BITCOIN';
  cashReceived?: number;
  cashChange?: number;
  tipoComprobante?: 'TICKET' | '01' | '03';
  cliente: {
    nombre: string;
    numDocumento?: string;
    nrc?: string;
    correo?: string;
    direccion?: string;
    departamento?: string;
    municipio?: string;
    telefono?: string;
    actividadEconomica?: string;
    categoriaContribuyente?: string;
  };
  dteInfo?: {
    codigoGeneracion?: string;
    numeroControl?: string;
    selloRecepcion?: string;
    estado?: string;
    simulated?: boolean;
    mensaje?: string;
    mhDteUrl?: string;
    pdfUrl?: string;
    jsonUrl?: string;
  };
  status?: 'PREFACTURA' | 'PENDING_PREPARATION' | 'READY_AT_WINDOW' | 'COMPLETED' | 'CANCELLED';
  channel?: 'POS' | 'ONLINE';
  shippingCost?: number;
  deliveryNotes?: string;
  vendedor?: string;
  cajero?: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    unit?: string;
    puesto?: string;
  }[];
}

export const PERFUME_CATEGORIES = [
  "Esencias para Perfume",
  "Botes",
  "Empaque",
  "Insumos y Materia Prima"
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    "id": "bote-100ml-acanalado-blanco",
    "sku": "BOT-100-ACA-B",
    "barcode": "741002000003",
    "name": "Bote de Vidrio 100ml Acanalado - Tapa Blanca / Oro",
    "officialName": "Bote de Vidrio 100ml Acanalado - Tapa Blanca / Oro",
    "brand": "",
    "gender": "Dama",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3,
    "cost": 0.47,
    "stock": 54,
    "minStock": 10,
    "imageUrl": "/images/botes/bote_100ml_acanalado_tapa_blanca.jpg",
    "description": "Frasco cilíndrico acanalado estriado de 100ml con tapa blanca mate y ribete dorado.",
    "isAvailableOnline": true,
    "puesto": "B2"
  },
  {
    "id": "bote-100ml-acanalado-negro",
    "sku": "BOT-100-ACA-N",
    "barcode": "741002000004",
    "name": "Bote de Vidrio 100ml Acanalado - Tapa Negra / Oro",
    "officialName": "Bote de Vidrio 100ml Acanalado - Tapa Negra / Oro",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3,
    "cost": 0.47,
    "stock": 54,
    "minStock": 10,
    "imageUrl": "/images/botes/bote_100ml_acanalado_tapa_negra.jpg",
    "description": "Frasco cilíndrico acanalado estriado de 100ml con tapa negra mate y ribete dorado.",
    "isAvailableOnline": true,
    "puesto": "B2"
  },
  {
    "id": "bote-100ml-chanel-cristal",
    "sku": "BOT-100-CHA-C",
    "barcode": "741002000016",
    "name": "Bote de Vidrio 100ml Rectangular Clásico - Tapa Cristal Facetada",
    "officialName": "Bote de Vidrio 100ml Rectangular Clásico - Tapa Cristal Facetada",
    "brand": "",
    "gender": "Dama",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.25,
    "cost": 0.52,
    "stock": 320,
    "minStock": 25,
    "imageUrl": "/images/botes/bote_100ml_chanel_tapa_cristal.jpg",
    "description": "Frasco rectangular biselado de 100ml estilo Chanel No. 5 con tapa facetada de cristal acrílico traslúcido.",
    "isAvailableOnline": true,
    "puesto": "B5"
  },
  {
    "id": "bote-100ml-cilindrico-alto-negro",
    "sku": "BOT-100-CIL-AN",
    "barcode": "741002000019",
    "name": "Bote de Vidrio 100ml Cilíndrico Alto - Tapa Negra Clásica",
    "officialName": "Bote de Vidrio 100ml Cilíndrico Alto - Tapa Negra Clásica",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 2.5,
    "cost": 0.4,
    "stock": 1980,
    "minStock": 100,
    "imageUrl": "/images/botes/bote_100ml_cilindrico_alto_tapa_negra.jpg",
    "description": "Frasco cilíndrico alto de vidrio grueso de 100ml con hombros redondeados suaves y tapa negra brillante.",
    "isAvailableOnline": true,
    "puesto": "B6"
  },
  {
    "id": "bote-100ml-cilindrico-tapa-negra",
    "sku": "BOT-100-CIL-TN",
    "barcode": "741002000011",
    "name": "Bote de Vidrio 100ml Cilíndrico Cristal - Tapa Negra",
    "officialName": "Bote de Vidrio 100ml Cilíndrico Cristal - Tapa Negra",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 2.75,
    "cost": 0.45,
    "stock": 280,
    "minStock": 25,
    "imageUrl": "/images/botes/bote_100ml_cilindrico_tapa_negra.jpg",
    "description": "Frasco cilíndrico transparente de 100ml con hombros suaves y tapa negra brillante de lujo.",
    "isAvailableOnline": true,
    "puesto": "B4"
  },
  {
    "id": "bote-100ml-cuadrado-bleu",
    "sku": "BOT-100-CUA-B",
    "barcode": "741002000005",
    "name": "Bote de Vidrio 100ml Cuadrado Azul Oscuro - Tapa Negra",
    "officialName": "Bote de Vidrio 100ml Cuadrado Azul Oscuro - Tapa Negra",
    "brand": "",
    "gender": "Caballero",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.25,
    "cost": 0.56,
    "stock": 300,
    "minStock": 25,
    "imageUrl": "/images/botes/bote_100ml_cuadrado_bleu_negro.jpg",
    "description": "Frasco cuadrado plano de 100ml en vidrio azul marino profundo estilo Bleu de Chanel con tapa negra.",
    "isAvailableOnline": true,
    "puesto": "B2"
  },
  {
    "id": "bote-100ml-diamante-plata",
    "sku": "BOT-100-DIA-P",
    "barcode": "741002000001",
    "name": "Bote de Vidrio 100ml Relieve Diamante - Tapa Plata",
    "officialName": "Bote de Vidrio 100ml Relieve Diamante - Tapa Plata",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 2.75,
    "cost": 0.43,
    "stock": 288,
    "minStock": 25,
    "imageUrl": "/images/botes/bote_100ml_diamante_plata.jpg",
    "description": "Frasco de vidrio de 100ml con textura en relieve de diamante y tapa atomizadora plateada cromada.",
    "isAvailableOnline": true,
    "puesto": "B1"
  },
  {
    "id": "bote-100ml-frosted-cilindro-madera-clara",
    "sku": "BOT-100-FRO-CMC",
    "barcode": "741002000012",
    "name": "Bote de Vidrio 100ml Esmerilado - Tapa Madera Clara",
    "officialName": "Bote de Vidrio 100ml Esmerilado - Tapa Madera Clara",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.5,
    "cost": 0.55,
    "stock": 94,
    "minStock": 15,
    "imageUrl": "/images/botes/bote_100ml_frosted_cilindro_madera_clara.jpg",
    "description": "Frasco esmerilado de 100ml con tapa cilíndrica de madera natural clara veteada.",
    "isAvailableOnline": true,
    "puesto": "B4"
  },
  {
    "id": "bote-100ml-frosted-cilindro-madera-media",
    "sku": "BOT-100-FRO-CMM",
    "barcode": "741002000013",
    "name": "Bote de Vidrio 100ml Esmerilado - Tapa Madera Media Nogal",
    "officialName": "Bote de Vidrio 100ml Esmerilado - Tapa Madera Media Nogal",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.5,
    "cost": 0.55,
    "stock": 93,
    "minStock": 15,
    "imageUrl": "/images/botes/bote_100ml_frosted_cilindro_madera_media.jpg",
    "description": "Frasco esmerilado de 100ml con tapa cilíndrica de madera cálida tono nogal.",
    "isAvailableOnline": true,
    "puesto": "B4"
  },
  {
    "id": "bote-100ml-frosted-cilindro-madera-oscura",
    "sku": "BOT-100-FRO-CMO",
    "barcode": "741002000014",
    "name": "Bote de Vidrio 100ml Esmerilado - Tapa Madera Oscura Wengué",
    "officialName": "Bote de Vidrio 100ml Esmerilado - Tapa Madera Oscura Wengué",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.5,
    "cost": 0.55,
    "stock": 93,
    "minStock": 15,
    "imageUrl": "/images/botes/bote_100ml_frosted_cilindro_madera_oscura.jpg",
    "description": "Frasco esmerilado de 100ml con tapa cilíndrica de madera oscura tono wengué.",
    "isAvailableOnline": true,
    "puesto": "B4"
  },
  {
    "id": "bote-100ml-frosted-esfera-madera-clara",
    "sku": "BOT-100-FRO-EMC",
    "barcode": "741002000006",
    "name": "Bote de Vidrio 100ml Esmerilado - Tapa Esfera Madera Clara",
    "officialName": "Bote de Vidrio 100ml Esmerilado - Tapa Esfera Madera Clara",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.5,
    "cost": 0.57,
    "stock": 245,
    "minStock": 20,
    "imageUrl": "/images/botes/bote_100ml_frosted_esfera_madera_clara.jpg",
    "description": "Frasco esmerilado satinado de 100ml con hombros curvos y tapa esférica de madera natural clara.",
    "isAvailableOnline": true,
    "puesto": "B3"
  },
  {
    "id": "bote-100ml-frosted-esfera-madera-oscura",
    "sku": "BOT-100-FRO-EMO",
    "barcode": "741002000007",
    "name": "Bote de Vidrio 100ml Esmerilado - Tapa Esfera Madera Oscura",
    "officialName": "Bote de Vidrio 100ml Esmerilado - Tapa Esfera Madera Oscura",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.5,
    "cost": 0.57,
    "stock": 245,
    "minStock": 20,
    "imageUrl": "/images/botes/bote_100ml_frosted_esfera_madera_oscura.jpg",
    "description": "Frasco esmerilado satinado de 100ml con hombros curvos y tapa esférica de madera oscura nogal.",
    "isAvailableOnline": true,
    "puesto": "B3"
  },
  {
    "id": "bote-100ml-hombro-curvo-blanco",
    "sku": "BOT-100-HC-B",
    "barcode": "741002000008",
    "name": "Bote de Vidrio 100ml Cilíndrico Hombro Curvo - Tapa Blanca / Oro",
    "officialName": "Bote de Vidrio 100ml Cilíndrico Hombro Curvo - Tapa Blanca / Oro",
    "brand": "",
    "gender": "Dama",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.5,
    "cost": 0.66,
    "stock": 70,
    "minStock": 15,
    "imageUrl": "/images/botes/bote_100ml_cilindrico_hombro_blanco.jpg",
    "description": "Frasco cilíndrico de 100ml con hombros redondeados, tapa cilíndrica blanca y cuello dorado brillante.",
    "isAvailableOnline": true,
    "puesto": "B3"
  },
  {
    "id": "bote-100ml-hombro-curvo-negro",
    "sku": "BOT-100-HC-N",
    "barcode": "741002000009",
    "name": "Bote de Vidrio 100ml Cilíndrico Hombro Curvo - Tapa Negra / Oro",
    "officialName": "Bote de Vidrio 100ml Cilíndrico Hombro Curvo - Tapa Negra / Oro",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.5,
    "cost": 0.66,
    "stock": 70,
    "minStock": 15,
    "imageUrl": "/images/botes/bote_100ml_cilindrico_hombro_negro.jpg",
    "description": "Frasco cilíndrico de 100ml con hombros redondeados, tapa cilíndrica negra y cuello dorado brillante.",
    "isAvailableOnline": true,
    "puesto": "B3"
  },
  {
    "id": "bote-100ml-rectangular-frosted-plata",
    "sku": "BOT-100-REC-FP",
    "barcode": "741002000015",
    "name": "Bote de Vidrio 100ml Rectangular Esmerilado - Tapa Plata Mate",
    "officialName": "Bote de Vidrio 100ml Rectangular Esmerilado - Tapa Plata Mate",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.25,
    "cost": 0.54,
    "stock": 320,
    "minStock": 25,
    "imageUrl": "/images/botes/bote_100ml_rectangular_frosted_plata.jpg",
    "description": "Frasco rectangular de vidrio esmerilado satinado de 100ml con atomizador y tapa de aluminio plata mate.",
    "isAvailableOnline": true,
    "puesto": "B5"
  },
  {
    "id": "bote-100ml-rockstud-tapa-cobre",
    "sku": "BOT-100-ROC-C",
    "barcode": "741002000018",
    "name": "Bote de Vidrio 100ml Rockstud Pirámides - Tapa Café Cobre / Oro",
    "officialName": "Bote de Vidrio 100ml Rockstud Pirámides - Tapa Café Cobre / Oro",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.75,
    "cost": 0.68,
    "stock": 150,
    "minStock": 15,
    "imageUrl": "/images/botes/bote_100ml_rockstud_tapa_cobre.jpg",
    "description": "Frasco de 100ml con relieve facetado de pirámides tachonadas estilo Valentino Born in Roma con tapa tono café cobre.",
    "isAvailableOnline": true,
    "puesto": "B5"
  },
  {
    "id": "bote-100ml-rockstud-tapa-negra",
    "sku": "BOT-100-ROC-N",
    "barcode": "741002000017",
    "name": "Bote de Vidrio 100ml Rockstud Pirámides - Tapa Negra",
    "officialName": "Bote de Vidrio 100ml Rockstud Pirámides - Tapa Negra",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.25,
    "cost": 0.48,
    "stock": 150,
    "minStock": 15,
    "imageUrl": "/images/botes/bote_100ml_rockstud_tapa_negra.jpg",
    "description": "Frasco de 100ml con relieve facetado de pirámides tachonadas estilo Valentino Born in Roma y tapa negra.",
    "isAvailableOnline": true,
    "puesto": "B5"
  },
  {
    "id": "bote-100ml-santal-oro",
    "sku": "BOT-100-SAN-O",
    "barcode": "741002000010",
    "name": "Bote de Vidrio 100ml Estilo Le Labo - Tapa Oro Moleteada",
    "officialName": "Bote de Vidrio 100ml Estilo Le Labo - Tapa Oro Moleteada",
    "brand": "",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.25,
    "cost": 0.52,
    "stock": 210,
    "minStock": 20,
    "imageUrl": "/images/botes/bote_100ml_santal_tapa_oro.jpg",
    "description": "Frasco botica de 100ml estilo Le Labo con tapa pesada de oro champagne moleteado diamantado.",
    "isAvailableOnline": true,
    "puesto": "B4"
  },
  {
    "id": "bote-100ml-sauvage-degrade",
    "sku": "BOT-100-SAU-N",
    "barcode": "741002000002",
    "name": "Bote de Vidrio 100ml Degradé Azul Noche - Tapa Negra",
    "officialName": "Bote de Vidrio 100ml Degradé Azul Noche - Tapa Negra",
    "brand": "",
    "gender": "Caballero",
    "category": "Botes",
    "unit": "Unidad",
    "price": 3.25,
    "cost": 0.56,
    "stock": 490,
    "minStock": 40,
    "imageUrl": "/images/botes/bote_100ml_sauvage_degrade_negro.jpg",
    "description": "Frasco cilíndrico de 100ml estilo Sauvage en degradé azul noche a negro con tapa ranurada negra.",
    "isAvailableOnline": true,
    "puesto": "B1"
  },
  {
    "id": "bolsa-lujo",
    "sku": "EMP-BOL",
    "barcode": "741999000EMP-BOL",
    "name": "Bolsa de Lujo Kraft Aromaniak",
    "officialName": "Bolsa de Lujo Kraft Aromaniak",
    "brand": "",
    "gender": "Unisex",
    "category": "Empaque",
    "unit": "Unidad",
    "price": 0.5,
    "cost": 0.2,
    "stock": 0,
    "minStock": 20,
    "imageUrl": "/images/botes/bote_100ml_sauvage_degrade_negro.jpg",
    "description": "",
    "isAvailableOnline": true,
    "puesto": ""
  },
  {
    "id": "caja-regalo",
    "sku": "EMP-CAJ",
    "barcode": "741999000EMP-CAJ",
    "name": "Caja de Presentación / Regalo",
    "officialName": "Caja de Presentación / Regalo",
    "brand": "",
    "gender": "Unisex",
    "category": "Empaque",
    "unit": "Unidad",
    "price": 0.75,
    "cost": 0.35,
    "stock": 0,
    "minStock": 20,
    "imageUrl": "/images/botes/bote_100ml_sauvage_degrade_negro.jpg",
    "description": "",
    "isAvailableOnline": true,
    "puesto": ""
  },
  {
    "id": "esencia-apae-001",
    "sku": "1",
    "barcode": "741001000001",
    "name": "Fiera",
    "officialName": "Fiera",
    "brand": "Dior",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 247,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_1.webp?v=aroma_official_v3",
    "description": "Inspirado en SAUVAGE DIOR",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-010",
    "sku": "10",
    "barcode": "741001000010",
    "name": "Nicho Y Papiro",
    "officialName": "Nicho Y Papiro",
    "brand": "Le Labo",
    "gender": "Unisex",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_10.webp?v=aroma_official_v3",
    "description": "Inspirado en SANTAL 33 LE LABO",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-011",
    "sku": "11",
    "barcode": "741001000011",
    "name": "EuroBoy Intense",
    "officialName": "EuroBoy Intense",
    "brand": "Valentino",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_11.webp?v=aroma_official_v3",
    "description": "Inspirado en VALENTINO BORN IN ROMA INTENSE",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-012",
    "sku": "12",
    "barcode": "741001000012",
    "name": "Hiedra Natural",
    "officialName": "Hiedra Natural",
    "brand": "Xerjoff",
    "gender": "Unisex",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_12.webp?v=aroma_official_v3",
    "description": "Inspirado en ERBA PURA XERJOFF",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-013",
    "sku": "13",
    "barcode": "741001000013",
    "name": "Pink Lady",
    "officialName": "Pink Lady",
    "brand": "Chanel",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_13.webp?v=aroma_official_v3",
    "description": "Inspirado en COCO MADEMOISELLE CHANEL",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-014",
    "sku": "14",
    "barcode": "741001000014",
    "name": "Ocean Lord",
    "officialName": "Ocean Lord",
    "brand": "Dolce &amp; Gabbana",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_14.webp?v=aroma_official_v3",
    "description": "Inspirado en DOLCE & GABBANA LIGHT BLUE MEN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-015",
    "sku": "15",
    "barcode": "741001000015",
    "name": "Lobo Financiero",
    "officialName": "Lobo Financiero",
    "brand": "Hugo Boss",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_15.webp?v=aroma_official_v3",
    "description": "Inspirado en BOSS BOTTLED",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-016",
    "sku": "16",
    "barcode": "741001000016",
    "name": "Boxeador",
    "officialName": "Boxeador",
    "brand": "Paco Rabanne",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_16.webp?v=aroma_official_v3",
    "description": "Inspirado en INVICTUS TYPE FINE INSPIRATION",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-017",
    "sku": "17",
    "barcode": "741001000017",
    "name": "Euro Heredera",
    "officialName": "Euro Heredera",
    "brand": "Burberry",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_17.webp?v=aroma_official_v3",
    "description": "Inspirado en BURBERRY HER",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-018",
    "sku": "18",
    "barcode": "741001000018",
    "name": "ManEater",
    "officialName": "ManEater",
    "brand": "Carolina Herrera",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_18.webp?v=aroma_official_v3",
    "description": "Inspirado en 212 VIP ROSE / VIP WOMAN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-019",
    "sku": "19",
    "barcode": "741001000019",
    "name": "Elite",
    "officialName": "Elite",
    "brand": "Ralph Lauren",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_19.webp?v=aroma_official_v3",
    "description": "Inspirado en POLO BLUE Z 1",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-002",
    "sku": "2",
    "barcode": "741001000002",
    "name": "Marino",
    "officialName": "Marino",
    "brand": "Chanel",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 176,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_2.webp?v=aroma_official_v3",
    "description": "Inspirado en BLEU DE CHANEL",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-020",
    "sku": "20",
    "barcode": "741001000020",
    "name": "RichRich",
    "officialName": "RichRich",
    "brand": "Paco Rabanne",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_20.webp?v=aroma_official_v3",
    "description": "Inspirado en ONE MILLION",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-021",
    "sku": "21",
    "barcode": "741001000021",
    "name": "Lady Money",
    "officialName": "Lady Money",
    "brand": "Chanel",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_21.webp?v=aroma_official_v3",
    "description": "Inspirado en COCO CHANEL",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-022",
    "sku": "22",
    "barcode": "741001000022",
    "name": "New York Lady",
    "officialName": "New York Lady",
    "brand": "Chanel",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_22.webp?v=aroma_official_v3",
    "description": "Inspirado en CHANCE CHANEL",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-023",
    "sku": "23",
    "barcode": "741001000023",
    "name": "Habibi",
    "officialName": "Habibi",
    "brand": "Afnan",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_23.webp?v=aroma_official_v3",
    "description": "Inspirado en 9PM TYPE AFNAN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-024",
    "sku": "24",
    "barcode": "741001000024",
    "name": "Gran hombre",
    "officialName": "Gran hombre",
    "brand": "Jean Paul Gaultier",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_24.webp?v=aroma_official_v3",
    "description": "Inspirado en LE MALE JEAN PAUL GAULTIER",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-025",
    "sku": "25",
    "barcode": "741001000025",
    "name": "Magnolia",
    "officialName": "Magnolia",
    "brand": "Dior",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_25.webp?v=aroma_official_v3",
    "description": "Inspirado en J'ADORE DIOR TYPE B",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-026",
    "sku": "26",
    "barcode": "741001000026",
    "name": "American Boy",
    "officialName": "American Boy",
    "brand": "Tommy Hilfiger",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_26.webp?v=aroma_official_v3",
    "description": "Inspirado en TOMMY FOR MEN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-027",
    "sku": "27",
    "barcode": "741001000027",
    "name": "Oberlin",
    "officialName": "Oberlin",
    "brand": "Chanel",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_27.webp?v=aroma_official_v3",
    "description": "Inspirado en CHANEL NO. 5",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-028",
    "sku": "28",
    "barcode": "741001000028",
    "name": "Irresistible",
    "officialName": "Irresistible",
    "brand": "Carolina Herrera",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_28.webp?v=aroma_official_v3",
    "description": "Inspirado en BAD BOY CAROLINA HERRERA",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-029",
    "sku": "29",
    "barcode": "741001000029",
    "name": "Charli Apple",
    "officialName": "Charli Apple",
    "brand": "DKNY",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_29.webp?v=aroma_official_v3",
    "description": "Inspirado en BE DELICIOUS DKNY",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-003",
    "sku": "3",
    "barcode": "741001000003",
    "name": "David Ocean",
    "officialName": "David Ocean",
    "brand": "Giorgio Armani",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 141,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_3.webp?v=aroma_official_v3",
    "description": "Inspirado en ACQUA DI GIO",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-030",
    "sku": "30",
    "barcode": "741001000030",
    "name": "Mon Cherry",
    "officialName": "Mon Cherry",
    "brand": "Tom Ford",
    "gender": "Unisex",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_30.webp?v=aroma_official_v3",
    "description": "Inspirado en OH CHERRY (LOST CHERRY)",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-031",
    "sku": "31",
    "barcode": "741001000031",
    "name": "Fiestero",
    "officialName": "Fiestero",
    "brand": "Jean Paul Gaultier",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_31.webp?v=aroma_official_v3",
    "description": "Inspirado en SCANDAL JEAN PAUL GAULTIER TYPE",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-032",
    "sku": "32",
    "barcode": "741001000032",
    "name": "Euro Girl",
    "officialName": "Euro Girl",
    "brand": "Valentino",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_32.webp?v=aroma_official_v3",
    "description": "Inspirado en VALENTINO DONNA TYPE",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-033",
    "sku": "33",
    "barcode": "741001000033",
    "name": "Rey Luis",
    "officialName": "Rey Luis",
    "brand": "Louis Vuitton",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_33.webp?v=aroma_official_v3",
    "description": "Inspirado en L'IMMENSITE LOUIS VUITTON",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-034",
    "sku": "34",
    "barcode": "741001000034",
    "name": "Wife Material",
    "officialName": "Wife Material",
    "brand": "Carolina Herrera",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_34.webp?v=aroma_official_v3",
    "description": "Inspirado en 212 VIP CAROLINA HERRERA",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-035",
    "sku": "35",
    "barcode": "741001000035",
    "name": "Euro Samurai",
    "officialName": "Euro Samurai",
    "brand": "Victorinox",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_35.webp?v=aroma_official_v3",
    "description": "Inspirado en SWISS ARMY",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-036",
    "sku": "36",
    "barcode": "741001000036",
    "name": "Basic White",
    "officialName": "Basic White",
    "brand": "Lacoste",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_36.webp?v=aroma_official_v3",
    "description": "Inspirado en LACOSTE BLANC L1212",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-037",
    "sku": "37",
    "barcode": "741001000037",
    "name": "Georgia Icon",
    "officialName": "Georgia Icon",
    "brand": "Giorgio Armani",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_37.webp?v=aroma_official_v3",
    "description": "Inspirado en ACQUA DI GIO WOMAN TYPE",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-038",
    "sku": "38",
    "barcode": "741001000038",
    "name": "Night Sky",
    "officialName": "Night Sky",
    "brand": "Ralph Lauren",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_38.webp?v=aroma_official_v3",
    "description": "Inspirado en POLO BLACK",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-039",
    "sku": "39",
    "barcode": "741001000039",
    "name": "CowBoy Girl",
    "officialName": "CowBoy Girl",
    "brand": "Ralph Lauren",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_39.webp?v=aroma_official_v3",
    "description": "Inspirado en RALPH BY RALPH LAUREN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-004",
    "sku": "4",
    "barcode": "741001000004",
    "name": "Videoclub",
    "officialName": "Videoclub",
    "brand": "Armaf",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 106,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_4.webp?v=aroma_official_v3",
    "description": "Inspirado en CLUB DE NUIT INTENSE ARMAF MEN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-040",
    "sku": "40",
    "barcode": "741001000040",
    "name": "Dubai",
    "officialName": "Dubai",
    "brand": "Lattafa",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_40.webp?v=aroma_official_v3",
    "description": "Inspirado en YARA TYPE",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-041",
    "sku": "41",
    "barcode": "741001000041",
    "name": "Burj Khalifa",
    "officialName": "Burj Khalifa",
    "brand": "Lattafa",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_41.webp?v=aroma_official_v3",
    "description": "Inspirado en YARA TOUS LATTAFA M",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-042",
    "sku": "42",
    "barcode": "741001000042",
    "name": "Explosiva",
    "officialName": "Explosiva",
    "brand": "Viktor &amp; Rolf",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_42.webp?v=aroma_official_v3",
    "description": "Inspirado en FLOWERBOMB VIKTOR & ROLF",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-043",
    "sku": "43",
    "barcode": "741001000043",
    "name": "Adictiva",
    "officialName": "Adictiva",
    "brand": "Yves Saint Laurent",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_43.webp?v=aroma_official_v3",
    "description": "Inspirado en BLACK OPIUM",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-044",
    "sku": "44",
    "barcode": "741001000044",
    "name": "Emperador",
    "officialName": "Emperador",
    "brand": "Dior",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_44.webp?v=aroma_official_v3",
    "description": "Inspirado en DIOR HOMME SPORT",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-045",
    "sku": "45",
    "barcode": "741001000045",
    "name": "Classic Man",
    "officialName": "Classic Man",
    "brand": "Calvin Klein",
    "gender": "Unisex",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_45.webp?v=aroma_official_v3",
    "description": "Inspirado en CK ONE Z",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-046",
    "sku": "46",
    "barcode": "741001000046",
    "name": "England Phone",
    "officialName": "England Phone",
    "brand": "Perry Ellis",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_46.webp?v=aroma_official_v3",
    "description": "Inspirado en PERRY ELLIS 360 RED",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-047",
    "sku": "47",
    "barcode": "741001000047",
    "name": "England Forest",
    "officialName": "England Forest",
    "brand": "Elizabeth Arden",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_47.webp?v=aroma_official_v3",
    "description": "Inspirado en GREEN TEA ELIZABETH ARDEN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-048",
    "sku": "48",
    "barcode": "741001000048",
    "name": "Romanov",
    "officialName": "Romanov",
    "brand": "Vera Wang",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_48.webp?v=aroma_official_v3",
    "description": "Inspirado en PRINCESS VERA WANG",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-005",
    "sku": "5",
    "barcode": "741001000005",
    "name": "Explorador",
    "officialName": "Explorador",
    "brand": "Creed",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 106,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_5.webp?v=aroma_official_v3",
    "description": "Inspirado en AVENTUS CREED",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-006",
    "sku": "6",
    "barcode": "741001000006",
    "name": "Ella Es Linda",
    "officialName": "Ella Es Linda",
    "brand": "Lancôme",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 106,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_6.webp?v=aroma_official_v3",
    "description": "Inspirado en LA VIE EST BELLE",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-007",
    "sku": "7",
    "barcode": "741001000007",
    "name": "Citric Heaven",
    "officialName": "Citric Heaven",
    "brand": "Armaf",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_7.webp?v=aroma_official_v3",
    "description": "Inspirado en ODYSSEY MANDARIN SKY ARMAF MEN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-008",
    "sku": "8",
    "barcode": "741001000008",
    "name": "Atrevido",
    "officialName": "Atrevido",
    "brand": "Versace",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_8.webp?v=aroma_official_v3",
    "description": "Inspirado en EROS VERSACE",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "esencia-apae-009",
    "sku": "9",
    "barcode": "741001000009",
    "name": "Nippon",
    "officialName": "Nippon",
    "brand": "Issey Miyake",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.25,
    "cost": 1.95,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/images/esencias/esencia_9.webp?v=aroma_official_v3",
    "description": "Inspirado en L'EAU D'ISSEY MEN",
    "isAvailableOnline": true,
    "puesto": "A1"
  },
  {
    "id": "alcohol-perfumeria",
    "sku": "INS-ALC",
    "barcode": "741999000INS-ALC",
    "name": "Alcohol de Perfumería Especial 96° (Galón)",
    "officialName": "Alcohol de Perfumería Especial 96° (Galón)",
    "brand": "",
    "gender": "Unisex",
    "category": "Insumos y Materia Prima",
    "unit": "Galón",
    "price": 18,
    "cost": 11.5,
    "stock": 0,
    "minStock": 20,
    "imageUrl": "/images/botes/bote_100ml_sauvage_degrade_negro.jpg",
    "description": "",
    "isAvailableOnline": true,
    "puesto": ""
  }
];

export const DATA_VERSION = '2026_oficial_real_v14';

export function resetDatabaseToInitialStock(): ProductItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  
  const initialProducts: ProductItem[] = INITIAL_PRODUCTS.map(p => ({
    ...p
  }));

  try {
    localStorage.setItem('kodelocal_products', JSON.stringify(initialProducts));
    localStorage.setItem('kodelocal_sales', JSON.stringify([]));
    localStorage.setItem('kodelocal_purchases', JSON.stringify([]));
    localStorage.setItem('kodelocal_kardex', JSON.stringify([]));
    localStorage.setItem('kodelocal_data_version', DATA_VERSION);
  } catch (e) {
    console.error('Error in resetDatabaseToInitialStock:', e);
  }

  return initialProducts;
}

export function resetDatabaseToZeroStock(): ProductItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  
  // Poner stock en cero a solicitud explícita del usuario
  const zeroStockProducts: ProductItem[] = INITIAL_PRODUCTS.map(p => ({
    ...p,
    stock: 0
  }));

  try {
    localStorage.setItem('kodelocal_products', JSON.stringify(zeroStockProducts));
    localStorage.setItem('kodelocal_sales', JSON.stringify([]));
    localStorage.setItem('kodelocal_purchases', JSON.stringify([]));
    localStorage.setItem('kodelocal_kardex', JSON.stringify([]));
    localStorage.setItem('kodelocal_data_version', DATA_VERSION);
  } catch (e) {
    console.error('Error in resetDatabaseToZeroStock:', e);
  }

  return zeroStockProducts;
}

export function getStoredProducts(): ProductItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  
  const currentVersion = localStorage.getItem('kodelocal_data_version');
  if (currentVersion !== DATA_VERSION) {
    return resetDatabaseToInitialStock();
  }

  const saved = localStorage.getItem('kodelocal_products');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 20 && parsed[0]?.category !== 'Audio') {
        return parsed;
      }
    } catch (e) {}
  }
  return resetDatabaseToInitialStock();
}

export function checkAndMigrateToZeroStock(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const currentVersion = localStorage.getItem('kodelocal_data_version');
    if (currentVersion !== DATA_VERSION) {
      resetDatabaseToInitialStock();
      return true;
    }
  } catch (e) {
    console.error('Error in checkAndMigrateToZeroStock:', e);
  }
  return false;
}

export function saveStoredProducts(products: ProductItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kodelocal_products', JSON.stringify(products));
  window.dispatchEvent(new Event('kodelocal_products_updated'));
}
