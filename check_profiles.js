const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    where: { categoryId: "cm10o4x12000213q1n9o8o0v1" }, // from db_snapshot, this is Esencias para Perfume
    select: { name: true, fragranceProfile: { select: { inspiredBy: true } } },
    take: 10
  });
  console.log(JSON.stringify(products, null, 2));
}
run();
