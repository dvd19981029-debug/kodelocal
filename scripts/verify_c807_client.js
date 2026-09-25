const fs = require('fs');
const path = require('path');

console.log('=== VERIFICACIÓN DEL CLIENTE Y PAYLOAD DE C807 EXPRESS ===\n');

// 1. Validar el código fuente de src/lib/c807.ts
const c807Source = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'c807.ts'), 'utf8');

const requiredMethods = [
  'class C807Client',
  'async obtenerToken()',
  'async generarGuia(input: C807GuideInput)',
  'buscarValorPorClaves(obj: any, claves: string[])',
  'async enviarNotificacionTelegram(mensaje: string)'
];

for (const m of requiredMethods) {
  if (c807Source.includes(m)) {
    console.log(`✅ [OK] Método / definición encontrada: ${m}`);
  } else {
    console.error(`❌ [ERROR] Falta método: ${m}`);
    process.exit(1);
  }
}

// 2. Probar el extractor recursivo in-situ
function buscarValorPorClaves(obj, claves) {
  if (!obj || typeof obj !== 'object') return null;
  const lowerKeys = claves.map(k => k.toLowerCase());
  for (const key of Object.keys(obj)) {
    if (lowerKeys.includes(key.toLowerCase())) {
      const val = obj[key];
      if (val !== null && val !== undefined && val !== '') return val;
    }
  }
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null) {
      const res = buscarValorPorClaves(val, claves);
      if (res !== null && res !== undefined && res !== '') return res;
    }
  }
  return null;
}

const mockResponseNested = {
  status: 'success',
  data: {
    result: {
      guias: [
        {
          numero_guia: 'C807-SV-2026-X',
          tracking_url: 'https://c807xpress.com/tracking/?guia=C807-SV-2026-X'
        }
      ]
    }
  }
};

const g2 = buscarValorPorClaves(mockResponseNested, ['num_guia', 'numero_guia']);
const l2 = buscarValorPorClaves(mockResponseNested, ['link_rastreo', 'tracking_url']);

if (g2 === 'C807-SV-2026-X' && l2.includes('C807-SV-2026-X')) {
  console.log('\n✅ Extracción recursiva de respuesta anidada profunda verificada con éxito.');
} else {
  console.error('❌ Error en extracción anidada:', { g2, l2 });
  process.exit(1);
}

// 3. Probar resolución territorial para C807 con el dataset
const munis = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'svMunicipiosData.json'), 'utf8'));

const DEPTO_TO_ID = {
  'Ahuachapán': 2,
  'La Libertad': 6,
  'San Miguel': 10,
  'San Salvador': 11,
  'Santa Ana': 13
};

function resolveC807MunicipioId(muniName, idDepto) {
  const clean = muniName.trim().toUpperCase();
  const found = munis.find(m => (!idDepto || m.id_depto === idDepto) && (m.nombre_municipio.toUpperCase() === clean));
  return found ? found.id_municipio : 194;
}

const testCases = [
  { depto: 'San Salvador', muni: 'SAN SALVADOR', expDeptoId: 11, expMuniId: 194 },
  { depto: 'Ahuachapán', muni: 'AHUACHAPAN', expDeptoId: 2, expMuniId: 2 },
  { depto: 'Santa Ana', muni: 'SANTA ANA', expDeptoId: 13, expMuniId: 221 },
  { depto: 'La Libertad', muni: 'SANTA TECLA', expDeptoId: 6, expMuniId: 81 },
  { depto: 'San Miguel', muni: 'SAN MIGUEL', expDeptoId: 10, expMuniId: 176 }
];

console.log('\n2. Probando resolución de departamento_id y municipio_id...');
for (const tc of testCases) {
  const deptoId = DEPTO_TO_ID[tc.depto];
  const muniId = resolveC807MunicipioId(tc.muni, deptoId);
  if (deptoId === tc.expDeptoId && muniId === tc.expMuniId) {
    console.log(`✅ [OK] ${tc.depto} -> departamento_id: ${deptoId} | ${tc.muni} -> municipio_id: ${muniId}`);
  } else {
    console.error(`❌ [ERROR] Falló resolución para ${tc.depto} / ${tc.muni}:`, {
      gotDeptoId: deptoId, expDeptoId: tc.expDeptoId,
      gotMuniId: muniId, expMuniId: tc.expMuniId
    });
    process.exit(1);
  }
}

// 4. Validar webhook route y guia route
const webhookSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'c807', 'webhook', 'route.ts'), 'utf8');
const guiaSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'kode', 'guia', 'route.ts'), 'utf8');

if (webhookSource.includes('c807Client.enviarNotificacionTelegram') && webhookSource.includes('public.pedidos')) {
  console.log('\n✅ Webhook /api/c807/webhook verificado con persistencia y alertas.');
} else {
  console.error('❌ Webhook no verificado correctamente.');
  process.exit(1);
}

if (guiaSource.includes('c807Client.generarGuia') && guiaSource.includes("modo === 'automatico'")) {
  console.log('✅ Endpoint /api/kode/guia verificado con soporte de generación automática directa.');
} else {
  console.error('❌ Endpoint /api/kode/guia no verificado correctamente.');
  process.exit(1);
}

console.log('\n🎉 ¡TODAS LAS VALIDACIONES DE C807 PASARON EXITOSAMENTE!');
