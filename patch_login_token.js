const fs = require('fs');
const file = 'src/app/api/kode/auth/login/route.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('createStaffInternalToken')) {
  code = code.replace(/import \{ queryKode \} from '@\/lib\/kodeDb';/, "import { queryKode } from '@/lib/kodeDb';\nimport { createStaffInternalToken } from '@/lib/customerAuthToken';");
  
  // Set the cryptographically secure token cookie
  code = code.replace(
    /response\.cookies\.set\('kode_session'/g,
    "const safeToken = createStaffInternalToken(adminData ? adminData.rol : (userData?.rol || 'STAFF'));\n      response.cookies.set('kodelocal_staff_token', safeToken, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 });\n      response.cookies.set('kode_session'"
  );
  
  fs.writeFileSync(file, code);
  console.log('Patched login to issue staff tokens');
}
