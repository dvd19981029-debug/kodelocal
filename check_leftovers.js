const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const ts = new Date("2026-10-09T04:49:04.472Z");
  console.log("Checking records after", ts);

  const models = [
    'product', 'customer', 'sale', 'saleItem', 'salePayment', 'dteDocument', 
    'stockMovement', 'cashShift', 'cashMovement', 'supplier', 'purchase', 
    'purchaseItem', 'purchasePayment', 'customerCredit', 'creditPayment', 
    'customerAddress', 'ecommerceOrder', 'ecommerceOrderItem', 'shipment', 
    'productReview', 'productFormula', 'promotion', 'staffUser', 'auditLog', 
    'blogPost', 'wpMedia', 'mirandaInteraction', 'mirandaTask', 'mirandaDemand', 
    'mirandaBusinessMemory', 'mirandaPendingChange', 'dailyVisit'
  ];

  for (const m of models) {
    if (!prisma[m]) continue;
    try {
      const count = await prisma[m].count({
        where: { createdAt: { gte: ts } }
      });
      if (count > 0) {
        console.log(`Model ${m} has ${count} leftovers.`);
      }
    } catch (e) {
      // Some models might not have createdAt
    }
  }
}
run();
