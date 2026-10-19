// Promoción Especial de Halloween — Top 10 Esencias Menos Vendidas a $3.30 la Onza

export const HALLOWEEN_PROMO_ACTIVE = true;
export const HALLOWEEN_PROMO_PRICE_1OZ = 3.30;
export const HALLOWEEN_ORIGINAL_PRICE_1OZ = 3.75;

/**
 * Top 10 de las esencias con menor rotación en ventas (con existencias activas)
 * 1. Toy Boy H (Black Bear H) - esencia-apae-059
 * 2. Blanc L.12.12 H (Basic White H) - esencia-apae-036
 * 3. Bad Boy H (Irresistible H) - esencia-apae-028
 * 4. Polo Black H (Night Sky H) - esencia-apae-038
 * 5. Ralph F (CowBoy Girl F) - esencia-apae-039
 * 6. Green Tea F (England Forest F) - esencia-apae-047
 * 7. Black Opium F (Aroma Addict F) - esencia-apae-043
 * 8. 212 VIP F (Wife Material F) - esencia-apae-034
 * 9. Yara F (Dubai F) - esencia-apae-040
 * 10. Chance F (New York Lady F) - esencia-apae-022
 */
export const HALLOWEEN_TOP10_PRODUCT_IDS = new Set<string>([
  'esencia-apae-059',
  'esencia-apae-036',
  'esencia-apae-028',
  'esencia-apae-038',
  'esencia-apae-039',
  'esencia-apae-047',
  'esencia-apae-043',
  'esencia-apae-034',
  'esencia-apae-040',
  'esencia-apae-022',
]);

export const HALLOWEEN_TOP10_SKUS = new Set<string>([
  'APAE-059',
  'APAE-036',
  'APAE-028',
  'APAE-038',
  'APAE-039',
  'APAE-047',
  'APAE-043',
  'APAE-034',
  'APAE-040',
  'APAE-022',
]);

export function isHalloweenPromoProduct(
  product?: { id?: string | null; sku?: string | null } | null
): boolean {
  if (!HALLOWEEN_PROMO_ACTIVE || !product) return false;
  if (product.id && HALLOWEEN_TOP10_PRODUCT_IDS.has(product.id)) return true;
  if (product.sku && HALLOWEEN_TOP10_SKUS.has(product.sku.toUpperCase())) return true;
  return false;
}
