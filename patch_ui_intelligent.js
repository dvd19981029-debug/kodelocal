const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

// Eliminar el input de Historial Días
const uiRegex = /<div>\s*<label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">Historial \(Días\)<\/label>\s*<input type="number" value=\{historyDays\}.*?\/>\s*<\/div>/;
const uiReplacement = `<div className="flex flex-col justify-end">
                  <div className="w-full h-full min-h-[42px] px-3 py-2 bg-indigo-50 border-2 border-indigo-200 text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-help" title="El algoritmo evalúa automáticamente tendencias de 30 y 90 días, e identifica si una bajada de ventas fue por falta de inventario (Stockout Masking).">
                    <BrainCircuit className="w-4 h-4" />
                    <span className="text-xs">Flujo Inteligente Activo</span>
                  </div>
                </div>`;
code = code.replace(uiRegex, uiReplacement);

// Quitar historyDays del body fetch
code = code.replace(/historyDays:\s*Number\(historyDays\),/, '');

fs.writeFileSync(path, code);
