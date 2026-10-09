const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    select: { name: true, sku: true },
    take: 20
  });
  console.log(products);
}
run();
