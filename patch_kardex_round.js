const fs = require('fs');
const path = 'src/app/api/kardex/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /previousStock: currentDbStock,/g,
  `previousStock: Math.round(currentDbStock),`
);

code = code.replace(
  /newStock: calculatedNewStock,/g,
  `newStock: Math.round(calculatedNewStock),`
);

code = code.replace(
  /data: isHalf \? \{ stockHalf: calculatedNewStock \} : \{ stock: calculatedNewStock \}/g,
  `data: isHalf ? { stockHalf: Math.round(calculatedNewStock) } : { stock: Math.round(calculatedNewStock) }`
);

fs.writeFileSync(path, code);
