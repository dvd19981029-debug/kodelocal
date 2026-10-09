const fs = require('fs');
const path = 'src/app/admin/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<ShoppingCart className="w-4 h-4" \/>\s*<span>Compras & Proveedores<\/span>\s*<\/div>\s*\{purchases.filter[\s\S]*?<\/button>/;

const newBtn = `<ShoppingCart className="w-4 h-4" />
                  <span>Compras & Proveedores</span>
                </div>
                {purchases.filter(p => p.paymentStatus === 'PENDIENTE').length > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                    {purchases.filter(p => p.paymentStatus === 'PENDIENTE').length} CxP
                  </span>
                ) : (
                  <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('abastecimiento')}
                className={\`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left \${
                  activeTab === 'abastecimiento'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }\`}
              >
                <div className="flex items-center gap-2.5">
                  <BrainCircuit className="w-4 h-4 text-emerald-500" />
                  <span>Abastecimiento Inteligente</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black uppercase tracking-wider">Nuevo</span>
              </button>`;

code = code.replace(regex, newBtn);
fs.writeFileSync(path, code);
console.log("Added button");
