const fs = require('fs');
const path = 'src/app/api/sales/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("const presLower = String(it.presentation || '').toLowerCase();", "const presLower = String(it.unit || '').toLowerCase();");

fs.writeFileSync(path, code);
console.log('Fixed TS errors 2 in sales API');
