const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentSales = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    where: {
      sale: {
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: 'COMPLETED'
      }
    }
  });
  console.log("Recent sales length:", recentSales.length);

  const historySales = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    where: {
      sale: {
        createdAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
        paymentStatus: 'COMPLETED'
      }
    }
  });
  console.log("History sales length:", historySales.length);
}
run();
