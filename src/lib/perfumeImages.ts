// src/lib/perfumeImages.ts
import { ProductItem } from './store';

export const MEN_PERFUME_IMAGES = [
  'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&q=80', // Vidrio ámbar pesado
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&q=80', // Frasco negro con atomizador plata
  'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=500&q=80', // Frasco azul marino cobalto
  'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500&q=80', // Frasco cuadrado moderno
  'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=500&q=80', // Frasco gris humo
  'https://images.unsplash.com/photo-1592914610354-fd354ea45e48?w=500&q=80', // Cilíndrico clásico
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&q=80', // Geométrico elegante
  'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=500&q=80', // Cristal nítido atomizador negro
];

export const WOMEN_PERFUME_IMAGES = [
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&q=80', // Oro rosado y cristal
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&q=80', // Cristal estilo francés
  'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=500&q=80', // Frasco blush suave
  'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=500&q=80', // Curvo con tapa dorada
  'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=500&q=80', // Ámbar floral
  'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=500&q=80', // Cristal tallado
  'https://images.unsplash.com/photo-1594913785162-e678a0c23cc7?w=500&q=80', // Alta perfumería
  'https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=500&q=80', // Cuello dorado fino
];

export const UNISEX_PERFUME_IMAGES = [
  'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&q=80', // Boticario moderno
  'https://images.unsplash.com/photo-1528720208104-3d9bd03cc9d4?w=500&q=80', // Cilíndrico cristalino
  'https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=500&q=80', // Cristal con ribete dorado
  'https://images.unsplash.com/photo-1617897903246-719242758050?w=500&q=80', // Cristal esmerilado
  'https://images.unsplash.com/photo-1594913785162-e678a0c23cc7?w=500&q=80', // Niche perfume
  'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&q=80', // Vidrio de lujo
  'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=500&q=80', // Frasco contemporáneo
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&q=80', // Cristal radiante
];

export const BOTTLE_IMAGES_MAP: Record<string, string> = {
  'BOT-100-DIA-P': '/images/botes/bote_100ml_diamante_plata.jpg',
  'bote-100ml-diamante-plata': '/images/botes/bote_100ml_diamante_plata.jpg',

  'BOT-100-SAU-N': '/images/botes/bote_100ml_sauvage_degrade_negro.jpg',
  'bote-100ml-sauvage-degrade': '/images/botes/bote_100ml_sauvage_degrade_negro.jpg',

  'BOT-100-ACA-B': '/images/botes/bote_100ml_acanalado_tapa_blanca.jpg',
  'bote-100ml-acanalado-blanco': '/images/botes/bote_100ml_acanalado_tapa_blanca.jpg',

  'BOT-100-ACA-N': '/images/botes/bote_100ml_acanalado_tapa_negra.jpg',
  'bote-100ml-acanalado-negro': '/images/botes/bote_100ml_acanalado_tapa_negra.jpg',

  'BOT-100-CUA-B': '/images/botes/bote_100ml_cuadrado_bleu_negro.jpg',
  'bote-100ml-cuadrado-bleu': '/images/botes/bote_100ml_cuadrado_bleu_negro.jpg',

  'BOT-100-FRO-EMC': '/images/botes/bote_100ml_frosted_esfera_madera_clara.jpg',
  'bote-100ml-frosted-esfera-madera-clara': '/images/botes/bote_100ml_frosted_esfera_madera_clara.jpg',

  'BOT-100-FRO-EMO': '/images/botes/bote_100ml_frosted_esfera_madera_oscura.jpg',
  'bote-100ml-frosted-esfera-madera-oscura': '/images/botes/bote_100ml_frosted_esfera_madera_oscura.jpg',

  'BOT-100-HC-B': '/images/botes/bote_100ml_cilindrico_hombro_blanco.jpg',
  'bote-100ml-hombro-curvo-blanco': '/images/botes/bote_100ml_cilindrico_hombro_blanco.jpg',

  'BOT-100-HC-N': '/images/botes/bote_100ml_cilindrico_hombro_negro.jpg',
  'bote-100ml-hombro-curvo-negro': '/images/botes/bote_100ml_cilindrico_hombro_negro.jpg',

  'BOT-100-SAN-O': '/images/botes/bote_100ml_santal_tapa_oro.jpg',
  'bote-100ml-santal-oro': '/images/botes/bote_100ml_santal_tapa_oro.jpg',

  'BOT-100-CIL-TN': '/images/botes/bote_100ml_cilindrico_tapa_negra.jpg',
  'bote-100ml-cilindrico-tapa-negra': '/images/botes/bote_100ml_cilindrico_tapa_negra.jpg',

  'BOT-100-FRO-CMC': '/images/botes/bote_100ml_frosted_cilindro_madera_clara.jpg',
  'bote-100ml-frosted-cilindro-madera-clara': '/images/botes/bote_100ml_frosted_cilindro_madera_clara.jpg',

  'BOT-100-FRO-CMM': '/images/botes/bote_100ml_frosted_cilindro_madera_media.jpg',
  'bote-100ml-frosted-cilindro-madera-media': '/images/botes/bote_100ml_frosted_cilindro_madera_media.jpg',

  'BOT-100-FRO-CMO': '/images/botes/bote_100ml_frosted_cilindro_madera_oscura.jpg',
  'bote-100ml-frosted-cilindro-madera-oscura': '/images/botes/bote_100ml_frosted_cilindro_madera_oscura.jpg',

  'BOT-100-REC-FP': '/images/botes/bote_100ml_rectangular_frosted_plata.jpg',
  'bote-100ml-rectangular-frosted-plata': '/images/botes/bote_100ml_rectangular_frosted_plata.jpg',

  'BOT-100-CHA-C': '/images/botes/bote_100ml_chanel_tapa_cristal.jpg',
  'bote-100ml-chanel-cristal': '/images/botes/bote_100ml_chanel_tapa_cristal.jpg',

  'BOT-100-ROC-N': '/images/botes/bote_100ml_rockstud_tapa_negra.jpg',
  'bote-100ml-rockstud-tapa-negra': '/images/botes/bote_100ml_rockstud_tapa_negra.jpg',

  'BOT-100-ROC-C': '/images/botes/bote_100ml_rockstud_tapa_cobre.jpg',
  'bote-100ml-rockstud-tapa-cobre': '/images/botes/bote_100ml_rockstud_tapa_cobre.jpg',

  'BOT-100-CIL-AN': '/images/botes/bote_100ml_cilindrico_alto_tapa_negra.jpg',
  'bote-100ml-cilindrico-alto-negro': '/images/botes/bote_100ml_cilindrico_alto_tapa_negra.jpg',
};

/**
 * Retorna la imagen oficial del producto.
 */
export function getProductImage(product: ProductItem): string {
  // 1. Para frascos y botes de perfume: siempre usar su fotografía oficial en fondo blanco
  if (product.category === 'Botes' || product.category === 'Botes & Envases') {
    if (product.imageUrl && product.imageUrl.startsWith('/images/botes/')) {
      return product.imageUrl;
    }
    const mapped = BOTTLE_IMAGES_MAP[product.sku] || BOTTLE_IMAGES_MAP[product.id];
    if (mapped) return mapped;
    return '/images/botes/bote_100ml_sauvage_degrade_negro.jpg';
  }

  // 2. Para todas las esencias de perfume (onzas y medias onzas)
  if (!product.category || product.category === 'Esencias para Perfume') {
    const contratipoName = product.name || 'Esencia Pura';
    return `/api/bottle-image?name=${encodeURIComponent(contratipoName)}`;
  }

  // 3. Si tiene imagen asignada (suministros, empaques, etc.)
  if (product.imageUrl && product.imageUrl.trim() !== '') {
    return product.imageUrl;
  }

  // Generar semilla determinista para suministros sin imagen
  const seedString = product.sku || product.id || product.name || '0';
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const gender = (product.gender || '').toLowerCase();

  if (gender.includes('caballero') || gender.includes('hombre')) {
    return MEN_PERFUME_IMAGES[seed % MEN_PERFUME_IMAGES.length];
  }

  if (gender.includes('dama') || gender.includes('mujer')) {
    return WOMEN_PERFUME_IMAGES[seed % WOMEN_PERFUME_IMAGES.length];
  }

  return UNISEX_PERFUME_IMAGES[seed % UNISEX_PERFUME_IMAGES.length];
}
