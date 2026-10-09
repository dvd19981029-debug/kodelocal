const fs = require('fs');
const path = 'src/app/api/wompi/webhook/route.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /\/\/ Enviar correo de confirmación de pago[\s\S]*?if \(paidOrder\.customerEmail\) \{/;
const fix = `// ====== DEDUCCIÓN DE KARDEX (BUGFIX) ======
        if (paidOrder.items && paidOrder.items.length > 0) {
          const productIds = Array.from(new Set(paidOrder.items.map(it => it.productId).filter(Boolean)));
          
          if (productIds.length > 0) {
            const dbProducts = await prisma.product.findMany({
              where: { id: { in: productIds } }
            });
            const productMap = new Map(dbProducts.map(p => [p.id, p]));
            
            const stockDeltas = new Map();
            const halfDeltas = new Map();
            
            for (const it of paidOrder.items) {
              if (!it.productId) continue;
              const prod = productMap.get(it.productId);
              if (!prod) continue;

              const isHalfOz = String(it.presentation || '').includes('½') || String(it.presentation || '').toUpperCase().includes('MEDIA');
              
              if (isHalfOz) {
                halfDeltas.set(prod.id, (halfDeltas.get(prod.id) || 0) + Number(it.quantity || 0));
              } else {
                stockDeltas.set(prod.id, (stockDeltas.get(prod.id) || 0) + Number(it.quantity || 0));
              }
            }

            // Ejecutar descuentos en Prisma
            for (const [prodId, deduct] of stockDeltas.entries()) {
               await prisma.product.update({
                 where: { id: prodId },
                 data: { stock: { decrement: deduct } }
               });
               const p = await prisma.product.findUnique({ where: { id: prodId }});
               if (p) {
                 await prisma.stockMovement.create({
                   data: {
                     productId: prodId,
                     type: 'OUT_SALE',
                     quantity: deduct,
                     previousStock: p.stock + deduct,
                     newStock: p.stock,
                     reference: \`Web \${paidOrder.orderNumber}\`,
                     notes: \`Venta E-Commerce Webhook Wompi Tx: \${IdTransaccion}\`
                   }
                 });
               }
            }
            
            for (const [prodId, deduct] of halfDeltas.entries()) {
               await prisma.product.update({
                 where: { id: prodId },
                 data: { stockHalf: { decrement: deduct } }
               });
               const p = await prisma.product.findUnique({ where: { id: prodId }});
               if (p) {
                 await prisma.stockMovement.create({
                   data: {
                     productId: prodId,
                     type: 'OUT_SALE',
                     quantity: deduct,
                     previousStock: p.stockHalf + deduct,
                     newStock: p.stockHalf,
                     reference: \`Web \${paidOrder.orderNumber} (Media Onza)\`,
                     notes: \`Venta E-Commerce Webhook Wompi Tx: \${IdTransaccion}\`
                   }
                 });
               }
            }
          }
        }
        // ==========================================

        // Enviar correo de confirmación de pago
        if (paidOrder.customerEmail) {`;

code = code.replace(regex, fix);
fs.writeFileSync(path, code);
console.log("Wompi Webhook Stock Deduction patched.");
