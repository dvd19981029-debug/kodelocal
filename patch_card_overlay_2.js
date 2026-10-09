const fs = require('fs');
const path = 'src/components/ecommerce/ProductCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<div className="absolute flex flex-col items-center justify-center w-full" style=\{\{ top: '65\.5%', left: '0%' \}\}>/;
const replacement = `<div className="absolute flex flex-col items-center justify-center w-full -translate-y-1/2" style={{ top: '65.5%', left: '0%' }}>`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
