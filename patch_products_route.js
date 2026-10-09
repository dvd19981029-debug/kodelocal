const fs = require('fs');
const path = 'src/app/api/products/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const \{ id, sku, stock, stockHalf, isAvailableOnline/g,
  `let { id, sku, stock, stockHalf, isAvailableOnline`
);

code = code.replace(
  /if \(!id && !sku\) \{/g,
  `
    if (typeof stock === 'number') stock = Math.round(stock);
    if (typeof stockHalf === 'number') stockHalf = Math.round(stockHalf);
    if (!id && !sku) {`
);

fs.writeFileSync(path, code);
