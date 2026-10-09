const fs = require('fs');

function patchFile(path, oldTextRegex, newText) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(oldTextRegex, newText);
  fs.writeFileSync(path, code);
  console.log('Patched', path);
}

// 1. PosProductGrid.tsx
patchFile(
  'src/app/pos/components/terminal/PosProductGrid.tsx',
  /isEssence \? \`\$\{fullRemaining\} de 1 Oz · \$\{halfRemaining\} de ½ Oz\`/g,
  "isEssence ? `${fullRemaining} Onzas · ${halfRemaining} Medias`"
);

// 2. KardexModule.tsx
patchFile(
  'src/components/admin/KardexModule.tsx',
  /\`\$\{p\.stock\} de 1 Oz · \$\{p\.stockHalf \|\| 0\} de ½ Oz\`/g,
  "`${p.stock} Onzas · ${p.stockHalf || 0} Medias`"
);

