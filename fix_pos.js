const fs = require('fs');

function patch(file, regex, replacement) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(regex, replacement);
  fs.writeFileSync(file, code);
}

// ProductCard.tsx
patch(
  'src/components/ecommerce/ProductCard.tsx',
  /<div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-108" style=\{\{ top: '8%', left: '0%' \}\}>/g,
  `<div className="absolute pointer-events-none flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-108" style={{ top: '61.5%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%' }}>`
);

// Product Page
patch(
  'src/app/producto/[id]/page.tsx',
  /<div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105" style=\{\{ top: '8%', left: '0%' \}\}>/g,
  `<div className="absolute pointer-events-none flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105" style={{ top: '61.5%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%' }}>`
);
