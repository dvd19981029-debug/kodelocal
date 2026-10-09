const fs = require('fs');
const path = 'src/components/admin/KardexModule.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /\$\{selectedProductObj\.cost\.toFixed\(2\)\}/g,
  `\${Number(selectedProductObj.cost || 0).toFixed(2)}`
);

code = code.replace(
  /\$\{selectedProductObj\.price\.toFixed\(2\)\}/g,
  `\${Number(selectedProductObj.price || 0).toFixed(2)}`
);

fs.writeFileSync(path, code);
