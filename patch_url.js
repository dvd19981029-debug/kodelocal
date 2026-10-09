const fs = require('fs');
const path = 'src/app/api/bottle-image/route.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /const baseUrl = process\.env\.NEXT_PUBLIC_APP_URL[\s\S]*?;/;
const replacement = `const { protocol, host } = new URL(request.url);
  const baseUrl = \`\${protocol}//\${host}\`;`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
