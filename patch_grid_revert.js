const fs = require('fs');
const path = 'src/app/pos/components/terminal/PosProductGrid.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove Sparkles icon
code = code.replace(/<Sparkles className="w-3\.5 h-3\.5 text-amber-500 shrink-0" \/> /g, '');

// 2. Remove emojis from gender buttons
code = code.replace(/\{gender === 'Caballero' \? '🧔 Caballero' : gender === 'Dama' \? '👩 Dama' : gender === 'Unisex' \? '⚧ Unisex' : 'Todos'\}/g, '{gender}');

// 3. Fix Puesto - remove emoji and make it look cleaner (user said it looked ugly)
code = code.replace(
  /<span className="clay-badge text-\[8\.5px\] font-mono font-bold bg-amber-100 text-amber-900 px-1 py-0\.5 border border-amber-200" title=\{`Puesto: \$\{product\.puesto\}`\}>\s*📍\{product\.puesto\}\s*<\/span>/g,
  '<span className="text-[9px] font-medium text-slate-500" title={`Puesto: ${product.puesto}`}>\n                        Estante {product.puesto}\n                      </span>'
);

fs.writeFileSync(path, code);
console.log('Fixed Grid Emojis without removing Claymorphism');
