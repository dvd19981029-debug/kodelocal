const fs = require('fs');
const path = 'src/app/api/admin/abastecimiento/route.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(projectedStock < TARGET_DOS \* adr\) \{\s*let neededOz = \(TARGET_DOS \* adr\) - projectedStock;\s*if \(neededOz < 0\) neededOz = 0;/;
const replacement = `if (projectedStock < TARGET_DOS * adr) {
      let neededOz = (TARGET_DOS * adr) - projectedStock;
      if (neededOz < 0) neededOz = 0;

      // Filtro de Baja Rotación: Si la necesidad es muy pequeña (< 4 onzas), 
      // no justificamos comprar 1 Kg entero porque se quedaría estancado por años.
      if (neededOz < 4) {
        neededOz = 0;
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
