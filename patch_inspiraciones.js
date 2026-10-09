const fs = require('fs');

const pathPage = 'src/app/mejor-proveedor-esencias-el-salvador/page.tsx';
let codePage = fs.readFileSync(pathPage, 'utf8');
codePage = codePage.replace(/contratipos/g, 'inspiraciones');
codePage = codePage.replace(/Contratipos/g, 'Inspiraciones');
codePage = codePage.replace(/contratipo/g, 'inspiración');
codePage = codePage.replace(/Contratipo/g, 'Inspiración');
fs.writeFileSync(pathPage, codePage);

const pathMarquee = 'src/components/ecommerce/LandingMarquee.tsx';
let codeMarquee = fs.readFileSync(pathMarquee, 'utf8');
codeMarquee = codeMarquee.replace(/Contratipos de Diseñador/g, 'Inspiraciones de Diseñador');
fs.writeFileSync(pathMarquee, codeMarquee);

