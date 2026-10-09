const fs = require('fs');
const path = 'src/lib/perfumeImages.ts';
let code = fs.readFileSync(path, 'utf8');

// Add import
const importRegex = /import \{ ProductItem \} from '\.\/store';/;
const importReplacement = `import { ProductItem } from './store';\nimport { getInspiracionPerfumeName } from './perfumeNames';`;
code = code.replace(importRegex, importReplacement);

// Replace the essence block
const targetRegex = /\/\/ 2\. Para todas las esencias de perfume[\s\S]*?return '\/images\/essence_bottle_blank\.webp';\s*\}/;
const targetReplacement = `// 2. Para esencias: usar el generador dinámico de imágenes del servidor
  if (!product.category || product.category === 'Esencias para Perfume' || product.category === 'Arma tu propio perfume') {
    const inspiracion = getInspiracionPerfumeName(product);
    if (inspiracion) {
      return \`/api/bottle-image?name=\${encodeURIComponent(inspiracion)}\`;
    }
    return '/images/essence_bottle_blank.webp';
  }`;

code = code.replace(targetRegex, targetReplacement);
fs.writeFileSync(path, code);
