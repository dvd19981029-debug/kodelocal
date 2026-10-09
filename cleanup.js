const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function cleanup() {
  const snapshot = JSON.parse(fs.readFileSync('db_snapshot.json', 'utf8'));
  const testStartTime = new Date(snapshot.timestamp);
  
  console.log("Iniciando limpieza de registros creados después de:", testStartTime);

  // 1. Delete Sales & Related
  await prisma.saleItem.deleteMany({ where: { sale: { createdAt: { gte: testStartTime } } } });
  await prisma.salePayment.deleteMany({ where: { sale: { createdAt: { gte: testStartTime } } } });
  await prisma.dteDocument.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  const deletedSales = await prisma.sale.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  console.log(`Borradas ${deletedSales.count} ventas simuladas.`);

  // 2. Delete Purchases
  await prisma.purchaseItem.deleteMany({ where: { purchase: { createdAt: { gte: testStartTime } } } });
  const deletedPurchases = await prisma.purchase.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  console.log(`Borradas ${deletedPurchases.count} compras simuladas.`);

  // 3. Delete Stock Movements
  const deletedMovements = await prisma.stockMovement.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  console.log(`Borrados ${deletedMovements.count} movimientos de inventario.`);

  // 4. Delete Cash Shifts
  const deletedShifts = await prisma.cashShift.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  console.log(`Borrados ${deletedShifts.count} cortes de caja simulados.`);

  // 5. Restore Product Stocks
  let restored = 0;
  for (const p of snapshot.products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { stock: p.stock, stockHalf: p.stockHalf }
    });
    restored++;
  }
  console.log(`Restaurados stocks de ${restored} productos al estado original.`);
  
  console.log("Limpieza completada con éxito.");
  process.exit(0);
}
cleanup();
