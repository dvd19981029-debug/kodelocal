const fs = require('fs');
const path = 'src/app/producto/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /<span className="text-slate-400">Inspirado en:<\/span>\s*<strong className="text-slate-800 font-bold">/g,
  `<span className="text-slate-500 font-medium">Inspirado en:</span>\n                  <strong className="text-slate-800 font-black text-sm sm:text-base">`
);

fs.writeFileSync(path, code);
