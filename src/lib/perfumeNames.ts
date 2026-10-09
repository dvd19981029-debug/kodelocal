// src/lib/perfumeNames.ts

/**
 * Mapeo exacto del nombre de INSPIRACIÓN (contratipo) para cada esencia del catálogo
 * SKU -> Nombre de la fragancia de inspiración
 */
export const INSPIRACION_PERFUME_MAP: Record<string, string> = {
  '1': 'Sauvage H',
  '2': 'Bleu H',
  '3': 'Acqua Di Gio H',
  '4': 'Club De Nuit Intense H',
  '5': 'Aventus H',
  '6': 'La Vie Est Belle F',
  '7': 'Odyssey Mandarin Sky H',
  '8': 'Eros H',
  '9': "L'Eau d'Issey H",
  '10': 'Santal 33',
  '11': 'Born in Roma Intense H',
  '12': 'Erba Pura',
  '13': 'Coco Mademoiselle F',
  '14': 'Light Blue H',
  '15': 'Boss Bottled H',
  '16': 'Invictus H',
  '17': 'Burberry Her F',
  '18': '212 VIP Rosé F',
  '19': 'Polo Blue H',
  '20': 'One Million H',
  '21': 'Coco F',
  '22': 'Chance F',
  '23': '9PM H',
  '24': 'Le Male H',
  '25': "J'adore F",
  '26': 'Tommy H',
  '27': 'N° 5 F',
  '28': 'Bad Boy H',
  '29': 'Be Delicious F',
  '30': 'Lost Cherry',
  '31': 'Scandal H',
  '32': 'Donna F',
  '33': "L'Immensité H",
  '34': '212 VIP F',
  '35': 'Swiss Army H',
  '36': 'Blanc L.12.12 H',
  '37': 'Acqua Di Gio F',
  '38': 'Polo Black H',
  '39': 'Ralph F',
  '40': 'Yara F',
  '41': 'Yara Tous F',
  '42': 'Flowerbomb F',
  '43': 'Black Opium F',
  '44': 'Homme Sport H',
  '45': 'CK One',
  '46': '360 Red H',
  '47': 'Green Tea F',
  '48': 'Princess F',
  '49': 'Sauvage Elixir H'
};

// Alias de retrocompatibilidad
export const ORIGINAL_PERFUME_MAP = INSPIRACION_PERFUME_MAP;

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
 * Formatea un nombre agregando el sufijo ' H' para Caballero o ' F' para Dama.
 * Las fragancias Unisex no llevan sufijo.
 */
export function formatWithGenderSuffix(name: string | null | undefined, gender: string | null | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  // Si ya termina en ' H' o ' F' (con espacio antes), normalizar a mayúscula
  if (/\s+[HhFf]$/.test(trimmed)) {
    return trimmed.replace(/\s+([HhFf])$/, (_, letter) => ` ${letter.toUpperCase()}`);
  }

  const g = (gender || '').trim().toLowerCase();
  if (g.includes('caballero') || g.includes('hombre')) {
    return `${trimmed} H`;
  }
  if (g.includes('dama') || g.includes('mujer')) {
    return `${trimmed} F`;
  }
  return trimmed;
}

/**
 * Devuelve el nombre comercial / oficial del producto con el sufijo H o F correspondiente.
 */
export function formatPerfumeDisplayName(product: { officialName?: string | null; name?: string | null; gender?: string | null } | null | undefined): string {
  if (!product) return '';
  const baseName = (product.officialName && product.officialName.trim()) 
    ? product.officialName.trim() 
    : (product.name ? product.name.trim() : '');
  return formatWithGenderSuffix(baseName, product.gender);
}

/**
 * Devuelve el nombre de inspiración (contratipo) SIN la marca y con el sufijo H o F correspondiente.
 */
export function getInspiracionPerfumeName(product: { sku?: string | null; description?: string | null; name?: string | null; brand?: string | null; officialName?: string | null; gender?: string | null } | null | undefined): string {
  if (!product) return '';

  let inspiracion = '';

  // 1. Si product.name tiene valor y es diferente a officialName, ese es el nombre de inspiración dinámico de la BD
  if (product.name && product.name.trim()) {
    const cleanName = product.name.trim();
    const offName = (product.officialName || '').trim();
    if (offName && cleanName.toLowerCase() !== offName.toLowerCase()) {
      inspiracion = cleanName;
    }
  }

  // 2. Mapeo directo por SKU si existe
  if (!inspiracion) {
    const sku = String(product.sku || '').trim();
    if (sku && INSPIRACION_PERFUME_MAP[sku]) {
      inspiracion = INSPIRACION_PERFUME_MAP[sku];
    }
  }

  // 3. Si product.name está definido (incluso si no hay officialName), usar product.name
  if (!inspiracion && product.name && product.name.trim()) {
    inspiracion = product.name.trim();
  }

  // 4. Extracción dinámica limpiando "Inspirado en", marcas y sufijos de laboratorio
  if (!inspiracion) {
    let text = (product.description || '').trim();
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
      inspiracion = 'Burberry Her';
    } else {
      const result = text || product.name || '';
      // Si viene todo en mayúsculas, convertir a Title Case
      inspiracion = (result === result.toUpperCase() && result.length > 2) ? toTitleCase(result) : result;
    }
  }

  // Garantizar sufijo de género H / F
  return formatWithGenderSuffix(inspiracion, product.gender);
}

// Alias de retrocompatibilidad
export const getOriginalPerfumeName = getInspiracionPerfumeName;

export interface BottleLabelConfig {
  lines: string[];
  fontSize: string;
}

/**
 * Calcula la distribución óptima en 1 o 2 líneas y el tamaño de fuente para la etiqueta del frasco.
 * - Permite doble línea balanceada para fragancias compuestas (ej. EUROBOY INTENSE, NICHO Y PAPIRO)
 * - Escala dinámicamente la tipografía según la longitud y líneas
 */
export function getBottleLabelConfig(name: string): BottleLabelConfig {
  const clean = (name || '').toUpperCase().replace(/\s+[HFU]$/i, '').trim();
  if (!clean) return { lines: [''], fontSize: '3.4cqw' };

  const words = clean.split(/\s+/).filter(Boolean);

  // 1 sola palabra (ej. "FIERA", "MARINO", "HIEDRAFRAIS")
  if (words.length === 1) {
    const len = clean.length;
    const fontSize = len <= 6 ? '5.5cqw' : len <= 9 ? '4.8cqw' : len <= 12 ? '4.2cqw' : '3.6cqw';
    return { lines: [clean], fontSize };
  }

  // 2 palabras (ej. "EUROBOY INTENSE", "DAVID OCEAN", "FIERA ELIXIR")
  if (words.length === 2) {
    const maxLen = Math.max(words[0].length, words[1].length);
    const fontSize = maxLen <= 6 ? '4.5cqw' : maxLen <= 8 ? '4.0cqw' : maxLen <= 11 ? '3.5cqw' : '3.0cqw';
    return { lines: [words[0], words[1]], fontSize };
  }

  // 3 palabras (ej. "NICHO Y PAPIRO", "GOOD GIRL VELVET")
  if (words.length === 3) {
    let line1 = '';
    let line2 = '';
    if (words[1].length <= 2) {
      // Conectores cortos como "Y", "DE", "EN", "EL" se agrupan en línea 1: "NICHO Y" / "PAPIRO"
      line1 = `${words[0]} ${words[1]}`;
      line2 = words[2];
    } else {
      const opt1 = [`${words[0]}`, `${words[1]} ${words[2]}`];
      const opt2 = [`${words[0]} ${words[1]}`, `${words[2]}`];
      if (Math.abs(opt1[0].length - opt1[1].length) <= Math.abs(opt2[0].length - opt2[1].length)) {
        line1 = opt1[0];
        line2 = opt1[1];
      } else {
        line1 = opt2[0];
        line2 = opt2[1];
      }
    }
    const maxLen = Math.max(line1.length, line2.length);
    const fontSize = maxLen <= 7 ? '4.2cqw' : maxLen <= 9 ? '3.6cqw' : '3.0cqw';
    return { lines: [line1, line2], fontSize };
  }

  // 4 o más palabras: partir en 2 líneas balanceadas por longitud
  let bestSplit = 1;
  let minDiff = 999;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(' ').length;
    const l2 = words.slice(i).join(' ').length;
    const diff = Math.abs(l1 - l2);
    if (diff < minDiff) {
      minDiff = diff;
      bestSplit = i;
    }
  }
  const line1 = words.slice(0, bestSplit).join(' ');
  const line2 = words.slice(bestSplit).join(' ');
  const maxLen = Math.max(line1.length, line2.length);
  const fontSize = maxLen <= 8 ? '4.0cqw' : maxLen <= 11 ? '3.3cqw' : '2.8cqw';
  return { lines: [line1, line2], fontSize };
}


