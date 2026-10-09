const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCashier() {
  const existing = await prisma.staffUser.findUnique({
    where: { email: 'mar@aromaniak' }
  });

  if (existing) {
    await prisma.staffUser.update({
      where: { email: 'mar@aromaniak' },
      data: {
        name: 'Erika Melgar',
        passwordHash: '2004',
        pin: '2004',
        role: 'CASHIER',
        cashRegister: 'Caja 1',
        isActive: true
      }
    });
    console.log('Updated existing cashier Erika');
  } else {
    await prisma.staffUser.create({
      data: {
        name: 'Erika Melgar',
        email: 'mar@aromaniak',
        passwordHash: '2004',
        pin: '2004',
        role: 'CASHIER',
        cashRegister: 'Caja 1',
        isActive: true
      }
    });
    console.log('Created new cashier Erika');
  }
}

addCashier()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
