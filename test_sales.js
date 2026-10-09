const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const statuses = await prisma.sale.groupBy({
    by: ['paymentStatus'],
    _count: true
  });
  console.log("Payment statuses:", statuses);
}
run();
