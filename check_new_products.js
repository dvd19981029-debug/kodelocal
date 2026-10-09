const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const snapshot = JSON.parse(fs.readFileSync('db_snapshot.json', 'utf8'));
  const testStartTime = new Date(snapshot.timestamp);
  
  const newProds = await prisma.product.findMany({ where: { createdAt: { gte: testStartTime } } });
  console.log("Any remaining new products?", newProds.map(p => p.sku));
  process.exit(0);
}
run();
