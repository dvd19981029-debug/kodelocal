const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: { sku: { startsWith: 'ESE-' } },
    select: { name: true, sku: true },
    take: 10
  });
  console.log(products);
}
run();
