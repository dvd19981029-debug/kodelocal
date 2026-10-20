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
  { pattern: /manzana\s*verde|martini\s*de\s*manzana/i, file: 'manzana-verde' },
  { pattern: /manzana\s*roja|manzana/i, file: 'manzana' },
  { pattern: /pera/i, file: 'pera' },
  { pattern: /pi[ñn]a/i, file: 'pina' },
  { pattern: /ciruela/i, file: 'ciruela' },
  { pattern: /coco/i, file: 'coco' },
  { pattern: /cereza/i, file: 'cereza' },
  { pattern: /frutos\s*rojos|fresa|zarzamora|mora|ar[áa]ndano/i, file: 'frutos-rojos' },
  { pattern: /frambuesa/i, file: 'frambuesa' },
  { pattern: /grosella/i, file: 'grosella' },
  { pattern: /melocot[óo]n|durazno|albaricoque|chabacano/i, file: 'melocoton' },
  { pattern: /mel[óo]n|pepino|papaya|guayaba|mango/i, file: 'melon' },
  { pattern: /ruibarbo/i, file: 'ruibarbo' },
  { pattern: /granada/i, file: 'granada' },
  { pattern: /maracuy[áa]/i, file: 'maracuya' },
  { pattern: /lichi/i, file: 'lichi' },
  { pattern: /higo/i, file: 'higo' },
  { pattern: /frut/i, file: 'frutos-rojos' },

  // Aromáticas y Hierbas
  { pattern: /lavanda/i, file: 'lavanda' },
  { pattern: /menta/i, file: 'menta' },
  { pattern: /salvia/i, file: 'salvia' },
  { pattern: /romero/i, file: 'romero' },
  { pattern: /albahaca/i, file: 'albahaca' },
  { pattern: /tomillo/i, file: 'tomillo' },
  { pattern: /enebro/i, file: 'enebro' },
  { pattern: /cipr[ée]s/i, file: 'cipres' },
  { pattern: /pino|abeto/i, file: 'pino-abeto' },
  { pattern: /t[ée](\s*verde)?/i, file: 'te-verde' },
  { pattern: /bamb[úu]/i, file: 'bambu' },
  { pattern: /verbena|artemisia|ajenjo|g[áa]lbano|manzanilla/i, file: 'verbena' },
  { pattern: /hinojo|alcaravea|apio/i, file: 'anis' },
  { pattern: /absenta/i, file: 'menta' },
  { pattern: /cannabis|lentisco|cactus|laurel/i, file: 'notas-verdes' },
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
  { pattern: /cilantro|coriandro/i, file: 'cilantro' },
  { pattern: /especia/i, file: 'canela' },

  // Flores
  { pattern: /flor\s*del?\s*cerezo|manzano\s*en\s*flor|flor\s*del?\s*durazn/i, file: 'flor-cerezo' },
  { pattern: /camelia/i, file: 'camelia' },
  { pattern: /lirio\s*de\s*los\s*valles|azucena|lirio/i, file: 'lirio-valles' },
  { pattern: /clavel/i, file: 'clavel' },
  { pattern: /mimosa|acacia|retama/i, file: 'mimosa' },
  { pattern: /lila|fresia|ciclamen|jacinto|heliotropo|boronia|hedione|hedeona/i, file: 'lila' },
  { pattern: /rosa\s*blanca|flor\s*de\s*las\s*nieves|flor\s*del?\s*algod/i, file: 'rosa-blanca' },
  { pattern: /rosa/i, file: 'rosa' },
  { pattern: /jazm[íi]n|madreselva|tiar[ée]/i, file: 'jazmin' },
  { pattern: /azahar|neroli/i, file: 'flor-azahar' },
  { pattern: /tuberosa|nardo/i, file: 'tuberosa' },
  { pattern: /iris/i, file: 'iris' },
  { pattern: /violeta|flor\s*de\s*lino/i, file: 'violeta' },
  { pattern: /geranio/i, file: 'geranio' },
  { pattern: /gardenia/i, file: 'gardenia' },
  { pattern: /peon[íi]a/i, file: 'peonia' },
  { pattern: /orqu[íi]dea/i, file: 'orquidea' },
  { pattern: /ylang|tagetes/i, file: 'ylang-ylang' },
  { pattern: /magnolia/i, file: 'magnolia' },
  { pattern: /loto|nen[úu]far/i, file: 'flor-loto' },
  { pattern: /campanilla|osmanto|espino|tr[ée]bol/i, file: 'jazmin' },
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
  { pattern: /caoba|palo\s*de\s*rosa|olivo|papiro/i, file: 'cedro' },
  { pattern: /madera/i, file: 'maderas' },

  // Resinas y Bálsamos
  { pattern: /[áa]mbar/i, file: 'ambar' },
  { pattern: /pachul[íi]/i, file: 'pachuli' },
  { pattern: /humo|ahumad/i, file: 'humo' },
  { pattern: /incienso|ol[íi]bano|elem[íi]|opop[óo]naco/i, file: 'incienso' },
  { pattern: /benju[íi]|tol[úu]/i, file: 'benjui' },
  { pattern: /l[áa]dano/i, file: 'ladano' },
  { pattern: /mirra/i, file: 'mirra' },
  { pattern: /b[áa]lsamo|resina/i, file: 'incienso' },
  { pattern: /ambroxan/i, file: 'ambroxan' },
  { pattern: /amberwood/i, file: 'ambar' },
  { pattern: /iso\s*e\s*super/i, file: 'maderas' },

  // Gourmand
  { pattern: /vainilla/i, file: 'vainilla' },
  { pattern: /tonka|cumarina/i, file: 'haba-tonka' },
  { pattern: /caf[ée]/i, file: 'cafe' },
  { pattern: /cacao/i, file: 'cacao' },
  { pattern: /chocolate/i, file: 'chocolate' },
  { pattern: /leche|lact[óo]nic/i, file: 'leche' },
  { pattern: /miel|cera\s*de\s*abeja/i, file: 'miel' },
  { pattern: /caramelo|acorde\s*goloso/i, file: 'caramelo' },
  { pattern: /almendra/i, file: 'almendra' },
  { pattern: /avellana|pralin[ée]|casta[ñn]a/i, file: 'avellana' },
  { pattern: /crema\s*batida/i, file: 'crema-batida' },
  { pattern: /algod[óo]n\s*(de\s*)?az[úu]car/i, file: 'algodon-azucar' },
  { pattern: /az[úu]car/i, file: 'azucar' },

  // Cuero y Tabaco
  { pattern: /gamuza/i, file: 'gamuza' },
  { pattern: /cuero/i, file: 'cuero' },
  { pattern: /tabaco/i, file: 'tabaco' },
  { pattern: /almizcle|ambreta|algalia/i, file: 'almizcle' },

  // Acuático, Fresco y Especial
  { pattern: /sal\s*de\s*mar|\bsal\b/i, file: 'sal-marina' },
  { pattern: /marina|mar|aquozone|calone|acu[áa]tic|algas/i, file: 'notas-marinas' },
  { pattern: /mineral/i, file: 'notas-minerales' },
  { pattern: /oz[óo]nic/i, file: 'notas-ozonicas' },
  { pattern: /verde/i, file: 'notas-verdes' },
  { pattern: /helad|vodka|ginebra|ron|licor|champ[áa]n/i, file: 'ginebra-helada' },
  { pattern: /aldeh[íi]d/i, file: 'aldehidos' }
];

export const NOTES_VERSION = '20261020_v4';
const DEFAULT_NOTE_PATH = '/notes/maderas.jpg';

/**
 * Resuelve la imagen fotográfica local real del ingrediente.
 * Siempre retorna la imagen estática optimizada de `/notes/<file>.jpg` con control de versión
 * para invalidar inmediatamente cualquier caché anterior del navegador.
 */
export function getNoteImageUrl(note: string): string {
  if (!note) return `${DEFAULT_NOTE_PATH}?v=${NOTES_VERSION}`;

  for (const rule of NOTE_RULES) {
    if (rule.pattern.test(note)) {
      return `/notes/${rule.file}.jpg?v=${NOTES_VERSION}`;
    }
  }

  return `${DEFAULT_NOTE_PATH}?v=${NOTES_VERSION}`;
}
