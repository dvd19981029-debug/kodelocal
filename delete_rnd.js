const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const deleted = await prisma.product.deleteMany({
    where: {
      OR: [
        { sku: { contains: 'RND' } },
        { name: { contains: 'Aleatorio' } },
        { name: { contains: 'RND-LOOP' } }
      ]
    }
  });
  console.log("Deleted fake products:", deleted.count);
  process.exit(0);
}
run();
