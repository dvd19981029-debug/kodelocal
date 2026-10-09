const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const p = await prisma.product.findMany({ where: { officialName: { not: null } }, select: { name: true, officialName: true } });
  console.log(p);
}
run();
