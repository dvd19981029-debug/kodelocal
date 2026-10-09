const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: { category: 'Esencias para Perfume' },
    select: { name: true, stock: true }
  });
  console.log(products.filter(p => p.stock > 0).length, "products have stock > 0");
  console.log(products.filter(p => p.stock === 0).length, "products have stock === 0");
}
run();
