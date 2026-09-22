const fs = require('fs');
const path = require('path');

const territoryPath = path.join(__dirname, '..', 'src', 'lib', 'svTerritory.ts');
const sqlPath = path.join(__dirname, '..', 'scripts', 'create_departamentos_table.sql');

const territoryContent = fs.readFileSync(territoryPath, 'utf8');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

const EXPECTED_MAPPING = [
  { nombre: 'Ahuachapán', c807: 'AHU', mh: '01' },
  { nombre: 'Cabañas', c807: 'CAB', mh: '09' },
  { nombre: 'Chalatenango', c807: 'CHA', mh: '04' },
  { nombre: 'Cuscatlán', c807: 'CUS', mh: '07' },
  { nombre: 'La Libertad', c807: 'LIB', mh: '05' },
  { nombre: 'La Paz', c807: 'PAZ', mh: '08' },
  { nombre: 'La Unión', c807: 'UNI', mh: '14' },
  { nombre: 'Morazán', c807: 'MOR', mh: '13' },
  { nombre: 'San Miguel', c807: 'MIG', mh: '12' },
  { nombre: 'San Salvador', c807: 'SLV', mh: '06' },
  { nombre: 'San Vicente', c807: 'VIC', mh: '10' },
  { nombre: 'Santa Ana', c807: 'ANA', mh: '02' },
  { nombre: 'Sonsonate', c807: 'SON', mh: '03' },
  { nombre: 'Usulután', c807: 'USU', mh: '11' },
];

console.log('=== VALIDACIÓN DE LA TABLA Y MAPEOS DE DEPARTAMENTOS ===\n');

let failed = false;

// 1. Validar svTerritory.ts
console.log('1. Validando src/lib/svTerritory.ts...');
for (const item of EXPECTED_MAPPING) {
  const catalogCheck = territoryContent.includes(`nombre_depto: '${item.nombre}'`) &&
                       territoryContent.includes(`cod_depto: '${item.c807}'`) &&
                       territoryContent.includes(`depto_mh: '${item.mh}'`);
  if (!catalogCheck) {
    console.error(`❌ Falló catálogo para ${item.nombre} en svTerritory.ts`);
    failed = true;
  }

  const c807MapCheck = territoryContent.includes(`'${item.nombre}': '${item.c807}'`);
  if (!c807MapCheck) {
    console.error(`❌ Falló mapa C807 para ${item.nombre} en svTerritory.ts`);
    failed = true;
  }
}

if (!territoryContent.includes('export function resolveC807DeptoCode')) {
  console.error('❌ Falta función resolveC807DeptoCode');
  failed = true;
}
if (!territoryContent.includes('export function resolveMhDeptoCode')) {
  console.error('❌ Falta función resolveMhDeptoCode');
  failed = true;
}

if (!failed) {
  console.log('✅ svTerritory.ts contiene los 14 departamentos con cod_depto y depto_mh correctos.');
}

// 2. Validar create_departamentos_table.sql
console.log('\n2. Validando scripts/create_departamentos_table.sql...');
for (const item of EXPECTED_MAPPING) {
  const sqlRowCheck = sqlContent.includes(`'${item.nombre}', '${item.c807}', '${item.mh}'`);
  if (!sqlRowCheck) {
    console.error(`❌ Falló fila SQL para: '${item.nombre}', '${item.c807}', '${item.mh}'`);
    failed = true;
  }
}

if (!failed) {
  console.log('✅ create_departamentos_table.sql contiene todas las tuplas de inserción requeridas.');
}

// 3. Resumen final
if (failed) {
  console.error('\n❌ Hubo errores en la validación.');
  process.exit(1);
} else {
  console.log('\n🎉 ¡VERIFICACIÓN EXITOSA! Todos los 14 departamentos coinciden con la tabla requerida.');
}
