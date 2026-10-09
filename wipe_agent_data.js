const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const ts = new Date("2026-10-09T04:49:04.472Z");
  console.log("Wiping records after", ts);

  // 1. Purchases
  await prisma.purchaseItem.deleteMany({ where: { purchase: { createdAt: { gte: ts } } } });
  await prisma.purchasePayment.deleteMany({ where: { purchase: { createdAt: { gte: ts } } } });
  const pDeleted = await prisma.purchase.deleteMany({ where: { createdAt: { gte: ts } } });
  console.log("Deleted Purchases:", pDeleted.count);

  // 2. Sales
  await prisma.saleItem.deleteMany({ where: { sale: { createdAt: { gte: ts } } } });
  await prisma.salePayment.deleteMany({ where: { sale: { createdAt: { gte: ts } } } });
  await prisma.dteDocument.deleteMany({ where: { createdAt: { gte: ts } } }); // DTEs are related to sales sometimes
  const sDeleted = await prisma.sale.deleteMany({ where: { createdAt: { gte: ts } } });
  console.log("Deleted Sales:", sDeleted.count);

  // 3. Stock Movements (Kardex)
  const smDeleted = await prisma.stockMovement.deleteMany({ where: { createdAt: { gte: ts } } });
  console.log("Deleted Stock Movements:", smDeleted.count);

  // 4. Products (just in case there are any leftover #RND products)
  await prisma.product.deleteMany({ where: { sku: { startsWith: '#RND' } } });

  // 5. Restore product stock exactly as it was in the snapshot
  const fs = require('fs');
  if (fs.existsSync('db_snapshot.json')) {
    const snapshot = JSON.parse(fs.readFileSync('db_snapshot.json', 'utf8'));
    let restored = 0;
    for (const p of snapshot.products) {
      await prisma.product.update({
        where: { id: p.id },
        data: { stock: p.stock, stockHalf: p.stockHalf }
      });
      restored++;
    }
    console.log(`Restored stocks of ${restored} products.`);
  }

}
run().then(() => console.log("Done")).catch(console.error);
