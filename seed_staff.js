const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = [
    { name: 'Luis G', email: 'luisg@forbiddensoluciones.com' },
    { name: 'Ventas', email: 'ventas@forbiddensoluciones.com' },
    { name: 'Luis Undae', email: 'luisundae@icloud.com' }
  ];

  console.log('Seeding admin users...');
  for (const admin of admins) {
    await prisma.staffUser.upsert({
      where: { email: admin.email },
      update: { role: 'ADMIN', isActive: true },
      create: {
        name: admin.name,
        email: admin.email,
        passwordHash: 'GOOGLE_OAUTH_ONLY',
        role: 'ADMIN',
        isActive: true
      }
    });
  }

  // Also seed a default cashier with a PIN so they don't get locked out of POS testing
  await prisma.staffUser.upsert({
    where: { email: 'cajero1@kodelocal.com' },
    update: { pin: '1234', role: 'CASHIER' },
    create: {
      name: 'Cajero 1',
      email: 'cajero1@kodelocal.com',
      passwordHash: 'PIN_LOGIN',
      pin: '1234',
      role: 'CASHIER',
      isActive: true
    }
  });

  console.log('Admin users seeded successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
