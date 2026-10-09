const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /disabled=\{!file \|\| catalogData\.length === 0\}/;
const replacement = `// Eliminado: disabled para que puedan avanzar sin archivo`;
code = code.replace(regex, replacement);

fs.writeFileSync(path, code);
