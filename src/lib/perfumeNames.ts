// src/lib/perfumeNames.ts

/**
 * Mapeo exacto del nombre del perfume ORIGINAL (sin la marca) para cada esencia del catálogo
 * SKU -> Nombre del perfume original
 */
export const ORIGINAL_PERFUME_MAP: Record<string, string> = {
  '1': 'Sauvage',
  '2': 'Bleu',
  '3': 'Acqua Di Gio',
  '4': 'Club De Nuit Intense',
  '5': 'Aventus',
  '6': 'La Vie Est Belle',
  '7': 'Odyssey Mandarin Sky',
  '8': 'Eros',
  '9': "L'Eau d'Issey",
  '10': 'Santal 33',
  '11': 'Born in Roma Intense',
  '12': 'Erba Pura',
  '13': 'Coco Mademoiselle',
  '14': 'Light Blue',
  '15': 'Boss Bottled',
  '16': 'Invictus',
  '17': 'Burberry Her',
  '18': '212 VIP Rosé',
  '19': 'Polo Blue',
  '20': 'One Million',
  '21': 'Coco',
  '22': 'Chance',
  '23': '9PM',
  '24': 'Le Male',
  '25': "J'adore",
  '26': 'Tommy',
  '27': 'N° 5',
  '28': 'Bad Boy',
  '29': 'Be Delicious',
  '30': 'Lost Cherry',
  '31': 'Scandal',
  '32': 'Donna',
  '33': "L'Immensité",
  '34': '212 VIP',
  '35': 'Swiss Army',
  '36': 'Blanc L.12.12',
  '37': 'Acqua Di Gio',
  '38': 'Polo Black',
  '39': 'Ralph',
  '40': 'Yara',
  '41': 'Yara Tous',
  '42': 'Flowerbomb',
  '43': 'Black Opium',
  '44': 'Homme Sport',
  '45': 'CK One',
  '46': '360 Red',
  '47': 'Green Tea',
  '48': 'Princess'
};

const FAMOUS_BRANDS = [
  'DOLCE & GABBANA', 'DOLCE &amp; GABBANA', 'D&G',
  'JEAN PAUL GAULTIER', 'CAROLINA HERRERA', 'GIORGIO ARMANI',
  'YVES SAINT LAURENT', 'RALPH LAUREN', 'TOMMY HILFIGER',
  'ELIZABETH ARDEN', 'PACO RABANNE', 'ISSEY MIYAKE', 'LOUIS VUITTON',
  'VIKTOR & ROLF', 'VIKTOR &amp; ROLF', 'CALVIN KLEIN', 'PERRY ELLIS',
  'VERA WANG', 'TOM FORD', 'VALENTINO', 'LANCOME', 'LANCÔME',
  'BURBERRY', 'VICTORINOX', 'LACOSTE', 'LATTAFA', 'CHANEL',
  'XERJOFF', 'LE LABO', 'CREED', 'VERSACE', 'ARMAF', 'AFNAN',
  'DKNY', 'DIOR', 'HUGO BOSS', 'BOSS'
];

/**
 * Convierte texto a formato Capitalizado / Title Case para no gritar en mayúsculas
 */
function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';
      // Excepciones comunes de palabras cortas o acrónimos
      if (['de', 'di', 'del', 'en', 'la', 'el', 'd\'', 'l\'', 'pour', 'for'].includes(word)) {
        return word;
      }
      if (['ck', 'vip', '9pm', '540', '212', '360', 'n°'].includes(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Devuelve el nombre del perfume original SIN la marca y en mayúsculas/minúsculas normales.
 */
export function getOriginalPerfumeName(product: { sku?: string; description?: string; name?: string; brand?: string }): string {
  if (!product) return '';

  // 1. Mapeo directo por SKU si existe
  const sku = String(product.sku || '').trim();
  if (sku && ORIGINAL_PERFUME_MAP[sku]) {
    return ORIGINAL_PERFUME_MAP[sku];
  }

  // 2. Extracción dinámica limpiando "Inspirado en", marcas y sufijos de laboratorio
  let text = (product.description || product.name || '').trim();
  text = text.replace(/^Inspirado en\s+/i, '').replace(/&amp;/g, '&').trim();

  // Remover sufijos de laboratorio
  text = text.replace(/\bTYPE\s+FINE\s+INSPIRATION\b/gi, '')
             .replace(/\bTYPE\s+AFNAN\b/gi, '')
             .replace(/\bTYPE\s+B\b/gi, '')
             .replace(/\bWOMAN\s+TYPE\b/gi, '')
             .replace(/\bTYPE\b/gi, '')
             .replace(/\bZ\s*1\b/gi, '')
             .replace(/\s+Z$/gi, '')
             .replace(/\bMEN\b/gi, '')
             .replace(/\bFOR\s+MEN\b/gi, '')
             .replace(/\bM$/gi, '')
             .trim();

  const brandList = [
    ...(product.brand ? [product.brand.replace(/&amp;/g, '&')] : []),
    ...FAMOUS_BRANDS
  ];

  for (const b of brandList) {
    if (!b) continue;
    const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp('^' + escaped + '\\s+', 'i'), '');
    text = text.replace(new RegExp('\\s+' + escaped + '$', 'i'), '');
    text = text.replace(new RegExp('\\s+BY\\s+' + escaped + '$', 'i'), '');
    text = text.replace(new RegExp('\\s+BY\\s+' + escaped, 'i'), '');
    text = text.replace(new RegExp('\\s+DE\\s+' + escaped + '$', 'i'), '');
    text = text.replace(new RegExp('^' + escaped + '$', 'i'), '');
  }

  text = text.replace(/\s+/g, ' ').trim();
  if (text.toUpperCase() === 'HER' || text.toUpperCase() === 'BURBERRY HER') {
    return 'Burberry Her';
  }
  const result = text || product.name || '';
  // Si viene todo en mayúsculas, convertir a Title Case
  if (result === result.toUpperCase() && result.length > 2) {
    return toTitleCase(result);
  }
  return result;
}
