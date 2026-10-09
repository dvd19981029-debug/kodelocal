const fs = require('fs');

const path = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldCheck = `{'Notification' in window && typeof Notification.permission === 'string' && Notification.permission !== 'granted' && (`;
const newCheck = `{typeof window !== 'undefined' && 'Notification' in window && typeof Notification.permission === 'string' && Notification.permission !== 'granted' && (`;

code = code.replace(oldCheck, newCheck);

fs.writeFileSync(path, code);
console.log('Patched SSR window check');
