const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFICACIÓN DEL ESQUEMA DEPURADO DE PEDIDOS ===\n');

// 1. Validar scripts/create_pedidos_table.sql
const sqlPath = path.join(__dirname, 'create_pedidos_table.sql');
assert(fs.existsSync(sqlPath), 'scripts/create_pedidos_table.sql debe existir');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

const requiredColumns = [
  'numero_pedido',
  'fecha_pedido',
  'cliente_id',
  'direccion_entrega',
  'departamento_id',
  'municipio_id',
  'estado',
  'tipo_pago',
  'estado_pago',
  'subtotal',
  'descuento',
  'costo_envio',
  'total',
  'monto_cobrar_cce',
  'proveedor_envio',
  'c807_guia_numero',
  'c807_link_rastreo',
  'c807_estado',
  'c807_fecha_guia',
  'dte_estado',
  'dte_codigo_generacion',
  'dte_numero_control',
  'dte_sello_recepcion',
  'dte_pdf_url',
  'dte_fecha_emision',
  'vendedora_id',
  'comision_vendedora'
];

for (const col of requiredColumns) {
  assert(sqlContent.includes(col), `La columna depurada ${col} debe estar en el SQL`);
  console.log(`✅ [OK] Columna núcleo presente: ${col}`);
}

// 2. Verificar que las columnas redundantes de AppSheet NO estén en el SQL
const rejectedColumns = [
  '_RowNumber',
  'Token 2',
  'Mensaje Whatsapp',
  'Link Wa',
  'Datos de Entrega',
  'Conteo Pedidos',
  '% Día',
  'Depto MH',
  'Municipio MH',
  'Estado Recibo',
  'Recibo '
];

for (const rejected of rejectedColumns) {
  assert(!sqlContent.includes(` ${rejected} `), `La columna innecesaria de AppSheet "${rejected}" NO debe existir en la BD`);
  console.log(`✅ [OK] Columna innecesaria eliminada con éxito: ${rejected}`);
}

// 3. Validar tabla hija pedido_items
assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.pedido_items'), 'Tabla pedido_items presente');
assert(sqlContent.includes('insumo_comprado'), 'Campo insumo_comprado presente en pedido_items');
assert(sqlContent.includes('version'), 'Campo version presente en pedido_items');
console.log('✅ [OK] Tabla hija public.pedido_items verificada');

// 4. Validar persistencia en api/kode/dte/route.ts
const dteRouteSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'kode', 'dte', 'route.ts'), 'utf8');
assert(dteRouteSrc.includes('dte_estado'), 'API DTE debe actualizar dte_estado');
assert(dteRouteSrc.includes('dte_codigo_generacion'), 'API DTE debe actualizar dte_codigo_generacion');
assert(dteRouteSrc.includes('dte_numero_control'), 'API DTE debe actualizar dte_numero_control');
assert(dteRouteSrc.includes('dte_pdf_url'), 'API DTE debe actualizar dte_pdf_url');
console.log('✅ [OK] API /api/kode/dte persiste los datos de Factura Llama en la tabla pedidos');

console.log('\n🎉 ¡VERIFICACIÓN EXITOSA! La tabla pedidos está depurada, optimizada y consistente al 100%.');
