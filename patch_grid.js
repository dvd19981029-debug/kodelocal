const fs = require('fs');

const path = 'src/app/pos/components/terminal/PosProductGrid.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  // Add prop to interface
  code = code.replace(
    /activeEssenceHalfPrice: number;/,
    "activeEssenceHalfPrice: number;\n  activeBottlePrice?: number | null;"
  );

  // Add prop to destructuring
  code = code.replace(
    /activeEssenceHalfPrice,/,
    "activeEssenceHalfPrice,\n  activeBottlePrice,"
  );

  // Use it when displaying prices for non-essences
  // Find where it renders product.price for non-essences
  const targetHTML = `                      <span className="text-xs sm:text-[13px] font-black font-mono text-indigo-600">
                        \${product.price.toFixed(2)}
                      </span>`;
  const replacementHTML = `                      <span className="text-xs sm:text-[13px] font-black font-mono text-indigo-600">
                        \${((product.category === 'Botes' || product.category === 'Botes & Envases') && activeBottlePrice ? activeBottlePrice : product.price).toFixed(2)}
                      </span>`;
  code = code.replace(targetHTML, replacementHTML);

  fs.writeFileSync(path, code);
  console.log('Patched PosProductGrid');
}
