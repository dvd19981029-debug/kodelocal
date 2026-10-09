const fs = require('fs');
const file = 'src/lib/auth.ts';
let code = fs.readFileSync(file, 'utf8');

const hookCode = `
export function getActiveSessionUI() {
  if (typeof document === 'undefined') return { name: 'Caja 1', role: 'CASHIER' };
  const match = document.cookie.match(new RegExp('(^| )kode_session_ui=([^;]+)'));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch(e) {}
  }
  // Fallback to old local storage if cookie is missing (shouldn't happen with new APIs)
  const saved = localStorage.getItem('kodelocal_active_user');
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return { name: 'Caja 1', role: 'CASHIER' };
}
`;

code += hookCode;
fs.writeFileSync(file, code);
console.log('Added getActiveSessionUI hook');
