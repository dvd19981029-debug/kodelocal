const fs = require('fs');
const path = 'src/app/api/admin/abastecimiento/route.ts';
let code = fs.readFileSync(path, 'utf8');

// Fix adr for dead products
const regexAdr = /let adr = 0\.1;\s*if \(v30 === 0 && v90 === 0\) \{\s*adr = 0\.05; \/\/ Casi muerto\s*\}/;
const replacementAdr = `let adr = 0;
      if (v30 === 0 && v90 === 0) {
        adr = 0; // Totalmente muerto
      }`;
code = code.replace(regexAdr, replacementAdr);

// Fix dos division by zero
const regexDos = /\} \/\/ mínimo 0\.1 onzas\/día para evitar división por 0\s*const dos = p\.stock \/ adr; \/\/ Days of supply/;
const replacementDos = `}
      const dos = adr > 0 ? p.stock / adr : 9999; // Days of supply`;
code = code.replace(regexDos, replacementDos);

fs.writeFileSync(path, code);
