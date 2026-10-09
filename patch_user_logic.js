const fs = require('fs');

// Patch 1: PerfumeNames
let names = fs.readFileSync('src/lib/perfumeNames.ts', 'utf8');

names = names.replace(/fontSize = len <= 6 \? '3\.5cqw' : len <= 9 \? '3\.0cqw' : len <= 12 \? '2\.5cqw' : '2\.1cqw';/g, 
  "fontSize = len <= 6 ? '5.5cqw' : len <= 9 ? '4.8cqw' : len <= 12 ? '4.2cqw' : '3.6cqw';");

names = names.replace(/fontSize = maxLen <= 6 \? '2\.8cqw' : maxLen <= 8 \? '2\.5cqw' : maxLen <= 11 \? '2\.2cqw' : '1\.9cqw';/g,
  "fontSize = maxLen <= 6 ? '4.5cqw' : maxLen <= 8 ? '4.0cqw' : maxLen <= 11 ? '3.5cqw' : '3.0cqw';");

names = names.replace(/fontSize = maxLen <= 7 \? '2\.5cqw' : maxLen <= 9 \? '2\.2cqw' : '1\.9cqw';/g,
  "fontSize = maxLen <= 7 ? '4.2cqw' : maxLen <= 9 ? '3.6cqw' : '3.0cqw';");

names = names.replace(/fontSize = maxLen <= 8 \? '2\.3cqw' : maxLen <= 11 \? '2\.0cqw' : '1\.7cqw';/g,
  "fontSize = maxLen <= 8 ? '4.0cqw' : maxLen <= 11 ? '3.3cqw' : '2.8cqw';");

fs.writeFileSync('src/lib/perfumeNames.ts', names);

// Patch 2 & 3: UI Files
const files = ['src/components/ecommerce/ProductCard.tsx', 'src/app/producto/[id]/page.tsx'];
for (const f of files) {
  let code = fs.readFileSync(f, 'utf8');
  code = code.replace(/w-\[29%\] max-w-\[29%\]/g, 'w-[35%] max-w-[35%]');
  code = code.replace(/w-\[24%\] h-\[1px\]/g, 'w-[30%] h-[2px]');
  fs.writeFileSync(f, code);
}
