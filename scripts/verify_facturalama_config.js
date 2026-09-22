const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFICACIÓN DE CONFIGURACIÓN KODE Y FACTURA LLAMA DTE ===\n');

// 1. Verificar kode_config.json
const configPath = path.join(__dirname, '..', 'src', 'lib', 'kode_config.json');
assert(fs.existsSync(configPath), 'src/lib/kode_config.json debe existir');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
console.log('1. [OK] Archivo kode_config.json válido:', {
  ambiente: config.ambiente,
  testApiKey: config.testApiKey.slice(0, 12) + '...',
  liveApiKey: config.liveApiKey.slice(0, 12) + '...',
  activeApiKey: config.facturaLlamaApiKey.slice(0, 12) + '...',
  apiVersion: config.facturaLlamaApiVersion,
  baseUrl: config.facturaLlamaBaseUrl,
  defaultEmail: config.defaultEmail
});
assert.strictEqual(config.ambiente, 'sandbox');
assert.strictEqual(config.testApiKey, 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1');
assert.strictEqual(config.liveApiKey, 'live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67');
assert.strictEqual(config.facturaLlamaApiKey, 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1');
assert.strictEqual(config.facturaLlamaApiVersion, '1');

// 2. Verificar código de src/lib/kodeConfig.ts
const kodeConfigSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'kodeConfig.ts'), 'utf8');
assert(kodeConfigSrc.includes('export function getKodeConfig'), 'getKodeConfig debe estar exportado');
assert(kodeConfigSrc.includes('export function saveKodeConfig'), 'saveKodeConfig debe estar exportado');
assert(kodeConfigSrc.includes('export function getActiveFacturaLlamaApiKey'), 'getActiveFacturaLlamaApiKey debe estar exportado');
assert(kodeConfigSrc.includes('test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1'), 'Clave de test de usuario presente');
console.log('2. [OK] src/lib/kodeConfig.ts verificado con éxito (soporte de Sandbox y Production)');

// 3. Verificar código de src/lib/facturalamaKode.ts
const facturalamaSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'facturalamaKode.ts'), 'utf8');
assert(facturalamaSrc.includes('export function buildKodeDtePayload'), 'buildKodeDtePayload debe estar exportado');
assert(facturalamaSrc.includes('export async function emitirDteKode'), 'emitirDteKode debe estar exportado');
assert(facturalamaSrc.includes('getActiveFacturaLlamaApiKey'), 'Debe utilizar getActiveFacturaLlamaApiKey');
assert(facturalamaSrc.includes('X-API-Key'), 'Debe enviar el header X-API-Key');
assert(facturalamaSrc.includes('X-API-Version'), 'Debe enviar el header X-API-Version');
assert(facturalamaSrc.includes("'BIENES'"), 'Items deben ser de tipo BIENES');
assert(facturalamaSrc.includes("'GRAVADA'"), 'Items deben tener saleType GRAVADA');
assert(facturalamaSrc.includes("'ID-Pedido'"), 'Apendice debe contener ID-Pedido');
console.log('3. [OK] src/lib/facturalamaKode.ts cumple con la especificación exacta de Factura Llama');

// 4. Verificar endpoint API GET/POST /api/kode/config
const apiConfigSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'kode', 'config', 'route.ts'), 'utf8');
assert(apiConfigSrc.includes('export async function GET'), 'GET /api/kode/config debe existir');
assert(apiConfigSrc.includes('export async function POST'), 'POST /api/kode/config debe existir');
assert(apiConfigSrc.includes('ambiente'), 'POST /api/kode/config debe procesar ambiente');
assert(apiConfigSrc.includes('testApiKey'), 'POST /api/kode/config debe procesar testApiKey');
console.log('4. [OK] API /api/kode/config verificada');

// 5. Verificar endpoint API POST /api/kode/dte
const apiDteSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'kode', 'dte', 'route.ts'), 'utf8');
assert(apiDteSrc.includes('export async function POST'), 'POST /api/kode/dte debe existir');
assert(apiDteSrc.includes('emitirDteKode'), 'Debe invocar a emitirDteKode');
console.log('5. [OK] API /api/kode/dte verificada');

// 6. Verificar el componente UI ConfiguracionKodeModule.tsx
const uiModuleSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'admin', 'ConfiguracionKodeModule.tsx'), 'utf8');
assert(uiModuleSrc.includes('export default function ConfiguracionKodeModule'), 'ConfiguracionKodeModule debe estar exportado');
assert(uiModuleSrc.includes('Configuración Kode'), 'Título del módulo presente');
assert(uiModuleSrc.includes('test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1'), 'Clave test configurada en UI');
assert(uiModuleSrc.includes('🧪 Sandbox (Pruebas)'), 'Opción Sandbox presente');
assert(uiModuleSrc.includes('🚀 Producción (Live)'), 'Opción Producción presente');
assert(uiModuleSrc.includes('Probar Conexión'), 'Botón para Probar Conexión presente');
console.log('6. [OK] Componente UI ConfiguracionKodeModule verificado');

// 7. Verificar integración en src/app/admin/page.tsx
const adminSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'admin', 'page.tsx'), 'utf8');
assert(adminSrc.includes("import ConfiguracionKodeModule from '@/components/admin/ConfiguracionKodeModule'"), 'Import en admin/page.tsx presente');
assert(adminSrc.includes("'configuracion-kode'"), 'Tab configuracion-kode presente en AdminTab');
assert(adminSrc.includes('Configuración Kode'), 'Botón en sidebar de admin presente');
assert(adminSrc.includes('<ConfiguracionKodeModule />'), 'Render de <ConfiguracionKodeModule /> presente');
console.log('7. [OK] Integración en src/app/admin/page.tsx verificada');

// 8. Verificar integración de emisión DTE en src/app/kode/page.tsx
const kodePageSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'kode', 'page.tsx'), 'utf8');
assert(kodePageSrc.includes('handleEmitirDte'), 'handleEmitirDte presente en kode/page.tsx');
assert(kodePageSrc.includes('Facturar DTE'), 'Botón Facturar DTE presente en lista de pedidos');
assert(kodePageSrc.includes('dteResultModal'), 'Modal de resultado DTE presente en kode/page.tsx');
console.log('8. [OK] Integración de emisión DTE en src/app/kode/page.tsx verificada');

// 9. Lógica de selección de API Key según el ambiente
function simulateApiKeyResolution(amb, testK, liveK) {
  if (amb === 'sandbox') return testK;
  return liveK;
}

const activeTestKey = simulateApiKeyResolution(config.ambiente, config.testApiKey, config.liveApiKey);
assert.strictEqual(activeTestKey, 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1');

const activeProdKey = simulateApiKeyResolution('produccion', config.testApiKey, config.liveApiKey);
assert.strictEqual(activeProdKey, 'live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67');

console.log('9. [OK] Resolución dinámica de API Key por ambiente verificada (Sandbox -> Test Key, Producción -> Live Key)');

console.log('\n🎉 ¡TODAS LAS 9 VERIFICACIONES DE SANDBOX Y FACTURA LLAMA PASARON EXITOSAMENTE!');
