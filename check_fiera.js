const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const p = await prisma.product.findFirst({ where: { name: { contains: "Fiera" } } });
  console.log(p);
}
run();
