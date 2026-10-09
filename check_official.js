const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    select: { name: true, officialName: true },
    take: 10
  });
  console.log(JSON.stringify(products, null, 2));
}
run();
