const fs = require('fs');

function fixUseClient(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes("'use client';") && !code.startsWith("'use client';")) {
    code = code.replace(/'use client';\n/g, '');
    code = "'use client';\n" + code;
    fs.writeFileSync(file, code);
    console.log('Fixed use client in', file);
  }
}

fixUseClient('src/components/pos/ThermalTicket.tsx');
fixUseClient('src/components/pos/PosCorteZ.tsx');
fixUseClient('src/app/pos/page.tsx');
