// Promoción Especial de Halloween — Top 10 Esencias Menos Vendidas a $3.30 la Onza

export const HALLOWEEN_PROMO_ACTIVE = true;
export const HALLOWEEN_PROMO_PRICE_1OZ = 3.30;
export const HALLOWEEN_ORIGINAL_PRICE_1OZ = 3.75;

export interface HalloweenPotionInfo {
  id: string;
  sku: string;
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
    potionTitle: 'Poción de Amor',
    potionEmoji: '💘',
    potionEffect: 'Dulzura envolvente que enamora al primer instante',
    potionColorClass: 'from-pink-600 via-rose-500 to-orange-500',
    categoryTag: 'amor',
  },
  'esencia-apae-028': {
    id: 'esencia-apae-028',
    sku: 'APAE-028',
    potionTitle: 'Poción de Atracción',
    potionEmoji: '🔥',
    potionEffect: 'Fuerza seductora e irresistible donde quiera que vayas',
    potionColorClass: 'from-red-600 via-orange-600 to-amber-500',
    categoryTag: 'amor',
  },
  'esencia-apae-036': {
    id: 'esencia-apae-036',
    sku: 'APAE-036',
    potionTitle: 'Poción de Energía',
    potionEmoji: '⚡',
    potionEffect: 'Frescura limpia y vitalidad para dominar todo el día',
    potionColorClass: 'from-amber-500 via-orange-500 to-yellow-500',
    categoryTag: 'energia',
  },
  'esencia-apae-059': {
    id: 'esencia-apae-059',
    sku: 'APAE-059',
    potionTitle: 'Poción de Magnetismo',
    potionEmoji: '🧲',
    potionEffect: 'Toque especiado y audaz que roba todas las miradas',
    potionColorClass: 'from-purple-700 via-fuchsia-600 to-orange-500',
    categoryTag: 'misterio',
  },
  'esencia-apae-038': {
    id: 'esencia-apae-038',
    sku: 'APAE-038',
    potionTitle: 'Poción de Misterio Nocturno',
    potionEmoji: '🌙',
    potionEffect: 'Elegancia oscura y enigmática para conquistar la noche',
    potionColorClass: 'from-indigo-800 via-purple-700 to-orange-500',
    categoryTag: 'misterio',
  },
  'esencia-apae-043': {
    id: 'esencia-apae-043',
    sku: 'APAE-043',
    potionTitle: 'Poción de Hechizo Nocturno',
    potionEmoji: '🔮',
    potionEffect: 'Adicción hipnótica de café, vainilla y flores blancas',
    potionColorClass: 'from-violet-800 via-purple-600 to-orange-600',
    categoryTag: 'misterio',
  },
  'esencia-apae-034': {
    id: 'esencia-apae-034',
    sku: 'APAE-034',
    potionTitle: 'Poción de Éxito y Glamour',
    potionEmoji: '👑',
    potionEffect: 'Aura VIP dorada para brillar en cada celebración',
    potionColorClass: 'from-amber-600 via-orange-500 to-yellow-500',
    categoryTag: 'energia',
  },
  'esencia-apae-022': {
    id: 'esencia-apae-022',
    sku: 'APAE-022',
    potionTitle: 'Poción de Buena Fortuna',
    potionEmoji: '🍀',
    potionEffect: 'Giro inesperado de suerte, sofisticación y destino',
    potionColorClass: 'from-emerald-600 via-teal-600 to-orange-500',
    categoryTag: 'energia',
  },
  'esencia-apae-047': {
    id: 'esencia-apae-047',
    sku: 'APAE-047',
    potionTitle: 'Poción de Paz y Armonía',
    potionEmoji: '🌿',
    potionEffect: 'Renovación botánica que recarga el espíritu al instante',
    potionColorClass: 'from-teal-600 via-emerald-500 to-amber-500',
    categoryTag: 'energia',
  },
  'esencia-apae-039': {
    id: 'esencia-apae-039',
    sku: 'APAE-039',
    potionTitle: 'Poción de Encanto y Alegría',
    potionEmoji: '✨',
    potionEffect: 'Chispa frutal y radiante que ilumina cualquier lugar',
    potionColorClass: 'from-orange-500 via-pink-500 to-amber-500',
    categoryTag: 'amor',
  },
};

export const HALLOWEEN_TOP10_PRODUCT_IDS = new Set<string>(Object.keys(HALLOWEEN_POTIONS));

export const HALLOWEEN_TOP10_SKUS = new Set<string>(
  Object.values(HALLOWEEN_POTIONS).map((p) => p.sku)
);

export function getHalloweenPotionInfo(
  product?: { id?: string | null; sku?: string | null } | null
): HalloweenPotionInfo | null {
  if (!HALLOWEEN_PROMO_ACTIVE || !product) return null;
  if (product.id && HALLOWEEN_POTIONS[product.id]) {
    return HALLOWEEN_POTIONS[product.id];
  }
  if (product.sku) {
    const skuUpper = product.sku.toUpperCase();
    const found = Object.values(HALLOWEEN_POTIONS).find((p) => p.sku === skuUpper);
    if (found) return found;
  }
  return null;
}

export function isHalloweenPromoProduct(
  product?: { id?: string | null; sku?: string | null } | null
): boolean {
  return getHalloweenPotionInfo(product) !== null;
}
