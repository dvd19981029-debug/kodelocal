import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

// 1 Kg = 35.274 Onzas
const OZ_PER_KG = 35.274;

// Catálogo maestro de Esencias APAESA mapeado por SKU oficial (1..61), código de proveedor y nombres
export interface SupplierCatalogEntry {
  sku?: string;
  id_proveedor: string;
  name: string;
  contratipo?: string;
  price_per_kg: number;
}

const DEFAULT_APAESA_CATALOG: SupplierCatalogEntry[] = [
  { sku: '1', id_proveedor: 'APAE-3842', name: 'SAUVAGE DIOR', contratipo: 'FIERA', price_per_kg: 56.79 },
  { sku: '2', id_proveedor: 'APAE-2163', name: 'BLEU DE CHANEL', contratipo: 'MARINO', price_per_kg: 34.85 },
  { sku: '3', id_proveedor: 'APAE-2839', name: 'ACQUA DI GIO', contratipo: 'DAVID OCEAN', price_per_kg: 43.14 },
  { sku: '4', id_proveedor: 'APAE 3966', name: 'CLUB DE NUIT INTENSE ARMAF MEN', contratipo: 'VIDEOCLUB', price_per_kg: 71.672 },
  { sku: '5', id_proveedor: 'APAE-3843', name: 'AVENTUS CREED', contratipo: 'EXPLORADOR', price_per_kg: 71.15 },
  { sku: '6', id_proveedor: 'APAE-2841', name: 'LA VIE EST BELLE', contratipo: 'ELLA ES LINDA', price_per_kg: 51.22 },
  { sku: '7', id_proveedor: 'NP - 135726', name: 'ODYSSEY MANDARIN SKY ARMAF MEN', contratipo: 'CITRIC HEAVEN', price_per_kg: 62.922 },
  { sku: '8', id_proveedor: 'APAE-3840', name: 'EROS VERSACE', contratipo: 'ATREVIDO', price_per_kg: 48.6 },
  { sku: '9', id_proveedor: 'NP - 110326', name: "L'EAU D'ISSEY MEN", contratipo: 'NIPPON', price_per_kg: 35.37 },
  { sku: '10', id_proveedor: 'APAE 3913', name: 'SANTAL 33 LE LABO', contratipo: 'NICHO Y PAPIRO', price_per_kg: 63.412 },
  { sku: '11', id_proveedor: 'NP-78726', name: 'VALENTINO BORN IN ROMA INTENSE', contratipo: 'EUROBOY INTENSE', price_per_kg: 56.208 },
  { sku: '12', id_proveedor: 'NP- 135626', name: 'ERBA PURA XERJOFF', contratipo: 'HIEDRAFRAIS', price_per_kg: 56.538 },
  { sku: '13', id_proveedor: 'APAE 4147', name: 'COCO MADEMOISELLE CHANEL', contratipo: 'PINK LADY', price_per_kg: 63.84 },
  { sku: '14', id_proveedor: 'APAE-2305', name: 'DOLCE & GABBANA LIGHT BLUE MEN', contratipo: 'OCEAN LORD', price_per_kg: 45.4 },
  { sku: '15', id_proveedor: 'APAE-3322', name: 'BOSS BOTTLED', contratipo: 'WALLSTREET WOLF', price_per_kg: 46.408 },
  { sku: '16', id_proveedor: 'APAE 3566', name: 'INVICTUS TYPE FINE INSPIRATION', contratipo: 'KICKBOX', price_per_kg: 44.65 },
  { sku: '17', id_proveedor: 'NP-128023', name: 'BURBERRY HER', contratipo: 'EURO HEIRESS', price_per_kg: 50.9 },
  { sku: '18', id_proveedor: 'APAE 3606', name: '212 VIP ROSE / VIP WOMAN', contratipo: 'MANEATER', price_per_kg: 51.1 },
  { sku: '19', id_proveedor: 'APAE-2299', name: 'POLO BLUE Z 1', contratipo: 'ELITE', price_per_kg: 54.602 },
  { sku: '20', id_proveedor: 'APAE-3567', name: 'ONE MILLION', contratipo: 'RICHRICH', price_per_kg: 61.3 },
  { sku: '21', id_proveedor: 'NP-117224', name: 'COCO CHANEL', contratipo: 'LADY MONEY', price_per_kg: 69.746 },
  { sku: '22', id_proveedor: 'APAE-3883', name: 'CHANCE CHANEL', contratipo: 'NEW YORK LADY', price_per_kg: 32.95 },
  { sku: '23', id_proveedor: 'APE 4148', name: '9PM TYPE AFNAN', contratipo: 'HABIBI', price_per_kg: 67.65 },
  { sku: '24', id_proveedor: 'APAE-3601', name: 'LE MALE JEAN PAUL GAULTIER', contratipo: 'THE MAN', price_per_kg: 31.3 },
  { sku: '25', id_proveedor: 'APAE-2154', name: "J'ADORE DIOR TYPE B", contratipo: 'MAGNOLIA', price_per_kg: 29.34 },
  { sku: '26', id_proveedor: 'APAE 3248', name: 'TOMMY FOR MEN', contratipo: 'AMERICAN BOY', price_per_kg: 62.15 },
  { sku: '27', id_proveedor: 'APAE-1475', name: 'CHANEL NO. 5', contratipo: 'OBERLIN', price_per_kg: 55.35 },
  { sku: '28', id_proveedor: 'NP-122826', name: 'BAD BOY CAROLINA HERRERA', contratipo: 'IRRESISTIBLE', price_per_kg: 45.134 },
  { sku: '29', id_proveedor: 'NP-138824', name: 'BE DELICIOUS DKNY', contratipo: 'CHARLI APPLE', price_per_kg: 53.646 },
  { sku: '30', id_proveedor: 'NP-47325', name: 'OH CHERRY (LOST CHERRY)', contratipo: 'MON CHERRY', price_per_kg: 48.242 },
  { sku: '31', id_proveedor: 'APAE 4664', name: 'SCANDAL JEAN PAUL GAULTIER TYPE', contratipo: 'PARTYBOY', price_per_kg: 62.45 },
  { sku: '32', id_proveedor: 'APAE 4645', name: 'VALENTINO DONNA TYPE', contratipo: 'EURO GIRL', price_per_kg: 74.25 },
  { sku: '33', id_proveedor: 'APAE-3864', name: "L'IMMENSITE LOUIS VUITTON", contratipo: 'KING LUIS', price_per_kg: 65.112 },
  { sku: '34', id_proveedor: 'APAE-3815', name: '212 VIP CAROLINA HERRERA', contratipo: 'WIFE MATERIAL', price_per_kg: 44.854 },
  { sku: '35', id_proveedor: 'APAE-2245', name: 'SWISS ARMY', contratipo: 'EURO SAMURAI', price_per_kg: 36.524 },
  { sku: '36', id_proveedor: 'APAE-4021', name: 'LACOSTE BLANC L1212', contratipo: 'BASIC WHITE', price_per_kg: 49.43 },
  { sku: '37', id_proveedor: 'APAE 2123', name: 'ACQUA DI GIO WOMAN TYPE', contratipo: 'GEORGIA ICON', price_per_kg: 31.05 },
  { sku: '38', id_proveedor: 'APAE-1904', name: 'POLO BLACK', contratipo: 'NIGHT SKY', price_per_kg: 47.6 },
  { sku: '39', id_proveedor: 'APAE-2844', name: 'RALPH BY RALPH LAUREN', contratipo: 'COWBOY GIRL', price_per_kg: 45.524 },
  { sku: '40', id_proveedor: 'APAE 4225', name: 'YARA TYPE', contratipo: 'DUBAI', price_per_kg: 48.55 },
  { sku: '41', id_proveedor: 'APAE 4192', name: 'YARA TOUS LATTAFA M', contratipo: 'BURJ KHALIFA', price_per_kg: 38.2 },
  { sku: '42', id_proveedor: 'APAE-3571', name: 'FLOWERBOMB VIKTOR & ROLF', contratipo: 'ATOMIC FLOWER', price_per_kg: 68.374 },
  { sku: '43', id_proveedor: 'NP-31724', name: 'BLACK OPIUM', contratipo: 'AROMA ADDICT', price_per_kg: 55.95 },
  { sku: '44', id_proveedor: 'NP-78121', name: 'DIOR HOMME SPORT', contratipo: 'EMPERADOR', price_per_kg: 60.042 },
  { sku: '45', id_proveedor: 'APAE-2617', name: 'CK ONE Z', contratipo: 'CLASSIC MAN', price_per_kg: 38.2 },
  { sku: '46', id_proveedor: 'APAE-3288', name: 'PERRY ELLIS 360 RED', contratipo: 'ENGLAND PHONE', price_per_kg: 39.35 },
  { sku: '47', id_proveedor: 'NP-31519 ENS2', name: 'GREEN TEA ELIZABETH ARDEN', contratipo: 'ENGLAND FOREST', price_per_kg: 46.742 },
  { sku: '48', id_proveedor: 'APAE-3605', name: 'PRINCESS VERA WANG', contratipo: 'ROMANOV', price_per_kg: 30.11 },
  { sku: '49', id_proveedor: 'APAE-4901', name: 'SAUVAGE ELIXIR DIOR', contratipo: 'FIERA ELIXIR', price_per_kg: 56.79 },
  { sku: '50', id_proveedor: 'APAE-5001', name: 'VALENTINO BORN IN ROMA UOMO', contratipo: 'EUROBOY', price_per_kg: 67.02 },
  { sku: '51', id_proveedor: 'APAE-5101', name: 'ACQUA DI GIO PROFONDO ARMANI', contratipo: 'DEEP OCEAN', price_per_kg: 67.02 },
  { sku: '52', id_proveedor: 'APAE-5201', name: 'LE MALE ELIXIR JEAN PAUL GAULTIER', contratipo: 'THE MAN ELIXIR', price_per_kg: 67.02 },
  { sku: '53', id_proveedor: 'APAE-5301', name: 'STRONGER WITH YOU ARMANI', contratipo: 'ALWAYS WITH YOU', price_per_kg: 67.02 },
  { sku: '54', id_proveedor: 'APAE-5401', name: '212 MEN CAROLINA HERRERA', contratipo: 'MANHATTAN', price_per_kg: 67.02 },
  { sku: '55', id_proveedor: 'APAE-5501', name: 'BVLGARI MAN IN BLACK', contratipo: 'BLACK VOLCANO', price_per_kg: 67.02 },
  { sku: '56', id_proveedor: 'APAE-5601', name: 'ACQUA DI GIO PROFUMO ARMANI', contratipo: 'BLACK OCEAN', price_per_kg: 67.02 },
  { sku: '57', id_proveedor: 'APAE-5701', name: 'LA BOMBA CAROLINA HERRERA', contratipo: 'SWEET BOMB', price_per_kg: 67.02 },
  { sku: '58', id_proveedor: 'APAE-5801', name: 'GOOD GIRL CAROLINA HERRERA', contratipo: 'FEMME FATALE', price_per_kg: 67.02 },
  { sku: '59', id_proveedor: 'APAE-5901', name: 'TOY BOY MOSCHINO', contratipo: 'BLACK BEAR', price_per_kg: 67.02 },
  { sku: '60', id_proveedor: 'APAE-6001', name: 'BACCARAT ROUGE 540 MFK', contratipo: 'CRISTAL ROUGE', price_per_kg: 67.02 },
  { sku: '61', id_proveedor: 'APAE-6101', name: 'FAHRENHEIT DIOR', contratipo: 'KELVIN', price_per_kg: 67.02 },
];

function checkStaffAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const staffHeaderToken = request.headers.get('x-staff-token');
  const cookieHeader = request.headers.get('cookie') || '';
  const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
  const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

  return (
    verifyStaffInternalToken(staffHeaderToken) ||
    verifyStaffInternalToken(bearerToken) ||
    verifyStaffInternalToken(staffCookieToken)
  );
}

// Limpia sufijos de género (" H", " F", " M", " U") y normaliza texto para cruce con catálogo de proveedor
function cleanAndNormalize(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/\s+[HFMU]$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Obtiene la fecha YYYY-MM-DD en zona horaria de El Salvador (UTC-6)
function toElSalvadorDateKey(date: Date): string {
  const svTime = new Date(date.getTime() - 6 * 60 * 60 * 1000);
  return svTime.toISOString().split('T')[0];
}

// Convierte una línea de venta o pedido web en consumo real de inventario base (Onzas para esencias, Unidades para botes/insumos)
function parseItemConsumption(
  isEssence: boolean,
  quantity: number,
  unit?: string | null,
  itemName?: string | null,
  presentation?: string | null
): { baseQty: number; fullOzCount: number; halfOzCount: number } {
  const qty = Math.max(0, Number(quantity || 0));
  if (!isEssence) {
    return { baseQty: qty, fullOzCount: 0, halfOzCount: 0 };
  }

  const combined = `${unit || ''} ${itemName || ''} ${presentation || ''}`.toLowerCase();

  // Media Onza (0.5 Oz)
  if (
    combined.includes('½') ||
    combined.includes('media') ||
    combined.includes('0.5') ||
    combined.includes('1/2')
  ) {
    return { baseQty: qty * 0.5, fullOzCount: 0, halfOzCount: qty };
  }

  // Presentaciones de perfume terminado E-commerce (fórmula 33% concentración de esencia)
  if (combined.includes('30ml') || combined.includes('30 ml')) {
    return { baseQty: Number((qty * 0.34).toFixed(2)), fullOzCount: 0, halfOzCount: qty };
  }
  if (combined.includes('50ml') || combined.includes('50 ml')) {
    return { baseQty: Number((qty * 0.56).toFixed(2)), fullOzCount: 0, halfOzCount: qty };
  }
  if (combined.includes('100ml') || combined.includes('100 ml')) {
    return { baseQty: Number((qty * 1.12).toFixed(2)), fullOzCount: qty, halfOzCount: 0 };
  }

  // Por defecto: 1 Onza completa por unidad
  return { baseQty: qty * 1.0, fullOzCount: qty, halfOzCount: 0 };
}

export interface ReplenishmentParams {
  budget: number;
  historyDays: number;
  targetDos: number;
  leadTime: number;
  serviceLevelPct: number; // 90 | 95 | 98 | 99
  categoryFilter: 'ALL' | 'ESENCIAS' | 'BOTES' | 'INSUMOS';
  essenceOrderUnit: 'KG' | 'HALF_KG' | 'OZ'; // Unidad de compra al proveedor de esencias
  includeZeroSalesBelowMin: boolean; // Si true, incluye productos sin ventas recientes pero bajo stock mínimo
  catalog?: SupplierCatalogEntry[];
}

async function runReplenishmentEngine(params: ReplenishmentParams) {
  const {
    budget,
    historyDays = 30,
    targetDos = 60,
    leadTime = 14,
    serviceLevelPct = 95,
    categoryFilter = 'ALL',
    essenceOrderUnit = 'KG',
    includeZeroSalesBelowMin = false,
    catalog = [],
  } = params;

  const now = new Date();
  const windowStart = new Date(now.getTime() - historyDays * 24 * 60 * 60 * 1000);
  const priorWindowStart = new Date(windowStart.getTime() - historyDays * 24 * 60 * 60 * 1000);

  // 1. Consultar productos, proveedores, ventas reales, comandas en preparación y compras en tránsito en paralelo
  const [products, suppliers, salesInWindow, priorSales, activeComandas, ecomOrders, pendingPurchases] =
    await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.sale.findMany({
        where: {
          createdAt: { gte: windowStart },
          orderStatus: { not: 'CANCELADO' },
          OR: [
            { paymentStatus: 'COMPLETED' },
            { orderStatus: 'COMPLETED' },
            { dteDocument: { is: { estado: 'PROCESADO' } } },
          ],
        },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.sale.findMany({
        where: {
          createdAt: { gte: priorWindowStart, lt: windowStart },
          orderStatus: { not: 'CANCELADO' },
          OR: [
            { paymentStatus: 'COMPLETED' },
            { orderStatus: 'COMPLETED' },
            { dteDocument: { is: { estado: 'PROCESADO' } } },
          ],
        },
        include: { items: true },
      }),
      prisma.sale.findMany({
        where: {
          orderStatus: { in: ['PENDING_PREPARATION', 'READY_AT_WINDOW'] },
          paymentStatus: { not: 'COMPLETED' },
        },
        include: { items: true },
      }),
      prisma.ecommerceOrder.findMany({
        where: {
          createdAt: { gte: windowStart },
          orderStatus: { not: 'CANCELADO' },
          saleId: null, // Evitar doble conteo con ventas ya facturadas en POS
        },
        include: { items: true },
      }),
      prisma.purchase.findMany({
        where: { receptionStatus: 'PENDIENTE' },
        include: { items: true },
      }),
    ]);

  // Determinar ventana efectiva real de operación (días reales transcurridos desde la primera venta registrada en la ventana)
  let earliestSaleDate: Date | null = null;
  for (const s of salesInWindow) {
    if (!earliestSaleDate || s.createdAt < earliestSaleDate) {
      earliestSaleDate = s.createdAt;
    }
  }
  for (const eo of ecomOrders) {
    if (!earliestSaleDate || eo.createdAt < earliestSaleDate) {
      earliestSaleDate = eo.createdAt;
    }
  }

  // Construir lista de fechas diarias (YYYY-MM-DD) de la ventana efectiva
  const activeDaySet = new Set<string>();
  for (const s of salesInWindow) {
    activeDaySet.add(toElSalvadorDateKey(s.createdAt));
  }
  for (const eo of ecomOrders) {
    activeDaySet.add(toElSalvadorDateKey(eo.createdAt));
  }

  const calendarSpanDays = earliestSaleDate
    ? Math.max(1, Math.ceil((now.getTime() - earliestSaleDate.getTime()) / (1000 * 60 * 60 * 24)))
    : historyDays;
  const effectiveDays = Math.min(historyDays, Math.max(1, activeDaySet.size, calendarSpanDays));

  // Generar vector ordenado de días YYYY-MM-DD para serie temporal diaria
  const dailyDateKeys: string[] = [];
  for (let i = effectiveDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dailyDateKeys.push(toElSalvadorDateKey(d));
  }
  // Asegurar que todos los días con ventas reales estén incluidos en dailyDateKeys
  Array.from(activeDaySet)
    .sort()
    .forEach((dk) => {
      if (!dailyDateKeys.includes(dk)) dailyDateKeys.push(dk);
    });
  dailyDateKeys.sort();
  const numBuckets = Math.max(1, dailyDateKeys.length);

  // Mapa rápido de categoría por producto
  const isEssenceProduct = (p: (typeof products)[number]) => {
    const catName = (p.category?.name || '').toLowerCase();
    return (
      catName.includes('esencia') ||
      p.id.startsWith('esencia-') ||
      (p.unit || '').toLowerCase().includes('onza')
    );
  };

  const getProductGroup = (p: (typeof products)[number]): 'ESENCIAS' | 'BOTES' | 'INSUMOS' => {
    if (isEssenceProduct(p)) return 'ESENCIAS';
    const catName = (p.category?.name || '').toLowerCase();
    if (catName.includes('bote') || p.id.startsWith('bote-')) return 'BOTES';
    return 'INSUMOS';
  };

  const productById = new Map(products.map((p) => [p.id, p]));

  // Estructuras de acumulación por producto
  interface ProductDemandStats {
    totalBaseSold: number;
    fullOzSold: number;
    halfOzSold: number;
    totalRevenue: number;
    ordersCount: number;
    dailyBuckets: Record<string, number>;
    priorBaseSold: number;
    committedBaseQty: number;
    inTransitBaseQty: number;
    lastSaleAt: Date | null;
  }

  const demandMap = new Map<string, ProductDemandStats>();
  for (const p of products) {
    const buckets: Record<string, number> = {};
    for (const dk of dailyDateKeys) buckets[dk] = 0;
    demandMap.set(p.id, {
      totalBaseSold: 0,
      fullOzSold: 0,
      halfOzSold: 0,
      totalRevenue: 0,
      ordersCount: 0,
      dailyBuckets: buckets,
      priorBaseSold: 0,
      committedBaseQty: 0,
      inTransitBaseQty: 0,
      lastSaleAt: null,
    });
  }

  // Procesar ventas reales en la ventana actual
  let totalValidTransactions = 0;
  for (const sale of salesInWindow) {
    totalValidTransactions++;
    const dateKey = toElSalvadorDateKey(sale.createdAt);
    const seenProdsInSale = new Set<string>();

    for (const item of sale.items) {
      // Ignorar cargos de envío u otros servicios
      if (
        item.unit === 'Servicio' ||
        item.productId === 'ENVIO-DOM' ||
        (item.productName || '').toLowerCase().includes('servicio de envío')
      ) {
        continue;
      }

      const prod = productById.get(item.productId);
      if (!prod) continue;
      const stats = demandMap.get(prod.id);
      if (!stats) continue;

      const isEss = isEssenceProduct(prod);
      const { baseQty, fullOzCount, halfOzCount } = parseItemConsumption(
        isEss,
        item.quantity,
        item.unit,
        item.productName
      );

      stats.totalBaseSold += baseQty;
      stats.fullOzSold += fullOzCount;
      stats.halfOzSold += halfOzCount;
      stats.totalRevenue += Number(item.total || 0);
      stats.dailyBuckets[dateKey] = (stats.dailyBuckets[dateKey] || 0) + baseQty;
      if (!seenProdsInSale.has(prod.id)) {
        stats.ordersCount += 1;
        seenProdsInSale.add(prod.id);
      }
      if (!stats.lastSaleAt || sale.createdAt > stats.lastSaleAt) {
        stats.lastSaleAt = sale.createdAt;
      }
    }
  }

  // Procesar pedidos E-commerce pagados/completados sin factura POS duplicada
  for (const eo of ecomOrders) {
    const ecomStatus = String(eo.orderStatus || '');
    const isCompletedEcom =
      eo.paymentStatus === 'COMPLETED' ||
      ecomStatus === 'ENTREGADO' ||
      ecomStatus === 'EN_RUTA' ||
      ecomStatus === 'CONFIRMADO' ||
      ecomStatus === 'LISTO_PARA_ENTREGA';
    const isCommittedEcom = ecomStatus === 'NUEVO' || ecomStatus === 'EN_PREPARACION';
    const dateKey = toElSalvadorDateKey(eo.createdAt);

    for (const item of eo.items) {
      const prod = productById.get(item.productId);
      if (!prod) continue;
      const stats = demandMap.get(prod.id);
      if (!stats) continue;

      const isEss = isEssenceProduct(prod);
      const { baseQty, fullOzCount, halfOzCount } = parseItemConsumption(
        isEss,
        item.quantity,
        null,
        item.productName,
        item.presentation
      );

      if (isCompletedEcom) {
        stats.totalBaseSold += baseQty;
        stats.fullOzSold += fullOzCount;
        stats.halfOzSold += halfOzCount;
        stats.totalRevenue += Number(item.total || 0);
        stats.ordersCount += 1;
        stats.dailyBuckets[dateKey] = (stats.dailyBuckets[dateKey] || 0) + baseQty;
        if (!stats.lastSaleAt || eo.createdAt > stats.lastSaleAt) {
          stats.lastSaleAt = eo.createdAt;
        }
      } else if (isCommittedEcom) {
        stats.committedBaseQty += baseQty;
      }
    }
  }

  // Procesar ventas de la ventana previa (para tendencia histórica)
  for (const sale of priorSales) {
    for (const item of sale.items) {
      if (
        item.unit === 'Servicio' ||
        item.productId === 'ENVIO-DOM' ||
        (item.productName || '').toLowerCase().includes('servicio de envío')
      ) {
        continue;
      }
      const prod = productById.get(item.productId);
      if (!prod) continue;
      const stats = demandMap.get(prod.id);
      if (!stats) continue;
      const { baseQty } = parseItemConsumption(
        isEssenceProduct(prod),
        item.quantity,
        item.unit,
        item.productName
      );
      stats.priorBaseSold += baseQty;
    }
  }

  // Procesar Comandas activas en Bodega/Ventanilla (Stock Comprometido)
  for (const comanda of activeComandas) {
    for (const item of comanda.items) {
      if (
        item.unit === 'Servicio' ||
        item.productId === 'ENVIO-DOM' ||
        (item.productName || '').toLowerCase().includes('servicio de envío')
      ) {
        continue;
      }
      const prod = productById.get(item.productId);
      if (!prod) continue;
      const stats = demandMap.get(prod.id);
      if (!stats) continue;
      const { baseQty } = parseItemConsumption(
        isEssenceProduct(prod),
        item.quantity,
        item.unit,
        item.productName
      );
      stats.committedBaseQty += baseQty;
    }
  }

  // Procesar Compras pendientes de recepción en Bodega (Stock en Tránsito / On-Order)
  for (const purchase of pendingPurchases) {
    for (const pItem of purchase.items) {
      if (!pItem.productId) continue;
      const prod = productById.get(pItem.productId);
      if (!prod) continue;
      const stats = demandMap.get(prod.id);
      if (!stats) continue;

      const isEss = isEssenceProduct(prod);
      const unitLower = (pItem.unit || '').toLowerCase();
      const addedBase =
        isEss && (unitLower.includes('kg') || unitLower.includes('kilo'))
          ? Number(pItem.quantity || 0) * OZ_PER_KG
          : Number(pItem.quantity || 0);
      stats.inTransitBaseQty += addedBase;
    }
  }

  // Combinar catálogo por defecto con cualquier catálogo CSV subido por el usuario
  const customCatalogValid = Array.isArray(catalog) && catalog.length > 0 ? catalog : [];
  const mergedCatalog: SupplierCatalogEntry[] = [...DEFAULT_APAESA_CATALOG];

  for (const customItem of customCatalogValid) {
    const cNorm = cleanAndNormalize(customItem.name);
    const existingIdx = mergedCatalog.findIndex(
      (d) =>
        d.id_proveedor.toLowerCase().trim() === String(customItem.id_proveedor || '').toLowerCase().trim() ||
        (cNorm && cleanAndNormalize(d.name) === cNorm)
    );
    if (existingIdx >= 0) {
      mergedCatalog[existingIdx] = {
        ...mergedCatalog[existingIdx],
        id_proveedor: customItem.id_proveedor || mergedCatalog[existingIdx].id_proveedor,
        price_per_kg: Number(customItem.price_per_kg) || mergedCatalog[existingIdx].price_per_kg,
      };
    } else {
      mergedCatalog.push({
        id_proveedor: customItem.id_proveedor,
        name: customItem.name,
        price_per_kg: Number(customItem.price_per_kg),
      });
    }
  }

  // Función inteligente de cruce con el catálogo del proveedor (por SKU exacto, contratipo o nombre sin sufijo H/F/M/U)
  const findSupplierCatalogMatch = (p: (typeof products)[number]): SupplierCatalogEntry | undefined => {
    if (!isEssenceProduct(p)) return undefined;
    const skuClean = (p.sku || '').trim();
    const bySku = mergedCatalog.find((c) => c.sku && c.sku === skuClean);
    if (bySku) return bySku;

    const pNameNorm = cleanAndNormalize(p.name);
    const pOfficialNorm = cleanAndNormalize(p.officialName);

    return mergedCatalog.find((c) => {
      const cNameNorm = cleanAndNormalize(c.name);
      const cContraNorm = cleanAndNormalize(c.contratipo);
      if (pOfficialNorm && cContraNorm && (pOfficialNorm === cContraNorm || pOfficialNorm.includes(cContraNorm))) {
        return true;
      }
      if (pNameNorm && cNameNorm && (cNameNorm.includes(pNameNorm) || pNameNorm.includes(cNameNorm))) {
        return true;
      }
      return false;
    });
  };

  // Resolver proveedor asignado según la categoría del producto
  const resolveSupplierInfo = (group: 'ESENCIAS' | 'BOTES' | 'INSUMOS', prodSupplier?: string | null) => {
    if (group === 'ESENCIAS') {
      const s = suppliers.find((sup) => (sup.category || '').toLowerCase().includes('esencia')) || suppliers[0];
      return {
        supplierId: s?.id || 'prov-1',
        supplierName: prodSupplier || s?.name || 'APAESA GUATEMALA / Fragrance Oils',
      };
    }
    if (group === 'BOTES') {
      const s = suppliers.find((sup) => (sup.category || '').toLowerCase().includes('envase') || (sup.category || '').toLowerCase().includes('bote')) || suppliers[1] || suppliers[0];
      return {
        supplierId: s?.id || 'prov-2',
        supplierName: prodSupplier || s?.name || 'Envases & Cristalería S.A.',
      };
    }
    const s = suppliers.find((sup) => (sup.category || '').toLowerCase().includes('quimica') || (sup.category || '').toLowerCase().includes('alcohol') || (sup.category || '').toLowerCase().includes('empaque')) || suppliers[2] || suppliers[0];
    return {
      supplierId: s?.id || 'prov-3',
      supplierName: prodSupplier || s?.name || 'Química & Insumos Industriales',
    };
  };

  // 2. Primer pase: Calcular velocidad de venta real (Media, EWMA, Volatilidad σ_d, Margen) y contribución para Clasificación ABC-XYZ
  const rawMetrics = products.map((p) => {
    const group = getProductGroup(p);
    const isEss = group === 'ESENCIAS';
    const stats = demandMap.get(p.id)!;

    // Stock físico real (incluyendo stockHalf de ½ Onza convertido a Onzas equivalentes para esencias)
    const stockFull = Math.max(0, Number(p.stock || 0));
    const stockHalfUnits = isEss ? Math.max(0, Number(p.stockHalf || 0)) : 0;
    const physicalStockBase = isEss ? Number((stockFull + stockHalfUnits * 0.5).toFixed(2)) : stockFull;

    // Posición de Inventario Neta (IP = Stock Físico - Comprometido + En Tránsito)
    const committedBase = Number(stats.committedBaseQty.toFixed(2));
    const inTransitBase = Number(stats.inTransitBaseQty.toFixed(2));
    const netInventoryPosition = Number(
      (Math.max(0, physicalStockBase - committedBase) + inTransitBase).toFixed(2)
    );

    // Serie diaria [d_1, d_2, ..., d_n]
    const dailyValues = dailyDateKeys.map((dk) => stats.dailyBuckets[dk] || 0);
    const meanDaily = stats.totalBaseSold / numBuckets;

    // EWMA (Exponentially Weighted Moving Average, α = 0.35)
    const alpha = 0.35;
    let ewma = dailyValues[0] || 0;
    for (let i = 1; i < dailyValues.length; i++) {
      ewma = alpha * dailyValues[i] + (1 - alpha) * ewma;
    }

    // Desviación estándar diaria (σ_d) y Coeficiente de Variación (CV)
    const variance =
      dailyValues.reduce((acc, val) => acc + Math.pow(val - meanDaily, 2), 0) / Math.max(1, dailyValues.length);
    const sigmaDaily = Math.sqrt(variance);
    const cv = meanDaily > 0 ? sigmaDaily / meanDaily : 0;

    // Comparación mitad reciente vs mitad previa dentro de la ventana activa (o contra ventana previa)
    const halfIdx = Math.floor(dailyValues.length / 2);
    const firstHalfAvg =
      halfIdx > 0
        ? dailyValues.slice(0, halfIdx).reduce((a, b) => a + b, 0) / halfIdx
        : stats.priorBaseSold / Math.max(1, historyDays);
    const secondHalfAvg =
      dailyValues.length - halfIdx > 0
        ? dailyValues.slice(halfIdx).reduce((a, b) => a + b, 0) / (dailyValues.length - halfIdx)
        : meanDaily;

    let trendType: 'ALZA_FUERTE' | 'ALZA' | 'ESTABLE' | 'BAJA' | 'SIN_MOVIMIENTO' = 'SIN_MOVIMIENTO';
    let trendMultiplier = 1.0;

    if (stats.totalBaseSold === 0 && stats.priorBaseSold === 0) {
      trendType = 'SIN_MOVIMIENTO';
      trendMultiplier = 1.0;
    } else if (firstHalfAvg === 0 && secondHalfAvg > 0) {
      trendType = 'ALZA_FUERTE';
      trendMultiplier = 1.15;
    } else if (firstHalfAvg > 0) {
      const ratio = secondHalfAvg / firstHalfAvg;
      if (ratio >= 1.25) {
        trendType = 'ALZA_FUERTE';
        trendMultiplier = 1.15;
      } else if (ratio >= 1.05) {
        trendType = 'ALZA';
        trendMultiplier = 1.07;
      } else if (ratio >= 0.85) {
        trendType = 'ESTABLE';
        trendMultiplier = 1.0;
      } else {
        trendType = 'BAJA';
        // Si está en ruptura o crítico, no castigamos la demanda (demanda censurada por falta de stock)
        trendMultiplier = physicalStockBase <= (p.minStock || 10) ? 1.0 : 0.88;
      }
    }

    // Corrección por demanda censurada (Stockout Recovery):
    // Si el producto tuvo ventas reales y hoy está en Stock 0, sus ventas se detuvieron por agotamiento
    const censoredRecovery = stats.totalBaseSold > 0 && physicalStockBase <= 0 ? 1.2 : 1.0;

    // Velocidad Diaria Pronosticada (ADR Ponderado = 55% EWMA + 45% Media Simple * Tendencia * Censored Recovery)
    const rawForecastAdr = (0.55 * ewma + 0.45 * meanDaily) * trendMultiplier * censoredRecovery;
    const forecastAdr = stats.totalBaseSold > 0 ? Math.max(0.05, Number(rawForecastAdr.toFixed(3))) : 0;

    // Costos y Precios Reales
    const supplierMatch = findSupplierCatalogMatch(p);
    const dbUnitCost = Number(p.cost || (isEss ? 1.61 : 0.55));
    const supplierPriceKg = isEss
      ? supplierMatch
        ? Number(supplierMatch.price_per_kg)
        : Number((dbUnitCost * OZ_PER_KG).toFixed(2))
      : 0;
    const unitCostBase = isEss
      ? Number((supplierPriceKg / OZ_PER_KG).toFixed(4))
      : Number(dbUnitCost.toFixed(4));

    // Precio de venta promedio ponderado real (o precio de catálogo)
    const realizedAvgPrice =
      stats.totalBaseSold > 0
        ? stats.totalRevenue / stats.totalBaseSold
        : Number(p.price || (isEss ? 3.75 : 1.5));
    const unitMargin = Math.max(0.05, realizedAvgPrice - unitCostBase);
    const grossMarginPct = realizedAvgPrice > 0 ? Number(((unitMargin / realizedAvgPrice) * 100).toFixed(1)) : 0;
    const gmroiRatio = unitCostBase > 0 ? Number((realizedAvgPrice / unitCostBase).toFixed(2)) : 1;

    // Contribución económica diaria (para Pareto ABC)
    const dailyProfitContribution = forecastAdr * unitMargin;
    const supplierInfo = resolveSupplierInfo(group, p.supplier);

    return {
      product: p,
      group,
      isEssence: isEss,
      stats,
      stockFull,
      stockHalfUnits,
      physicalStockBase,
      committedBase,
      inTransitBase,
      netInventoryPosition,
      meanDaily: Number(meanDaily.toFixed(2)),
      ewmaDaily: Number(ewma.toFixed(2)),
      forecastAdr: Number(forecastAdr.toFixed(2)),
      sigmaDaily: Number(sigmaDaily.toFixed(2)),
      cv: Number(cv.toFixed(2)),
      trendType,
      supplierMatch,
      supplierCode: supplierMatch?.id_proveedor || p.sku || p.id.toUpperCase(),
      supplierName: supplierInfo.supplierName,
      supplierId: supplierInfo.supplierId,
      supplierPriceKg: Number(supplierPriceKg.toFixed(2)),
      unitCostBase: Number(unitCostBase.toFixed(2)),
      realizedAvgPrice: Number(realizedAvgPrice.toFixed(2)),
      unitMargin: Number(unitMargin.toFixed(2)),
      grossMarginPct,
      gmroiRatio,
      dailyProfitContribution,
    };
  });

  // 3. Clasificación ABC (Pareto 80 / 15 / 5 sobre contribución de utilidad/ventas) y XYZ (Variabilidad CV)
  const totalProfitContribution = rawMetrics.reduce((acc, m) => acc + m.dailyProfitContribution, 0);
  const sortedByContribution = [...rawMetrics].sort(
    (a, b) => b.dailyProfitContribution - a.dailyProfitContribution || b.stats.totalBaseSold - a.stats.totalBaseSold
  );

  const abcMap = new Map<string, 'A' | 'B' | 'C'>();
  let cumulativeProfit = 0;
  sortedByContribution.forEach((m, index) => {
    if (m.stats.totalBaseSold <= 0) {
      abcMap.set(m.product.id, 'C');
      return;
    }
    cumulativeProfit += m.dailyProfitContribution;
    const pct = totalProfitContribution > 0 ? cumulativeProfit / totalProfitContribution : 1;
    if (pct <= 0.8 || index < 8) {
      abcMap.set(m.product.id, 'A');
    } else if (pct <= 0.95 || index < 22) {
      abcMap.set(m.product.id, 'B');
    } else {
      abcMap.set(m.product.id, 'C');
    }
  });

  // Factor Z según Nivel de Servicio solicitado y Clase ABC
  const baseZ =
    serviceLevelPct >= 99 ? 2.33 : serviceLevelPct >= 98 ? 2.05 : serviceLevelPct >= 95 ? 1.65 : 1.28;

  const TARGET_DOS = Math.max(7, Number(targetDos || 60));
  const LEAD_TIME = Math.max(1, Number(leadTime || 14));

  // Tamaño de lote de esencia según configuración (1 Kg = 35.274 Oz, 0.5 Kg = 17.637 Oz, 1 Oz = 1 Oz)
  const essenceLotOz =
    essenceOrderUnit === 'HALF_KG' ? OZ_PER_KG / 2 : essenceOrderUnit === 'OZ' ? 1 : OZ_PER_KG;

  // 4. Segundo pase: Cálculo de Stock de Seguridad (SS), Punto de Reorden (ROP), Nivel Objetivo (S), DOS y Requerimientos
  const fullAnalysis = rawMetrics
    .filter((m) => categoryFilter === 'ALL' || m.group === categoryFilter)
    .map((m) => {
      const abcClass = abcMap.get(m.product.id) || 'C';
      const xyzClass: 'X' | 'Y' | 'Z' =
        m.stats.totalBaseSold === 0 ? 'Z' : m.cv <= 0.5 ? 'X' : m.cv <= 1.0 ? 'Y' : 'Z';

      // Ajuste de Z por importancia ABC
      const effectiveZ =
        abcClass === 'A' ? Math.max(baseZ, 2.05) : abcClass === 'B' ? baseZ : Math.min(baseZ, 1.28);

      // Incertidumbre combinada de demanda y lead time (σ_L = 15% del Lead Time)
      const sigmaLeadTimeDays = LEAD_TIME * 0.15;
      const sigmaDemandDuringLT = Math.sqrt(
        LEAD_TIME * Math.pow(m.sigmaDaily, 2) + Math.pow(m.forecastAdr * sigmaLeadTimeDays, 2)
      );

      const statisticalSS = effectiveZ * sigmaDemandDuringLT;
      const policyMinStock = Math.max(1, Number(m.product.minStock || 15));

      // Stock de Seguridad (SS): combina fórmula estadística Z*σ_LT con piso operativo
      const safetyStock =
        m.forecastAdr > 0
          ? Number(Math.max(policyMinStock * 0.6, statisticalSS).toFixed(1))
          : policyMinStock;

      // Demanda esperada durante el Lead Time (LTD = ADR * L)
      const leadTimeDemand = Number((m.forecastAdr * LEAD_TIME).toFixed(1));

      // Punto de Reorden (ROP = LTD + SS)
      const reorderPoint = Number((leadTimeDemand + safetyStock).toFixed(1));

      // Nivel Máximo Objetivo (Order-Up-To Level S = ADR * (TargetDOS + L) + SS)
      const targetLevelS =
        m.forecastAdr > 0
          ? Number((m.forecastAdr * (TARGET_DOS + LEAD_TIME) + safetyStock * 0.5).toFixed(1))
          : policyMinStock;

      // Días de Cobertura (DOS = NetInventoryPosition / ADR)
      const dos =
        m.forecastAdr > 0
          ? Number((m.netInventoryPosition / m.forecastAdr).toFixed(1))
          : m.netInventoryPosition > 0
          ? 999
          : 0;

      // Días restantes para tocar el Punto de Reorden (Days Until Order)
      const daysUntilReorder =
        m.forecastAdr > 0
          ? Math.floor((m.netInventoryPosition - reorderPoint) / m.forecastAdr)
          : m.netInventoryPosition <= policyMinStock
          ? 0
          : 999;

      // Stock proyectado al momento en que llegue el pedido (después de Lead Time días)
      const projectedStockAtArrival = Number(
        Math.max(0, m.netInventoryPosition - leadTimeDemand).toFixed(1)
      );

      // Estado de Riesgo de Inventario
      let stockStatus: 'AGOTADO' | 'CRITICO' | 'REORDEN' | 'PREVENTIVO' | 'OPTIMO' | 'SOBRESTOCK' = 'OPTIMO';
      if (m.netInventoryPosition <= 0 && (m.forecastAdr > 0 || includeZeroSalesBelowMin)) {
        stockStatus = 'AGOTADO';
      } else if (m.forecastAdr > 0 && (dos <= LEAD_TIME || m.netInventoryPosition <= safetyStock * 0.75)) {
        stockStatus = 'CRITICO';
      } else if (
        (m.forecastAdr > 0 && m.netInventoryPosition <= reorderPoint) ||
        (includeZeroSalesBelowMin && m.netInventoryPosition < policyMinStock)
      ) {
        stockStatus = 'REORDEN';
      } else if (m.forecastAdr > 0 && dos < TARGET_DOS) {
        stockStatus = 'PREVENTIVO';
      } else if (m.netInventoryPosition > Math.max(targetLevelS * 1.8, policyMinStock * 3)) {
        stockStatus = 'SOBRESTOCK';
      }

      // Cálculo de Requerimiento Neto en unidades base (Oz para esencias, Unidades para botes/insumos)
      let neededBaseQty = 0;
      if (m.forecastAdr > 0) {
        if (m.netInventoryPosition < targetLevelS) {
          neededBaseQty = Math.max(0, targetLevelS - m.netInventoryPosition);
          // Filtro inteligente de baja rotación: si está por encima del ROP y solo faltan < 6 Oz, no forzar 1 Kg entero
          if (
            m.isEssence &&
            m.netInventoryPosition > reorderPoint &&
            neededBaseQty < 8 &&
            essenceOrderUnit === 'KG'
          ) {
            neededBaseQty = 0;
          }
        }
      } else if (includeZeroSalesBelowMin && m.netInventoryPosition < policyMinStock) {
        neededBaseQty = policyMinStock - m.netInventoryPosition;
      }

      // Conversión a Unidades Comerciales de Compra (Kg para esencias o Unidades para botes/insumos)
      let neededOrderQty = 0; // En Kg (o según unidad) para esencias, o Unidades para botes/insumos
      let orderUnitLabel = m.product.unit || 'Unidad';
      let unitOrderPrice = m.unitCostBase;

      if (m.isEssence) {
        if (essenceOrderUnit === 'KG') {
          neededOrderQty = neededBaseQty > 0 ? Math.ceil(neededBaseQty / OZ_PER_KG) : 0;
          orderUnitLabel = 'Kg';
          unitOrderPrice = m.supplierPriceKg;
        } else if (essenceOrderUnit === 'HALF_KG') {
          const halfKgUnits = neededBaseQty > 0 ? Math.ceil(neededBaseQty / (OZ_PER_KG / 2)) : 0;
          neededOrderQty = halfKgUnits * 0.5;
          orderUnitLabel = 'Kg';
          unitOrderPrice = m.supplierPriceKg;
        } else {
          neededOrderQty = Math.ceil(neededBaseQty);
          orderUnitLabel = 'Onza';
          unitOrderPrice = m.unitCostBase;
        }
      } else {
        // Botes e Insumos: redondeo a múltiplos de 6 si es Bote y necesita >= 6, o unidades exactas
        if (m.group === 'BOTES' && neededBaseQty >= 6) {
          neededOrderQty = Math.ceil(neededBaseQty / 6) * 6;
        } else {
          neededOrderQty = Math.ceil(neededBaseQty);
        }
        orderUnitLabel = m.product.unit || 'Unidad';
        unitOrderPrice = m.unitCostBase;
      }

      const unconstrainedCost = Number((neededOrderQty * unitOrderPrice).toFixed(2));
      const baseUnitsPerOrderStep = m.isEssence ? essenceLotOz : m.group === 'BOTES' ? 6 : 1;
      const orderQtyPerStep = m.isEssence && essenceOrderUnit === 'HALF_KG' ? 0.5 : m.group === 'BOTES' ? 6 : 1;

      // Índice compuesto de Prioridad (combina Riesgo de Ruptura, Velocidad de Venta, Clase ABC y GMROI)
      const statusWeight =
        stockStatus === 'AGOTADO'
          ? 10000
          : stockStatus === 'CRITICO'
          ? 5000
          : stockStatus === 'REORDEN'
          ? 1500
          : stockStatus === 'PREVENTIVO'
          ? 300
          : 10;
      const abcWeight = abcClass === 'A' ? 2.0 : abcClass === 'B' ? 1.35 : 0.8;
      const urgencyScore = Number(
        (
          statusWeight * abcWeight +
          (500 / (Math.min(dos, 365) + 1)) * m.gmroiRatio * Math.max(0.2, m.forecastAdr)
        ).toFixed(2)
      );

      const displayName = m.product.officialName
        ? `${m.product.officialName} (${m.product.name})`
        : m.product.name;

      return {
        id: m.product.id,
        sku: m.product.sku || '',
        name: displayName,
        rawName: m.product.name,
        officialName: m.product.officialName || '',
        brand: m.product.brand || '',
        categoryName: m.product.category?.name || 'General',
        group: m.group,
        isEssence: m.isEssence,
        unit: m.product.unit || 'Onza',
        orderUnitLabel,
        // Inventario detallado
        stockFull: m.stockFull,
        stockHalfUnits: m.stockHalfUnits,
        physicalStock: m.physicalStockBase,
        committedStock: m.committedBase,
        inTransitStock: m.inTransitBase,
        netInventoryPosition: m.netInventoryPosition,
        minStock: policyMinStock,
        // Demanda y Predicción
        totalSoldWindow: Number(m.stats.totalBaseSold.toFixed(1)),
        fullOzSold: m.stats.fullOzSold,
        halfOzSold: m.stats.halfOzSold,
        ordersCount: m.stats.ordersCount,
        totalRevenueWindow: Number(m.stats.totalRevenue.toFixed(2)),
        meanDaily: m.meanDaily,
        ewmaDaily: m.ewmaDaily,
        adr: m.forecastAdr,
        sigmaDaily: m.sigmaDaily,
        cv: m.cv,
        trendType: m.trendType,
        // Parámetros Estándar de Control de Stock
        abcClass,
        xyzClass,
        abcXyz: `${abcClass}${xyzClass}`,
        safetyStock,
        leadTimeDemand,
        reorderPoint,
        targetLevelS,
        dos,
        daysUntilReorder,
        projectedStockAtArrival,
        stockStatus,
        // Proveedor y Finanzas
        supplierId: m.supplierId,
        supplierName: m.supplierName,
        supplierCode: m.supplierCode,
        supplierPriceKg: m.supplierPriceKg,
        unitCostBase: m.unitCostBase,
        unitOrderPrice: Number(unitOrderPrice.toFixed(2)),
        realizedAvgPrice: m.realizedAvgPrice,
        grossMarginPct: m.grossMarginPct,
        gmroiRatio: m.gmroiRatio,
        // Requerimiento Ideal (Sin restricción de presupuesto)
        neededOz: Number(neededBaseQty.toFixed(1)),
        neededBaseQty: Number(neededBaseQty.toFixed(1)),
        neededKg: m.isEssence ? neededOrderQty : 0,
        neededOrderQty,
        unconstrainedCost,
        urgencyScore,
        baseUnitsPerOrderStep,
        orderQtyPerStep,
      };
    });

  // 5. Optimización Marginal de Presupuesto (Multi-Pass Priority Knapsack)
  // Descompone la necesidad de cada SKU en lotes incrementales (ej. 1er Kg = Urgencia Crítica/ROP, 2do Kg = Cobertura Target DOS)
  // para que el presupuesto cubra primero todas las emergencias y puntos de reorden antes de acumular stock extra en un solo SKU.
  interface IncrementalLot {
    itemId: string;
    lotIndex: number;
    orderQtyDelta: number;
    baseQtyDelta: number;
    lotCost: number;
    marginalScore: number;
  }

  const incrementalLots: IncrementalLot[] = [];
  for (const item of fullAnalysis) {
    if (item.neededOrderQty <= 0 || item.unitOrderPrice <= 0) continue;
    const stepQty = item.orderQtyPerStep;
    const numSteps = Math.max(1, Math.round(item.neededOrderQty / stepQty));

    for (let stepIdx = 0; stepIdx < numSteps; stepIdx++) {
      const virtualStockBeforeLot = item.netInventoryPosition + stepIdx * item.baseUnitsPerOrderStep;
      const virtualDosBeforeLot =
        item.adr > 0 ? virtualStockBeforeLot / item.adr : virtualStockBeforeLot > 0 ? 180 : 0;

      // Clasificación por Hito de Cobertura (4-Pass Supply Chain Standard):
      // Pase 1 (Tier 400,000+): Supervivencia de Lead Time (evitar ruptura antes de que llegue el pedido)
      // Pase 2 (Tier 200,000+): Restauración de Punto de Reorden y Stock de Seguridad (ROP)
      // Pase 3 (Tier 100,000+): Cobertura Media (mitad del Target DOS)
      // Pase 4 (Tier 10,000+): Cobertura Total Objetivo (Order-Up-To Level S)
      const halfTargetStock = item.leadTimeDemand + item.adr * (TARGET_DOS * 0.5);
      let passBaseScore = 10000;
      if (virtualStockBeforeLot <= 0) {
        passBaseScore = 500000;
      } else if (virtualStockBeforeLot < item.leadTimeDemand) {
        passBaseScore = 400000;
      } else if (virtualStockBeforeLot < item.reorderPoint) {
        passBaseScore = 250000;
      } else if (virtualStockBeforeLot < halfTargetStock) {
        passBaseScore = 100000;
      }

      const abcFactor = item.abcClass === 'A' ? 1.5 : item.abcClass === 'B' ? 1.15 : 0.8;
      const economicPriority =
        (item.gmroiRatio * Math.max(0.2, item.adr) * abcFactor * 100) /
        Math.max(1, virtualDosBeforeLot + 1);

      const marginalScore = passBaseScore + economicPriority;

      incrementalLots.push({
        itemId: item.id,
        lotIndex: stepIdx + 1,
        orderQtyDelta: stepQty,
        baseQtyDelta: item.baseUnitsPerOrderStep,
        lotCost: Number((stepQty * item.unitOrderPrice).toFixed(2)),
        marginalScore,
      });
    }
  }

  incrementalLots.sort((a, b) => b.marginalScore - a.marginalScore);

  const allocatedByItem = new Map<string, { orderQty: number; baseQty: number; cost: number }>();
  let currentSpend = 0;
  const maxBudget = Math.max(0, Number(budget || 0));

  for (const lot of incrementalLots) {
    if (currentSpend + lot.lotCost <= maxBudget + 0.01) {
      const prev = allocatedByItem.get(lot.itemId) || { orderQty: 0, baseQty: 0, cost: 0 };
      allocatedByItem.set(lot.itemId, {
        orderQty: Number((prev.orderQty + lot.orderQtyDelta).toFixed(2)),
        baseQty: Number((prev.baseQty + lot.baseQtyDelta).toFixed(1)),
        cost: Number((prev.cost + lot.lotCost).toFixed(2)),
      });
      currentSpend = Number((currentSpend + lot.lotCost).toFixed(2));
    }
  }

  // Construir borrador final de Orden de Compra (Draft) enriquecido
  const analysisById = new Map(fullAnalysis.map((a) => [a.id, a]));
  const draft = Array.from(allocatedByItem.entries())
    .map(([itemId, alloc]) => {
      const info = analysisById.get(itemId)!;
      const newStockAfterOrder = Number((info.netInventoryPosition + alloc.baseQty).toFixed(1));
      const projectedDosAfterOrder =
        info.adr > 0 ? Math.round(newStockAfterOrder / info.adr) : 180;
      const expectedRevenue = Number((alloc.baseQty * info.realizedAvgPrice).toFixed(2));
      const expectedGrossProfit = Number((expectedRevenue - alloc.cost).toFixed(2));

      return {
        productId: info.id,
        sku: info.sku,
        productName: info.name,
        rawName: info.rawName,
        officialName: info.officialName,
        group: info.group,
        isEssence: info.isEssence,
        supplierId: info.supplierId,
        supplierName: info.supplierName,
        supplierCode: info.supplierCode,
        orderUnitLabel: info.orderUnitLabel,
        // Retrocompatibilidad + Campos extendidos
        suggestedKg: info.isEssence ? alloc.orderQty : alloc.orderQty,
        suggestedOrderQty: alloc.orderQty,
        suggestedBaseOz: alloc.baseQty,
        idealOrderQty: info.neededOrderQty,
        pricePerKg: info.unitOrderPrice,
        unitOrderPrice: info.unitOrderPrice,
        unitCostBase: info.unitCostBase,
        totalCost: alloc.cost,
        currentStock: info.physicalStock,
        stockFull: info.stockFull,
        stockHalfUnits: info.stockHalfUnits,
        committedStock: info.committedStock,
        inTransitStock: info.inTransitStock,
        netInventoryPosition: info.netInventoryPosition,
        currentDos: Math.round(info.dos),
        projectedDosAfterOrder,
        adr: info.adr,
        safetyStock: info.safetyStock,
        reorderPoint: info.reorderPoint,
        targetLevelS: info.targetLevelS,
        abcXyz: info.abcXyz,
        stockStatus: info.stockStatus,
        trendType: info.trendType,
        grossMarginPct: info.grossMarginPct,
        expectedRevenue,
        expectedGrossProfit,
      };
    })
    .sort((a, b) => {
      const itemA = analysisById.get(a.productId)!;
      const itemB = analysisById.get(b.productId)!;
      return itemB.urgencyScore - itemA.urgencyScore;
    });

  // Ordenar fullAnalysis por prioridad / urgencia
  const sortedFullAnalysis = [...fullAnalysis].sort((a, b) => {
    if (b.neededOrderQty > 0 && a.neededOrderQty === 0) return 1;
    if (a.neededOrderQty > 0 && b.neededOrderQty === 0) return -1;
    return b.urgencyScore - a.urgencyScore || a.dos - b.dos;
  });

  // Resumen Ejecutivo (KPIs del Motor Predictivo)
  const totalUnconstrainedCost = Number(
    fullAnalysis.reduce((acc, item) => acc + item.unconstrainedCost, 0).toFixed(2)
  );
  const totalExpectedRevenue = Number(
    draft.reduce((acc, d) => acc + d.expectedRevenue, 0).toFixed(2)
  );
  const totalExpectedProfit = Number(
    draft.reduce((acc, d) => acc + d.expectedGrossProfit, 0).toFixed(2)
  );

  const summary = {
    effectiveDays,
    historyDaysRequested: historyDays,
    totalValidTransactions,
    totalSkusAnalyzed: fullAnalysis.length,
    skusWithSales: fullAnalysis.filter((i) => i.totalSoldWindow > 0).length,
    agotadosCount: fullAnalysis.filter((i) => i.stockStatus === 'AGOTADO').length,
    criticosCount: fullAnalysis.filter((i) => i.stockStatus === 'CRITICO').length,
    reordenCount: fullAnalysis.filter((i) => i.stockStatus === 'REORDEN').length,
    preventivosCount: fullAnalysis.filter((i) => i.stockStatus === 'PREVENTIVO').length,
    optimosCount: fullAnalysis.filter((i) => i.stockStatus === 'OPTIMO').length,
    sobrestockCount: fullAnalysis.filter((i) => i.stockStatus === 'SOBRESTOCK').length,
    totalUnconstrainedCost,
    budgetRequested: maxBudget,
    budgetUsed: currentSpend,
    budgetCoveragePct:
      totalUnconstrainedCost > 0
        ? Number(Math.min(100, (currentSpend / totalUnconstrainedCost) * 100).toFixed(1))
        : 100,
    totalExpectedRevenue,
    totalExpectedProfit,
    portfolioRoiPct:
      currentSpend > 0 ? Number(((totalExpectedProfit / currentSpend) * 100).toFixed(1)) : 0,
  };

  return {
    budgetUsed: currentSpend,
    totalItems: draft.length,
    draft,
    fullAnalysis: sortedFullAnalysis,
    summary,
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      creditDays: s.creditDays,
    })),
  };
}

export async function GET(request: Request) {
  try {
    if (!checkStaffAuth(request)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const budget = Number(searchParams.get('budget') || 3000);
    const historyDays = Number(searchParams.get('historyDays') || 30);
    const targetDos = Number(searchParams.get('targetDos') || 60);
    const leadTime = Number(searchParams.get('leadTime') || 14);
    const serviceLevelPct = Number(searchParams.get('serviceLevelPct') || 95);
    const categoryFilter = (searchParams.get('categoryFilter') || 'ALL') as ReplenishmentParams['categoryFilter'];

    const data = await runReplenishmentEngine({
      budget,
      historyDays,
      targetDos,
      leadTime,
      serviceLevelPct,
      categoryFilter,
      essenceOrderUnit: 'KG',
      includeZeroSalesBelowMin: false,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Error en GET /api/admin/abastecimiento:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!checkStaffAuth(request)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      budget = 3000,
      catalog = [],
      historyDays = 30,
      targetDos = 60,
      leadTime = 14,
      serviceLevelPct = 95,
      categoryFilter = 'ALL',
      essenceOrderUnit = 'KG',
      includeZeroSalesBelowMin = false,
    } = body;

    if (budget === undefined || budget === null || Number(budget) < 0) {
      return NextResponse.json({ success: false, error: 'Presupuesto inválido' }, { status: 400 });
    }

    const data = await runReplenishmentEngine({
      budget: Number(budget),
      historyDays: Number(historyDays),
      targetDos: Number(targetDos),
      leadTime: Number(leadTime),
      serviceLevelPct: Number(serviceLevelPct),
      categoryFilter,
      essenceOrderUnit,
      includeZeroSalesBelowMin: Boolean(includeZeroSalesBelowMin),
      catalog,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Error en POST /api/admin/abastecimiento:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
