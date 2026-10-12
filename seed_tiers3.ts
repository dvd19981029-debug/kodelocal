import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.customerTier.update({
    where: { id: 'tier_bronze' },
    data: { discountPct: 3 }
  });
  await prisma.customerTier.update({
    where: { id: 'tier_silver' },
    data: { discountPct: 7 }
  });
  await prisma.customerTier.update({
    where: { id: 'tier_gold' },
    data: { discountPct: 10 }
  });
  console.log('Tiers updated to 3%, 7%, and 10%.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
