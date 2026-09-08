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
    "id": "esencia-apaesa-1",
    "sku": "APAE 3774",
    "barcode": "741000000001",
    "name": "SAUVAGE DIOR",
    "officialName": "",
    "brand": "Dior",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 247,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=SAUVAGE DIOR",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-2",
    "sku": "APAE-2163",
    "barcode": "741000000002",
    "name": "BLEU DE CHANEL",
    "officialName": "",
    "brand": "Chanel",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 176,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=BLEU DE CHANEL",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-3",
    "sku": "APAE-2839",
    "barcode": "741000000003",
    "name": "ACQUA DI GIO",
    "officialName": "",
    "brand": "Giorgio Armani",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 141,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=ACQUA DI GIO",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-4",
    "sku": "APAE 3966",
    "barcode": "741000000004",
    "name": "CLUB DE NUIT INTENSE ARMAF MEN",
    "officialName": "",
    "brand": "Armaf",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 106,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=CLUB DE NUIT INTENSE ARMAF MEN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-5",
    "sku": "APAE-3843",
    "barcode": "741000000005",
    "name": "AVENTUS CREED",
    "officialName": "",
    "brand": "Creed",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 106,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=AVENTUS CREED",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-6",
    "sku": "APAE-2841",
    "barcode": "741000000006",
    "name": "LA VIE EST BELLE",
    "officialName": "",
    "brand": "Lancôme",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 106,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=LA VIE EST BELLE",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-7",
    "sku": "NP - 135726",
    "barcode": "741000000007",
    "name": "ODYSSEY MANDARIN SKY ARMAF MEN",
    "officialName": "",
    "brand": "Armaf",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=ODYSSEY MANDARIN SKY ARMAF MEN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-8",
    "sku": "APAE-3840",
    "barcode": "741000000008",
    "name": "EROS VERSACE",
    "officialName": "",
    "brand": "Versace",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=EROS VERSACE",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-9",
    "sku": "NP - 110326",
    "barcode": "741000000009",
    "name": "L'EAU D'ISSEY MEN",
    "officialName": "",
    "brand": "Issey Miyake",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=L'EAU D'ISSEY MEN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-10",
    "sku": "APAE 3913",
    "barcode": "741000000010",
    "name": "SANTAL 33 LE LABO",
    "officialName": "",
    "brand": "Le Labo",
    "gender": "Unisex",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=SANTAL 33 LE LABO",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-11",
    "sku": "NP-78726",
    "barcode": "741000000011",
    "name": "VALENTINO BORN IN ROMA INTENSE",
    "officialName": "",
    "brand": "Valentino",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=VALENTINO BORN IN ROMA INTENSE",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-12",
    "sku": "NP- 135626",
    "barcode": "741000000012",
    "name": "ERBA PURA XERJOFF",
    "officialName": "",
    "brand": "Xerjoff",
    "gender": "Unisex",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=ERBA PURA XERJOFF",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-13",
    "sku": "APAE 4147",
    "barcode": "741000000013",
    "name": "COCO MADEMOISELLE CHANEL",
    "officialName": "",
    "brand": "Chanel",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=COCO MADEMOISELLE CHANEL",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-14",
    "sku": "APAE-2305",
    "barcode": "741000000014",
    "name": "DOLCE & GABBANA LIGHT BLUE MEN",
    "officialName": "",
    "brand": "Dolce & Gabbana",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=DOLCE & GABBANA LIGHT BLUE MEN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-15",
    "sku": "APAE-3322",
    "barcode": "741000000015",
    "name": "BOSS BOTTLED",
    "officialName": "",
    "brand": "Hugo Boss",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=BOSS BOTTLED",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-16",
    "sku": "APAE 3566",
    "barcode": "741000000016",
    "name": "INVICTUS TYPE FINE INSPIRATION",
    "officialName": "",
    "brand": "Paco Rabanne",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=INVICTUS TYPE FINE INSPIRATION",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-17",
    "sku": "NP-128023",
    "barcode": "741000000017",
    "name": "BURBERRY HER",
    "officialName": "",
    "brand": "Burberry",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=BURBERRY HER",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-18",
    "sku": "APAE 3606",
    "barcode": "741000000018",
    "name": "212 VIP ROSE / VIP WOMAN",
    "officialName": "",
    "brand": "Carolina Herrera",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=212 VIP ROSE / VIP WOMAN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-19",
    "sku": "APAE-2299",
    "barcode": "741000000019",
    "name": "POLO BLUE Z 1",
    "officialName": "",
    "brand": "Ralph Lauren",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=POLO BLUE Z 1",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-20",
    "sku": "APAE-3567",
    "barcode": "741000000020",
    "name": "ONE MILLION",
    "officialName": "",
    "brand": "Paco Rabanne",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=ONE MILLION",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-21",
    "sku": "NP-117224",
    "barcode": "741000000021",
    "name": "COCO CHANEL",
    "officialName": "",
    "brand": "Chanel",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=COCO CHANEL",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-22",
    "sku": "APAE-3883",
    "barcode": "741000000022",
    "name": "CHANCE CHANEL",
    "officialName": "",
    "brand": "Chanel",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=CHANCE CHANEL",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-23",
    "sku": "APE 4148",
    "barcode": "741000000023",
    "name": "9PM TYPE AFNAN",
    "officialName": "",
    "brand": "Afnan",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=9PM TYPE AFNAN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-24",
    "sku": "APAE-3601",
    "barcode": "741000000024",
    "name": "LE MALE JEAN PAUL GAULTIER",
    "officialName": "",
    "brand": "Jean Paul Gaultier",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=LE MALE JEAN PAUL GAULTIER",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-25",
    "sku": "APAE-2154",
    "barcode": "741000000025",
    "name": "J'ADORE DIOR TYPE B",
    "officialName": "",
    "brand": "Dior",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=J'ADORE DIOR TYPE B",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-26",
    "sku": "APAE 3248",
    "barcode": "741000000026",
    "name": "TOMMY FOR MEN",
    "officialName": "",
    "brand": "Tommy Hilfiger",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=TOMMY FOR MEN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-27",
    "sku": "APAE-1475",
    "barcode": "741000000027",
    "name": "CHANEL NO. 5",
    "officialName": "",
    "brand": "Chanel",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=CHANEL NO. 5",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-28",
    "sku": "NP-122826",
    "barcode": "741000000028",
    "name": "BAD BOY CAROLINA HERRERA",
    "officialName": "",
    "brand": "Carolina Herrera",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=BAD BOY CAROLINA HERRERA",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-29",
    "sku": "NP-138824",
    "barcode": "741000000029",
    "name": "BE DELICIOUS DKNY",
    "officialName": "",
    "brand": "DKNY",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=BE DELICIOUS DKNY",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-30",
    "sku": "NP-47325",
    "barcode": "741000000030",
    "name": "OH CHERRY (LOST CHERRY)",
    "officialName": "",
    "brand": "Tom Ford",
    "gender": "Unisex",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 71,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=OH CHERRY (LOST CHERRY)",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-31",
    "sku": "APAE 4664",
    "barcode": "741000000031",
    "name": "SCANDAL JEAN PAUL GAULTIER TYPE",
    "officialName": "",
    "brand": "Jean Paul Gaultier",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=SCANDAL JEAN PAUL GAULTIER TYPE",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-32",
    "sku": "APAE 4645",
    "barcode": "741000000032",
    "name": "VALENTINO DONNA TYPE",
    "officialName": "",
    "brand": "Valentino",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=VALENTINO DONNA TYPE",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-33",
    "sku": "APAE-3864",
    "barcode": "741000000033",
    "name": "L'IMMENSITE LOUIS VUITTON",
    "officialName": "",
    "brand": "Louis Vuitton",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=L'IMMENSITE LOUIS VUITTON",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-34",
    "sku": "APAE-3815",
    "barcode": "741000000034",
    "name": "212 VIP CAROLINA HERRERA",
    "officialName": "",
    "brand": "Carolina Herrera",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=212 VIP CAROLINA HERRERA",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-35",
    "sku": "APAE-2245",
    "barcode": "741000000035",
    "name": "SWISS ARMY",
    "officialName": "",
    "brand": "Victorinox",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=SWISS ARMY",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-36",
    "sku": "APAE-4021",
    "barcode": "741000000036",
    "name": "LACOSTE BLANC L1212",
    "officialName": "",
    "brand": "Lacoste",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=LACOSTE BLANC L1212",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-37",
    "sku": "APAE 2123",
    "barcode": "741000000037",
    "name": "ACQUA DI GIO WOMAN TYPE",
    "officialName": "",
    "brand": "Giorgio Armani",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=ACQUA DI GIO WOMAN TYPE",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-38",
    "sku": "APAE-1904",
    "barcode": "741000000038",
    "name": "POLO BLACK",
    "officialName": "",
    "brand": "Ralph Lauren",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=POLO BLACK",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-39",
    "sku": "APAE-2844",
    "barcode": "741000000039",
    "name": "RALPH BY RALPH LAUREN",
    "officialName": "",
    "brand": "Ralph Lauren",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=RALPH BY RALPH LAUREN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-40",
    "sku": "APAE 4225",
    "barcode": "741000000040",
    "name": "YARA TYPE",
    "officialName": "",
    "brand": "Lattafa",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=YARA TYPE",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-41",
    "sku": "APAE 4192",
    "barcode": "741000000041",
    "name": "YARA TOUS LATTAFA M",
    "officialName": "",
    "brand": "Lattafa",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=YARA TOUS LATTAFA M",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-42",
    "sku": "APAE-3571",
    "barcode": "741000000042",
    "name": "FLOWERBOMB VIKTOR & ROLF",
    "officialName": "",
    "brand": "Viktor & Rolf",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=FLOWERBOMB VIKTOR & ROLF",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-43",
    "sku": "NP-31724",
    "barcode": "741000000043",
    "name": "BLACK OPIUM",
    "officialName": "",
    "brand": "Yves Saint Laurent",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=BLACK OPIUM",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-44",
    "sku": "NP-78121",
    "barcode": "741000000044",
    "name": "DIOR HOMME SPORT",
    "officialName": "",
    "brand": "Dior",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=DIOR HOMME SPORT",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-45",
    "sku": "APAE-2617",
    "barcode": "741000000045",
    "name": "CK ONE Z",
    "officialName": "",
    "brand": "Calvin Klein",
    "gender": "Unisex",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=CK ONE Z",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-46",
    "sku": "APAE-3288",
    "barcode": "741000000046",
    "name": "PERRY ELLIS 360 RED",
    "officialName": "",
    "brand": "Perry Ellis",
    "gender": "Caballero",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=PERRY ELLIS 360 RED",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-47",
    "sku": "NP-31519 ENS2",
    "barcode": "741000000047",
    "name": "GREEN TEA ELIZABETH ARDEN",
    "officialName": "",
    "brand": "Elizabeth Arden",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=GREEN TEA ELIZABETH ARDEN",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "esencia-apaesa-48",
    "sku": "APAE-3605",
    "barcode": "741000000048",
    "name": "PRINCESS VERA WANG",
    "officialName": "",
    "brand": "Vera Wang",
    "gender": "Dama",
    "category": "Esencias para Perfume",
    "unit": "Onza",
    "price": 3.75,
    "cost": 3.75,
    "stock": 35,
    "minStock": 15,
    "imageUrl": "/api/bottle-image?name=PRINCESS VERA WANG",
    "isAvailableOnline": true,
    "puesto": "A1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "bote-100ml-lux",
    "sku": "BOT-100-LUX",
    "barcode": "741000000903",
    "name": "Frasco de Vidrio Luxury 100ml Atomizador Negro Mate",
    "officialName": "Frasco 100ml Luxury",
    "brand": "Kōde Luxury Glass",
    "gender": "Unisex",
    "category": "Botes",
    "unit": "Unidad",
    "price": 2.5,
    "cost": 1.25,
    "stock": 100,
    "minStock": 10,
    "imageUrl": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80",
    "isAvailableOnline": true,
    "puesto": "B1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "ins-alc-gal",
    "sku": "INS-ALC-01",
    "barcode": "741000000907",
    "name": "Alcohol de Perfumería Desodorizado 96° (Galón)",
    "officialName": "Alcohol 96° Galón",
    "brand": "Kōde Lab",
    "gender": "Unisex",
    "category": "Insumos y Materia Prima",
    "unit": "Unidad",
    "price": 18.0,
    "cost": 10.0,
    "stock": 20,
    "minStock": 5,
    "imageUrl": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
    "isAvailableOnline": true,
    "puesto": "C1",
    "supplier": "APAESA GUATEMALA"
  },
  {
    "id": "ins-fij-500",
    "sku": "INS-FIJ-01",
    "barcode": "741000000908",
    "name": "Fijador de Fragancia Galaxolide 500ml",
    "officialName": "Fijador Galaxolide 500ml",
    "brand": "Kōde Lab",
    "gender": "Unisex",
    "category": "Insumos y Materia Prima",
    "unit": "Unidad",
    "price": 12.5,
    "cost": 7.0,
    "stock": 20,
    "minStock": 5,
    "imageUrl": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80",
    "isAvailableOnline": true,
    "puesto": "C1",
    "supplier": "APAESA GUATEMALA"
  }
];

export const DATA_VERSION = '2026_apaesa_guatemala_v1';

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
