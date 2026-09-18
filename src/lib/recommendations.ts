// src/lib/recommendations.ts

import { ProductItem, INITIAL_PRODUCTS } from '@/lib/store';

export interface PostRecommendations {
  primaryProduct: ProductItem;
  matchedEssences: ProductItem[];
  recommendedBottles: ProductItem[];
  recommendedSupplies: ProductItem[];
  intentType: 'diy' | 'business' | 'performance' | 'general';
  headline: string;
  subheadline: string;
}

/**
 * Analiza el título, contenido y categoría de un artículo para recomendar
 * de diversas formas los productos más pertinentes del catálogo de Aromaniak SV.
 */
export function getRecommendationsForPost(
  postTitle: string,
  postContent: string,
  category?: string | null
): PostRecommendations {
  const fullText = `${postTitle} ${postContent} ${category || ''}`.toLowerCase();

  // 1. Detección de intenciones temáticas
  const isDIY = /armar|hacer perfume|en casa|maceraci[oó]n|mezclar|f[oó]rmula|alcohol|gotero|atomizador|proporci[oó]n/i.test(fullText);
  const isBusiness = /vender|negocio|emprender|revendedor|desde casa|ganancia|mayoreo|revender|ingreso extra|clientes|inversi[oó]n/i.test(fullText);
  const isPerformance = /fijaci[oó]n|duraci[oó]n|rendimiento|concentraci[oó]n|estela|proyecci[oó]n|horas/i.test(fullText);

  // 2. Búsqueda de esencias explícitamente mencionadas en el texto
  const allEssences = INITIAL_PRODUCTS.filter(p => p.category === 'Esencias para Perfume' && p.isAvailableOnline);
  const mentionedEssences: ProductItem[] = [];
  const seenIds = new Set<string>();

  for (const prod of allEssences) {
    const nameLower = prod.name.toLowerCase();
    const officialLower = (prod.officialName || '').toLowerCase();
    const brandLower = (prod.brand || '').toLowerCase();

    // Comprobar coincidencias de palabras completas o términos clave
    const matchName = nameLower.length > 3 && fullText.includes(nameLower);
    const matchOfficial = officialLower.length > 3 && fullText.includes(officialLower);
    const matchBrand = brandLower.length > 4 && fullText.includes(brandLower);

    if (matchName || matchOfficial || matchBrand) {
      if (!seenIds.has(prod.id)) {
        seenIds.add(prod.id);
        mentionedEssences.push(prod);
      }
    }
  }

  // 3. Fallbacks de esencias si no se mencionaron o para completar hasta 4-6
  let fallbackEssences: ProductItem[] = [];
  if (fullText.includes('dama') || fullText.includes('mujer') || (category && category.toLowerCase().includes('dama'))) {
    fallbackEssences = allEssences.filter(p => p.gender === 'Dama');
  } else if (fullText.includes('caballero') || fullText.includes('hombre') || (category && category.toLowerCase().includes('caballero'))) {
    fallbackEssences = allEssences.filter(p => p.gender === 'Caballero');
  } else {
    // Esencias populares estrella
    fallbackEssences = allEssences.filter(p => 
      ['esencia-apae-001', 'esencia-apae-016', 'esencia-apae-013', 'esencia-apae-004', 'esencia-apae-018'].includes(p.id)
    );
  }

  for (const fb of fallbackEssences) {
    if (!seenIds.has(fb.id) && mentionedEssences.length < 6) {
      seenIds.add(fb.id);
      mentionedEssences.push(fb);
    }
  }

  // Si aún está vacío, usar las primeras esencias
  if (mentionedEssences.length === 0) {
    mentionedEssences.push(...allEssences.slice(0, 4));
  }

  const primaryProduct = mentionedEssences[0];

  // 4. Botes de vidrio recomendados (100ml con atomizador de lujo)
  const allBottles = INITIAL_PRODUCTS.filter(p => p.category === 'Botes' && p.isAvailableOnline);
  const recommendedBottles = allBottles.length > 0
    ? allBottles
    : INITIAL_PRODUCTS.filter(p => p.category === 'Botes');

  // 5. Insumos recomendados según el tipo de artículo
  const allSupplies = INITIAL_PRODUCTS.filter(p => 
    (p.category === 'Insumos y Materia Prima' || p.category === 'Empaque') && p.isAvailableOnline
  );

  let intentType: 'diy' | 'business' | 'performance' | 'general' = 'general';
  let headline = 'Fragancia Destacada del Artículo';
  let subheadline = 'Esencia 100% pura de alta concentración disponible por onza y media onza.';

  if (isDIY) {
    intentType = 'diy';
    headline = 'Materiales y Esencias para Armar tu Perfume';
    subheadline = 'Esencias 100% puras sin diluir, frascos de vidrio con atomizador e insumos recomendados en esta guía.';
  } else if (isBusiness) {
    intentType = 'business';
    headline = 'Fragancias y Presentaciones Recomendadas para Emprender';
    subheadline = 'Líneas de alta rotación por onza y frascos con excelente margen para vender desde casa.';
  } else if (isPerformance) {
    intentType = 'performance';
    headline = 'Esencias de Máxima Fijación y Rendimiento';
    subheadline = 'Concentrados puros de más de 8 a 12 horas de duración sobre la piel.';
  }

  return {
    primaryProduct,
    matchedEssences: mentionedEssences.slice(0, 6),
    recommendedBottles: recommendedBottles.slice(0, 8),
    recommendedSupplies: allSupplies,
    intentType,
    headline,
    subheadline,
  };
}
