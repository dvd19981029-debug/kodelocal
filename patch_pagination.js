const fs = require('fs');
const path = 'src/app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /className=\{\`flex flex-col sm:flex-row items-center justify-between gap-3 \$\{\n\s*position === 'top'\n\s*\? 'pb-4 pt-1 border-b border-slate-200\/80'\n\s*: 'pt-6 border-t border-slate-200\/80'\n\s*\}\`\}/;

const replacement = `className={\`flex flex-col sm:flex-row items-center justify-between gap-6 \${
          position === 'top'
            ? 'pb-6 pt-2 mb-6 border-b border-slate-200/80'
            : 'mt-8 pt-8 pb-14 border-t-2 border-slate-200/80'
        }\`}`;

code = code.replace(regex, replacement);
fs.writeFileSync(path, code);
