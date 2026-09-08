// src/lib/fragranceNotesData.ts

/**
 * Colores oficiales de acordes según la convención de perfumería de Fragrantica.
 */
export const ACCORD_COLORS: Record<string, { bg: string; text: string }> = {
  'ámbar': { bg: '#c95a12', text: '#ffffff' },
  'ambarado': { bg: '#c95a12', text: '#ffffff' },
  'amaderado': { bg: '#6b4226', text: '#ffffff' },
  'cálido especiado': { bg: '#8c2518', text: '#ffffff' },
  'aromático': { bg: '#2d6964', text: '#ffffff' },
  'ahumado': { bg: '#564f5c', text: '#ffffff' },
  'cítrico': { bg: '#9ba036', text: '#ffffff' },
  'floral blanco': { bg: '#858e99', text: '#ffffff' },
  'rosas': { bg: '#9d1e4c', text: '#ffffff' },
  'floral': { bg: '#b23b68', text: '#ffffff' },
  'fresco especiado': { bg: '#5c822a', text: '#ffffff' },
  'balsámico': { bg: '#644c38', text: '#ffffff' },
  'marino': { bg: '#1e7a9e', text: '#ffffff' },
  'acuático': { bg: '#2980b9', text: '#ffffff' },
  'avainillado': { bg: '#cfa246', text: '#ffffff' },
  'vainilla': { bg: '#cfa246', text: '#ffffff' },
  'dulce': { bg: '#d35400', text: '#ffffff' },
  'cuero': { bg: '#4a2c11', text: '#ffffff' },
  'atalcado': { bg: '#ad9588', text: '#ffffff' },
  'afrutado': { bg: '#ba2d32', text: '#ffffff' },
  'frutal': { bg: '#ba2d32', text: '#ffffff' },
  'fruta de la pasión': { bg: '#d35400', text: '#ffffff' },
  'verde': { bg: '#337a37', text: '#ffffff' },
  'almizclado': { bg: '#7b8794', text: '#ffffff' },
  'ozónico': { bg: '#3b9296', text: '#ffffff' },
  'terroso': { bg: '#554137', text: '#ffffff' },
  'pachulí': { bg: '#4a3525', text: '#ffffff' },
  'lavanda': { bg: '#6d538e', text: '#ffffff' },
  'canela': { bg: '#994d22', text: '#ffffff' },
  'tabaco': { bg: '#614735', text: '#ffffff' },
  'anisado': { bg: '#496d6e', text: '#ffffff' },
  'anís': { bg: '#496d6e', text: '#ffffff' },
  'absenta': { bg: '#2e7d5b', text: '#ffffff' },
  'metálico': { bg: '#6c7a89', text: '#ffffff' },
  'musgoso': { bg: '#405d27', text: '#ffffff' },
  'café': { bg: '#3e2723', text: '#ffffff' },
  'cacao': { bg: '#4a2c11', text: '#ffffff' },
  'lactónico': { bg: '#b0a495', text: '#ffffff' },
  'fresco': { bg: '#2e7d7a', text: '#ffffff' },
  'almendrado': { bg: '#a3845b', text: '#ffffff' },
  'animal': { bg: '#42372f', text: '#ffffff' },
  'licor': { bg: '#78351b', text: '#ffffff' },
  'vodka': { bg: '#4a6572', text: '#ffffff' },
  'mineral': { bg: '#5c6b73', text: '#ffffff' },
  'salado': { bg: '#4682b4', text: '#ffffff' },
  'aldehídico': { bg: '#7f8c8d', text: '#ffffff' },
  'cereza': { bg: '#881337', text: '#ffffff' },
  'miel': { bg: '#d97706', text: '#ffffff' },
  'oud': { bg: '#3e2723', text: '#ffffff' }
};

/**
 * Obtiene el color de un acorde normalizando tildes y mayúsculas.
 */
export function getAccordColor(name: string): { bg: string; text: string } {
  const norm = name.toLowerCase().trim();
  if (ACCORD_COLORS[norm]) return ACCORD_COLORS[norm];

  // Búsqueda por subcadena
  for (const [key, val] of Object.entries(ACCORD_COLORS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }

  return { bg: '#475569', text: '#ffffff' };
}

/**
 * URLs de fotos reales en alta definición optimizadas (Unsplash CDN w=120&q=80)
 * para ingredientes de notas olfativas de perfumería.
 */
const INGREDIENT_IMAGES: Record<string, string> = {
  // Cítricos
  'bergamota': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120&q=80',
  'limon': 'https://images.unsplash.com/photo-1533082606337-4c6c74988246?w=120&q=80',
  'lima': 'https://images.unsplash.com/photo-1533082606337-4c6c74988246?w=120&q=80',
  'mandarina': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=120&q=80',
  'naranja': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=120&q=80',
  'pomelo': 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=120&q=80',
  'toronja': 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=120&q=80',
  'yuzu': 'https://images.unsplash.com/photo-1533082606337-4c6c74988246?w=120&q=80',
  'petit grain': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120&q=80',

  // Frutas
  'manzana': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120&q=80',
  'pera': 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=120&q=80',
  'pina': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=120&q=80',
  'piña': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=120&q=80',
  'lichi': 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?w=120&q=80',
  'maracuya': 'https://images.unsplash.com/photo-1595155777675-2386a344933a?w=120&q=80',
  'coco': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=120&q=80',
  'cereza': 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=120&q=80',
  'grosella': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=120&q=80',
  'frambuesa': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=120&q=80',
  'frutos': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=120&q=80',
  'frut': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=120&q=80',
  'ciruela': 'https://images.unsplash.com/photo-1595155777675-2386a344933a?w=120&q=80',
  'melocoton': 'https://images.unsplash.com/photo-1595155777675-2386a344933a?w=120&q=80',
  'durazno': 'https://images.unsplash.com/photo-1595155777675-2386a344933a?w=120&q=80',
  'melon': 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=120&q=80',
  'higo': 'https://images.unsplash.com/photo-1595155777675-2386a344933a?w=120&q=80',
  'davana': 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?w=120&q=80',

  // Aromáticas y Hierbas
  'lavanda': 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=120&q=80',
  'menta': 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=120&q=80',
  'romero': 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=120&q=80',
  'salvia': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=120&q=80',
  'albahaca': 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=120&q=80',
  'tomillo': 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=120&q=80',
  'enebro': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'cipres': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'artemisia': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=120&q=80',
  'absenta': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=120&q=80',

  // Especias
  'pimienta': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=120&q=80',
  'cardamomo': 'https://images.unsplash.com/photo-1599909682622-7935406006f1?w=120&q=80',
  'canela': 'https://images.unsplash.com/photo-1509358740172-f77c168f6312?w=120&q=80',
  'jengibre': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=120&q=80',
  'nuez moscada': 'https://images.unsplash.com/photo-1599909682622-7935406006f1?w=120&q=80',
  'azafran': 'https://images.unsplash.com/photo-1589135233689-d56d95392f45?w=120&q=80',
  'anis': 'https://images.unsplash.com/photo-1509358740172-f77c168f6312?w=120&q=80',
  'clavo': 'https://images.unsplash.com/photo-1509358740172-f77c168f6312?w=120&q=80',
  'cilantro': 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=120&q=80',

  // Flores
  'rosa': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&q=80',
  'jazmin': 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=120&q=80',
  'azahar': 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=120&q=80',
  'neroli': 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=120&q=80',
  'flores': 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=120&q=80',
  'tuberosa': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=120&q=80',
  'nardo': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=120&q=80',
  'iris': 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=120&q=80',
  'lirio': 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=120&q=80',
  'violeta': 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=120&q=80',
  'geranio': 'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=120&q=80',
  'gardenia': 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=120&q=80',
  'peonia': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&q=80',
  'orquidea': 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=120&q=80',
  'ylang': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=120&q=80',
  'magnolia': 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=120&q=80',
  'osmanto': 'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?w=120&q=80',

  // Maderas
  'cedro': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'sandalo': 'https://images.unsplash.com/photo-1605807646983-377bc7a76593?w=120&q=80',
  'pachuli': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=120&q=80',
  'vetiver': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=120&q=80',
  'gaiac': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'guayaco': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'oud': 'https://images.unsplash.com/photo-1605807646983-377bc7a76593?w=120&q=80',
  'agar': 'https://images.unsplash.com/photo-1605807646983-377bc7a76593?w=120&q=80',
  'maderas': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'abedul': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'roble': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'musgo': 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=120&q=80',
  'cachemira': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=120&q=80',

  // Resinas, Dulces y Gourmand
  'vainilla': 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=120&q=80',
  'tonka': 'https://images.unsplash.com/photo-1509358740172-f77c168f6312?w=120&q=80',
  'ambar': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=120&q=80',
  'cuero': 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=120&q=80',
  'almizcle': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=120&q=80',
  'incienso': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=120&q=80',
  'olibano': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=120&q=80',
  'benjui': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=120&q=80',
  'mirra': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=120&q=80',
  'ladano': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=120&q=80',
  'tabaco': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=120&q=80',
  'cafe': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&q=80',
  'cacao': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120&q=80',
  'chocolate': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120&q=80',
  'miel': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=120&q=80',
  'almendra': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=120&q=80',
  'avellana': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=120&q=80',
  'caramelo': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=120&q=80',
  'praline': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120&q=80',
  'azucar': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=120&q=80',

  // Acuático y Otros
  'marinas': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&q=80',
  'mar': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&q=80',
  'calone': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&q=80',
  'agua': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&q=80',
  'ambroxan': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=120&q=80',
  'amberwood': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=120&q=80'
};

const DEFAULT_NOTE_IMAGE = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=120&q=80';

/**
 * Resuelve la imagen fotográfica real del ingrediente mediante análisis de texto.
 */
export function getNoteImageUrl(note: string): string {
  if (!note) return DEFAULT_NOTE_IMAGE;

  // Normalizar: quitar tildes y caracteres especiales
  const clean = note
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [key, url] of Object.entries(INGREDIENT_IMAGES)) {
    if (clean.includes(key)) {
      return url;
    }
  }

  return DEFAULT_NOTE_IMAGE;
}
