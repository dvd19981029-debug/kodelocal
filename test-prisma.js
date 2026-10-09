const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      where: {
        sale: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: 'COMPLETED'
        }
      }
    });
    console.log(recentSales);
  } catch (err) {
    console.error("PRISMA ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
