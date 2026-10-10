const fs = require('fs');
const path = 'src/app/api/sales/route.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. PATCH: include items in findFirst
const oldPatchFind = `    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(saleNumber ? [{ saleNumber }] : []),
        ],
      },
    });`;

const newPatchFind = `    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(saleNumber ? [{ saleNumber }] : []),
        ],
      },
      include: { items: true } // NECESARIO PARA RESTAURAR INVENTARIO Y FACTURAR
    });`;

code = code.replace(oldPatchFind, newPatchFind);

// 2. POST: Deduct only if COMPLETED
const oldPostDeduct = `// 3. Descontar existencias y asentar Kardex en lote (OUT_SALE)
      if (resolvedItems.length > 0) {`;

const newPostDeduct = `// 3. Descontar existencias y asentar Kardex en lote (OUT_SALE) SOLO SI YA ESTÁ FACTURADO/PAGADO
      const isCompletingSale = paymentStatus === 'COMPLETED' || orderStatus === 'COMPLETED';
      if (isCompletingSale && resolvedItems.length > 0) {`;

code = code.replace(oldPostDeduct, newPostDeduct);

// 3. PATCH: Deduct if transitioning to COMPLETED
const oldPatchCancel = `const isAlreadyCancelled = sale.orderStatus === 'CANCELLED' || sale.orderStatus === 'CANCELADO' || sale.orderStatus === 'ANULADA';
    const isCancelling = (orderStatus === 'CANCELLED' || orderStatus === 'CANCELADO' || orderStatus === 'ANULADA') && !isAlreadyCancelled;
    
    if (isCancelling && sale.items && sale.items.length > 0) {`;

const newPatchCancel = `const isAlreadyCancelled = sale.orderStatus === 'CANCELLED' || sale.orderStatus === 'CANCELADO' || sale.orderStatus === 'ANULADA';
    const isCancelling = (orderStatus === 'CANCELLED' || orderStatus === 'CANCELADO' || orderStatus === 'ANULADA') && !isAlreadyCancelled;
    
    const isAlreadyCompleted = sale.paymentStatus === 'COMPLETED' || sale.orderStatus === 'COMPLETED';
    const isCompletingNow = !isAlreadyCompleted && (paymentStatus === 'COMPLETED' || orderStatus === 'COMPLETED') && !isCancelling;

    // Si está transicionando a completado (ej. cobrando una comanda que estaba pendiente)
    if (isCompletingNow && sale.items && sale.items.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Descontar inventario aquí
        const productIds = Array.from(new Set(sale.items.map((it) => it.productId).filter(Boolean))) as string[];
        if (productIds.length > 0) {
          const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });
          const productMap = new Map(dbProducts.map((p) => [p.id, p]));
          const stockDeltas = new Map<string, number>();
          const halfDeltas = new Map<string, number>();

          for (const it of sale.items) {
            if (!it.productId) continue;
            const prod = productMap.get(it.productId);
            if (!prod) continue;

            const isHalfOz = String(it.presentation || '').toLowerCase().includes('media') || String(it.presentation || '').toLowerCase().includes('½');
            const qty = Math.max(1, Number(it.quantity || 1));

            if (isHalfOz) {
              halfDeltas.set(prod.id, (halfDeltas.get(prod.id) || 0) + qty);
            } else {
              stockDeltas.set(prod.id, (stockDeltas.get(prod.id) || 0) + qty);
            }
          }

          // Deducir normales
          for (const [prodId, totalDeduct] of stockDeltas.entries()) {
            const prod = productMap.get(prodId);
            if (!prod) continue;
            const updated = await tx.product.update({
              where: { id: prodId },
              data: { stock: { decrement: totalDeduct } }
            });
            await tx.stockMovement.create({
              data: {
                productId: prodId,
                type: 'OUT_SALE',
                quantity: totalDeduct,
                previousStock: updated.stock + totalDeduct,
                newStock: updated.stock,
                reference: \`Cobro Comanda #\${sale.saleNumber}\`,
                notes: 'Descuento de inventario post-facturación',
                userName: 'Sistema (Caja)',
              }
            });
          }

          // Deducir medias
          for (const [prodId, totalHalf] of halfDeltas.entries()) {
            const updatedRows: Array<{ stockHalf: number }> = await tx.$queryRaw\`
              UPDATE "Product"
              SET "stockHalf" = GREATEST(0, "stockHalf" - \${totalHalf}),
                  "updatedAt" = NOW()
              WHERE "id" = \${prodId}
              RETURNING "stockHalf"
            \`;
            if (updatedRows && updatedRows.length > 0) {
              await tx.stockMovement.create({
                data: {
                  productId: prodId,
                  type: 'OUT_SALE',
                  quantity: totalHalf,
                  previousStock: updatedRows[0].stockHalf + totalHalf,
                  newStock: updatedRows[0].stockHalf,
                  reference: \`Cobro Comanda #\${sale.saleNumber}\`,
                  notes: '½ Onza - Descuento de inventario post-facturación',
                  userName: 'Sistema (Caja)',
                }
              });
            }
          }
        }
      });
    }
    
    // Si se está CANCELANDO, y YA estaba COMPLETADO, devolver el stock.
    // Si NO estaba completado, NO descontamos nada, por lo que NO hay que devolver nada.
    if (isCancelling && isAlreadyCompleted && sale.items && sale.items.length > 0) {`;

code = code.replace(oldPatchCancel, newPatchCancel);

fs.writeFileSync(path, code);
console.log('Patched', path);
