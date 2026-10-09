const fs = require('fs');
const file = 'src/lib/auth.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/export function getActiveUser\(\): UserAccount \| null \{[\s\S]*?return INITIAL_USERS\[0\];\n\}/, `
export function getActiveUser(): UserAccount | null {
  if (typeof window === 'undefined') return INITIAL_USERS[0];
  
  // 1. Try to read from real session cookie
  const match = document.cookie.match(new RegExp('(^| )kode_session_ui=([^;]+)'));
  if (match) {
    try {
      const session = JSON.parse(decodeURIComponent(match[2]));
      return {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        isActive: true,
        createdAt: new Date().toISOString()
      };
    } catch(e) {}
  }
  
  // 2. Fallback to old localStorage
  const saved = localStorage.getItem('kodelocal_active_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  
  return INITIAL_USERS[0];
}
`);

fs.writeFileSync(file, code);
console.log('Patched getActiveUser');
