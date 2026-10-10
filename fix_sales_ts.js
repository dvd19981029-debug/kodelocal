const fs = require('fs');
const path = 'src/app/api/sales/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/String\(it\.presentation \|\| ''\)\.toLowerCase\(\)\.includes\('media'\) \|\| String\(it\.presentation \|\| ''\)\.toLowerCase\(\)\.includes\('½'\)/g, "String(it.unit || '').toLowerCase().includes('media') || String(it.unit || '').toLowerCase().includes('½')");

fs.writeFileSync(path, code);
console.log('Fixed TS errors in sales API');
