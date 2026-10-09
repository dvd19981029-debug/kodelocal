const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: { category: 'Esencias para Perfume' },
    select: { name: true, slug: true },
    take: 10
  });
  console.log(products);
}
run();
