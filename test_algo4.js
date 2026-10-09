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
    where: { sale: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'COMPLETED' } }
  });
  
  const historySales = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    where: { sale: { createdAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo }, paymentStatus: 'COMPLETED' } }
  });
  
  const recentMap = {};
  for (const s of recentSales) { if (s.productId) recentMap[s.productId] = Number(s._sum.quantity || 0); }
  const historyMap = {};
  for (const s of historySales) { if (s.productId) historyMap[s.productId] = Number(s._sum.quantity || 0); }

  const products = await prisma.product.findMany({
    select: { id: true, name: true, stock: true }
  });

  const OZ_PER_KG = 33.814;
  const TARGET_DOS = 60;
  const LEAD_TIME = 14;

  let totalKg = 0;
  
  for(let p of products) {
    const v30 = (recentMap[p.id] || 0) / 30;
    const v90 = (historyMap[p.id] || 0) / 60;
    
    let adr = 0;
    if (v30 === 0 && v90 === 0) { adr = 0; }
    else if (v30 > v90) { adr = v30; }
    else if (v30 < v90) {
      if (p.stock < 10) adr = v90;
      else adr = (v30 * 0.7) + (v90 * 0.3);
    } else { adr = v30; }

    if (adr === 0) continue; 

    const projectedStock = p.stock - (adr * LEAD_TIME);
    if (projectedStock < TARGET_DOS * adr) {
      let neededOz = (TARGET_DOS * adr) - projectedStock;
      if (neededOz < 0) neededOz = 0;
      if (neededOz < 5) neededOz = 0;
      
      const neededKg = Math.ceil(neededOz / OZ_PER_KG);
      if (neededKg > 0) {
        console.log(`${p.name} - Stock: ${p.stock}oz - ADR: ${adr.toFixed(2)} - NeedOz: ${neededOz.toFixed(2)} - Sugiere: ${neededKg} Kg`);
        totalKg += neededKg;
      }
    }
  }
  console.log("TOTAL KGS TO ORDER:", totalKg);
}
run();
