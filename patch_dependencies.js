const fs = require('fs');
const path = 'src/app/pos/page.tsx';

if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  code = code.replace(
    /const cartSubtotal = useMemo\(\(\) => \{\n    return cart\.reduce\(\(acc, item\) => acc \+ \(getItemUnitPrice\(item\) \* item\.quantity\), 0\);\n  \}, \[cart\]\);/g,
    "const cartSubtotal = useMemo(() => {\n    return cart.reduce((acc, item) => acc + (getItemUnitPrice(item) * item.quantity), 0);\n  }, [cart, selectedCustomerId, customers]);"
  );

  fs.writeFileSync(path, code);
  console.log('Patched dependencies in pos/page.tsx');
}
