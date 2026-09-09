// src/lib/fragranceProfiles.ts
import { ProductItem } from './store';
import { getAccordColor } from './fragranceNotesData';
import { getOriginalPerfumeName } from './perfumeNames';
import { CATALOG_PROFILES_48 } from './catalogProfilesData';
import fragranceDatabaseRaw from './fragranceDatabase.json';

export interface AccordBarItem {
  name: string;
  percentage: number;
  bg: string;
  text: string;
}

export interface FragranceProfile {
  officialName?: string;
  brand?: string;
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

interface FragranceDbEntry {
  kodigo?: string;
  contratipo: string;
  marca: string;
  genero?: string;
  officialName: string;
  brand: string;
  family: string;
  accords: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  source?: string;
  description?: string;
}

const fragranceDatabase = fragranceDatabaseRaw as unknown as Record<string, FragranceDbEntry>;

/**
 * Convierte los acordes de un perfil en barras porcentuales con color según la paleta armonizada.
 */
export function getFragranceAccordBars(profile: FragranceProfile): AccordBarItem[] {
  const accords = profile.accords || [];
  if (accords.length === 0) return [];

  // Progresión decreciente natural de Fragrantica
  const weights = [100, 82, 68, 56, 46, 38, 32, 28, 24, 20];

  return accords.slice(0, 8).map((name, idx) => {
    const percentage = profile.accordItems && profile.accordItems[idx] 
      ? profile.accordItems[idx].percentage 
      : (weights[idx] || Math.max(18, 100 - idx * 12));

    const color = getAccordColor(name);
    return {
      name,
      percentage,
      bg: color.bg,
      text: color.text
    };
  });
}

function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Obtiene el perfil olfativo oficial garantizado con notas de salida, corazón y fondo.
 */
export function getFragranceProfile(product: ProductItem): FragranceProfile {
  const sku = String(product.sku || (product as any).kodigo || '').trim();
  const origName = getOriginalPerfumeName(product);
  const displayName = product.officialName || product.name;

  // 1. Coincidencia prioritaria directa en los 48 perfumes del catálogo de Aromaniak
  if (sku && CATALOG_PROFILES_48[sku]) {
    const p = CATALOG_PROFILES_48[sku];
    return {
      ...p,
      officialName: displayName,
      brand: product.brand || 'Aromaniak',
      description: `Perfil olfativo oficial de alta fijación inspirado en ${origName || displayName}. Concentrado de perfumería fina con acordes equilibrados y notas de máxima calidad.`
    };
  }

  // 2. Búsqueda en la base de datos externa de Fragrantica por nombre de perfume original
  const normOrig = normalize(origName);
  const normName = normalize(displayName);

  let entry: FragranceDbEntry | undefined;
  if (normOrig || normName) {
    const values = Object.values(fragranceDatabase);
    entry = values.find(p => {
      const dbOfficial = normalize(p.officialName);
      const dbContratipo = normalize(p.contratipo);
      return (normOrig && (dbOfficial === normOrig || dbContratipo === normOrig)) ||
             (normName && (dbOfficial === normName || dbContratipo === normName));
    });

    if (!entry && normOrig) {
      entry = values.find(p => {
        const dbOfficial = normalize(p.officialName);
        return dbOfficial.includes(normOrig) || normOrig.includes(dbOfficial);
      });
    }
  }

  // Si se encontró en la base externa Y tiene notas válidas
  if (entry && entry.topNotes && entry.topNotes.length > 0) {
    return {
      officialName: entry.officialName || displayName,
      brand: entry.brand || product.brand || 'Aromaniak',
      family: entry.family || 'Fragancia Fina',
      accords: entry.accords && entry.accords.length > 0 ? entry.accords : ['amaderado', 'aromático', 'cítrico'],
      topNotes: entry.topNotes,
      heartNotes: entry.heartNotes && entry.heartNotes.length > 0 ? entry.heartNotes : ['Notas florales', 'Especias finas'],
      baseNotes: entry.baseNotes && entry.baseNotes.length > 0 ? entry.baseNotes : ['Maderas nobles', 'Almizcle'],
      season: 'Todo el año / Versátil',
      occasion: 'Uso diario y ocasiones especiales',
      intensity: 'Intensa',
      description: `Perfil olfativo de alta fijación inspirado en ${origName || displayName}. Formulado con aceites concentrados franceses para brindar una estela duradera.`
    };
  }

  // 3. Respaldo inteligente completo para productos nuevos o personalizados según género
  const g = (product.gender || '').toLowerCase();
  const isDama = g.includes('dama') || g.includes('mujer');
  const isHombre = g.includes('caballero') || g.includes('hombre');

  return {
    officialName: displayName,
    brand: product.brand || 'Aromaniak',
    family: isDama ? 'Floral Frutal Oriental' : isHombre ? 'Amaderada Aromática Fougère' : 'Ámbar Cítrica Unisex',
    accords: isDama 
      ? ['floral', 'dulce', 'afrutado', 'avainillado'] 
      : isHombre 
      ? ['amaderado', 'aromático', 'fresco especiado', 'cítrico'] 
      : ['cítrico', 'aromático', 'amaderado', 'ámbar'],
    topNotes: isDama 
      ? ['Bergamota', 'Pera jugosa', 'Mandarina'] 
      : isHombre 
      ? ['Bergamota', 'Pimienta rosa', 'Toronja'] 
      : ['Bergamota', 'Limón', 'Notas verdes'],
    heartNotes: isDama 
      ? ['Jazmín Sambac', 'Rosa', 'Flor de azahar'] 
      : isHombre 
      ? ['Lavanda silvestre', 'Geranio', 'Pimienta'] 
      : ['Lavanda', 'Jazmín', 'Nuez moscada'],
    baseNotes: isDama 
      ? ['Vainilla', 'Pachulí', 'Almizcle blanco'] 
      : isHombre 
      ? ['Cedro', 'Vetiver', 'Ambroxan', 'Pachulí'] 
      : ['Cedro', 'Almizcle', 'Ámbar'],
    season: 'Todo el año',
    occasion: 'Uso diario y ocasiones especiales',
    intensity: 'Intensa',
    description: `Perfil olfativo fino de alta fijación inspirado en ${origName || displayName}.`
  };
}
