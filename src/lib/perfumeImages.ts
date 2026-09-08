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

/**
 * Retorna la imagen oficial del producto.
 * Para todas las esencias (onzas y medias onzas), genera dinámicamente
 * la fotografía del frasco de onza con el nombre del contratipo impreso en la etiqueta.
 */
export function getProductImage(product: ProductItem): string {
  // Para todas las esencias de perfume (onzas y medias onzas)
  if (!product.category || product.category === 'Esencias para Perfume') {
    const contratipoName = product.name || 'Esencia Pura';
    return `/api/bottle-image?name=${encodeURIComponent(contratipoName)}`;
  }

  // Si tiene imagen asignada (frascos, envases o suministros)
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
