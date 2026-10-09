const fs = require('fs');
const path = 'src/app/api/admin/abastecimiento/route.ts';
let code = fs.readFileSync(path, 'utf8');

const defaultCatalog = fs.readFileSync('default_catalog.json', 'utf8');

const regex = /const \{ budget, catalog \} = body;/;
const replacement = `const { budget, catalog } = body;
    
    // Si no se proporcionó catálogo (o es un arreglo vacío), usar el catálogo por defecto
    const DEFAULT_CATALOG = ${defaultCatalog};
    const effectiveCatalog = (Array.isArray(catalog) && catalog.length > 0) ? catalog : DEFAULT_CATALOG;
`;

code = code.replace(regex, replacement);

const regex2 = /if \(!budget \|\| !catalog \|\| !Array\.isArray\(catalog\)\) \{/;
const replacement2 = `if (!budget) {`;

code = code.replace(regex2, replacement2);

const regex3 = /const supplierItem = catalog\.find/g;
const replacement3 = `const supplierItem = effectiveCatalog.find`;

code = code.replace(regex3, replacement3);

fs.writeFileSync(path, code);
