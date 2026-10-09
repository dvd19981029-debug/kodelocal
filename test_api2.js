const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const DEFAULT_CATALOG = require('./src/app/api/admin/abastecimiento/route.ts');
  // Wait, DEFAULT_CATALOG is in the route.ts file but we can't require TS directly.
  
  // Let's just fetch products
  const products = await prisma.product.findMany({
    where: { category: 'Esencias para Perfume' },
    select: { id: true, sku: true, name: true, stock: true }
  });
  console.log("Products length:", products.length);
}
run();
