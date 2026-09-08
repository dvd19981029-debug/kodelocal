// src/lib/svTerritory.ts
// Catálogo oficial de Departamentos y Municipios para DTE de El Salvador (Ministerio de Hacienda / Factura Llama)

export interface DepartamentoCatalogItem {
  id: string; // Código MH de 2 dígitos (ej. "06")
  nombre: string;
}

export interface MunicipioCatalogItem {
  id: string; // Código MH de 2 dígitos dentro del departamento (ej. "23")
  departamentoId: string; // Código de departamento (ej. "06")
  nombre: string;
}

export const DEPARTAMENTOS_CATALOG: DepartamentoCatalogItem[] = [
  { id: '01', nombre: 'Ahuachapán' },
  { id: '02', nombre: 'Santa Ana' },
  { id: '03', nombre: 'Sonsonate' },
  { id: '04', nombre: 'Chalatenango' },
  { id: '05', nombre: 'La Libertad' },
  { id: '06', nombre: 'San Salvador' },
  { id: '07', nombre: 'Cuscatlán' },
  { id: '08', nombre: 'La Paz' },
  { id: '09', nombre: 'Cabañas' },
  { id: '10', nombre: 'San Vicente' },
  { id: '11', nombre: 'Usulután' },
  { id: '12', nombre: 'San Miguel' },
  { id: '13', nombre: 'Morazán' },
  { id: '14', nombre: 'La Unión' },
  { id: '00', nombre: 'Otro (Para extranjeros)' }
];

export const MUNICIPIOS_CATALOG: MunicipioCatalogItem[] = [
  // 01 - Ahuachapán
  { id: '13', departamentoId: '01', nombre: 'Ahuachapán Norte' },
  { id: '14', departamentoId: '01', nombre: 'Ahuachapán Centro' },
  { id: '15', departamentoId: '01', nombre: 'Ahuachapán Sur' },

  // 02 - Santa Ana
  { id: '14', departamentoId: '02', nombre: 'Santa Ana Norte' },
  { id: '15', departamentoId: '02', nombre: 'Santa Ana Centro' },
  { id: '16', departamentoId: '02', nombre: 'Santa Ana Este' },
  { id: '17', departamentoId: '02', nombre: 'Santa Ana Oeste' },

  // 03 - Sonsonate
  { id: '17', departamentoId: '03', nombre: 'Sonsonate Norte' },
  { id: '18', departamentoId: '03', nombre: 'Sonsonate Centro' },
  { id: '19', departamentoId: '03', nombre: 'Sonsonate Este' },
  { id: '20', departamentoId: '03', nombre: 'Sonsonate Oeste' },

  // 04 - Chalatenango
  { id: '34', departamentoId: '04', nombre: 'Chalatenango Norte' },
  { id: '35', departamentoId: '04', nombre: 'Chalatenango Centro' },
  { id: '36', departamentoId: '04', nombre: 'Chalatenango Sur' },

  // 05 - La Libertad
  { id: '23', departamentoId: '05', nombre: 'La Libertad Norte' },
  { id: '24', departamentoId: '05', nombre: 'La Libertad Centro' },
  { id: '25', departamentoId: '05', nombre: 'La Libertad Oeste' },
  { id: '26', departamentoId: '05', nombre: 'La Libertad Este' },
  { id: '27', departamentoId: '05', nombre: 'La Libertad Costa' },
  { id: '28', departamentoId: '05', nombre: 'La Libertad Sur' },

  // 06 - San Salvador
  { id: '20', departamentoId: '06', nombre: 'San Salvador Norte' },
  { id: '21', departamentoId: '06', nombre: 'San Salvador Oeste' },
  { id: '22', departamentoId: '06', nombre: 'San Salvador Este' },
  { id: '23', departamentoId: '06', nombre: 'San Salvador Centro' },
  { id: '24', departamentoId: '06', nombre: 'San Salvador Sur' },

  // 07 - Cuscatlán
  { id: '17', departamentoId: '07', nombre: 'Cuscatlán Norte' },
  { id: '18', departamentoId: '07', nombre: 'Cuscatlán Sur' },

  // 08 - La Paz
  { id: '23', departamentoId: '08', nombre: 'La Paz Oeste' },
  { id: '24', departamentoId: '08', nombre: 'La Paz Centro' },
  { id: '25', departamentoId: '08', nombre: 'La Paz Este' },

  // 09 - Cabañas
  { id: '10', departamentoId: '09', nombre: 'Cabañas Oeste' },
  { id: '11', departamentoId: '09', nombre: 'Cabañas Este' },

  // 10 - San Vicente
  { id: '14', departamentoId: '10', nombre: 'San Vicente Norte' },
  { id: '15', departamentoId: '10', nombre: 'San Vicente Sur' },

  // 11 - Usulután
  { id: '24', departamentoId: '11', nombre: 'Usulután Norte' },
  { id: '25', departamentoId: '11', nombre: 'Usulután Este' },
  { id: '26', departamentoId: '11', nombre: 'Usulután Oeste' },

  // 12 - San Miguel
  { id: '21', departamentoId: '12', nombre: 'San Miguel Norte' },
  { id: '22', departamentoId: '12', nombre: 'San Miguel Centro' },
  { id: '23', departamentoId: '12', nombre: 'San Miguel Oeste' },

  // 13 - Morazán
  { id: '27', departamentoId: '13', nombre: 'Morazán Norte' },
  { id: '28', departamentoId: '13', nombre: 'Morazán Sur' },

  // 14 - La Unión
  { id: '19', departamentoId: '14', nombre: 'La Unión Norte' },
  { id: '20', departamentoId: '14', nombre: 'La Unión Sur' },

  // 00 - Otro
  { id: '00', departamentoId: '00', nombre: 'Otro (Para extranjeros)' }
];

// Mapeos rápidos de nombres a códigos
export const DEPARTAMENTOS_CODES: Record<string, string> = {
  'Ahuachapán': '01',
  'Ahuachapan': '01',
  'Santa Ana': '02',
  'Sonsonate': '03',
  'Chalatenango': '04',
  'La Libertad': '05',
  'San Salvador': '06',
  'Cuscatlán': '07',
  'Cuscatlan': '07',
  'La Paz': '08',
  'Cabañas': '09',
  'Cabanas': '09',
  'San Vicente': '10',
  'Usulután': '11',
  'Usulutan': '11',
  'San Miguel': '12',
  'Morazán': '13',
  'Morazan': '13',
  'La Unión': '14',
  'La Union': '14',
  'Otro': '00',
  'Extranjero': '00'
};

// Aliases de distritos tradicionales a nuevos municipios
const DISTRITO_ALIASES: Record<string, { dept: string; muni: string }> = {
  // San Salvador
  'SAN SALVADOR': { dept: '06', muni: '23' },
  'MEJICANOS': { dept: '06', muni: '23' },
  'AYUTUXTEPEQUE': { dept: '06', muni: '23' },
  'CUSCATANCINGO': { dept: '06', muni: '23' },
  'CIUDAD DELGADO': { dept: '06', muni: '23' },
  'SAN MARCOS': { dept: '06', muni: '24' },
  'SANTO TOMAS': { dept: '06', muni: '24' },
  'SANTIAGO TEXACUANGOS': { dept: '06', muni: '24' },
  'PANCHIMALCO': { dept: '06', muni: '24' },
  'ROSARIO DE MORA': { dept: '06', muni: '24' },
  'SOYAPANGO': { dept: '06', muni: '22' },
  'ILOPANGO': { dept: '06', muni: '22' },
  'SAN MARTIN': { dept: '06', muni: '22' },
  'TONACATEPEQUE': { dept: '06', muni: '22' },
  'APOPA': { dept: '06', muni: '21' },
  'NEJAPA': { dept: '06', muni: '21' },
  'AGUILARES': { dept: '06', muni: '20' },
  'EL PAISNAL': { dept: '06', muni: '20' },
  'GUAZAPA': { dept: '06', muni: '20' },

  // La Libertad
  'SANTA TECLA': { dept: '05', muni: '28' },
  'COMASAGUA': { dept: '05', muni: '28' },
  'ANTIGUO CUSCATLAN': { dept: '05', muni: '26' },
  'HUIZUCAR': { dept: '05', muni: '26' },
  'NUEVO CUSCATLAN': { dept: '05', muni: '26' },
  'SAN JOSE VILLANUEVA': { dept: '05', muni: '26' },
  'ZARAGOZA': { dept: '05', muni: '26' },
  'COLON': { dept: '05', muni: '25' },
  'LOURDES': { dept: '05', muni: '25' },
  'SAN JUAN OPICO': { dept: '05', muni: '24' },
  'CIUDAD ARCE': { dept: '05', muni: '24' },
  'QUEZALTEPEQUE': { dept: '05', muni: '23' },
  'LA LIBERTAD': { dept: '05', muni: '27' },
  'PUERTO DE LA LIBERTAD': { dept: '05', muni: '27' },

  // Santa Ana
  'SANTA ANA': { dept: '02', muni: '15' },
  'CHALCHUAPA': { dept: '02', muni: '17' },
  'METAPAN': { dept: '02', muni: '14' },
  'COATEPEQUE': { dept: '02', muni: '16' },

  // San Miguel
  'SAN MIGUEL': { dept: '12', muni: '22' },

  // Sonsonate
  'SONSONATE': { dept: '03', muni: '18' },
  'ACAJUTLA': { dept: '03', muni: '20' }
};

/**
 * Obtiene la lista de municipios correspondientes a un departamento
 */
export function getMunicipiosByDepartamento(deptIdOrName: string): MunicipioCatalogItem[] {
  const deptCode = resolveDepartamentoCode(deptIdOrName);
  return MUNICIPIOS_CATALOG.filter(m => m.departamentoId === deptCode);
}

/**
 * Normaliza cualquier entrada de departamento (nombre o código) a su código oficial MH de 2 dígitos.
 * Fallback seguro: "06" (San Salvador).
 */
export function resolveDepartamentoCode(deptIdOrName?: string): string {
  if (!deptIdOrName) return '06';
  const clean = deptIdOrName.trim();
  
  // Si ya viene en formato de código válido de 2 dígitos
  const pad = clean.padStart(2, '0');
  if (DEPARTAMENTOS_CATALOG.some(d => d.id === pad)) {
    return pad;
  }

  // Búsqueda por nombre
  const upper = clean.toUpperCase();
  for (const [key, val] of Object.entries(DEPARTAMENTOS_CODES)) {
    if (key.toUpperCase() === upper) {
      return val;
    }
  }

  // Búsqueda por coincidencia parcial en el catálogo
  const found = DEPARTAMENTOS_CATALOG.find(d => 
    d.nombre.toUpperCase().includes(upper) || upper.includes(d.nombre.toUpperCase())
  );
  if (found) return found.id;

  return '06';
}

/**
 * Normaliza cualquier entrada de municipio a un código válido de 2 dígitos dentro del departamento especificado.
 * Garantiza al 100% que el código pertenezca al departamento según las reglas del Ministerio de Hacienda.
 */
export function resolveMunicipioCode(deptCode: string, muniIdOrName?: string): string {
  const munisOfDept = MUNICIPIOS_CATALOG.filter(m => m.departamentoId === deptCode);
  if (munisOfDept.length === 0) return '00';

  if (!muniIdOrName) {
    // Fallback: retornar el primer municipio del depto (o el Centro si existe)
    const centro = munisOfDept.find(m => m.nombre.toUpperCase().includes('CENTRO'));
    return (centro || munisOfDept[0]).id;
  }

  const clean = muniIdOrName.trim();
  const pad = clean.padStart(2, '0');

  // 1. Si ya es un código de 2 dígitos y existe en este departamento:
  const matchById = munisOfDept.find(m => m.id === pad);
  if (matchById) return matchById.id;

  // 2. Búsqueda por nombre exacto en los municipios del departamento
  const cleanUpper = clean.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const matchByName = munisOfDept.find(m => {
    const norm = m.nombre.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return norm === cleanUpper || cleanUpper.includes(norm) || norm.includes(cleanUpper);
  });
  if (matchByName) return matchByName.id;

  // 3. Revisar alias tradicionales de distritos
  const aliasKey = Object.keys(DISTRITO_ALIASES).find(k => 
    k.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cleanUpper
  );
  if (aliasKey) {
    const alias = DISTRITO_ALIASES[aliasKey];
    if (alias.dept === deptCode) {
      const matchAlias = munisOfDept.find(m => m.id === alias.muni);
      if (matchAlias) return matchAlias.id;
    }
  }

  // 4. Fallback garantizado: municipio centro o primer municipio del depto
  const fallback = munisOfDept.find(m => m.nombre.toUpperCase().includes('CENTRO')) || munisOfDept[0];
  return fallback.id;
}

/**
 * Obtiene el nombre legible de un departamento por su código
 */
export function getDepartamentoNombre(deptCode: string): string {
  const found = DEPARTAMENTOS_CATALOG.find(d => d.id === deptCode);
  return found ? found.nombre : 'San Salvador';
}

/**
 * Obtiene el nombre legible de un municipio por sus códigos
 */
export function getMunicipioNombre(deptCode: string, muniCode: string): string {
  const found = MUNICIPIOS_CATALOG.find(m => m.departamentoId === deptCode && m.id === muniCode);
  return found ? found.nombre : 'San Salvador Centro';
}
