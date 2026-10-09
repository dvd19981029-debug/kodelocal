const fs = require('fs');
const file = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const \[sales, setSales\] = useState<SaleRecord\[\]>\(\(\) => \{\n\s*if \(typeof window !== 'undefined'\) \{\n\s*const currentVersion = localStorage\.getItem\('kodelocal_data_version'\);\n\s*if \(currentVersion !== '2026_zero_stock_v3'\) return \[\];\n\s*const saved = localStorage\.getItem\('kodelocal_sales'\);\n\s*if \(saved\) \{\n\s*try \{ return JSON\.parse\(saved\); \} catch \(e\) \{\}\n\s*\}\n\s*\}\n\s*return \[\];\n\s*\}\);/,
  "const [sales, setSales] = useState<SaleRecord[]>([]);"
);

fs.writeFileSync(file, code);
console.log('Patched Bodega Init');
