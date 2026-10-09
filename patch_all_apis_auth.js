const fs = require('fs');

const authLogic = `
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieHeader = request.headers.get('cookie') || '';
    const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
    const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

    let isStaff = verifyStaffInternalToken(staffHeaderToken) || 
                  verifyStaffInternalToken(bearerToken) || 
                  verifyStaffInternalToken(staffCookieToken);

    if (!isStaff) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Se requiere autenticacion de administrador.' }, { status: 401 });
    }
`;

function patchApi(file, hasImport) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  if (!hasImport) {
    code = code.replace(/import \{ NextResponse \} from 'next\/server';/, "import { NextResponse } from 'next/server';\nimport { verifyStaffInternalToken } from '@/lib/customerAuthToken';");
  }

  // Find export async function GET
  if (code.includes('export async function GET(request: Request)') || code.includes('export async function GET()')) {
    code = code.replace(/export async function GET\([^)]*\) \{\n\s*try \{/, "export async function GET(request: Request) {\n  try {" + authLogic);
  }

  // Find export async function POST
  if (code.includes('export async function POST(request: Request)')) {
    code = code.replace(/export async function POST\(request: Request\) \{\n\s*try \{/, "export async function POST(request: Request) {\n  try {" + authLogic);
  }

  fs.writeFileSync(file, code);
  console.log('Secured ' + file);
}

patchApi('src/app/api/sales/route.ts', false);
patchApi('src/app/api/purchases/route.ts', false);
patchApi('src/app/api/suppliers/route.ts', false);
patchApi('src/app/api/shifts/route.ts', false);
