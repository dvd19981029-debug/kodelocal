const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    select: { name: true, sku: true }
  });
  console.log(products.map(p => p.name).slice(30, 50));
}
run();
