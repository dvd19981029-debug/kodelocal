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
  /isEssence \? `\$\{fullRemaining\}×1Oz · \$\{halfRemaining\}×½Oz`/g,
  "isEssence ? `${fullRemaining} de 1 Oz · ${halfRemaining} de ½ Oz`"
);

// 2. KardexModule.tsx
patchFile(
  'src/components/admin/KardexModule.tsx',
  /\`\$\{p\.stock\}×1Oz · \$\{p\.stockHalf \|\| 0\}×½Oz\`/g,
  "`${p.stock} de 1 Oz · ${p.stockHalf || 0} de ½ Oz`"
);

