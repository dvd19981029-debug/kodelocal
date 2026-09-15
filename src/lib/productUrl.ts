// src/lib/productUrl.ts
// Helper centralizado para URLs y Slugs limpios del Ecommerce
// Garantiza que JAMÁS se revele el proveedor ('apae') ni marcas de diseñadores ajenas ('sauvage', 'santal', 'chanel', 'bleu')

export const BOTTLE_SLUG_MAP: Record<string, string> = {
  'bote-100ml-sauvage-degrade': 'bote-100ml-degrade-azul-noche',
  'bote-100ml-santal-oro': 'bote-100ml-cilindrico-tapa-oro',
  'bote-100ml-chanel-cristal': 'bote-100ml-rectangular-cristal',
  'bote-100ml-cuadrado-bleu': 'bote-100ml-cuadrado-azul-oscuro',
};

export const BOTTLE_REVERSE_MAP: Record<string, string> = {
  'bote-100ml-degrade-azul-noche': 'bote-100ml-sauvage-degrade',
  'bote-100ml-cilindrico-tapa-oro': 'bote-100ml-santal-oro',
  'bote-100ml-rectangular-cristal': 'bote-100ml-chanel-cristal',
  'bote-100ml-cuadrado-azul-oscuro': 'bote-100ml-cuadrado-bleu',
};

/**
 * Genera un slug limpio y amigable para SEO y URLs del ecommerce.
 * - Esencias: 'esencia-1', 'esencia-7', etc. (sin 'apae' ni nombres de proveedores).
 * - Botes: nombres genéricos descriptivos (sin 'sauvage', 'santal', etc.).
 */
export function getProductSlug(product: {
  id: string;
  sku?: string | null;
  name?: string | null;
  category?: string | null;
}): string {
  if (!product || !product.id) return '';

  // 1. Esencias de perfumería fina: usar esencia-[sku] o esencia-[numero]
  const isEssence =
    product.category === 'Esencias para Perfume' ||
    product.id.startsWith('esencia-');

  if (isEssence) {
    const sku = String(product.sku || '').trim();
    if (sku && /^\d+$/.test(sku)) {
      return `esencia-${sku}`;
    }
    // Si no hay SKU numérico, limpiar cualquier mención de proveedor 'apae'
    return product.id.replace(/^esencia-apae-/, 'esencia-');
  }

  // 2. Botes de vidrio con nombres de marcas: mapear a slug genérico
  if (BOTTLE_SLUG_MAP[product.id]) {
    return BOTTLE_SLUG_MAP[product.id];
  }

  // 3. Demás insumos y empaques
  return product.id;
}

/**
 * Devuelve la URL canónica para el producto en el ecommerce.
 * Ej: '/producto/esencia-1', '/producto/bote-100ml-degrade-azul-noche'
 */
export function getProductUrl(product: {
  id: string;
  sku?: string | null;
  name?: string | null;
  category?: string | null;
}): string {
  const slug = getProductSlug(product);
  return slug ? `/producto/${encodeURIComponent(slug)}` : '/';
}

/**
 * Resuelve un slug recibido en la ruta /producto/[id] a su ID o criterio de búsqueda original.
 */
export function resolveTargetProductId(slugOrId: string): string {
  const clean = decodeURIComponent(slugOrId || '').toLowerCase().trim();
  return BOTTLE_REVERSE_MAP[clean] || clean;
}
