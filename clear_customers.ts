import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCustomers() {
  try {
    console.log('Unlinking customers from sales...');
    await prisma.sale.updateMany({
      where: { customerId: { not: null } },
      data: { customerId: null }
    });

    console.log('Unlinking customers from ecommerce orders...');
    await prisma.ecommerceOrder.updateMany({
      where: { customerId: { not: null } },
      data: { customerId: null }
    });

    console.log('Deleting customer addresses...');
    await prisma.customerAddress.deleteMany({});

    console.log('Deleting customer credits...');
    await prisma.customerCredit.deleteMany({});

    console.log('Deleting product reviews...');
    await prisma.productReview.deleteMany({});

    console.log('Deleting customers...');
    const result = await prisma.customer.deleteMany({});
    console.log(`Deleted ${result.count} customers.`);
    
  } catch (error) {
    console.error('Error clearing customers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCustomers();
