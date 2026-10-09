const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('getActiveSessionUI')) return; // already patched

  // Add import
  if (code.includes("import { getStaffToken } from '@/lib/auth';")) {
     code = code.replace("import { getStaffToken } from '@/lib/auth';", "import { getStaffToken, getActiveSessionUI } from '@/lib/auth';");
  } else if (code.includes("import { getStaffToken }")) {
     code = code.replace("import { getStaffToken }", "import { getStaffToken, getActiveSessionUI }");
  } else if (code.includes("import { getActiveUser }")) {
     code = code.replace("import { getActiveUser }", "import { getActiveUser, getActiveSessionUI }");
  } else {
     code = "import { getActiveSessionUI } from '@/lib/auth';\n" + code;
  }

  // Replace hardcoded "Caja 1" with dynamic user where possible
  // Inside components, we can just call getActiveSessionUI().name
  
  if (file.includes('PosCorteZ')) {
    code = code.replace("useState('Caja 1');", "useState(getActiveSessionUI().name);");
  }
  
  if (file.includes('ThermalTicket')) {
    code = code.replace("Cajero: {currentTicket.cajero || 'Caja 1'}", "Cajero: {currentTicket.cajero || getActiveSessionUI().name}");
  }

  if (file.includes('pos/page.tsx')) {
    // POS has multiple hardcoded 'Caja 1' inside useEffects or callbacks.
    // Instead of parsing perfectly, let's just replace all 'Caja 1' strings in the file with getActiveSessionUI().name 
    // IF they are inside objects or arguments.
    code = code.replace(/'Caja 1'/g, "getActiveSessionUI().name");
  }

  fs.writeFileSync(file, code);
  console.log('Patched', file);
}

patchFile('src/app/pos/page.tsx');
patchFile('src/components/pos/ThermalTicket.tsx');
patchFile('src/components/pos/PosCorteZ.tsx');
