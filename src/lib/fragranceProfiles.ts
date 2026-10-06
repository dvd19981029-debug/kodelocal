// src/lib/fragranceProfiles.ts
import { ProductItem } from './store';
import { getAccordColor } from './fragranceNotesData';
import { getInspiracionPerfumeName } from './perfumeNames';
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

export interface FragranceDbEntry {
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

/**
 * Consulta asíncrona de notas olfativas hacia el backend (/api/fragrance-profile)
 * sin cargar los 378KB en el bundle de JavaScript del navegador.
 */
export async function fetchExternalFragranceProfile(name: string, inspiracion?: string): Promise<FragranceDbEntry | null> {
  try {
    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (inspiracion) params.set('inspiracion', inspiracion);

    const res = await fetch(`/api/fragrance-profile?${params.toString()}`);
    const data = await res.json();
    return data.success && data.entry ? (data.entry as FragranceDbEntry) : null;
  } catch (err) {
    console.warn('No se pudo cargar perfil externo de fragancia:', err);
    return null;
  }
}

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

const fragranceDatabase = fragranceDatabaseRaw as unknown as Record<string, FragranceDbEntry>;
const fragranceDbValues = Object.values(fragranceDatabase);

/**
 * Busca en la base de datos real de 646 perfumes (Fragrantica/Parfumo) por SKU, nombre, contratipo o inspiración.
 */
export function findInFragranceDatabase(query: {
  sku?: string;
  name?: string;
  officialName?: string;
  inspiracion?: string;
}): FragranceDbEntry | null {
  const normSku = (query.sku || '').trim();
  const normName = normalize(query.name || '');
  const normOfficial = normalize(query.officialName || '');
  const normInspiracion = normalize(query.inspiracion || '');

  // 1. Coincidencia directa por clave/código en el mapa
  if (normSku && fragranceDatabase[normSku]) {
    const entry = fragranceDatabase[normSku];
    if (entry.topNotes?.length || entry.heartNotes?.length || entry.baseNotes?.length) {
      return entry;
    }
  }

  // 2. Coincidencia por campo kodigo
  if (normSku) {
    const byKodigo = fragranceDbValues.find(p => String(p.kodigo || '').trim() === normSku);
    if (byKodigo && (byKodigo.topNotes?.length || byKodigo.heartNotes?.length || byKodigo.baseNotes?.length)) {
      return byKodigo;
    }
  }

  // 3. Coincidencia exacta de nombre o inspiración en contratipo u officialName
  const exact = fragranceDbValues.find(p => {
    const dbOfficial = normalize(p.officialName);
    const dbContratipo = normalize(p.contratipo);
    return (normInspiracion && (dbOfficial === normInspiracion || dbContratipo === normInspiracion)) ||
           (normOfficial && (dbOfficial === normOfficial || dbContratipo === normOfficial)) ||
           (normName && (dbOfficial === normName || dbContratipo === normName));
  });
  if (exact && (exact.topNotes?.length || exact.heartNotes?.length || exact.baseNotes?.length)) {
    return exact;
  }

  // 4. Búsqueda por inclusión / contiene (ej. Sauvage Elixir, Fiera Elixir, etc.)
  const partial = fragranceDbValues.find(p => {
    const dbOfficial = normalize(p.officialName);
    const dbContratipo = normalize(p.contratipo);
    if (!dbOfficial && !dbContratipo) return false;

    if (normInspiracion) {
      if (dbOfficial && (dbOfficial.includes(normInspiracion) || normInspiracion.includes(dbOfficial))) return true;
      if (dbContratipo && (dbContratipo.includes(normInspiracion) || normInspiracion.includes(dbContratipo))) return true;
    }
    if (normName) {
      if (dbOfficial && (dbOfficial.includes(normName) || normName.includes(dbOfficial))) return true;
      if (dbContratipo && (dbContratipo.includes(normName) || normName.includes(dbContratipo))) return true;
    }
    if (normOfficial) {
      if (dbOfficial && (dbOfficial.includes(normOfficial) || normOfficial.includes(dbOfficial))) return true;
      if (dbContratipo && (dbContratipo.includes(normOfficial) || normOfficial.includes(dbContratipo))) return true;
    }
    return false;
  });
  if (partial && (partial.topNotes?.length || partial.heartNotes?.length || partial.baseNotes?.length)) {
    return partial;
  }

  return null;
}

/**
 * Obtiene el perfil olfativo oficial garantizado con notas de salida, corazón y fondo.
 */
export function getFragranceProfile(product: ProductItem): FragranceProfile {
  const sku = String(product.sku || (product as any).kodigo || '').trim();
  const inspiracionName = getInspiracionPerfumeName(product);
  const displayName = product.officialName || product.name;

  // 1. Coincidencia prioritaria directa en el catálogo curado de Aromaniak
  if (sku && CATALOG_PROFILES_48[sku]) {
    const p = CATALOG_PROFILES_48[sku];
    return {
      ...p,
      officialName: displayName,
      brand: product.brand || 'Aromaniak',
      description: `Perfil olfativo oficial de alta fijación inspirado en ${inspiracionName || displayName}. Concentrado de perfumería fina con acordes equilibrados y notas de máxima calidad.`
    };
  }

  // 2. Consulta directa en la base de datos real de fragancias (646 perfumes con notas de Fragrantica)
  const dbMatch = findInFragranceDatabase({
    sku,
    name: product.name,
    officialName: product.officialName,
    inspiracion: inspiracionName,
  });

  if (dbMatch && (dbMatch.topNotes?.length || dbMatch.heartNotes?.length || dbMatch.baseNotes?.length)) {
    return {
      officialName: displayName,
      brand: dbMatch.brand || product.brand || 'Aromaniak',
      family: dbMatch.family || 'Aromática Especiada',
      accords: dbMatch.accords?.length ? dbMatch.accords : ['cálido especiado', 'amaderado', 'aromático'],
      topNotes: dbMatch.topNotes?.length ? dbMatch.topNotes : ['Bergamota', 'Pimienta'],
      heartNotes: dbMatch.heartNotes?.length ? dbMatch.heartNotes : ['Lavanda'],
      baseNotes: dbMatch.baseNotes?.length ? dbMatch.baseNotes : ['Cedro', 'Ámbar'],
      season: 'Todo el año',
      occasion: 'Uso diario y ocasiones especiales',
      intensity: 'Intensa',
      description: `Perfil olfativo oficial de alta fijación inspirado en ${inspiracionName || displayName}. Concentrado de perfumería fina con acordes equilibrados y notas de máxima calidad.`
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
    description: `Perfil olfativo fino de alta fijación inspirado en ${inspiracionName || displayName}.`
  };
}
