const fs = require('fs');
const path = 'src/app/api/sales/route.ts';
let code = fs.readFileSync(path, 'utf8');

const restockCode = `
    const isAlreadyCancelled = sale.orderStatus === 'CANCELLED' || sale.orderStatus === 'CANCELADO' || sale.orderStatus === 'ANULADA';
    const isCancelling = (orderStatus === 'CANCELLED' || orderStatus === 'CANCELADO' || orderStatus === 'ANULADA') && !isAlreadyCancelled;
    
    if (isCancelling && sale.items && sale.items.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const it of sale.items) {
          if (it.productId) {
            const qty = Math.max(1, it.quantity || 1);
            const presLower = String(it.presentation || '').toLowerCase();
            const isHalfRestore = presLower.includes('media') || presLower.includes('½');

            if (isHalfRestore) {
              await tx.$queryRaw\`
                UPDATE "Product"
                SET "stockHalf" = "stockHalf" + \${qty},
                    "updatedAt" = NOW()
                WHERE "id" = \${it.productId}
              \`;
            } else {
              await tx.$queryRaw\`
                UPDATE "Product"
                SET "stock" = "stock" + \${qty},
                    "updatedAt" = NOW()
                WHERE "id" = \${it.productId}
              \`;
            }

            // Registrar movimiento en Kardex
            await tx.stockMovement.create({
              data: {
                productId: it.productId,
                type: 'ADJUSTMENT',
                quantity: qty,
                previousStock: 0, // Not querying previous to save db hit
                newStock: 0,
                reference: \`Anulación Venta #\${sale.saleNumber}\`,
                notes: \`Restauración de inventario por cancelación de venta (\${isHalfRestore ? '½ Onza' : 'Normal'})\`,
                userName: 'Sistema (Anulación)',
              }
            });
          }
        }
      });
    }
`;

const replaceTarget = `
    const updated = await prisma.sale.update({
`;

if (code.includes(replaceTarget)) {
  code = code.replace(replaceTarget, restockCode + '\n' + replaceTarget);
  fs.writeFileSync(path, code);
  console.log("Fixed POS cancel stock bug");
}
