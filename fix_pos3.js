const fs = require('fs');

function patch(file, regex, replacement) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(regex, replacement);
  fs.writeFileSync(file, code);
}

// ProductCard.tsx
patch(
  'src/components/ecommerce/ProductCard.tsx',
  /style=\{\{ top: '58\.5%', left: '50%', transform: 'translate\(-50%, -50%\)', width: '80%' \}\}/g,
  `style={{ top: '65.5%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%' }}`
);

// Product Page
patch(
  'src/app/producto/[id]/page.tsx',
  /style=\{\{ top: '58\.5%', left: '50%', transform: 'translate\(-50%, -50%\)', width: '80%' \}\}/g,
  `style={{ top: '65.5%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%' }}`
);
