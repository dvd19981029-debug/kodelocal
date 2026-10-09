const fs = require('fs');

function replaceInFile(path, regex, replacement) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(regex, replacement);
  fs.writeFileSync(path, code);
}

// In CartDrawer.tsx, we replaced it with:
// src={item.kitDetails.essenceImageUrl || '/images/essence_bottle_blank.webp'}
replaceInFile(
  'src/components/ecommerce/CartDrawer.tsx',
  /src=\{item\.kitDetails\.essenceImageUrl \|\| '\/images\/essence_bottle_blank\.webp'\}/g,
  `src={'/images/essence_bottle_blank.webp'}`
);

// In Checkout page:
replaceInFile(
  'src/app/checkout/page.tsx',
  /src=\{'\/images\/essence_bottle_blank\.webp'\}/g, // It already was replaced
  `src={'/images/essence_bottle_blank.webp'}`
);

