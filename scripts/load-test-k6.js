import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * 🚀 Aromaniak - Script Oficial de Pruebas de Carga (k6)
 * Basado en la Especificación Técnica para 1,000+ Usuarios Concurrentes (REQ-QA-01).
 *
 * Criterios de Aceptación (SLAs):
 * 1. Tasa de errores HTTP 5xx: < 0.1%
 * 2. Latencia de catálogo (p95): < 150 ms
 * 3. Latencia de checkout (p95): < 600 ms
 *
 * Uso:
 *   k6 run scripts/load-test-k6.js
 *   k6 run --env BASE_URL=https://tu-dominio.vercel.app scripts/load-test-k6.js
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Métricas personalizadas para validar SLAs
export const errorRate5xx = new Rate('errors_5xx');
export const catalogLatency = new Trend('catalog_duration', true);
export const checkoutLatency = new Trend('checkout_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 250 },   // Rampa inicial: 0 a 250 VUs
    { duration: '1m', target: 1000 },    // Rampa a pico: 250 a 1,000 VUs en 1 minuto
    { duration: '30s', target: 1000 },   // Pico sostenido: 1,000 VUs
    { duration: '30s', target: 0 },      // Descenso controlado (Ramp-down)
  ],
  thresholds: {
    'errors_5xx': ['rate<0.001'],        // Error rate < 0.1%
    'catalog_duration': ['p(95)<150'],   // Catálogo p95 < 150ms
    'checkout_duration': ['p(95)<600'],  // Checkout p95 < 600ms
  },
};

export default function () {
  const rand = Math.random();

  // 1. Distribución 85%: Lectura de catálogo general e-commerce (GET /api/products)
  if (rand < 0.85) {
    const res = http.get(`${BASE_URL}/api/products`, {
      headers: { 'Accept': 'application/json' },
    });

    catalogLatency.add(res.timings.duration);
    errorRate5xx.add(res.status >= 500);

    check(res, {
      'Catálogo status 200': (r) => r.status === 200,
      'Catálogo latencia < 200ms': (r) => r.timings.duration < 200,
    });
  }
  // 2. Distribución 10%: Búsqueda / Filtros con query params
  else if (rand < 0.95) {
    const filters = ['inStock=true', 'fresh=true', 'gender=Caballero', 'gender=Dama'];
    const selectedFilter = filters[Math.floor(Math.random() * filters.length)];
    const res = http.get(`${BASE_URL}/api/products?${selectedFilter}`, {
      headers: { 'Accept': 'application/json' },
    });

    catalogLatency.add(res.timings.duration);
    errorRate5xx.add(res.status >= 500);

    check(res, {
      'Filtro status 200': (r) => r.status === 200,
    });
  }
  // 3. Distribución 5%: Creación de órdenes en Checkout (POST /api/ecommerce/orders)
  else {
    const payload = JSON.stringify({
      orderNumber: `TEST-VU-${__VU}-${Date.now().toString().slice(-4)}`,
      customerName: `Usuario Test VU ${__VU}`,
      customerEmail: `test_vu_${__VU}@aromaniak-loadtest.com`,
      customerPhone: '7777-8888',
      department: 'San Salvador',
      municipality: 'San Salvador Centro',
      shippingAddress: 'Colonia Escalón, Calle Principal #123',
      paymentMethod: 'CASH',
      items: [
        {
          productId: 'cmfa9m2o9000108jy526l2n9z', // ID de prueba o fallback
          productName: '1 Million Elixir H',
          presentation: '1 Onza',
          quantity: 1,
        },
      ],
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(`${BASE_URL}/api/ecommerce/orders`, payload, params);

    checkoutLatency.add(res.timings.duration);
    errorRate5xx.add(res.status >= 500);

    check(res, {
      'Checkout respuesta válida (200 o 409 stock)': (r) => r.status === 200 || r.status === 409 || r.status === 429,
      'Checkout sin errores de servidor (no 5xx)': (r) => r.status < 500,
    });
  }

  // Pausa realista entre acciones del usuario (500ms a 1.5s)
  sleep(Math.random() * 1.0 + 0.5);
}
