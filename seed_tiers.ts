import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.customerTier.upsert({
    where: { name: 'Gold' },
    update: { discountPct: 15, badgeColor: '#fbbf24' },
    create: { name: 'Gold', discountPct: 15, badgeColor: '#fbbf24' },
  });
  await prisma.customerTier.upsert({
    where: { name: 'Silver' },
    update: { discountPct: 20, badgeColor: '#94a3b8' },
    create: { name: 'Silver', discountPct: 20, badgeColor: '#94a3b8' },
  });
  await prisma.customerTier.upsert({
    where: { name: 'Diamond' },
    update: { discountPct: 25, badgeColor: '#60a5fa' },
    create: { name: 'Diamond', discountPct: 25, badgeColor: '#60a5fa' },
  });
  console.log('Tiers seeded');
}
main().catch(console.error).finally(() => prisma.$disconnect());
