const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'bodega@aromaniak';
  const role = 'BODEGA'; // Or something similar
  const existing = await prisma.staffUser.findUnique({ where: { email } });
  
  if (existing) {
    const updated = await prisma.staffUser.update({
      where: { email },
      data: {
        passwordHash: '1998',
        pin: '1998',
        role: 'BODEGA',
        isActive: true,
      }
    });
    console.log('Updated existing user:', updated);
  } else {
    const created = await prisma.staffUser.create({
      data: {
        name: 'Bodega Aromaniak',
        email,
        passwordHash: '1998',
        pin: '1998',
        role: 'BODEGA',
        cashRegister: 'Bodega 1',
        isActive: true,
      }
    });
    console.log('Created new user:', created);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
