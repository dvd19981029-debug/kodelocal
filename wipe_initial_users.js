const fs = require('fs');
const file = 'src/lib/auth.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/export const INITIAL_USERS: UserAccount\[\] = \[[\s\S]*?\];/g, 'export const INITIAL_USERS: UserAccount[] = [];');
fs.writeFileSync(file, code);
console.log('Wiped INITIAL_USERS');
