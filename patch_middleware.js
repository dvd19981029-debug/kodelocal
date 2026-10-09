const fs = require('fs');
const file = 'src/middleware.ts';
let code = fs.readFileSync(file, 'utf8');

// Insert at the top of the middleware function
const newCode = `
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;
  
  if (pathname === '/login') {
    return NextResponse.next();
  }
`;

code = code.replace(/const host = request.headers.get\('host'\) \|\| '';\n  const \{ pathname \} = request.nextUrl;/, newCode);
fs.writeFileSync(file, code);
console.log('Patched middleware');
