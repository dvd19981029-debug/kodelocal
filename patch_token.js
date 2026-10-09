const fs = require('fs');
const file = 'src/lib/customerAuthToken.ts';
let code = fs.readFileSync(file, 'utf8');

// Update createStaffInternalToken
code = code.replace(/export function createStaffInternalToken\(role: string = 'STAFF'\): string \{([\s\S]*?)exp: Date.now\(\) \+ 24 \* 60 \* 60 \* 1000,\s*\};/, `export function createStaffInternalToken(role: string = 'STAFF', email: string = 'admin@kodelocal.com', name: string = 'Administrador', id: string = 'system'): string {
  const secret = ensureAuthSecret();
  const payload = {
    id,
    name,
    email,
    role,
    scope: 'internal_operations',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };`);

// Update verifyStaffInternalToken to return the payload instead of boolean, or we can just add a new function decodeStaffToken
const decodeFunc = `
export function decodeStaffToken(token?: string | null): any | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, receivedSig] = parts;
  try {
    const secret = ensureAuthSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    if (expectedSig !== receivedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
`;
code += decodeFunc;

fs.writeFileSync(file, code);
console.log('Patched customerAuthToken.ts');
