const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.staffUser.findMany();
  console.log("Current Users in DB:", users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  
  // Keep only the 3 admins
  const adminsToKeep = [
    'luisg@forbiddensoluciones.com',
    'ventas@forbiddensoluciones.com',
    'luisundae@icloud.com'
  ];
  
  for (const u of users) {
    if (!adminsToKeep.includes(u.email)) {
      console.log('Deleting mock user:', u.email);
      await prisma.staffUser.delete({ where: { id: u.id } });
    }
  }
  
  const remaining = await prisma.staffUser.findMany();
  console.log("Remaining Users in DB:", remaining.map(u => ({ id: u.id, email: u.email, role: u.role })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
