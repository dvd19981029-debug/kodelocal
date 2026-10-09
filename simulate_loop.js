const crypto = require('crypto');

const SECRET = '5376bdd2-4d1a-4146-983c-7b4012728a55';

function generateToken() {
  const payload = {
    id: 'cmv0d09cj0001srssy0ywo57z',
    name: 'Ventas',
    email: 'ventas@forbiddensoluciones.com',
    role: 'ADMIN',
    scope: 'internal_operations',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

const TOKEN = generateToken();
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};
const BASE_URL = 'http://localhost:3000/api';

async function tick() {
  try {
    const r = Math.random();
    if (r < 0.33) {
      // Create random product
      const sku = `RND-LOOP-${Date.now()}`;
      await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ sku, name: `Prod ${sku}`, price: 10, cost: 5, stock: 10 })
      });
      console.log('Created product', sku);
    } else if (r < 0.66) {
      // Fetch products to adjust stock
      const getRes = await fetch(`${BASE_URL}/products`, { headers: HEADERS });
      const { products } = await getRes.json();
      if (products && products.length > 0) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const newStock = prod.stock + (Math.random() > 0.5 ? 1 : -1);
        await fetch(`${BASE_URL}/products`, {
          method: 'PATCH',
          headers: HEADERS,
          body: JSON.stringify({ id: prod.id, stock: newStock })
        });
        console.log('Adjusted stock for', prod.id, 'to', newStock);
      }
    } else {
      // Create a purchase
      const getRes = await fetch(`${BASE_URL}/products`, { headers: HEADERS });
      const { products } = await getRes.json();
      if (products && products.length > 0) {
        const prod = products[Math.floor(Math.random() * products.length)];
        await fetch(`${BASE_URL}/purchases`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({
            supplierName: `Proveedor Loop`,
            purchaseDate: new Date().toISOString(),
            condicion: 'CONTADO',
            total: 100,
            subtotalNeto: 100,
            items: [{
              productId: prod.id,
              productName: prod.name,
              quantity: 10,
              costPrice: 10,
              subtotal: 100
            }]
          })
        });
        console.log('Created purchase for product', prod.id);
      }
    }
  } catch (err) {
    console.error('Error in tick:', err.message);
  }
}

setInterval(tick, 5000);
console.log('Simulador loop iniciado. (Ejecutando cada 5s)');
tick();
