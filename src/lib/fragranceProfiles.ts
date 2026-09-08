// src/lib/fragranceProfiles.ts
import { ProductItem } from './store';

export interface FragranceProfile {
  family: string;
  accords: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  season: string;
  occasion: string;
  intensity: 'Sutil' | 'Moderada' | 'Intensa';
  description: string;
}

// Perfiles olfativos específicos para contratipos destacados
const NOTABLE_PROFILES: Record<string, Partial<FragranceProfile>> = {
  '100': { // 1 Million Elixir
    family: 'Ámbar Amaderada',
    accords: ['Vainilla', 'Dulce', 'Frutal', 'Amaderado', 'Ámbar'],
    topNotes: ['Manzana crujiente', 'Davana'],
    heartNotes: ['Rosa de Damasco', 'Osmanthus', 'Madera de cedro'],
    baseNotes: ['Absoluto de vainilla', 'Haba tonka', 'Pachulí'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Salidas nocturnas, eventos especiales y citas',
    intensity: 'Intensa',
    description: 'Una fragancia rica y seductora que combina acordes frutales licorosos con la calidez del haba tonka y una vainilla opulenta. Diseñada para dejar una estela magnética e inolvidable.',
  },
  '102': { // 1 Million
    family: 'Amaderada Especiada',
    accords: ['Cálido especiado', 'Canela', 'Cítrico', 'Cuero', 'Ámbar'],
    topNotes: ['Mandarina roja', 'Pomelo', 'Menta fresca'],
    heartNotes: ['Canela', 'Notas especiadas', 'Rosa'],
    baseNotes: ['Ámbar dorado', 'Cuero', 'Maderas blancas', 'Pachulí'],
    season: 'Todo el año / Noche',
    occasion: 'Fiestas, reuniones sociales y momentos audaces',
    intensity: 'Intensa',
    description: 'El clásico indiscutible del carisma moderno. Abre con destellos cítricos de mandarina y menta que dan paso a un corazón especiado de canela antes de reposar en una base de cuero y maderas nobles.',
  },
  '103': { // 212 Men
    family: 'Almizcle Floral Amaderado',
    accords: ['Verde', 'Cítrico', 'Amaderado', 'Fresco especiado'],
    topNotes: ['Hojas verdes', 'Pomelo', 'Bergamota', 'Lavanda'],
    heartNotes: ['Jengibre', 'Pimienta verde', 'Gardenia', 'Salvia'],
    baseNotes: ['Almizcle blanco', 'Sándalo', 'Madera de gaiac', 'Incienso'],
    season: 'Primavera / Verano / Día',
    occasion: 'Uso diario, oficina y actividades al aire libre',
    intensity: 'Moderada',
    description: 'Inspirada en el ritmo dinámico y cosmopolita de la gran ciudad. Su combinación de notas verdes acuáticas y jengibre picante aporta una frescura sofisticada y limpia.',
  },
  '104': { // 212 VIP Men
    family: 'Ámbar Amaderada',
    accords: ['Vodka', 'Fruta de la pasión', 'Cálido especiado', 'Amaderado'],
    topNotes: ['Maracuyá', 'Lima caviar', 'Pimienta negra'],
    heartNotes: ['Vodka helado', 'Ginebra', 'Menta crujiente'],
    baseNotes: ['Ámbar', 'Cuero', 'Maderas reales'],
    season: 'Noches / Todo el año',
    occasion: 'Vida nocturna, celebraciones y momentos VIP',
    intensity: 'Intensa',
    description: 'Un cóctel aromático exclusivo y vibrante. Con notas chispeantes de maracuyá y menta combinadas con acordes licorosos que proyectan seguridad y magnetismo.',
  },
  '105': { // 212 VIP Black
    family: 'Aromática Fougère',
    accords: ['Absenta', 'Anís', 'Lavanda', 'Vainilla negra'],
    topNotes: ['Absenta', 'Anís', 'Hinojo'],
    heartNotes: ['Lavanda francesa'],
    baseNotes: ['Vainilla negra', 'Almizcle'],
    season: 'Noche / Clima templado y fresco',
    occasion: 'Eventos elegantes y salidas de impacto',
    intensity: 'Intensa',
    description: 'Misteriosa e hipnótica, contrasta el aroma anisado de la absenta con la serenidad de la lavanda y el fondo dulce envolvente de vainilla negra.',
  },
  '112': { // Acqua di Gio
    family: 'Aromática Acuática',
    accords: ['Marino', 'Cítrico', 'Aromático', 'Fresco'],
    topNotes: ['Notas marinas', 'Bergamota de Calabria', 'Limón', 'Neroli'],
    heartNotes: ['Romero', 'Jazmín', 'Calone', 'Cilantro'],
    baseNotes: ['Cedro', 'Almizcle', 'Pachulí', 'Musgo de roble'],
    season: 'Primavera / Verano / Calor',
    occasion: 'Playa, paseos casuales, oficina y clima cálido',
    intensity: 'Moderada',
    description: 'La máxima expresión del frescor mediterráneo. Una bocanada de brisa marina salada combinada con bergamota resplandeciente y maderas transparentes.',
  },
  '143': { // Baccarat Rouge 540
    family: 'Ámbar Floral Unisex',
    accords: ['Ambarado', 'Almendrado', 'Amaderado', 'Cálido especiado', 'Metálico'],
    topNotes: ['Azafrán de Persia', 'Jazmín Grandiflorum'],
    heartNotes: ['Madera de cedro', 'Amberwood'],
    baseNotes: ['Ámbar gris', 'Resina de abeto'],
    season: 'Todo el año / Firma personal',
    occasion: 'Cualquier ocasión donde desees destacar con elegancia de alta perfumería',
    intensity: 'Intensa',
    description: 'Una creación luminosa y aérea que se posa sobre la piel como una caricia de ámbar y madera floral. El azafrán y el jazmín se funden con un ámbar gris que proyecta un lujo contemporáneo.',
  },
  '148': { // Bleu de Chanel
    family: 'Amaderada Aromática',
    accords: ['Cítrico', 'Amaderado', 'Aromático', 'Ámbar', 'Incienso'],
    topNotes: ['Pomelo', 'Limón', 'Menta', 'Pimienta rosa'],
    heartNotes: ['Jengibre', 'Nuez moscada', 'Jazmín', 'Iso E Super'],
    baseNotes: ['Incienso', 'Vetiver', 'Cedro', 'Sándalo', 'Pachulí'],
    season: 'Versátil / Todo el año',
    occasion: 'Trabajo profesional, citas, reuniones ejecutivas y noche',
    intensity: 'Moderada',
    description: 'El epítome de la elegancia masculina contemporánea. Equilibra frescura cítrica chispeante con la profundidad balsámica del incienso y las maderas finas.',
  },
  '199': { // Sauvage
    family: 'Aromática Fougère',
    accords: ['Fresco especiado', 'Ámbar', 'Cítrico', 'Lavanda', 'Almizclado'],
    topNotes: ['Bergamota de Reggio di Calabria', 'Pimienta de Sichuan'],
    heartNotes: ['Lavanda', 'Pimienta rosa', 'Vetiver', 'Geranio'],
    baseNotes: ['Ambroxan de alta pureza', 'Cedro', 'Ládano'],
    season: 'Todo el año / Firma diaria',
    occasion: 'Uso diario versátil, oficina y salidas',
    intensity: 'Intensa',
    description: 'Una composición radicalmente fresca, cruda y noble a la vez. El desborde de bergamota jugosa se ancla en la potencia radiante del ambroxan.',
  }
};

/**
 * Genera determinísticamente un perfil olfativo completo para cualquier producto
 * según su nombre, marca, SKU y género.
 */
export function getFragranceProfile(product: ProductItem): FragranceProfile {
  const sku = String(product.sku || '').trim();

  if (NOTABLE_PROFILES[sku]) {
    const p = NOTABLE_PROFILES[sku];
    return {
      family: p.family || 'Amaderada Aromática',
      accords: p.accords || ['Amaderado', 'Fresco', 'Aromático'],
      topNotes: p.topNotes || ['Cítricos', 'Notas verdes'],
      heartNotes: p.heartNotes || ['Especias finas', 'Notas florales'],
      baseNotes: p.baseNotes || ['Maderas nobles', 'Almizcle'],
      season: p.season || 'Todo el año',
      occasion: p.occasion || 'Uso diario y ocasiones especiales',
      intensity: p.intensity || 'Moderada',
      description: p.description || `${product.officialName || product.name} es un contratipo fino de máxima pureza inspirado en ${product.name}, formulado con aceites concentrados franceses para brindar una experiencia olfativa envolvente y duradera.`
    };
  }

  const gender = (product.gender || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();

  // Generación según género y familia
  if (gender.includes('dama') || gender.includes('mujer')) {
    if (name.includes('rose') || name.includes('flora') || name.includes('bloom') || name.includes('bella')) {
      return {
        family: 'Floral Frutal',
        accords: ['Floral', 'Frutal dulce', 'Rosas', 'Fresco'],
        topNotes: ['Pera jugosa', 'Grosellas negras', 'Bergamota'],
        heartNotes: ['Rosa de Mayo', 'Jazmín Sambac', 'Flor de azahar'],
        baseNotes: ['Vainilla de Madagascar', 'Pachulí blanco', 'Almizcle'],
        season: 'Primavera / Verano / Todo el año',
        occasion: 'Día a día, citas románticas y reuniones sociales',
        intensity: 'Moderada',
        description: `Un homenaje a la feminidad radiante. Inspirado en ${product.name} de ${product.brand || 'alta perfumería'}, despliega un bouquet floral con destellos frutales dulces que se asienta delicadamente sobre la piel.`
      };
    }

    return {
      family: 'Floral Oriental',
      accords: ['Floral blanco', 'Vainilla', 'Atalcado', 'Ámbar'],
      topNotes: ['Mandarina italiana', 'Almendra dulce', 'Café sutil'],
      heartNotes: ['Tuberosa', 'Jazmín', 'Flor de naranja'],
      baseNotes: ['Haba tonka', 'Cacao', 'Sándalo', 'Vainilla'],
      season: 'Todo el año / Noche y clima fresco',
      occasion: 'Eventos elegantes, cenas y salidas nocturnas',
      intensity: 'Intensa',
      description: `Inspirado en la sensualidad sofisticada de ${product.name}. Su apertura cremosa y luminosa evoluciona hacia un fondo cálido de haba tonka y maderas preciosas que atrae todas las miradas.`
    };
  }

  if (gender.includes('caballero') || gender.includes('hombre')) {
    if (name.includes('aqua') || name.includes('blue') || name.includes('sport') || name.includes('marine')) {
      return {
        family: 'Acuática Cítrica',
        accords: ['Marino', 'Cítrico', 'Aromático', 'Fresco'],
        topNotes: ['Bergamota', 'Notas ozónicas', 'Pomelo'],
        heartNotes: ['Romero', 'Lavanda silvestre', 'Salvia'],
        baseNotes: ['Cedro del Atlas', 'Vetiver', 'Almizcle cristalino'],
        season: 'Día / Calor / Primavera y Verano',
        occasion: 'Uso diario casual, oficina, deporte y climas cálidos',
        intensity: 'Moderada',
        description: `Frescura pura y vigorizante. Inspirado en ${product.name} de ${product.brand || 'perfumería de diseño'}, captura la brisa marina y los cítricos frescos sobre un fondo amaderado limpio.`
      };
    }

    return {
      family: 'Amaderada Especiada',
      accords: ['Amaderado', 'Cálido especiado', 'Aromático', 'Ámbar'],
      topNotes: ['Cardamomo', 'Pimienta negra', 'Cítricos aromáticos'],
      heartNotes: ['Lavanda', 'Madera de cedro', 'Canela'],
      baseNotes: ['Vetiver', 'Haba tonka', 'Ámbar gris', 'Pachulí'],
      season: 'Todo el año / Versátil',
      occasion: 'Trabajo, negocios, salidas de noche y citas',
      intensity: 'Intensa',
      description: `Elegancia y presencia masculina indiscutible. Inspirado en ${product.name} de ${product.brand || 'alta gama'}, combina especias refinadas y maderas cálidas que proyectan carácter y distinción.`
    };
  }

  // Unisex default
  return {
    family: 'Ámbar Amaderada Unisex',
    accords: ['Ámbar', 'Amaderado', 'Almizclado', 'Cálido especiado'],
    topNotes: ['Azafrán suave', 'Bergamota', 'Nuez moscada'],
    heartNotes: ['Rosa oscura', 'Madera de cedro', 'Incienso'],
    baseNotes: ['Ámbar dorado', 'Sándalo', 'Almizcle blanco'],
    season: 'Todo el año / Versatilidad total',
    occasion: 'Cualquier momento del día o evento especial',
    intensity: 'Moderada',
    description: `Una creación versátil y envolvente para quien busca autenticidad sin etiquetas. Inspirada en ${product.name}, fusiona maderas nobles con resinas doradas para adaptarse a la química de cada piel.`
  };
}
