const fs = require('fs');

const path = 'src/lib/customers.ts';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  code = code.replace(
    /notas\?: string;/,
    "notas?: string;\n  specialEssencePrice?: number | null;\n  specialBottlePrice?: number | null;"
  );

  fs.writeFileSync(path, code);
  console.log('Patched src/lib/customers.ts');
}
