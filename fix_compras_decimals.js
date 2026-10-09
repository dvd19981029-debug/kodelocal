const fs = require('fs');
const path = 'src/components/admin/ComprasModule.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /\$\{prod\.cost\.toFixed\(2\)\}/g,
  `\${Number(prod.cost || 0).toFixed(2)}`
);

fs.writeFileSync(path, code);
