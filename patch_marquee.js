const fs = require('fs');
const path = 'src/app/mejor-proveedor-esencias-el-salvador/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/import LandingCatalogReveal from '@\/components\/ecommerce\/LandingCatalogReveal';/, "import LandingMarquee from '@/components/ecommerce/LandingMarquee';");
code = code.replace(/<LandingCatalogReveal \/>/, "<LandingMarquee />");

fs.writeFileSync(path, code);
