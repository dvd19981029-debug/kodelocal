const fs = require('fs');
const path = 'src/components/ecommerce/ProductCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /\{inspiracionPerfumeName\.toUpperCase\(\)\.replace\(\/\\s\+\[HFU\]\$\/i, ''\)\}/;
const replacement = `{displayName.toUpperCase().replace(/\\s+[HFU]$/i, '')}`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
