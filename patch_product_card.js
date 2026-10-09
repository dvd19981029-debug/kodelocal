const fs = require('fs');

// Patch ProductCard.tsx
const pathCard = 'src/components/ecommerce/ProductCard.tsx';
let codeCard = fs.readFileSync(pathCard, 'utf8');

// Aumentar un poco los tamaños base en inspiredSizeClass
codeCard = codeCard.replace(
  /const inspiredSizeClass = inspiracionNameLength > 30\s*\?\s*'text-\[8px\] sm:text-\[9px\]'\s*:\s*inspiracionNameLength > 22\s*\?\s*'text-\[9px\] sm:text-\[10px\]'\s*:\s*inspiracionNameLength > 16\s*\?\s*'text-\[10px\] sm:text-\[11px\]'\s*:\s*'text-\[11px\] sm:text-xs';/,
  `const inspiredSizeClass = inspiracionNameLength > 30
    ? 'text-[9px] sm:text-[10px]'
    : inspiracionNameLength > 22
    ? 'text-[10px] sm:text-[11px]'
    : inspiracionNameLength > 16
    ? 'text-[11px] sm:text-xs'
    : 'text-xs sm:text-[13px]';`
);

// Cambiar text-slate-400 a text-slate-500 para 'Inspirado en'
codeCard = codeCard.replace(
  /<span className="text-slate-400 font-normal">Inspirado en <\/span>/g,
  `<span className="text-slate-500 font-normal">Inspirado en </span>`
);
codeCard = codeCard.replace(
  /<span className="text-slate-400 font-medium tracking-tight">Inspirado en <\/span>/g,
  `<span className="text-slate-500 font-medium tracking-tight">Inspirado en </span>`
);

fs.writeFileSync(pathCard, codeCard);


// Patch producto/[id]/page.tsx
const pathPage = 'src/app/producto/[id]/page.tsx';
let codePage = fs.readFileSync(pathPage, 'utf8');

codePage = codePage.replace(
  /<span className="text-slate-400">Inspirado en:<\/span>\s*<span className="font-semibold text-slate-800 uppercase tracking-tight">/g,
  `<span className="text-slate-500 font-medium">Inspirado en:</span>
                  <span className="font-bold text-slate-800 uppercase tracking-tight text-lg">`
);

fs.writeFileSync(pathPage, codePage);
