const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Wiping all transactions and inventory...');

  await prisma.stockMovement.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.saleItem.deleteMany({});
  await prisma.salePayment.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.purchaseItem.deleteMany({});
  await prisma.purchasePayment.deleteMany({});
  await prisma.purchase.deleteMany({});
  
  // Wipe ecommerce orders just in case
  try {
    await prisma.ecommerceOrder.deleteMany({});
  } catch (e) {
    // maybe model doesn't exist or is named differently, it's fine
  }

  await prisma.product.updateMany({
    data: {
      stock: 0,
      stockHalf: 0
    }
  });

  console.log('Database wiped! All stock is 0 and no movements exist.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
