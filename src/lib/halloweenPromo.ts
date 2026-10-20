// Promoción Especial de Halloween — Top 10 Esencias Menos Vendidas
// 1 Onza: Antes $3.75 -> Ahora $3.30 (Descuento $0.45)
// ½ Onza: Antes $1.90 -> Ahora $1.85 (Descuento $0.05)
// Vigencia: Hasta el 31 de octubre de 2026 a las 11:59:59 PM (Hora de El Salvador, UTC-6)

export const HALLOWEEN_END_ISO = '2026-10-31T23:59:59.999-06:00';
export const HALLOWEEN_END_TIMESTAMP = new Date(HALLOWEEN_END_ISO).getTime();

export function isHalloweenSeasonActive(nowMs: number = Date.now()): boolean {
  return nowMs <= HALLOWEEN_END_TIMESTAMP;
}

export const HALLOWEEN_PROMO_PRICE_1OZ = 3.30;
export const HALLOWEEN_ORIGINAL_PRICE_1OZ = 3.75;
export const HALLOWEEN_PROMO_DISCOUNT_1OZ = 0.45;

export const HALLOWEEN_PROMO_PRICE_HALF_OZ = 1.85;
export const HALLOWEEN_ORIGINAL_PRICE_HALF_OZ = 1.90;
export const HALLOWEEN_PROMO_DISCOUNT_HALF_OZ = 0.05;

export interface HalloweenPotionInfo {
  id: string;
  sku: string;
  numericSku: string;
  name: string;
  officialName: string;
  potionTitle: string;
  potionEmoji: string;
  potionEffect: string;
  potionColorClass: string;
  categoryTag: 'amor' | 'energia' | 'misterio';
}

/**
 * Top 10 de las esencias con menor rotación en ventas (con existencias activas),
 * cada una con su propio badge de Poción de la Bruja Aromaniaka:
 */
export const HALLOWEEN_POTIONS: Record<string, HalloweenPotionInfo> = {
  'esencia-apae-040': {
    id: 'esencia-apae-040',
    sku: 'APAE-040',
    numericSku: '40',
    name: 'Yara F',
    officialName: 'Dubai F',
    potionTitle: 'Poción de Amor',
    potionEmoji: '💘',
    potionEffect: 'Dulzura envolvente que enamora al primer instante',
    potionColorClass: 'from-pink-600 via-rose-500 to-orange-500',
    categoryTag: 'amor',
  },
  'esencia-apae-028': {
    id: 'esencia-apae-028',
    sku: 'APAE-028',
    numericSku: '28',
    name: 'Bad Boy H',
    officialName: 'Irresistible H',
    potionTitle: 'Poción de Atracción',
    potionEmoji: '🔥',
    potionEffect: 'Fuerza seductora e irresistible donde quiera que vayas',
    potionColorClass: 'from-red-600 via-orange-600 to-amber-500',
    categoryTag: 'amor',
  },
  'esencia-apae-036': {
    id: 'esencia-apae-036',
    sku: 'APAE-036',
    numericSku: '36',
    name: 'Blanc L.12.12 H',
    officialName: 'Basic White H',
    potionTitle: 'Poción de Energía',
    potionEmoji: '⚡',
    potionEffect: 'Frescura limpia y vitalidad para dominar todo el día',
    potionColorClass: 'from-amber-500 via-orange-500 to-yellow-500',
    categoryTag: 'energia',
  },
  'esencia-apae-059': {
    id: 'esencia-apae-059',
    sku: 'APAE-059',
    numericSku: '59',
    name: 'Toy Boy H',
    officialName: 'Black Bear H',
    potionTitle: 'Poción de Magnetismo',
    potionEmoji: '🧲',
    potionEffect: 'Toque especiado y audaz que roba todas las miradas',
    potionColorClass: 'from-purple-700 via-fuchsia-600 to-orange-500',
    categoryTag: 'misterio',
  },
  'esencia-apae-038': {
    id: 'esencia-apae-038',
    sku: 'APAE-038',
    numericSku: '38',
    name: 'Polo Black H',
    officialName: 'Night Sky H',
    potionTitle: 'Poción de Misterio Nocturno',
    potionEmoji: '🌙',
    potionEffect: 'Elegancia oscura y enigmática para conquistar la noche',
    potionColorClass: 'from-indigo-800 via-purple-700 to-orange-500',
    categoryTag: 'misterio',
  },
  'esencia-apae-043': {
    id: 'esencia-apae-043',
    sku: 'APAE-043',
    numericSku: '43',
    name: 'Black Opium F',
    officialName: 'Adictiva F',
    potionTitle: 'Poción de Hechizo Nocturno',
    potionEmoji: '🔮',
    potionEffect: 'Adicción hipnótica de café, vainilla y flores blancas',
    potionColorClass: 'from-violet-800 via-purple-600 to-orange-600',
    categoryTag: 'misterio',
  },
  'esencia-apae-034': {
    id: 'esencia-apae-034',
    sku: 'APAE-034',
    numericSku: '34',
    name: '212 VIP F',
    officialName: 'Wife Material F',
    potionTitle: 'Poción de Éxito y Glamour',
    potionEmoji: '👑',
    potionEffect: 'Aura VIP dorada para brillar en cada celebración',
    potionColorClass: 'from-amber-600 via-orange-500 to-yellow-500',
    categoryTag: 'energia',
  },
  'esencia-apae-022': {
    id: 'esencia-apae-022',
    sku: 'APAE-022',
    numericSku: '22',
    name: 'Chance F',
    officialName: 'New York Lady F',
    potionTitle: 'Poción de Buena Fortuna',
    potionEmoji: '🍀',
    potionEffect: 'Giro inesperado de suerte, sofisticación y destino',
    potionColorClass: 'from-emerald-600 via-teal-600 to-orange-500',
    categoryTag: 'energia',
  },
  'esencia-apae-047': {
    id: 'esencia-apae-047',
    sku: 'APAE-047',
    numericSku: '47',
    name: 'Green Tea F',
    officialName: 'England Forest F',
    potionTitle: 'Poción de Paz y Armonía',
    potionEmoji: '🌿',
    potionEffect: 'Renovación botánica que recarga el espíritu al instante',
    potionColorClass: 'from-teal-600 via-emerald-500 to-amber-500',
    categoryTag: 'energia',
  },
  'esencia-apae-039': {
    id: 'esencia-apae-039',
    sku: 'APAE-039',
    numericSku: '39',
    name: 'Ralph F',
    officialName: 'CowBoy Girl F',
    potionTitle: 'Poción de Encanto y Alegría',
    potionEmoji: '✨',
    potionEffect: 'Chispa frutal y radiante que ilumina cualquier lugar',
    potionColorClass: 'from-orange-500 via-pink-500 to-amber-500',
    categoryTag: 'amor',
  },
};

export const HALLOWEEN_TOP10_PRODUCT_IDS = new Set<string>(Object.keys(HALLOWEEN_POTIONS));

export const HALLOWEEN_TOP10_SKUS = new Set<string>(
  Object.values(HALLOWEEN_POTIONS).flatMap((p) => [p.sku, p.numericSku, `0${p.numericSku}`])
);

export function getHalloweenPotionInfo(
  product?: { id?: string | null; sku?: string | null; name?: string | null; officialName?: string | null } | null
): HalloweenPotionInfo | null {
  if (!isHalloweenSeasonActive() || !product) return null;
  if (product.id) {
    const cleanId = String(product.id)
      .trim()
      .replace(/-(ONZA_COMPLETA|MEDIA_ONZA|1_OZ|2_OZ|UNIDAD)$/i, '');
    if (HALLOWEEN_POTIONS[cleanId]) {
      return HALLOWEEN_POTIONS[cleanId];
    }
  }
  if (product.sku) {
    const skuClean = String(product.sku).trim().toUpperCase().replace(/^#/, '');
    const numericClean = skuClean.replace(/^APAE-0*/i, '').replace(/^0+/, '');
    const found = Object.values(HALLOWEEN_POTIONS).find(
      (p) => p.sku === skuClean || p.numericSku === skuClean || p.numericSku === numericClean
    );
    if (found) return found;
  }
  const prodOfficial = String(product.officialName || '').trim().toLowerCase();
  const prodName = String(product.name || '').trim().toLowerCase();
  if (prodOfficial || prodName) {
    const foundByName = Object.values(HALLOWEEN_POTIONS).find((p) => {
      const targetOff = p.officialName.toLowerCase();
      const targetName = p.name.toLowerCase();
      return (
        (prodOfficial && (prodOfficial === targetOff || prodOfficial === targetName)) ||
        (prodName && (prodName === targetName || prodName === targetOff))
      );
    });
    if (foundByName) return foundByName;
  }
  return null;
}

export function isHalloweenPromoProduct(
  product?: { id?: string | null; sku?: string | null; name?: string | null; officialName?: string | null } | null
): boolean {
  return getHalloweenPotionInfo(product) !== null;
}

/**
 * Detecta si un ítem a facturar en DTE corresponde a una promoción de Halloween ($3.30 la onza o $1.85 la media onza)
 * o trae un descuento explícito, devolviendo el precio de lista original con IVA y el descuento unitario con IVA
 * para transmitirlo oficialmente a Hacienda como descuento (montoDescu).
 */
export function resolveDteItemDiscount(item: {
  codigo?: string;
  descripcion?: string;
  precioUnitario: number;
  precioOriginal?: number;
  montoDescuento?: number;
}): { originalUnitPriceConIva: number; unitDiscountConIva: number } {
  const paidUnit = Number(item.precioUnitario) || 0;

  // 1. Si ya viene precioOriginal o montoDescuento explícito
  if (item.precioOriginal && Number(item.precioOriginal) > paidUnit + 0.001) {
    const orig = Number(Number(item.precioOriginal).toFixed(4));
    const disc = Number((orig - paidUnit).toFixed(4));
    return { originalUnitPriceConIva: orig, unitDiscountConIva: disc };
  }
  if (item.montoDescuento && Number(item.montoDescuento) > 0.001) {
    const disc = Number(Number(item.montoDescuento).toFixed(4));
    const orig = Number((paidUnit + disc).toFixed(4));
    return { originalUnitPriceConIva: orig, unitDiscountConIva: disc };
  }

  // 2. Detección automática para compras de la promoción de Halloween ($3.30 la onza -> orig $3.75, dto $0.45; $1.85 media onza -> orig $1.90, dto $0.05)
  const descLower = String(item.descripcion || '').toLowerCase();
  const isHalf = descLower.includes('½') || descLower.includes('media onza') || descLower.includes('1/2');

  if (!isHalf && Math.abs(paidUnit - HALLOWEEN_PROMO_PRICE_1OZ) < 0.005) {
    return {
      originalUnitPriceConIva: HALLOWEEN_ORIGINAL_PRICE_1OZ,
      unitDiscountConIva: HALLOWEEN_PROMO_DISCOUNT_1OZ,
    };
  }

  if (isHalf && Math.abs(paidUnit - HALLOWEEN_PROMO_PRICE_HALF_OZ) < 0.005) {
    return {
      originalUnitPriceConIva: HALLOWEEN_ORIGINAL_PRICE_HALF_OZ,
      unitDiscountConIva: HALLOWEEN_PROMO_DISCOUNT_HALF_OZ,
    };
  }

  return { originalUnitPriceConIva: paidUnit, unitDiscountConIva: 0 };
}
