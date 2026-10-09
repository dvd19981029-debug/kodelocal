const fs = require('fs');
const path = 'src/app/api/purchases/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const addedQty = Number\(it\.quantity \|\| 0\);/g,
  `const addedQty = Math.round(Number(it.quantity || 0));`
);

fs.writeFileSync(path, code);
