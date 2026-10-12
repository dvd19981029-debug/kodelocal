import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.customerTier.deleteMany({});
  
  await prisma.customerTier.createMany({
    data: [
      { id: 'tier_bronze', name: 'Bronze', discountPct: 5, badgeColor: '#b08d57' },
      { id: 'tier_silver', name: 'Silver', discountPct: 10, badgeColor: '#c0c0c0' },
      { id: 'tier_gold', name: 'Gold', discountPct: 15, badgeColor: '#ffd700' },
      { id: 'tier_custom', name: 'Personalizado', discountPct: 0, badgeColor: '#6366f1' },
    ]
  });
  console.log('Tiers updated.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
