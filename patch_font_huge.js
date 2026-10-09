const fs = require('fs');
const files = ['src/components/ecommerce/ProductCard.tsx', 'src/app/producto/[id]/page.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Increase container to w-[36%] for maximum safe width on the physical label
  code = code.replace(/w-\[33%\]/g, 'w-[36%]');
  
  // Dramatically increase font sizes
  code = code.replace(/fontSize: displayName\.length > 25 \? '3\.5cqw' : displayName\.length > 15 \? '4cqw' : '4\.8cqw'/g, 
                     "fontSize: displayName.length > 25 ? '4.5cqw' : displayName.length > 15 ? '5.5cqw' : '7cqw'");
  
  fs.writeFileSync(file, code);
}
