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
  /span className=\{\`clay-badge text-\[9px\] font-bold py-0\.5 px-1\.5 rounded-md/g,
  "span className={`clay-badge text-[9px] font-bold py-0.5 px-1.5 rounded-md whitespace-nowrap"
);

// 2. KardexModule.tsx - check if it has the same issue
patchFile(
  'src/components/admin/KardexModule.tsx',
  /span className="text-\[10px\] font-mono shrink-0"/g,
  'span className="text-[10px] font-mono shrink-0 whitespace-nowrap"'
);

