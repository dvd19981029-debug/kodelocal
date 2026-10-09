const fs = require('fs');
const path = 'src/components/ecommerce/CartDrawer.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /src=\{item\.kitDetails\.essenceImageUrl \|\| \(item\.kitDetails\.essenceSku \? `\/images\/esencias\/esencia_\$\{String\(item\.kitDetails\.essenceSku\)\.trim\(\)\}\.webp\?v=aroma_official_v4` : `\/images\/esencias\/\$\{item\.kitDetails\.essenceId\}\.webp\?v=aroma_official_v4`\)\}/;
const replacement = `src={item.kitDetails.essenceImageUrl || '/images/essence_bottle_blank.webp'}`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
