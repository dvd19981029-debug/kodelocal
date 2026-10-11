const fs = require('fs');

// Fix CajaSubTab
const typesPath = 'src/app/pos/types/index.ts';
if (fs.existsSync(typesPath)) {
  let typesCode = fs.readFileSync(typesPath, 'utf8');
  typesCode = typesCode.replace(
    /export type CajaSubTab = 'listas_facturar' \| 'dtes_emitidos';/,
    "export type CajaSubTab = 'listas_facturar' | 'dtes_emitidos' | 'corte_z';"
  );
  fs.writeFileSync(typesPath, typesCode);
  console.log('Fixed CajaSubTab type in index.ts');
}

// Fix Calculator import
const cajaPath = 'src/components/pos/PosCajaModule.tsx';
if (fs.existsSync(cajaPath)) {
  let cajaCode = fs.readFileSync(cajaPath, 'utf8');
  cajaCode = cajaCode.replace(
    /import \{\s*ReceiptText,/,
    "import {\n  Calculator,\n  ReceiptText,"
  );
  fs.writeFileSync(cajaPath, cajaCode);
  console.log('Added Calculator to PosCajaModule.tsx');
}
