const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConsistency() {
  console.log('--- AUDIT REPORT ---');
  let isConsistent = true;
  
  try {
    // 1. Check Sales Totals
    const sales = await prisma.sale.findMany({ include: { items: true } });
    for (const sale of sales) {
      let expectedTotal = Number(sale.subtotal) + Number(sale.ivaTotal) - Number(sale.discountTotal) + Number(sale.shippingCost);
      // Let's account for float inaccuracies
      if (Math.abs(expectedTotal - Number(sale.total)) > 0.05) {
        console.error(`ERROR: Sale ${sale.id} total mismatch. Expected ${expectedTotal}, got ${sale.total}`);
        isConsistent = false;
      }

      let itemsTotal = sale.items.reduce((acc, item) => acc + Number(item.total), 0);
      if (Math.abs(itemsTotal - Number(sale.subtotal)) > 0.05) {
        console.error(`ERROR: Sale ${sale.id} items total mismatch. Expected subtotal ${sale.subtotal}, got items total ${itemsTotal}`);
        isConsistent = false;
      }
    }
    
    // 2. Check Stock Levels and Kardex
    const products = await prisma.product.findMany({ include: { stockMovements: { orderBy: { createdAt: 'asc' } }, saleItems: true } });
    for (const product of products) {
      let calculatedStock = 0; 
      if (product.stockMovements.length > 0) {
        let currentStock = product.stockMovements[0].previousStock;
        for (const mov of product.stockMovements) {
          if (mov.previousStock !== currentStock) {
            console.error(`ERROR: Product ${product.id} movement ${mov.id} previous stock mismatch. Expected ${currentStock}, got ${mov.previousStock}`);
            isConsistent = false;
          }
          
          let delta = mov.quantity;
          if (['OUT_SALE', 'OUT_DAMAGE'].includes(mov.type)) {
            delta = -Math.abs(mov.quantity); // assume out movements reduce stock
          } else if (['IN_PURCHASE', 'RETURN'].includes(mov.type)) {
            delta = Math.abs(mov.quantity);
          } else if (mov.type === 'ADJUSTMENT') {
            delta = mov.quantity; // assume it carries the sign
          }
          
          let expectedNewStock = currentStock + delta;
          if (mov.newStock !== expectedNewStock) {
            console.error(`ERROR: Product ${product.id} movement ${mov.id} new stock mismatch. Expected ${expectedNewStock}, got ${mov.newStock} (delta: ${delta}, type: ${mov.type}, prev: ${currentStock})`);
            isConsistent = false;
          }
          currentStock = expectedNewStock;
        }
        
        if (currentStock !== product.stock) {
          console.error(`ERROR: Product ${product.id} final stock mismatch. Expected ${currentStock}, got ${product.stock}`);
          isConsistent = false;
        }
      }
      
      // 3. Check Sales Items match OUT_SALE stock movements
      const totalSaleItemsQty = product.saleItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalOutSaleQty = product.stockMovements.filter(m => m.type === 'OUT_SALE').reduce((acc, m) => acc + Math.abs(m.quantity), 0);
      
      if (totalSaleItemsQty !== totalOutSaleQty) {
        console.error(`ERROR: Product ${product.id} Sale items quantity (${totalSaleItemsQty}) does not match OUT_SALE movements quantity (${totalOutSaleQty})`);
        isConsistent = false;
      }
    }
    
    if (isConsistent) {
      console.log('SUCCESS: The database is mathematically consistent.');
    } else {
      console.log('FAILED: The database is mathematically inconsistent.');
    }
  } catch(e) {
    console.error('Exception during audit:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkConsistency();
