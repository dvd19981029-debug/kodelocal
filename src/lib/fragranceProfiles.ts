// src/lib/fragranceProfiles.ts
import { ProductItem } from './store';
import { getAccordColor, getNoteImageUrl } from './fragranceNotesData';

export interface AccordBarItem {
  name: string;
  percentage: number;
  bg: string;
  text: string;
}

export interface FragranceProfile {
  family: string;
  accords: string[];
  accordItems?: { name: string; percentage: number }[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  season: string;
  occasion: string;
  intensity: 'Sutil' | 'Moderada' | 'Intensa';
  description: string;
}

/**
 * Convierte los acordes de un perfil en barras porcentuales con color según Fragrantica.
 */
export function getFragranceAccordBars(profile: FragranceProfile): AccordBarItem[] {
  const accords = profile.accords || [];
  if (accords.length === 0) return [];

  // Progresión decreciente natural de Fragrantica
  const weights = [100, 80, 66, 56, 48, 42, 36, 32, 28, 25];

  return accords.slice(0, 10).map((name, idx) => {
    const percentage = profile.accordItems && profile.accordItems[idx] 
      ? profile.accordItems[idx].percentage 
      : (weights[idx] || Math.max(20, 100 - idx * 12));

    const color = getAccordColor(name);
    return {
      name,
      percentage,
      bg: color.bg,
      text: color.text
    };
  });
}

// Perfiles olfativos extraídos directamente de la convención de Fragrantica
const NOTABLE_PROFILES: Record<string, Partial<FragranceProfile>> = {
  // --- PACO RABANNE ---
  '100': { // 1 Million Elixir
    family: 'Ámbar Amaderada',
    accords: ['vainilla', 'dulce', 'amaderado', 'frutal', 'ámbar', 'atalcado'],
    topNotes: ['Manzana crujiente', 'Davana'],
    heartNotes: ['Rosa de Damasco', 'Osmanto', 'Madera de cedro'],
    baseNotes: ['Absoluto de vainilla', 'Haba tonka', 'Pachulí'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Salidas nocturnas, eventos especiales y citas',
    intensity: 'Intensa',
    description: 'Una fragancia rica y seductora que combina acordes frutales licorosos con la calidez del haba tonka y una vainilla opulenta. Diseñada para dejar una estela magnética e inolvidable.'
  },
  '101': { // 1 Million Golden Oud
    family: 'Ámbar Amaderada Oriental',
    accords: ['oud', 'amaderado', 'ámbar', 'cálido especiado', 'cuero'],
    topNotes: ['Nuez moscada', 'Pimienta negra', 'Azafrán', 'Bergamota'],
    heartNotes: ['Bálsamo de Gurjum', 'Madera de cedro', 'Ládano', 'Iris'],
    baseNotes: ['Madera de agar (Oud)', 'Cuero', 'Pachulí', 'Sándalo'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Eventos de gala y ocasiones memorables',
    intensity: 'Intensa',
    description: 'Una oda a la opulencia oriental. El precioso oud se fusiona con resinas cálidas, cuero curtido y especias vibrantes.'
  },
  '102': { // 1 Million
    family: 'Amaderada Especiada',
    accords: ['cálido especiado', 'canela', 'cítrico', 'ámbar', 'cuero', 'amaderado'],
    topNotes: ['Mandarina roja', 'Pomelo', 'Menta fresca'],
    heartNotes: ['Canela', 'Notas especiadas', 'Rosa de Damasco'],
    baseNotes: ['Ámbar dorado', 'Cuero', 'Maderas blancas', 'Pachulí'],
    season: 'Todo el año / Noche',
    occasion: 'Fiestas, reuniones sociales y momentos audaces',
    intensity: 'Intensa',
    description: 'El clásico indiscutible del carisma moderno. Abre con destellos cítricos de mandarina y menta que dan paso a un corazón especiado de canela antes de reposar en una base de cuero y maderas nobles.'
  },
  '104': { // 1 Million Lucky
    family: 'Amaderada Frutal',
    accords: ['amaderado', 'dulce', 'frutal', 'ozónico', 'miel'],
    topNotes: ['Ciruela', 'Notas ozónicas', 'Pomelo', 'Bergamota'],
    heartNotes: ['Avellana', 'Miel', 'Madera de cedro', 'Jazmín'],
    baseNotes: ['Amberwood', 'Pachulí', 'Musgo de roble', 'Vetiver'],
    season: 'Otoño / Primavera / Versátil',
    occasion: 'Citas, salidas casuales y fiestas',
    intensity: 'Intensa',
    description: 'Una explosión golosa y adictiva que entrelaza la jugosidad de la ciruela verde con notas gourmand de avellana crujiente y miel dorada.'
  },
  '107': { // 1 Million Royal
    family: 'Ámbar Amaderada',
    accords: ['amaderado', 'aromático', 'ámbar', 'cálido especiado', 'lavanda'],
    topNotes: ['Cardamomo', 'Mandarina', 'Bergamota'],
    heartNotes: ['Lavanda', 'Salvia', 'Hojas de violeta'],
    baseNotes: ['Benjuí', 'Madera de cedro', 'Pachulí'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Ocasiones especiales y eventos nocturnos',
    intensity: 'Intensa',
    description: 'Una interpretación regia que realza la masculinidad con lavanda aromática sobre una base resinosa de benjuí y cedro profundo.'
  },

  // --- CAROLINA HERRERA ---
  '109': { // 212 Men
    family: 'Almizcle Floral Amaderado',
    accords: ['verde', 'cítrico', 'amaderado', 'fresco especiado', 'aromático'],
    topNotes: ['Notas verdes', 'Pomelo', 'Bergamota', 'Lavanda'],
    heartNotes: ['Jengibre', 'Pimienta verde', 'Gardenia', 'Salvia'],
    baseNotes: ['Almizcle blanco', 'Sándalo', 'Incienso', 'Madera de gaiac', 'Vetiver'],
    season: 'Primavera / Verano / Día',
    occasion: 'Uso diario, oficina y actividades al aire libre',
    intensity: 'Moderada',
    description: 'Inspirada en el ritmo dinámico y cosmopolita de Nueva York. Su combinación de notas verdes acuáticas y jengibre picante aporta una frescura sofisticada y limpia.'
  },
  '112': { // 212 Heroes
    family: 'Aromática Frutal',
    accords: ['frutal', 'aromático', 'amaderado', 'fresco', 'cítrico'],
    topNotes: ['Pera jugosa', 'Jengibre', 'Cannabis'],
    heartNotes: ['Geranio', 'Salvia'],
    baseNotes: ['Almizcle', 'Cuero'],
    season: 'Primavera / Verano / Casual',
    occasion: 'Salidas juveniles, momentos casuales y deporte chic',
    intensity: 'Moderada',
    description: 'Una fragancia rebelde y efervescente inspirada en la juventud urbana, con notas chispeantes de pera y jengibre sobre cuero suave.'
  },
  '115': { // 212 VIP Black
    family: 'Aromática Fougère',
    accords: ['aromático', 'avainillado', 'anisado', 'absenta', 'lavanda'],
    topNotes: ['Absenta', 'Anís', 'Hinojo'],
    heartNotes: ['Lavanda francesa'],
    baseNotes: ['Vainilla negra', 'Almizcle'],
    season: 'Noche / Clima templado y fresco',
    occasion: 'Eventos elegantes y salidas de impacto',
    intensity: 'Intensa',
    description: 'Misteriosa e hipnótica, contrasta el aroma anisado de la absenta con la serenidad de la lavanda y el fondo dulce envolvente de vainilla negra.'
  },
  '118': { // 212 VIP Men
    family: 'Ámbar Amaderada',
    accords: ['licor', 'vodka', 'fruta de la pasión', 'cálido especiado', 'amaderado'],
    topNotes: ['Maracuyá', 'Lima caviar', 'Pimienta negra', 'Jengibre'],
    heartNotes: ['Vodka helado', 'Ginebra', 'Menta fresca', 'Especias'],
    baseNotes: ['Ámbar', 'Cuero', 'Maderas nobles'],
    season: 'Noches / Todo el año',
    occasion: 'Vida nocturna, celebraciones y momentos VIP',
    intensity: 'Intensa',
    description: 'Un cóctel aromático exclusivo y vibrante. Con notas chispeantes de maracuyá y menta combinadas con acordes licorosos que proyectan seguridad y magnetismo.'
  },
  '151': { // Bad Boy
    family: 'Ámbar Especiada',
    accords: ['cálido especiado', 'aromático', 'amaderado', 'cacao', 'cítrico'],
    topNotes: ['Pimienta blanca', 'Pimienta negra', 'Bergamota'],
    heartNotes: ['Salvia', 'Madera de cedro'],
    baseNotes: ['Haba tonka', 'Cacao', 'Amberwood'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Citas nocturnas y eventos elegantes',
    intensity: 'Intensa',
    description: 'La dualidad del hombre contemporáneo: fuerte pero sensible, audaz y sofisticado. Un contraste entre pimienta picante y cacao sedoso.'
  },

  // --- GIORGIO ARMANI ---
  '140': { // Acqua di Gio
    family: 'Aromática Acuática',
    accords: ['cítrico', 'marino', 'aromático', 'fresco especiado', 'amaderado'],
    topNotes: ['Notas marinas', 'Bergamota de Calabria', 'Limón', 'Neroli', 'Mandarina'],
    heartNotes: ['Romero', 'Jazmín', 'Calone', 'Melocotón'],
    baseNotes: ['Madera de cedro', 'Almizcle blanco', 'Pachulí', 'Musgo de roble', 'Ámbar'],
    season: 'Primavera / Verano / Calor',
    occasion: 'Playa, paseos casuales, oficina y clima cálido',
    intensity: 'Moderada',
    description: 'La máxima expresión del frescor mediterráneo. Una bocanada de brisa marina salada combinada con bergamota resplandeciente y maderas transparentes.'
  },
  '141': { // Acqua di Gio Profondo
    family: 'Aromática Acuática Mineral',
    accords: ['marino', 'aromático', 'cítrico', 'fresco especiado', 'mineral', 'amaderado'],
    topNotes: ['Notas marinas', 'Aquozone', 'Bergamota', 'Mandarina verde'],
    heartNotes: ['Romero', 'Lavanda', 'Ciprés', 'Lentisco'],
    baseNotes: ['Notas minerales', 'Almizcle', 'Pachulí', 'Ámbar'],
    season: 'Primavera / Verano / Todo el año',
    occasion: 'Uso diario elegante, deportes náuticos y veladas',
    intensity: 'Moderada',
    description: 'Una inmersión fascinante en las profundidades marinas. Acordes marinos helados y romero aromático que reposan sobre una base mineral y amaderada.'
  },
  '142': { // Acqua di Gio Profumo
    family: 'Aromática Acuática Ahumada',
    accords: ['marino', 'aromático', 'ahumado', 'fresco especiado', 'amaderado'],
    topNotes: ['Notas marinas', 'Bergamota'],
    heartNotes: ['Romero', 'Salvia', 'Geranio'],
    baseNotes: ['Incienso de olíbano', 'Pachulí'],
    season: 'Todo el año / Noche y Día',
    occasion: 'Reuniones de negocios, citas y eventos distinguidos',
    intensity: 'Intensa',
    description: 'El encuentro volcánico del mar contra la roca negra. Frescura acuática intensa enriquecida por la profundidad mística del incienso puro.'
  },

  // --- CHRISTIAN DIOR ---
  '190': { // Sauvage
    family: 'Aromática Fougère',
    accords: ['fresco especiado', 'ámbar', 'cítrico', 'aromático', 'almizclado', 'amaderado'],
    topNotes: ['Bergamota de Calabria', 'Pimienta negra'],
    heartNotes: ['Pimienta de Sichuan', 'Lavanda', 'Pimienta rosa', 'Vetiver', 'Geranio', 'Pachulí'],
    baseNotes: ['Ambroxan', 'Madera de cedro', 'Ládano'],
    season: 'Todo el año / Firma diaria',
    occasion: 'Uso diario versátil, oficina y salidas',
    intensity: 'Intensa',
    description: 'Una composición radicalmente fresca, cruda y noble a la vez. El desborde de bergamota jugosa se ancla en la potencia radiante del ambroxan.'
  },
  '191': { // Sauvage Elixir
    family: 'Amaderada Especiada Cálida',
    accords: ['cálido especiado', 'amaderado', 'fresco especiado', 'lavanda', 'aromático'],
    topNotes: ['Canela', 'Nuez moscada', 'Cardamomo', 'Pomelo'],
    heartNotes: ['Lavanda'],
    baseNotes: ['Regaliz', 'Sándalo', 'Ámbar', 'Pachulí', 'Vetiver'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Eventos exclusivos donde se busca una proyección colosal',
    intensity: 'Intensa',
    description: 'Una concentración licorosa y ultra potente que lleva la firma de Sauvage a un nivel nocturno extremo con especias calientes y lavanda nocturna.'
  },
  '160': { // Dior Homme Intense
    family: 'Amaderada Floral Almizclada',
    accords: ['iris', 'amaderado', 'atalcado', 'terroso', 'floral', 'ámbar'],
    topNotes: ['Lavanda'],
    heartNotes: ['Iris', 'Ambreta', 'Pera'],
    baseNotes: ['Madera de cedro', 'Vetiver'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Cenas románticas, galas y vestimenta formal',
    intensity: 'Intensa',
    description: 'El iris noble en su máxima expresión. Suaves notas atalcadas se entrelazan con cedro y ambreta creando un aura de elegancia aristocrática.'
  },

  // --- CHANEL ---
  '154': { // Bleu de Chanel
    family: 'Amaderada Aromática',
    accords: ['cítrico', 'amaderado', 'cálido especiado', 'aromático', 'ámbar', 'ahumado'],
    topNotes: ['Pomelo', 'Limón', 'Menta fresca', 'Pimienta rosa'],
    heartNotes: ['Jengibre', 'Nuez moscada', 'Jazmín', 'Iso E Super'],
    baseNotes: ['Incienso de olíbano', 'Vetiver', 'Madera de cedro', 'Sándalo', 'Pachulí'],
    season: 'Versátil / Todo el año',
    occasion: 'Trabajo profesional, citas, reuniones ejecutivas y noche',
    intensity: 'Moderada',
    description: 'El epítome de la elegancia masculina contemporánea. Equilibra frescura cítrica chispeante con la profundidad balsámica del incienso y las maderas finas.'
  },
  '136': { // Allure Homme Sport
    family: 'Amaderada Especiada Fresca',
    accords: ['cítrico', 'aromático', 'aldehídico', 'avainillado', 'fresco especiado'],
    topNotes: ['Naranja', 'Notas marinas', 'Aldehídos', 'Mandarina roja'],
    heartNotes: ['Pimienta', 'Neroli', 'Madera de cedro'],
    baseNotes: ['Haba tonka', 'Vainilla', 'Almizcle blanco', 'Ámbar', 'Vetiver'],
    season: 'Primavera / Verano / Todo el año',
    occasion: 'Deporte, oficina, eventos de día y estilo casual chic',
    intensity: 'Moderada',
    description: 'Vitalidad pura y sensualidad atlética. Cítricos luminosos y brisa marina sobre una base cremosa de haba tonka.'
  },

  // --- VERSACE ---
  '162': { // Eros
    family: 'Aromática Fougère',
    accords: ['avainillado', 'aromático', 'verde', 'fresco especiado', 'ámbar', 'cítrico'],
    topNotes: ['Menta fresca', 'Manzana verde', 'Limón italiano'],
    heartNotes: ['Haba tonka', 'Ambroxan', 'Geranio'],
    baseNotes: ['Vainilla de Madagascar', 'Madera de cedro', 'Vetiver', 'Musgo de roble'],
    season: 'Todo el año / Noche y Fiesta',
    occasion: 'Fiestas, clubes, citas y momentos donde quieras destacar',
    intensity: 'Intensa',
    description: 'Inspirada en el dios del amor y la pasión. Menta crujiente y manzana verde abren paso a una deliciosa vainilla con haba tonka.'
  },
  '163': { // Eros Flame
    family: 'Amaderada Especiada Cítrica',
    accords: ['cítrico', 'cálido especiado', 'aromático', 'avainillado', 'amaderado'],
    topNotes: ['Mandarina', 'Pimienta negra', 'Limón', 'Romero'],
    heartNotes: ['Pimienta rosa', 'Geranio', 'Rosa de Damasco'],
    baseNotes: ['Vainilla', 'Haba tonka', 'Sándalo', 'Madera de cedro', 'Pachulí'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Citas románticas y salidas nocturnas',
    intensity: 'Intensa',
    description: 'El fuego de la pasión. Mandarina jugosa y pimienta negra sobre una base ardiente de maderas y vainilla.'
  },

  // --- CREED ---
  '149': { // Aventus
    family: 'Chipre Frutal Ahumada',
    accords: ['afrutado', 'amaderado', 'ahumado', 'cuero', 'cítrico', 'musgoso'],
    topNotes: ['Piña', 'Bergamota', 'Grosellas negras', 'Manzana'],
    heartNotes: ['Abedul', 'Pachulí', 'Jazmín', 'Rosa'],
    baseNotes: ['Almizcle', 'Musgo de roble', 'Ámbar gris', 'Vainilla'],
    season: 'Todo el año / Firma personal',
    occasion: 'Negocios de alto nivel, eventos de gala y presencia absoluta',
    intensity: 'Intensa',
    description: 'La leyenda de la perfumería masculina de nicho. Piña ahumada y abedul con un fondo majestuoso de ámbar gris.'
  },

  // --- MAISON FRANCIS KURKDJIAN ---
  '205': { // Baccarat Rouge 540
    family: 'Ámbar Floral Metálica',
    accords: ['ámbar', 'amaderado', 'cálido especiado', 'fresco especiado', 'aromático', 'metálico'],
    topNotes: ['Azafrán de Persia', 'Jazmín'],
    heartNotes: ['Amberwood', 'Ámbar gris'],
    baseNotes: ['Resina de abeto', 'Madera de cedro'],
    season: 'Todo el año / Firma personal',
    occasion: 'Ocasiones exclusivas, cenas de gala y presencia sofisticada',
    intensity: 'Intensa',
    description: 'Una creación luminosa y aérea que se posa sobre la piel como una caricia de cristal y oro ambarado.'
  },

  // --- TOM FORD ---
  '200': { // Tobacco Vanille
    family: 'Ámbar Especiada Gourmand',
    accords: ['avainillado', 'dulce', 'tabaco', 'cálido especiado', 'afrutado', 'amaderado'],
    topNotes: ['Hojas de tabaco', 'Notas especiadas'],
    heartNotes: ['Vainilla de Madagascar', 'Cacao', 'Haba tonka', 'Flor del tabaco'],
    baseNotes: ['Frutos secos', 'Maderas nobles'],
    season: 'Otoño / Invierno / Clima frío',
    occasion: 'Noches frías, celebraciones y momentos acogedores',
    intensity: 'Intensa',
    description: 'Inspirada en los clubes de caballeros ingleses. Hojas de tabaco aromático bañadas en vainilla cremosa y cacao tibio.'
  },
  '201': { // Oud Wood
    family: 'Ámbar Amaderada Exótica',
    accords: ['amaderado', 'oud', 'cálido especiado', 'aromático', 'avainillado', 'balsámico'],
    topNotes: ['Palo de rosa de Brasil', 'Cardamomo', 'Pimienta de Sichuan'],
    heartNotes: ['Madera de agar (Oud)', 'Sándalo', 'Vetiver'],
    baseNotes: ['Haba tonka', 'Vainilla', 'Ámbar'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Eventos selectos y reuniones íntimas',
    intensity: 'Intensa',
    description: 'Uno de los ingredientes más raros y costosos de la perfumería: madera de oud envuelta en cardamomo y sándalo cremoso.'
  },
  '202': { // Ombré Leather
    family: 'Cuero Cálido',
    accords: ['cuero', 'cálido especiado', 'floral blanco', 'ámbar', 'terroso'],
    topNotes: ['Cardamomo'],
    heartNotes: ['Cuero', 'Jazmín Sambac'],
    baseNotes: ['Ámbar', 'Musgo de roble', 'Pachulí'],
    season: 'Otoño / Invierno / Versátil',
    occasion: 'Citas, salidas de noche y estilo con carácter',
    intensity: 'Intensa',
    description: 'El aroma inconfundible del cuero negro suave enriquecido con cardamomo y jazmín silvestre.'
  },

  // --- JEAN PAUL GAULTIER ---
  '172': { // Le Male
    family: 'Ámbar Fougère',
    accords: ['avainillado', 'aromático', 'fresco especiado', 'lavanda', 'cálido especiado'],
    topNotes: ['Lavanda', 'Menta fresca', 'Cardamomo', 'Bergamota'],
    heartNotes: ['Canela', 'Flor de azahar', 'Alcaravea'],
    baseNotes: ['Vainilla', 'Haba tonka', 'Ámbar', 'Sándalo', 'Madera de cedro'],
    season: 'Otoño / Invierno / Primavera',
    occasion: 'Salidas nocturnas, citas y fiestas',
    intensity: 'Intensa',
    description: 'Un icono atemporal que rinde tributo a la figura del marinero. Menta vigorizante sobre una reconfortante lavanda y vainilla dulce.'
  },
  '174': { // Ultra Male
    family: 'Ámbar Fougère Gourmand',
    accords: ['avainillado', 'afrutado', 'dulce', 'aromático', 'cálido especiado', 'canela'],
    topNotes: ['Pera jugosa', 'Lavanda', 'Menta fresca', 'Bergamota', 'Limón'],
    heartNotes: ['Canela', 'Salvia', 'Alcaravea'],
    baseNotes: ['Vainilla negra', 'Ámbar', 'Madera de cedro', 'Pachulí'],
    season: 'Noches de fiesta / Otoño e Invierno',
    occasion: 'Conquistas, discotecas y veladas seductoras',
    intensity: 'Intensa',
    description: 'Una seducción extrema dominada por una pera dulce licorosa y una vainilla negra magnética.'
  },

  // --- PERFUMES FEMENINOS DESTACADOS ---
  '455': { // Good Girl
    family: 'Ámbar Floral Femenina',
    accords: ['dulce', 'floral blanco', 'cálido especiado', 'avainillado', 'cacao', 'amaderado'],
    topNotes: ['Almendra', 'Café', 'Bergamota', 'Limón'],
    heartNotes: ['Tuberosa', 'Jazmín Sambac', 'Flor de azahar', 'Rosa de Damasco'],
    baseNotes: ['Haba tonka', 'Cacao', 'Vainilla', 'Praliné', 'Sándalo', 'Ámbar'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Fiestas, eventos de gala, citas y noches de encanto',
    intensity: 'Intensa',
    description: 'Es bueno ser mala. La luminosidad floral de la tuberosa contrasta con la misteriosa tentación del cacao tostado y el haba tonka.'
  },
  '475': { // La Vie Est Belle
    family: 'Floral Frutal Gourmand',
    accords: ['dulce', 'avainillado', 'afrutado', 'pachulí', 'floral blanco', 'iris'],
    topNotes: ['Grosellas negras', 'Pera'],
    heartNotes: ['Iris', 'Jazmín', 'Flor de azahar'],
    baseNotes: ['Praliné', 'Vainilla', 'Pachulí', 'Haba tonka'],
    season: 'Otoño / Invierno / Todo el año',
    occasion: 'Celebraciones, reuniones especiales y firma diaria',
    intensity: 'Intensa',
    description: 'Una declaración universal a la belleza de la vida. La nobleza del iris florentino abrazada por la alegría gourmand del praliné y la vainilla.'
  },
  '480': { // Libre YSL
    family: 'Ámbar Fougère Femenina',
    accords: ['floral blanco', 'cítrico', 'lavanda', 'avainillado', 'aromático', 'dulce'],
    topNotes: ['Lavanda', 'Mandarina', 'Grosellas negras', 'Petit grain'],
    heartNotes: ['Lavanda', 'Flor de azahar', 'Jazmín'],
    baseNotes: ['Vainilla de Madagascar', 'Almizcle', 'Madera de cedro', 'Ámbar gris'],
    season: 'Todo el año / Versátil',
    occasion: 'Oficina ejecutiva, eventos de día y citas nocturnas',
    intensity: 'Intensa',
    description: 'La fragancia de la mujer libre y audaz. Tensión sensual entre la flor de azahar ardiente de Marruecos y la audacia de la lavanda francesa.'
  },
  '420': { // Black Opium
    family: 'Ámbar Vainilla Gourmand',
    accords: ['avainillado', 'café', 'dulce', 'cálido especiado', 'floral blanco'],
    topNotes: ['Pera', 'Pimienta rosa', 'Flor de azahar'],
    heartNotes: ['Café', 'Jazmín', 'Almendra amarga'],
    baseNotes: ['Vainilla', 'Pachulí', 'Madera de cedro', 'Madera de cachemira'],
    season: 'Otoño / Invierno / Noche',
    occasion: 'Salidas nocturnas, citas y fiestas',
    intensity: 'Intensa',
    description: 'Una dosis electrizante de adrenalina. La energía del café negro combinada con flores blancas radiantes y vainilla cautivadora.'
  },
  '435': { // Cloud Ariana Grande
    family: 'Floral Frutal Gourmand',
    accords: ['dulce', 'lactónico', 'avainillado', 'coco', 'almizclado'],
    topNotes: ['Lavanda', 'Pera', 'Bergamota'],
    heartNotes: ['Crema batida', 'Praliné', 'Coco', 'Orquídea de vainilla'],
    baseNotes: ['Almizcle', 'Maderas nobles'],
    season: 'Todo el año / Diario',
    occasion: 'Uso diario casual, salidas con amigas y momentos dulces',
    intensity: 'Moderada',
    description: 'Un sueño reconfortante en una nube de algodón. Coco cremoso, praliné crujiente y lavanda suave que transmiten pura alegría.'
  },
  '440': { // Coco Mademoiselle
    family: 'Ámbar Floral',
    accords: ['cítrico', 'pachulí', 'floral blanco', 'dulce', 'rosas', 'terroso'],
    topNotes: ['Naranja', 'Mandarina', 'Bergamota', 'Flor de azahar'],
    heartNotes: ['Rosa turca', 'Jazmín', 'Mimosa', 'Ylang-Ylang'],
    baseNotes: ['Pachulí', 'Almizcle blanco', 'Vainilla', 'Vetiver', 'Haba tonka'],
    season: 'Todo el año / Firma elegante',
    occasion: 'Reuniones de trabajo, eventos elegantes y uso diario de lujo',
    intensity: 'Moderada',
    description: 'La esencia de una mujer libre y audaz. Un oriental femenino de carácter asombroso y frescura deslumbrante.'
  },
  '485': { // Light Blue
    family: 'Floral Frutal Cítrica',
    accords: ['cítrico', 'fresco', 'amaderado', 'afrutado', 'aromático'],
    topNotes: ['Limón siciliano', 'Manzana verde', 'Madera de cedro', 'Campanilla'],
    heartNotes: ['Bambú', 'Jazmín', 'Rosa blanca'],
    baseNotes: ['Madera de cedro', 'Almizcle', 'Ámbar'],
    season: 'Primavera / Verano / Días de calor',
    occasion: 'Playa, paseos veraniegos y uso diario fresco',
    intensity: 'Moderada',
    description: 'La alegría de vivir mediterránea bajo el sol de Capri. Limón siciliano chispeante y manzana crujiente sobre cedro acariciado por el viento.'
  },
  '428': { // Bright Crystal
    family: 'Floral Frutal Fresca',
    accords: ['floral', 'acuático', 'cítrico', 'fresco', 'amaderado'],
    topNotes: ['Yuzu', 'Granada', 'Notas heladas'],
    heartNotes: ['Peonía', 'Flor de loto', 'Magnolia'],
    baseNotes: ['Almizcle', 'Caoba', 'Ámbar'],
    season: 'Primavera / Verano / Todo el año',
    occasion: 'Día a día, oficina y ocasiones románticas',
    intensity: 'Moderada',
    description: 'Una joya brillante de frescura floral cristalina enriquecida con semillas de granada y flor de loto delicada.'
  }
};

/**
 * Genera determinísticamente un perfil olfativo completo para cualquier producto
 * según su nombre, marca, SKU y género, aplicando la taxonomía de Fragrantica.
 */
export function getFragranceProfile(product: ProductItem): FragranceProfile {
  const sku = String(product.sku || '').trim();

  // 1. Coincidencia directa por SKU
  if (NOTABLE_PROFILES[sku]) {
    const p = NOTABLE_PROFILES[sku];
    return {
      family: p.family || 'Amaderada Aromática',
      accords: p.accords || ['amaderado', 'cítrico', 'aromático', 'ámbar'],
      topNotes: p.topNotes || ['Cítricos', 'Notas verdes'],
      heartNotes: p.heartNotes || ['Especias finas', 'Notas florales'],
      baseNotes: p.baseNotes || ['Maderas nobles', 'Almizcle'],
      season: p.season || 'Todo el año',
      occasion: p.occasion || 'Uso diario y ocasiones especiales',
      intensity: p.intensity || 'Moderada',
      description: p.description || `${product.officialName || product.name} es un contratipo fino de máxima pureza inspirado en ${product.name}.`
    };
  }

  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const gender = (product.gender || '').toLowerCase();

  // 2. Coincidencias inteligentes por nombre de perfume icónico
  if (name.includes('million')) {
    return {
      family: 'Amaderada Especiada Cálida',
      accords: ['cálido especiado', 'canela', 'cítrico', 'ámbar', 'cuero', 'amaderado'],
      topNotes: ['Mandarina roja', 'Pomelo', 'Menta fresca'],
      heartNotes: ['Canela', 'Notas especiadas', 'Rosa de Damasco'],
      baseNotes: ['Ámbar dorado', 'Cuero', 'Maderas blancas', 'Pachulí'],
      season: 'Todo el año / Noche',
      occasion: 'Eventos sociales, fiestas y momentos seductores',
      intensity: 'Intensa',
      description: `Inspirado en el carisma magnético de ${product.name} de ${product.brand || 'Paco Rabanne'}. Especias cálidas y cuero dorado de alta fijación.`
    };
  }

  if (name.includes('sauvage')) {
    return {
      family: 'Aromática Fougère',
      accords: ['fresco especiado', 'ámbar', 'cítrico', 'aromático', 'almizclado', 'amaderado'],
      topNotes: ['Bergamota de Calabria', 'Pimienta negra'],
      heartNotes: ['Pimienta de Sichuan', 'Lavanda', 'Pimienta rosa', 'Vetiver', 'Geranio'],
      baseNotes: ['Ambroxan', 'Madera de cedro', 'Ládano'],
      season: 'Todo el año / Firma personal',
      occasion: 'Uso diario versátil, oficina y salidas',
      intensity: 'Intensa',
      description: `Inspirado en el magnetismo salvaje de ${product.name}. Frescura noble de bergamota sobre la estela radiante del ambroxan.`
    };
  }

  if (name.includes('bleu')) {
    return {
      family: 'Amaderada Aromática',
      accords: ['cítrico', 'amaderado', 'cálido especiado', 'aromático', 'ámbar', 'ahumado'],
      topNotes: ['Pomelo', 'Limón', 'Menta fresca', 'Pimienta rosa'],
      heartNotes: ['Jengibre', 'Nuez moscada', 'Jazmín'],
      baseNotes: ['Incienso de olíbano', 'Vetiver', 'Madera de cedro', 'Sándalo', 'Pachulí'],
      season: 'Todo el año / Versátil',
      occasion: 'Oficina, citas y reuniones ejecutivas',
      intensity: 'Moderada',
      description: `La cumbre de la distinción moderna inspirada en ${product.name}. Cítricos luminosos y maderas nobles ahumadas con incienso.`
    };
  }

  if (name.includes('aventus')) {
    return {
      family: 'Chipre Frutal Ahumada',
      accords: ['afrutado', 'amaderado', 'ahumado', 'cuero', 'cítrico', 'musgoso'],
      topNotes: ['Piña', 'Bergamota', 'Grosellas negras', 'Manzana'],
      heartNotes: ['Abedul', 'Pachulí', 'Jazmín', 'Rosa'],
      baseNotes: ['Almizcle', 'Musgo de roble', 'Ámbar gris', 'Vainilla'],
      season: 'Todo el año / Firma personal',
      occasion: 'Negocios de alto nivel y momentos memorables',
      intensity: 'Intensa',
      description: `Inspirado en la fragancia de nicho más codiciada del mundo. Piña jugosa sobre maderas de abedul ahumadas y ámbar gris.`
    };
  }

  if (name.includes('good girl')) {
    return {
      family: 'Ámbar Floral',
      accords: ['dulce', 'floral blanco', 'cálido especiado', 'avainillado', 'cacao', 'amaderado'],
      topNotes: ['Almendra', 'Café', 'Bergamota', 'Limón'],
      heartNotes: ['Tuberosa', 'Jazmín Sambac', 'Flor de azahar', 'Rosa'],
      baseNotes: ['Haba tonka', 'Cacao', 'Vainilla', 'Praliné', 'Sándalo'],
      season: 'Otoño / Invierno / Noche',
      occasion: 'Fiestas, citas y noches de impacto',
      intensity: 'Intensa',
      description: `Inspirado en la dualidad femenina de ${product.name}. Flores blancas luminosas enfrentadas a un fondo goloso de cacao y haba tonka.`
    };
  }

  if (name.includes('vie est belle')) {
    return {
      family: 'Floral Frutal Gourmand',
      accords: ['dulce', 'avainillado', 'afrutado', 'pachulí', 'floral blanco', 'iris'],
      topNotes: ['Grosellas negras', 'Pera'],
      heartNotes: ['Iris', 'Jazmín', 'Flor de azahar'],
      baseNotes: ['Praliné', 'Vainilla', 'Pachulí', 'Haba tonka'],
      season: 'Todo el año',
      occasion: 'Reuniones especiales, trabajo y disfrute diario',
      intensity: 'Intensa',
      description: `Un himno a la feminidad radiante inspirado en ${product.name}. Iris precioso envuelto en vainilla sedosa y praliné dulce.`
    };
  }

  if (name.includes('baccarat') || name.includes('rouge')) {
    return {
      family: 'Ámbar Floral Metálica',
      accords: ['ámbar', 'amaderado', 'cálido especiado', 'fresco especiado', 'aromático', 'metálico'],
      topNotes: ['Azafrán de Persia', 'Jazmín'],
      heartNotes: ['Amberwood', 'Ámbar gris'],
      baseNotes: ['Resina de abeto', 'Madera de cedro'],
      season: 'Todo el año / Firma personal',
      occasion: 'Cenas de gala y ocasiones exclusivas',
      intensity: 'Intensa',
      description: `Inspirado en la magia de Baccarat Rouge 540. Azafrán dorado y jazmín que flotan sobre ámbar gris y cedro resinoso.`
    };
  }

  // 3. Generación según palabras clave olfativas
  if (name.includes('aqua') || name.includes('blue') || name.includes('marine') || name.includes('water')) {
    return {
      family: 'Aromática Acuática Cítrica',
      accords: ['marino', 'cítrico', 'aromático', 'fresco especiado', 'amaderado'],
      topNotes: ['Notas marinas', 'Bergamota', 'Pomelo', 'Limón'],
      heartNotes: ['Romero', 'Lavanda', 'Salvia'],
      baseNotes: ['Madera de cedro', 'Almizcle blanco', 'Pachulí', 'Vetiver'],
      season: 'Primavera / Verano / Calor',
      occasion: 'Uso diario casual, oficina, deporte y climas cálidos',
      intensity: 'Moderada',
      description: `Frescura vigorizante inspirada en ${product.name}. Notas marinas limpias acompañadas de bergamota y maderas nobles.`
    };
  }

  if (name.includes('black') || name.includes('noir') || name.includes('noche') || name.includes('dark')) {
    return {
      family: 'Ámbar Amaderada Oriental',
      accords: ['cálido especiado', 'amaderado', 'ámbar', 'ahumado', 'avainillado'],
      topNotes: ['Pimienta negra', 'Cardamomo', 'Bergamota'],
      heartNotes: ['Incienso de olíbano', 'Canela', 'Madera de cedro'],
      baseNotes: ['Vainilla negra', 'Haba tonka', 'Cuero', 'Pachulí'],
      season: 'Otoño / Invierno / Noche',
      occasion: 'Veladas nocturnas, eventos formales y citas',
      intensity: 'Intensa',
      description: `Misterio y seducción profunda inspirados en ${product.name}. Especias oscuras y maderas nobles ahumadas con vainilla negra.`
    };
  }

  if (name.includes('rose') || name.includes('flora') || name.includes('bloom') || name.includes('bella') || name.includes('pink')) {
    return {
      family: 'Floral Frutal',
      accords: ['floral', 'rosas', 'afrutado', 'fresco', 'cítrico'],
      topNotes: ['Lichi', 'Bergamota', 'Pera jugosa'],
      heartNotes: ['Rosa de Damasco', 'Jazmín', 'Flor de azahar', 'Peonía'],
      baseNotes: ['Almizcle blanco', 'Vainilla', 'Madera de cedro'],
      season: 'Primavera / Verano / Todo el año',
      occasion: 'Día a día, citas románticas y salidas casuales',
      intensity: 'Moderada',
      description: `Un bouquet romántico y luminoso inspirado en ${product.name}. Rosas frescas combinadas con lichi frutal y jazmín delicado.`
    };
  }

  if (name.includes('oud')) {
    return {
      family: 'Oriental Amaderada Oud',
      accords: ['oud', 'amaderado', 'cálido especiado', 'ámbar', 'ahumado'],
      topNotes: ['Azafrán', 'Nuez moscada', 'Cardamomo'],
      heartNotes: ['Madera de agar (Oud)', 'Pachulí', 'Ládano'],
      baseNotes: ['Cuero', 'Ámbar', 'Sándalo', 'Almizcle'],
      season: 'Otoño / Invierno / Noche',
      occasion: 'Ocasiones exclusivas y eventos memorables',
      intensity: 'Intensa',
      description: `La opulencia del oro líquido oriental inspirada en ${product.name}. Madera de oud auténtica con especias exóticas.`
    };
  }

  // 4. Clasificación por género predeterminado
  if (gender.includes('dama') || gender.includes('mujer')) {
    return {
      family: 'Floral Oriental Femenina',
      accords: ['floral blanco', 'dulce', 'avainillado', 'afrutado', 'ámbar', 'amaderado'],
      topNotes: ['Mandarina', 'Pera jugosa', 'Grosellas negras'],
      heartNotes: ['Jazmín Sambac', 'Tuberosa', 'Flor de azahar'],
      baseNotes: ['Vainilla de Madagascar', 'Haba tonka', 'Sándalo', 'Pachulí'],
      season: 'Todo el año / Versátil',
      occasion: 'Día a día elegante, citas y salidas',
      intensity: 'Moderada',
      description: `Una composición sofisticada y femenina inspirada en ${product.name} de ${product.brand || 'diseño'}. Flores blancas y vainilla dulce.`
    };
  }

  if (gender.includes('caballero') || gender.includes('hombre')) {
    return {
      family: 'Amaderada Aromática Masculina',
      accords: ['amaderado', 'aromático', 'cítrico', 'fresco especiado', 'ámbar'],
      topNotes: ['Bergamota', 'Cardamomo', 'Pimienta negra'],
      heartNotes: ['Lavanda', 'Madera de cedro', 'Salvia'],
      baseNotes: ['Vetiver', 'Haba tonka', 'Ámbar', 'Pachulí'],
      season: 'Todo el año / Versátil',
      occasion: 'Trabajo, negocios, citas y uso diario',
      intensity: 'Intensa',
      description: `Presencia y carácter masculino inspirado en ${product.name} de ${product.brand || 'diseño'}. Maderas nobles y especias aromáticas.`
    };
  }

  // Unisex por defecto
  return {
    family: 'Ámbar Amaderada Unisex',
    accords: ['ámbar', 'amaderado', 'cálido especiado', 'aromático', 'cítrico'],
    topNotes: ['Bergamota', 'Cardamomo', 'Notas verdes'],
    heartNotes: ['Madera de cedro', 'Jazmín', 'Pimienta rosa'],
    baseNotes: ['Ámbar dorado', 'Sándalo', 'Almizcle blanco', 'Vetiver'],
    season: 'Todo el año / Versatilidad total',
    occasion: 'Cualquier momento del día o evento especial',
    intensity: 'Moderada',
    description: `Una armonía envolvente sin etiquetas inspirada en ${product.name}. Maderas nobles y resinas doradas para toda ocasión.`
  };
}
