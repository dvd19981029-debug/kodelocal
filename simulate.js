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

async function simulate() {
  console.log('--- Empezando simulación ---');

  // 1. Crear 5 productos aleatorios
  const newProducts = [];
  for (let i = 1; i <= 5; i++) {
    const sku = `RND-${Date.now()}-${i}`;
    const name = `Producto Aleatorio ${i}`;
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        sku,
        name,
        price: 15.99,
        cost: 5.00,
        stock: 10
      })
    });
    const data = await res.json();
    if (data.success) {
      console.log(`Producto creado: ${name} (SKU: ${sku})`);
      newProducts.push(data.product);
    } else {
      console.error(`Error creando producto:`, data.error);
    }
  }

  // 2. Adjust stock blindly to trigger Kardex
  // Obtenemos un producto para ajustar (el primero que creamos)
  if (newProducts.length > 0) {
    const prodToAdjust = newProducts[0];
    const newStock = prodToAdjust.stock + 5;
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({
        id: prodToAdjust.id,
        stock: newStock
      })
    });
    const data = await res.json();
    if (data.success) {
      console.log(`Stock ajustado para ${prodToAdjust.name} a ${newStock} unidades. (Kardex disparado)`);
    } else {
      console.error(`Error ajustando stock:`, data.error);
    }
  }

  // 3. Create 3 Purchases
  for (let i = 1; i <= 3; i++) {
    // Escogemos 2 productos al azar de los que creamos
    const items = newProducts.slice(0, 2).map(p => ({
      productId: p.id,
      productName: p.name,
      quantity: 10 * i,
      costPrice: p.cost,
      subtotal: (10 * i) * p.cost
    }));

    const total = items.reduce((acc, it) => acc + it.subtotal, 0);

    const res = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        supplierName: `Proveedor ${i}`,
        purchaseDate: new Date().toISOString(),
        condicion: 'CONTADO',
        total: total,
        subtotalNeto: total,
        items: items
      })
    });
    const data = await res.json();
    if (data.success) {
      console.log(`Compra ${i} creada con éxito.`);
    } else {
      console.error(`Error creando compra ${i}:`, data.error);
    }
  }

  console.log('--- Simulación terminada ---');
}

simulate().catch(console.error);
