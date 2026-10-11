const fs = require('fs');

const path = 'src/app/pos/components/terminal/PosCartPanel.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  const halfPriceRegex = /const halfPrice = item\.product\.priceHalfOunce != null[\s\S]*?Number\(\(item\.product\.price \/ 2\)\.toFixed\(2\)\);/;
  
  const halfPriceReplacement = `const fullPriceVal = (isEssence && selectedCustomerObj?.specialEssencePrice) ? Number(selectedCustomerObj.specialEssencePrice) : item.product.price;
              const halfPriceVal = (isEssence && selectedCustomerObj?.specialEssencePrice) ? Number((Number(selectedCustomerObj.specialEssencePrice) / 2).toFixed(2)) : (item.product.priceHalfOunce != null ? Number(item.product.priceHalfOunce) : Number((item.product.price / 2).toFixed(2)));`;

  code = code.replace(halfPriceRegex, halfPriceReplacement);

  // Now replace the buttons rendering the prices
  code = code.replace(/title=\{\`1 Onza: \$\$\{item\.product\.price\.toFixed\(2\)\}\`\}/g, "title={`1 Onza: $${fullPriceVal.toFixed(2)}`}");
  code = code.replace(/1 Oz \(\$\{item\.product\.price\.toFixed\(2\)\}\)/g, "1 Oz (${fullPriceVal.toFixed(2)})");

  code = code.replace(/title=\{\`½ Onza: \$\$\{halfPrice\.toFixed\(2\)\}\`\}/g, "title={`½ Onza: $${halfPriceVal.toFixed(2)}`}");
  code = code.replace(/½ Oz \(\$\{halfPrice\.toFixed\(2\)\}\)/g, "½ Oz (${halfPriceVal.toFixed(2)})");

  fs.writeFileSync(path, code);
  console.log('Patched PosCartPanel presentation buttons');
}
