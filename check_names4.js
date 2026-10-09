const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    select: { name: true, sku: true }
  });
  console.log(products.filter(p => p.name.includes(' TIPO') || p.name.includes(' TYPE')).slice(0, 10));
}
run();
