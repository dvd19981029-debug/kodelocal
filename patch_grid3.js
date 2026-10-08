const fs = require('fs');
const path = 'src/app/pos/components/terminal/PosProductGrid.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix the Search and Barcode input padding
code = code.replace(
  /className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full pr-4 py-2 sm:py-2\.5 text-xs sm:text-sm font-bold"/g,
  'className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold"'
);

code = code.replace(
  /className="bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full pr-4 py-2 sm:py-2\.5 text-xs sm:text-sm font-mono font-bold border-indigo-200"/g,
  'className="bg-indigo-50 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-mono font-bold text-indigo-900"'
);

// 2. Fix the Gender filter container
code = code.replace(
  /<div className="bg-white border border-slate-200 rounded-xl p-2 px-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs font-semibold text-slate-600">\s*<div className="grid grid-cols-4 gap-1 w-full sm:w-auto">/g,
  '<div className="flex gap-2 text-xs font-semibold text-slate-600">\n          <div className="grid grid-cols-4 gap-1.5 w-full sm:w-[400px]">'
);

// 3. Fix the "Todos, Botes, Empaque" buttons to have slightly better sizing
code = code.replace(
  /className={`px-3 sm:px-4 py-1\.5 sm:py-2 text-xs rounded-full whitespace-nowrap transition-all font-bold shrink-0 \${/g,
  'className={`px-4 py-2 text-[11px] sm:text-xs rounded-full whitespace-nowrap transition-all font-bold shrink-0 ${'
);

// 4. Update the "Add to cart" buttons to look more solid instead of washed out
code = code.replace(
  /bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200/g,
  'bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 shadow-sm'
);

code = code.replace(
  /bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white rounded-lg border border-violet-200/g,
  'bg-white text-violet-600 hover:bg-violet-50 hover:text-violet-700 rounded-lg border border-slate-200 shadow-sm'
);

// Make the product name darker and easier to read
code = code.replace(
  /text-xs sm:text-sm font-bold text-slate-700 leading-tight/g,
  'text-xs sm:text-sm font-black text-slate-900 leading-tight'
);

fs.writeFileSync(path, code);
console.log('Fixed Grid Layout Errors');
