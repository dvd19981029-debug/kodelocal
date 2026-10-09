const fs = require('fs');
const path = 'src/app/pos/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const importRegex = /import ThermalTicket from '@\/components\/pos\/ThermalTicket';/;
const importReplacement = `import ThermalTicket from '@/components/pos/ThermalTicket';\nimport { StockWarningBanner } from '@/components/pos/StockWarningBanner';`;
code = code.replace(importRegex, importReplacement);

const renderRegex = /<div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">/;
const renderReplacement = `<div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">\n      <StockWarningBanner />`;
code = code.replace(renderRegex, renderReplacement);

fs.writeFileSync(path, code);
