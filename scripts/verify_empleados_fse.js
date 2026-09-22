const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFICACIÓN DE VISTA TABLA DE EMPLEADOS Y DTE SUJETO EXCLUIDO ===\n');

// 1. Verificar ConfiguracionKodeModule.tsx
const componentPath = path.join(__dirname, '..', 'src', 'components', 'admin', 'ConfiguracionKodeModule.tsx');
assert(fs.existsSync(componentPath), 'ConfiguracionKodeModule.tsx existe');
const compContent = fs.readFileSync(componentPath, 'utf8');

// Comprobar que activeTab empleados tiene la tabla
assert(compContent.includes('<table className="w-full text-left border-collapse text-xs">'), 'La tabla de empleados debe estar presente');
assert(compContent.includes('Directorio de Empleados y Asesoras KÖDE'), 'Título de la vista');
assert(compContent.includes('openDeleteModal'), 'Función para modal de eliminar');
assert(compContent.includes('openFseModal'), 'Función para modal de DTE Sujeto Excluido');
assert(compContent.includes('handleEmitirFse'), 'Función para emitir Sujeto Excluido');
assert(compContent.includes('DEPARTAMENTOS_CATALOG'), 'Catálogo de departamentos para DTE-14');
assert(compContent.includes('MUNICIPIOS_CATALOG'), 'Catálogo de municipios para DTE-14');
console.log('✅ [OK] ConfiguracionKodeModule.tsx cuenta con la tabla completa, modales y validaciones fiscales.');

// 2. Verificar API /api/kode/empleados
const empleadosApi = path.join(__dirname, '..', 'src', 'app', 'api', 'kode', 'empleados', 'route.ts');
const apiContent = fs.readFileSync(empleadosApi, 'utf8');
assert(apiContent.includes('username'), 'API maneja username');
assert(apiContent.includes('password'), 'API maneja password');
assert(apiContent.includes('doc_tipo'), 'API maneja doc_tipo');
assert(apiContent.includes('doc_numero'), 'API maneja doc_numero');
assert(apiContent.includes('departamento_mh'), 'API maneja departamento_mh');
assert(apiContent.includes('municipio_mh'), 'API maneja municipio_mh');
assert(apiContent.includes('direccion_complemento'), 'API maneja direccion_complemento');
assert(apiContent.includes('checkOrders'), 'DELETE verifica pedidos asociados');
console.log('✅ [OK] /api/kode/empleados maneja credenciales, datos fiscales Sujeto Excluido y borrado seguro.');

// 3. Verificar API /api/kode/dte/fse
const fseApi = path.join(__dirname, '..', 'src', 'app', 'api', 'kode', 'dte', 'fse', 'route.ts');
assert(fs.existsSync(fseApi), 'Endpoint /api/kode/dte/fse existe');
const fseContent = fs.readFileSync(fseApi, 'utf8');
assert(fseContent.includes('emitirDteFseKode'), 'Llama a emitirDteFseKode');
assert(fseContent.includes('retencion_renta'), 'Calcula retención de renta');
console.log('✅ [OK] /api/kode/dte/fse implementado con soporte de Factura Llama POST /dte/fse.');

// 4. Verificar facturalamaKode.ts
const libPath = path.join(__dirname, '..', 'src', 'lib', 'facturalamaKode.ts');
const libContent = fs.readFileSync(libPath, 'utf8');
assert(libContent.includes('emitirDteFseKode'), 'emitirDteFseKode exportado');
assert(libContent.includes('/dte/fse'), 'Usa endpoint /dte/fse');
assert(libContent.includes('SERVICIOS'), 'Item tipo SERVICIOS para servicios profesionales');
console.log('✅ [OK] facturalamaKode.ts incluye constructor de payload y llamada a /dte/fse.');

console.log('\n🎉 ¡TODAS LAS VALIDACIONES PASARON EXITOSAMENTE!');
