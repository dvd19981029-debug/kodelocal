// src/lib/fragranceNotesData.ts

/**
 * Paleta de colores para acordes olfativos cuidadosamente armonizada
 * con la identidad visual morada/índigo de la tienda.
 * Tonos sofisticados (púrpura imperial, ciruela profunda, índigo vibrante, 
 * frambuesa, amatista y lavanda) sin beiges ni marrones apagados.
 */
export const ACCORD_COLORS: Record<string, { bg: string; text: string }> = {
  // Base y Maderas (Tonos ciruela profunda y berenjena elegante)
  'amaderado': { bg: '#4a154b', text: '#ffffff' },
  'oud': { bg: '#1e1b4b', text: '#ffffff' },
  'pachulí': { bg: '#581c87', text: '#ffffff' },
  'terroso': { bg: '#2e1065', text: '#ffffff' },
  'cuero': { bg: '#3b0764', text: '#ffffff' },
  'tabaco': { bg: '#4c0519', text: '#ffffff' },

  // Especias y Cálidos (Tonos mora madura y grosella especiada)
  'cálido especiado': { bg: '#701a75', text: '#ffffff' },
  'canela': { bg: '#831843', text: '#ffffff' },
  'especias': { bg: '#701a75', text: '#ffffff' },
  'café': { bg: '#311042', text: '#ffffff' },
  'cacao': { bg: '#3b0764', text: '#ffffff' },

  // Resinas y Dulces (Tonos amatista real y orquídea brillante)
  'ámbar': { bg: '#86198f', text: '#ffffff' },
  'ambarado': { bg: '#86198f', text: '#ffffff' },
  'avainillado': { bg: '#9333ea', text: '#ffffff' },
  'vainilla': { bg: '#9333ea', text: '#ffffff' },
  'dulce': { bg: '#d946ef', text: '#ffffff' },
  'miel': { bg: '#a21caf', text: '#ffffff' },
  'caramelo': { bg: '#a855f7', text: '#ffffff' },
  'balsámico': { bg: '#6b21a8', text: '#ffffff' },
  'licor': { bg: '#581c87', text: '#ffffff' },

  // Aromáticos e Índigo (Tonos índigo eléctrico y violeta vibrante)
  'aromático': { bg: '#4338ca', text: '#ffffff' },
  'fresco especiado': { bg: '#4f46e5', text: '#ffffff' },
  'fresco': { bg: '#6366f1', text: '#ffffff' },
  'lavanda': { bg: '#7e22ce', text: '#ffffff' },
  'iris': { bg: '#4f46e5', text: '#ffffff' },
  'anisado': { bg: '#3730a3', text: '#ffffff' },
  'anís': { bg: '#3730a3', text: '#ffffff' },

  // Florales y Frutales (Tonos magenta radiante, peonía y frambuesa)
  'floral': { bg: '#c026d3', text: '#ffffff' },
  'floral blanco': { bg: '#818cf8', text: '#ffffff' },
  'rosas': { bg: '#be123c', text: '#ffffff' },
  'afrutado': { bg: '#db2777', text: '#ffffff' },
  'frutal': { bg: '#db2777', text: '#ffffff' },
  'fruta de la pasión': { bg: '#e11d48', text: '#ffffff' },
  'cereza': { bg: '#9f1239', text: '#ffffff' },
  'coco': { bg: '#c084fc', text: '#ffffff' },

  // Cítricos y Acuáticos (Tonos cian-índigo luminoso y violeta claro)
  'cítrico': { bg: '#6366f1', text: '#ffffff' },
  'marino': { bg: '#0284c7', text: '#ffffff' },
  'acuático': { bg: '#0284c7', text: '#ffffff' },
  'ozónico': { bg: '#38bdf8', text: '#0f172a' },
  'vodka': { bg: '#38bdf8', text: '#0f172a' },

  // Botánicos y Verdes (Tonos esmeralda-índigo profundos)
  'verde': { bg: '#059669', text: '#ffffff' },
  'musgoso': { bg: '#065f46', text: '#ffffff' },
  'absenta': { bg: '#0d9488', text: '#ffffff' },

  // Suaves y Texturizados (Tonos lila pastel y pizarra suave)
  'atalcado': { bg: '#a855f7', text: '#ffffff' },
  'lactónico': { bg: '#e9d5ff', text: '#581c87' },
  'almizclado': { bg: '#64748b', text: '#ffffff' },
  'ahumado': { bg: '#334155', text: '#ffffff' },
  'mineral': { bg: '#334155', text: '#ffffff' },
  'metálico': { bg: '#475569', text: '#ffffff' },
  'aldehídico': { bg: '#a5b4fc', text: '#1e1b4b' },
};

/**
 * Obtiene el color de un acorde normalizando tildes, mayúsculas y espacios.
 */
export function getAccordColor(name: string): { bg: string; text: string } {
  const norm = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [key, val] of Object.entries(ACCORD_COLORS)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm === normKey || norm.includes(normKey) || normKey.includes(norm)) {
      return val;
    }
  }

  // Fallback con armonía índigo
  return { bg: '#4f46e5', text: '#ffffff' };
}

/**
 * Reglas deterministas para mapear cualquier nota olfativa
 * a su imagen real, fija y optimizada alojada localmente en `/notes/*.jpg`.
 */
const NOTE_RULES: Array<{ pattern: RegExp; file: string }> = [
  // Cítricos
  { pattern: /bergamot/i, file: 'bergamota' },
  { pattern: /lim[oó]n/i, file: 'limon' },
  { pattern: /lima(?!\s*caviar)/i, file: 'lima' },
  { pattern: /lima\s*caviar/i, file: 'lima' },
  { pattern: /mandarin/i, file: 'mandarina' },
  { pattern: /naranja/i, file: 'naranja' },
  { pattern: /pomelo|toronja/i, file: 'pomelo' },
  { pattern: /yuzu/i, file: 'yuzu' },
  { pattern: /petit\s*grain/i, file: 'petitgrain' },
  { pattern: /c[íi]tric/i, file: 'limon' },

  // Frutas
  { pattern: /manzana\s*verde/i, file: 'manzana-verde' },
  { pattern: /manzana/i, file: 'manzana' },
  { pattern: /pera/i, file: 'pera' },
  { pattern: /pi[ñn]a/i, file: 'pina' },
  { pattern: /ciruela/i, file: 'ciruela' },
  { pattern: /coco/i, file: 'coco' },
  { pattern: /cereza/i, file: 'cereza' },
  { pattern: /frambuesa/i, file: 'frambuesa' },
  { pattern: /grosella/i, file: 'grosella' },
  { pattern: /melocot[óo]n|durazno/i, file: 'melocoton' },
  { pattern: /granada/i, file: 'granada' },
  { pattern: /maracuy[áa]/i, file: 'maracuya' },
  { pattern: /lichi/i, file: 'lichi' },
  { pattern: /higo/i, file: 'higo' },
  { pattern: /fruto/i, file: 'frambuesa' },

  // Aromáticas y Hierbas
  { pattern: /lavanda/i, file: 'lavanda' },
  { pattern: /menta/i, file: 'menta' },
  { pattern: /salvia/i, file: 'salvia' },
  { pattern: /romero/i, file: 'romero' },
  { pattern: /albahaca/i, file: 'albahaca' },
  { pattern: /tomillo/i, file: 'tomillo' },
  { pattern: /enebro/i, file: 'enebro' },
  { pattern: /cipr[ée]s/i, file: 'cipres' },
  { pattern: /hinojo|alcaravea/i, file: 'anis' },
  { pattern: /absenta/i, file: 'menta' },
  { pattern: /bamb[úu]/i, file: 'notas-verdes' },
  { pattern: /cannabis/i, file: 'notas-verdes' },
  { pattern: /lentisco/i, file: 'notas-verdes' },
  { pattern: /davana/i, file: 'melocoton' },

  // Especias
  { pattern: /canela/i, file: 'canela' },
  { pattern: /cardamomo/i, file: 'cardamomo' },
  { pattern: /pimienta\s*rosa/i, file: 'pimienta-rosa' },
  { pattern: /pimienta\s*blanca/i, file: 'pimienta-blanca' },
  { pattern: /pimienta/i, file: 'pimienta-negra' },
  { pattern: /jengibre/i, file: 'jengibre' },
  { pattern: /azafr[áa]n/i, file: 'azafran' },
  { pattern: /nuez\s*moscada/i, file: 'nuez-moscada' },
  { pattern: /an[íi]s|regaliz/i, file: 'anis' },
  { pattern: /clavo/i, file: 'clavo' },
  { pattern: /cilantro/i, file: 'cilantro' },
  { pattern: /especia/i, file: 'canela' },

  // Flores
  { pattern: /rosa\s*blanca/i, file: 'rosa-blanca' },
  { pattern: /rosa/i, file: 'rosa' },
  { pattern: /jazm[íi]n/i, file: 'jazmin' },
  { pattern: /azahar|neroli/i, file: 'flor-azahar' },
  { pattern: /tuberosa|nardo/i, file: 'tuberosa' },
  { pattern: /iris/i, file: 'iris' },
  { pattern: /violeta/i, file: 'violeta' },
  { pattern: /geranio/i, file: 'geranio' },
  { pattern: /gardenia/i, file: 'gardenia' },
  { pattern: /peon[íi]a/i, file: 'peonia' },
  { pattern: /orqu[íi]dea/i, file: 'orquidea' },
  { pattern: /ylang/i, file: 'ylang-ylang' },
  { pattern: /magnolia/i, file: 'magnolia' },
  { pattern: /loto/i, file: 'flor-loto' },
  { pattern: /campanilla|mimosa|osmanto/i, file: 'jazmin' },
  { pattern: /floral/i, file: 'rosa' },

  // Maderas
  { pattern: /cedro/i, file: 'cedro' },
  { pattern: /s[áa]ndalo/i, file: 'sandalo' },
  { pattern: /vetiver/i, file: 'vetiver' },
  { pattern: /oud|agar/i, file: 'oud' },
  { pattern: /gaiac|guayaco/i, file: 'guayaco' },
  { pattern: /cachemira|cashmeran/i, file: 'cachemira' },
  { pattern: /abedul/i, file: 'abedul' },
  { pattern: /musgo/i, file: 'musgo-roble' },
  { pattern: /caoba|palo\s*de\s*rosa/i, file: 'cedro' },
  { pattern: /madera/i, file: 'maderas' },

  // Resinas y Bálsamos
  { pattern: /[áa]mbar/i, file: 'ambar' },
  { pattern: /pachul[íi]/i, file: 'pachuli' },
  { pattern: /incienso|ol[íi]bano/i, file: 'incienso' },
  { pattern: /benju[íi]/i, file: 'benjui' },
  { pattern: /l[áa]dano/i, file: 'ladano' },
  { pattern: /mirra/i, file: 'mirra' },
  { pattern: /b[áa]lsamo|resina/i, file: 'incienso' },
  { pattern: /ambroxan|amberwood/i, file: 'ambar' },
  { pattern: /iso\s*e\s*super/i, file: 'maderas' },

  // Gourmand
  { pattern: /vainilla/i, file: 'vainilla' },
  { pattern: /tonka/i, file: 'haba-tonka' },
  { pattern: /caf[ée]/i, file: 'cafe' },
  { pattern: /cacao/i, file: 'cacao' },
  { pattern: /chocolate/i, file: 'chocolate' },
  { pattern: /miel/i, file: 'miel' },
  { pattern: /caramelo/i, file: 'caramelo' },
  { pattern: /almendra/i, file: 'almendra' },
  { pattern: /avellana|pralin[ée]/i, file: 'avellana' },
  { pattern: /crema\s*batida/i, file: 'crema-batida' },

  // Cuero y Tabaco
  { pattern: /cuero/i, file: 'cuero' },
  { pattern: /tabaco/i, file: 'tabaco' },
  { pattern: /almizcle|ambreta/i, file: 'almizcle' },

  // Acuático, Fresco y Especial
  { pattern: /marina|mar|aquozone|calone/i, file: 'notas-marinas' },
  { pattern: /mineral/i, file: 'notas-minerales' },
  { pattern: /oz[óo]nic/i, file: 'notas-ozonicas' },
  { pattern: /verde/i, file: 'notas-verdes' },
  { pattern: /helad|vodka|ginebra/i, file: 'ginebra-helada' },
  { pattern: /aldeh[íi]d/i, file: 'aldehidos' }
];

const DEFAULT_NOTE_PATH = '/notes/maderas.jpg';

/**
 * Resuelve la imagen fotográfica local real del ingrediente.
 * Siempre retorna la misma imagen estática de `/notes/<file>.jpg`,
 * optimizada para cargar de inmediato (<5ms) y sin depender de servicios externos.
 */
export function getNoteImageUrl(note: string): string {
  if (!note) return DEFAULT_NOTE_PATH;

  for (const rule of NOTE_RULES) {
    if (rule.pattern.test(note)) {
      return `/notes/${rule.file}.jpg`;
    }
  }

  return DEFAULT_NOTE_PATH;
}
