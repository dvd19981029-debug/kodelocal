const fs = require('fs');
const files = ['src/components/ecommerce/ProductCard.tsx', 'src/app/producto/[id]/page.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Increase width from 31% to 33% and update font sizes
  code = code.replace(/w-\[31%\]/g, 'w-[33%]');
  code = code.replace(/fontSize: displayName\.length > 25 \? '2\.5cqw' : displayName\.length > 15 \? '2\.9cqw' : '3\.4cqw'/g, 
                     "fontSize: displayName.length > 25 ? '3.5cqw' : displayName.length > 15 ? '4cqw' : '4.8cqw'");
  
  fs.writeFileSync(file, code);
}
