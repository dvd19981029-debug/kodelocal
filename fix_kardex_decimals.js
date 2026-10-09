const fs = require('fs');
const path = 'src/components/admin/KardexModule.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const val = m\.costPrice \|\| m\.unitPrice \|\| 0;/g,
  `const val = Number(m.costPrice || m.unitPrice || 0);`
);

code = code.replace(
  /const val = mov\.costPrice \|\| mov\.unitPrice \|\| 0;/g,
  `const val = Number(mov.costPrice || mov.unitPrice || 0);`
);

fs.writeFileSync(path, code);
console.log("Fixed KardexModule Decimal string parsing crashes");
