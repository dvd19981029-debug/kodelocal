const fs = require('fs');
const path = require('path');

const munisJsonPath = path.join(__dirname, '..', 'src', 'lib', 'svMunicipiosData.json');
const munisSqlPath = path.join(__dirname, '..', 'scripts', 'create_municipios_table.sql');
const deptosSqlPath = path.join(__dirname, '..', 'scripts', 'create_departamentos_table.sql');

console.log('=== TEST DE VALIDACIÓN: TABLA MUNICIPIOS (262 REGISTROS) ===\n');

// 1. Validar JSON extraído
const munis = JSON.parse(fs.readFileSync(munisJsonPath, 'utf8'));
console.log(`1. Total de registros en svMunicipiosData.json: ${munis.length}`);
if (munis.length !== 262) {
  console.error(`❌ ERROR: Se esperaban 262 municipios pero se encontraron ${munis.length}`);
  process.exit(1);
} else {
  console.log('✅ Correcto: Existen exactamente los 262 municipios tradicionales de El Salvador.');
}

// 2. Validar estructura de campos requeridos
const requiredKeys = ['id_municipio', 'nombre_municipio', 'id_depto', 'municipio_mh', 'nombre_mh'];
let missingKeys = 0;
for (const m of munis) {
  for (const k of requiredKeys) {
    if (m[k] === undefined || m[k] === null || m[k] === '') {
      console.error(`❌ Campo ${k} vacío o indefinido en municipio:`, m);
      missingKeys++;
    }
  }
}

if (missingKeys === 0) {
  console.log('✅ Correcto: Todos los 262 registros tienen id_municipio, nombre_municipio, id_depto, municipio_mh y nombre_mh.');
} else {
  process.exit(1);
}

// 3. Validar relación de id_depto (2 al 15)
const deptCounts = {};
for (const m of munis) {
  deptCounts[m.id_depto] = (deptCounts[m.id_depto] || 0) + 1;
}

console.log('\n2. Distribución de municipios por id_depto (2 al 15):');
for (let id = 2; id <= 15; id++) {
  const count = deptCounts[id] || 0;
  console.log(`   id_depto = ${String(id).padStart(2)}: ${count} municipios`);
  if (count === 0) {
    console.error(`❌ ERROR: id_depto ${id} no tiene municipios asignados.`);
    process.exit(1);
  }
}

// 4. Validar SQL scripts
const munisSql = fs.readFileSync(munisSqlPath, 'utf8');
const deptosSql = fs.readFileSync(deptosSqlPath, 'utf8');

if (!munisSql.includes('CREATE TABLE IF NOT EXISTS public.municipios') ||
    !munisSql.includes('id_depto INT NOT NULL REFERENCES public.departamentos(id)')) {
  console.error('❌ ERROR en create_municipios_table.sql: No define la tabla correctamente o falta FK.');
  process.exit(1);
}

if (!deptosSql.includes('(2, \'Ahuachapán\', \'AHU\', \'01\')') ||
    !deptosSql.includes('(11, \'San Salvador\', \'SLV\', \'06\')')) {
  console.error('❌ ERROR en create_departamentos_table.sql: Faltan IDs explícitos (2 al 15).');
  process.exit(1);
}

console.log('✅ Correcto: create_municipios_table.sql y create_departamentos_table.sql validados.');

// 5. Validar ejemplos específicos:
// San Salvador (id_municipio: 194, id_depto: 11, municipio_mh: '23', nombre_mh: 'San Salvador Centro')
const ss = munis.find(m => m.id_municipio === 194);
if (!ss || ss.nombre_municipio !== 'SAN SALVADOR' || ss.id_depto !== 11 || ss.municipio_mh !== '23') {
  console.error('❌ ERROR validando San Salvador:', ss);
  process.exit(1);
} else {
  console.log('\n3. Caso testigo San Salvador verificado:');
  console.log('   id_municipio (C807):', ss.id_municipio);
  console.log('   nombre_municipio (Asesores):', ss.nombre_municipio);
  console.log('   id_depto:', ss.id_depto);
  console.log('   municipio_mh (Factura Llama):', ss.municipio_mh);
  console.log('   nombre_mh (Distribución nueva):', ss.nombre_mh);
}

console.log('\n🎉 ¡TODOS LOS TESTS DE MUNICIPIOS COMPLETADOS CON ÉXITO (262/262)!');
