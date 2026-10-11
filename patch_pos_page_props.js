const fs = require('fs');

const path = 'src/app/pos/page.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  // Compute activeBottlePrice
  code = code.replace(
    /const activeEssenceHalfPrice = activeCustomer\?.specialEssencePrice[\s\S]*?\)\)\);/,
    "$& \n  const activeBottlePrice = activeCustomer?.specialBottlePrice ? Number(activeCustomer.specialBottlePrice) : null;"
  );

  // Pass it to PosProductGrid
  code = code.replace(
    /activeEssenceHalfPrice=\{activeEssenceHalfPrice\}/,
    "activeEssenceHalfPrice={activeEssenceHalfPrice}\n                activeBottlePrice={activeBottlePrice}"
  );

  fs.writeFileSync(path, code);
  console.log('Patched pos/page.tsx to pass activeBottlePrice');
}
