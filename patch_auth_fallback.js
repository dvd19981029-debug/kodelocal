const fs = require('fs');
const file = 'src/lib/auth.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/return INITIAL_USERS\[0\];/g, "return null;");
fs.writeFileSync(file, code);
console.log('Fixed fallback');
