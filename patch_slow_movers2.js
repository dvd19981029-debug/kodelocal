const fs = require('fs');
const path = 'src/app/api/admin/abastecimiento/route.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(projectedStock < TARGET_DOS \* p\.adr\) \{\s*neededOz = \(TARGET_DOS \* p\.adr\) - projectedStock;\s*if \(neededOz < 0\) neededOz = 0;\s*\}/;
const replacement = `if (projectedStock < TARGET_DOS * p.adr) {
        neededOz = (TARGET_DOS * p.adr) - projectedStock;
        if (neededOz < 0) neededOz = 0;

        // Filtro de Baja Rotación: Si la necesidad es muy pequeña (< 5 onzas), 
        // no justificamos comprar 1 Kg entero porque el inventario se quedaría estancado por años.
        if (neededOz < 5) {
          neededOz = 0;
        }
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
