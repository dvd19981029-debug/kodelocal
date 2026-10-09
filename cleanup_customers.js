const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const snapshot = JSON.parse(fs.readFileSync('db_snapshot.json', 'utf8'));
  const testStartTime = new Date(snapshot.timestamp);
  
  const delCust = await prisma.customer.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  console.log("Deleted fake customers:", delCust.count);
  process.exit(0);
}
run();
