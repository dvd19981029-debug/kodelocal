const fs = require('fs');

const path = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("Radio\n} from 'lucide-react';", "Radio,\n  X\n} from 'lucide-react';");

fs.writeFileSync(path, code);
console.log('Fixed X import');
