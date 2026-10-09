const fs = require('fs');
const path = 'src/app/api/sales/route.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Ghost Sales Fix
const postValidationRegex = /const rawItems = Array\.isArray\(items\) \? items : \[\];/;
const validationFix = `
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Venta Fantasma Detectada: La orden no puede ser procesada sin artículos.' }, { status: 400 });
    }
    const rawItems = Array.isArray(items) ? items : [];`;
code = code.replace(postValidationRegex, validationFix);

// 2. Race Condition / Math fix for Sales Kardex
const raceRegex = /const updatedRows: Array<\{ stock: number \}> = await tx\.\$queryRaw`[\s\S]*?const previousStock = newStock \+ totalDeduct;/g;
const raceFix = `const updated = await tx.product.update({
              where: { id: prodId },
              data: { stock: { decrement: totalDeduct } }
            });
            const previousStock = updated.stock + totalDeduct;
            const newStock = updated.stock;`;

code = code.replace(raceRegex, raceFix);

// Same for stockHalf
const halfRegex = /const updatedRowsHalf: Array<\{ "stockHalf": number \}> = await tx\.\$queryRaw`[\s\S]*?const previousStockHalf = newStockHalf \+ totalDeduct;/g;
const halfFix = `const updated = await tx.product.update({
              where: { id: prodId },
              data: { stockHalf: { decrement: totalDeduct } }
            });
            const previousStockHalf = updated.stockHalf + totalDeduct;
            const newStockHalf = updated.stockHalf;`;

code = code.replace(halfRegex, halfFix);

fs.writeFileSync(path, code);
console.log("Sales route patched.");
