const fs = require('fs');
const path = 'src/app/api/kardex/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const prodRows = await tx\.\$queryRaw<any\[\]>`SELECT "stock", "stockHalf" FROM "Product" WHERE "id" = \$\{productId\} FOR UPDATE`;\s*if \(!prodRows \|\| prodRows\.length === 0\) \{\s*throw new Error\('Producto no encontrado'\);\s*\}\s*const currentDbStock = isHalf \? \(prodRows\[0\]\.stockHalf \|\| 0\) : \(prodRows\[0\]\.stock \|\| 0\);/g,
  `const currentProd = await tx.product.findUnique({ where: { id: productId } });
      if (!currentProd) {
        throw new Error('Producto no encontrado');
      }
      const currentDbStock = isHalf ? (currentProd.stockHalf || 0) : (currentProd.stock || 0);`
);

// Also let's force quantity to be an integer to avoid Prisma Float->Int cast errors
code = code.replace(/const \{ productId, type, quantity, /g, 'let { productId, type, quantity, ');
code = code.replace(/if \(!productId \|\| !type \|\| quantity === undefined \|\| previousStock === undefined \|\| newStock === undefined\) \{/g, `
    quantity = Math.round(Number(quantity));
    if (!productId || !type || quantity === undefined || isNaN(quantity) || previousStock === undefined || newStock === undefined) {`);

fs.writeFileSync(path, code);
