const fs = require('fs');
const path = 'src/lib/perfumeImages.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /\/\/ 2\. Para todas las esencias de perfume[\s\S]*?if \(!product\.category \|\| product\.category === 'Esencias para Perfume' \|\| product\.category === 'Arma tu propio perfume'\) \{[\s\S]*?return '\/images\/essence_bottle_blank\.webp';\s*\}/;

const replacement = `import { getInspiracionPerfumeName } from './perfumeNames';

  // 2. Para esencias: usar renderizado dinámico del frasco
  if (!product.category || product.category === 'Esencias para Perfume' || product.category === 'Arma tu propio perfume') {
    const inspiracion = getInspiracionPerfumeName(product);
    if (inspiracion) {
      return \`/api/bottle-image?name=\${encodeURIComponent(inspiracion)}\`;
    }
    return '/images/essence_bottle_blank.webp';
  }`;

// I need to be careful with imports. If I inject import inside a function it fails.
// Let's do it right.
