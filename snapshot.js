const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({ select: { id: true, stock: true, stockHalf: true } });
  fs.writeFileSync('db_snapshot.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    products
  }, null, 2));
  console.log('Snapshot guardado en db_snapshot.json con timestamp:', new Date().toISOString());
  process.exit(0);
}
run();
