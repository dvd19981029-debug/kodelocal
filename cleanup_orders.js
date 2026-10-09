const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const snapshot = JSON.parse(fs.readFileSync('db_snapshot.json', 'utf8'));
  const testStartTime = new Date(snapshot.timestamp);
  
  await prisma.ecommerceOrderItem.deleteMany({ where: { order: { createdAt: { gte: testStartTime } } } });
  const delOrders = await prisma.ecommerceOrder.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  console.log("Deleted fake ecommerce orders:", delOrders.count);
  process.exit(0);
}
run();
