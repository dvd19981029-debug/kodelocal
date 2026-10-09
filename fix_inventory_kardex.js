const fs = require('fs');
const path = 'src/app/api/products/route.ts';
let code = fs.readFileSync(path, 'utf8');

const replaceTarget = `
    const updated = await prisma.product.update({
`;

const kardexCode = `
    const oldStock = existing.stock;
    const oldStockHalf = (existing as any).stockHalf ?? 0;
    
    const updated = await prisma.product.update({
`;

const afterUpdate = `
    const formattedUpdated = {
`;

const afterUpdateNew = `
    // Si hubo cambio de inventario manual, registrar en Kardex
    if (typeof stock === 'number' && stock !== oldStock) {
      await prisma.stockMovement.create({
        data: {
          productId: existing.id,
          type: 'ADJUSTMENT',
          quantity: Math.abs(stock - oldStock),
          previousStock: oldStock,
          newStock: stock,
          reference: 'Ajuste Manual',
          notes: \`Ajuste manual de inventario (1 Onza). Diferencia: \${stock - oldStock}\`,
          userName: 'Personal/Admin',
        }
      });
    }
    
    if (typeof stockHalf === 'number' && stockHalf !== oldStockHalf) {
      await prisma.stockMovement.create({
        data: {
          productId: existing.id,
          type: 'ADJUSTMENT',
          quantity: Math.abs(stockHalf - oldStockHalf),
          previousStock: oldStockHalf,
          newStock: stockHalf,
          reference: 'Ajuste Manual',
          notes: \`Ajuste manual de inventario (½ Onza). Diferencia: \${stockHalf - oldStockHalf}\`,
          userName: 'Personal/Admin',
        }
      });
    }

    const formattedUpdated = {
`;

if (code.includes(replaceTarget)) {
  code = code.replace(replaceTarget, kardexCode);
  code = code.replace(afterUpdate, afterUpdateNew);
  fs.writeFileSync(path, code);
  console.log("Fixed manual inventory Kardex bug");
}
