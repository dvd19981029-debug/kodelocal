const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

// Fix budget state to be string
code = code.replace(/const \[budget, setBudget\] = useState<number>\(3000\);/, `const [budget, setBudget] = useState<string>('3000');\n  const [historyDays, setHistoryDays] = useState<string>('30');\n  const [targetDos, setTargetDos] = useState<string>('60');\n  const [leadTime, setLeadTime] = useState<string>('14');`);

// Update fetch call payload
const fetchRegex = /body: JSON\.stringify\(\{[\s\n]*budget,[\s\n]*catalog: catalogData[\s\n]*\}\)/;
const fetchReplacement = `body: JSON.stringify({
          budget: Number(budget),
          historyDays: Number(historyDays),
          targetDos: Number(targetDos),
          leadTime: Number(leadTime),
          catalog: catalogData
        })`;
code = code.replace(fetchRegex, fetchReplacement);

// Fix budget input field
const inputRegex = /<input\s+type="number"\s+value=\{budget\}\s+onChange=\{\(e\) => setBudget\(Number\(e\.target\.value\)\)\}[\s\n]+className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500\/10 outline-none transition-all font-bold text-slate-700"[\s\n]+placeholder="3000"\s+\/>/;

const inputReplacement = `<input 
                  type="number" 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700"
                  placeholder="Ej: 3000"
                />`;
code = code.replace(inputRegex, inputReplacement);

// Add the other inputs visually
const paramsRegex = /<\/div>\s*<\/div>\s*<div className="pt-4 border-t border-slate-100">/;
const paramsReplacement = `</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">Historial (Días)</label>
                  <input type="number" value={historyDays} onChange={e => setHistoryDays(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none" title="Días hacia atrás para calcular velocidad de venta" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">Meta (Días Stock)</label>
                  <input type="number" value={targetDos} onChange={e => setTargetDos(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none" title="Para cuántos días de venta deseas comprar" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1 uppercase tracking-wider">Tránsito (Días)</label>
                  <input type="number" value={leadTime} onChange={e => setLeadTime(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none" title="Días que tarda el proveedor en entregar" />
                </div>
              </div>

            <div className="pt-4 border-t border-slate-100">`;
code = code.replace(paramsRegex, paramsReplacement);

fs.writeFileSync(path, code);
