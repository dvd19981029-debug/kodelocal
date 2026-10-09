const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const sales = await prisma.sale.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });
  console.log("Latest sales:", sales.map(s => s.createdAt));
}
run();
