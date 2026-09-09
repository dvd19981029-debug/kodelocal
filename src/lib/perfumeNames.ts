// src/lib/perfumeNames.ts

/**
 * Mapeo exacto del nombre del perfume ORIGINAL (sin la marca) para cada esencia del catálogo
 * SKU -> Nombre del perfume original
 */
export const ORIGINAL_PERFUME_MAP: Record<string, string> = {
  '1': 'SAUVAGE',
  '2': 'BLEU',
  '3': 'ACQUA DI GIO',
  '4': 'CLUB DE NUIT INTENSE',
  '5': 'AVENTUS',
  '6': 'LA VIE EST BELLE',
  '7': 'ODYSSEY MANDARIN SKY',
  '8': 'EROS',
  '9': "L'EAU D'ISSEY",
  '10': 'SANTAL 33',
  '11': 'BORN IN ROMA INTENSE',
  '12': 'ERBA PURA',
  '13': 'COCO MADEMOISELLE',
  '14': 'LIGHT BLUE',
  '15': 'BOSS BOTTLED',
  '16': 'INVICTUS',
  '17': 'HER',
  '18': '212 VIP ROSE',
  '19': 'POLO BLUE',
  '20': 'ONE MILLION',
  '21': 'COCO',
  '22': 'CHANCE',
  '23': '9PM',
  '24': 'LE MALE',
  '25': "J'ADORE",
  '26': 'TOMMY',
  '27': 'N° 5',
  '28': 'BAD BOY',
  '29': 'BE DELICIOUS',
  '30': 'LOST CHERRY',
  '31': 'SCANDAL',
  '32': 'DONNA',
  '33': "L'IMMENSITE",
  '34': '212 VIP',
  '35': 'SWISS ARMY',
  '36': 'BLANC L.12.12',
  '37': 'ACQUA DI GIO',
  '38': 'POLO BLACK',
  '39': 'RALPH',
  '40': 'YARA',
  '41': 'YARA TOUS',
  '42': 'FLOWERBOMB',
  '43': 'BLACK OPIUM',
  '44': 'HOMME SPORT',
  '45': 'CK ONE',
  '46': '360 RED',
  '47': 'GREEN TEA',
  '48': 'PRINCESS'
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
 * Devuelve el nombre del perfume original SIN la marca.
 * Ejemplo:
 *   - "Inspirado en SAUVAGE DIOR" -> "SAUVAGE"
 *   - "Inspirado en BLEU DE CHANEL" -> "BLEU"
 *   - "Inspirado en DOLCE & GABBANA LIGHT BLUE MEN" -> "LIGHT BLUE"
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
  return text || product.name || '';
}
