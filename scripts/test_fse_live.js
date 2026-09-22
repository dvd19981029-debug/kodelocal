const https = require('https');
const crypto = require('crypto');

const apiKey = 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1';
const dteId = crypto.randomUUID();

const payload = {
  id: dteId,
  paymentType: 'CONTADO',
  retentionRenta: 5.00, // 10% de retención sobre $50
  retentionIva: 0,
  recipient: {
    name: 'Patricia Elizabeth Mejía Ramírez',
    phone: '72304650',
    email: 'pm3923193@gmail.com',
    identificationDocument: {
      type: 'DUI',
      number: '068614130',
    },
    address: {
      department: '10',
      municipality: '15',
      complement: 'Caserío Las Vegas, Cantón Cañas, Tepetitán, San Vicente',
    },
  },
  items: [
    {
      type: 'SERVICIOS',
      internalCode: 'COM-01',
      description: 'Servicios profesionales de intermediación comercial y comisiones por venta de fragancias',
      quantity: 1,
      unitPrice: 50.00,
    },
  ],
};

console.log('=== PROBANDO EMISIÓN DE FACTURA DE SUJETO EXCLUIDO (DTE-14) EN FACTURA LLAMA (TEST API) ===');
console.log('UUID Generado:', dteId);
console.log('Payload a enviar:\n', JSON.stringify(payload, null, 2));

const postData = JSON.stringify(payload);

const options = {
  hostname: 'api.facturallama.com',
  port: 443,
  path: '/dte/fse',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'X-API-Version': '1',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = https.request(options, (res) => {
  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log(`\nCódigo de Respuesta HTTP: ${res.statusCode} ${res.statusMessage}`);
    try {
      const parsed = JSON.parse(responseBody);
      console.log('Respuesta Factura Llama:\n', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Respuesta en texto crudo:\n', responseBody);
    }
  });
});

req.on('error', (e) => {
  console.error('Error en la petición HTTPS:', e.message);
});

req.write(postData);
req.end();
