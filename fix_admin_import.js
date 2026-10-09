const fs = require('fs');
const path = 'src/app/admin/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("import AbastecimientoInteligentePage from './abastecimiento/page';", "import { AbastecimientoModule } from '../components/admin/AbastecimientoModule';");
code = code.replace("<AbastecimientoInteligentePage />", "<AbastecimientoModule />");

fs.writeFileSync(path, code);
