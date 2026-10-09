const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const WOMPI_API_SECRET = process.env.WOMPI_API_SECRET || "5376bdd2-4d1a-4146-983c-7b4012728a55"; // from .env

async function main() {
  console.log("Simulating 15 Ecommerce Orders...");

  const products = await prisma.product.findMany({ take: 10 });
  if (!products || products.length === 0) {
    console.error("No products found to create orders.");
    return;
  }

  for (let i = 1; i <= 15; i++) {
    const orderNumber = `ORD-${Date.now()}-${i}`;
    const product = products[Math.floor(Math.random() * products.length)];
    const price = product.price || 15.00;

    const order = await prisma.ecommerceOrder.create({
      data: {
        orderNumber,
        customerName: `Customer Simulation ${i}`,
        customerEmail: `customer${i}@example.com`,
        customerPhone: `7000000${i.toString().padStart(2, '0')}`,
        department: "San Salvador",
        municipality: "San Salvador",
        shippingAddress: `Test Address ${i}`,
        subtotal: price,
        shippingCost: 3.50,
        total: Number(price) + 3.50,
        paymentMethod: "CARD",
        paymentStatus: "PENDING",
        orderStatus: "NUEVO",
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              presentation: "50ml",
              unitPrice: price,
              quantity: 1,
              total: price,
            }
          ]
        }
      }
    });

    console.log(`Created order ${order.orderNumber}`);

    // Simulate Wompi webhook
    const payload = {
      IdTransaccion: `TXN-${Date.now()}-${i}`,
      ResultadoTransaccion: "ExitosaAprobada",
      CodigoAutorizacion: `AUTH-${i}`,
      Monto: Number(price) + 3.50,
      EnlacePago: {
        IdentificadorEnlaceComercio: orderNumber,
        IdEnlace: 1000 + i
      },
      EsProductiva: true
    };

    const rawBody = JSON.stringify(payload);
    
    // Generate Hash
    const hmac = crypto.createHmac('sha256', WOMPI_API_SECRET);
    hmac.update(rawBody, 'utf8');
    const hash = hmac.digest('hex');

    const webhookUrl = "http://localhost:3000/api/wompi/webhook";
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'wompi_hash': hash
      },
      body: rawBody
    });

    const resJson = await res.json();
    console.log(`Webhook response for ${orderNumber}:`, resJson);
  }

  console.log("Finished simulation!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
