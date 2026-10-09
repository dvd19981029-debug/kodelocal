const fs = require('fs');

function replaceInFile(path, regex, replacement) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(regex, replacement);
  fs.writeFileSync(path, code);
}

// 1. Checkout page
replaceInFile(
  'src/app/checkout/page.tsx', 
  /src=\{it\.kitDetails\.essenceImageUrl[\s\S]*?\}/g, 
  `src={'/images/essence_bottle_blank.webp'}`
);

// 2. Blog page
replaceInFile(
  'src/app/blog/[slug]/page.tsx', 
  /`\/images\/esencias\/esencia_\$\{p\.sku \|\| p\.id\}\.webp\?v=aroma_official_v4`/g, 
  `'/images/essence_bottle_blank.webp'`
);

// 3. API products
replaceInFile(
  'src/app/api/products/route.ts',
  /`\/images\/esencias\/esencia_\$\{p\.sku \|\| p\.id\}\.webp\?v=aroma_official_v4`/g,
  `'/images/essence_bottle_blank.webp'`
);

// 4. Context
replaceInFile(
  'src/context/EcommerceCartContext.tsx',
  /`\/images\/esencias\/esencia_\$\{String\(essence\.sku\)\.trim\(\)\}\.webp\?v=aroma_official_v4`/g,
  `'/images/essence_bottle_blank.webp'`
);

