const fs = require('fs');
const path = 'src/app/mejor-proveedor-esencias-el-salvador/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const newComparative = `
      {/* COMPARATIVE SECTION - Responsive Stacked Cards */}
      <section className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 text-center mb-10 drop-shadow-sm">
          La Realidad: <span className="text-indigo-600">Aromaniak</span> vs <span className="text-slate-400">Otros</span>
        </h2>
        
        <div className="space-y-6">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Zap className="w-5 h-5" /></div>
              <h3 className="font-black text-slate-700 text-lg">Experiencia de Compra</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="p-6 bg-indigo-50/30">
                <div className="text-indigo-800 font-black text-sm mb-3 uppercase tracking-wider">🏆 Aromaniak</div>
                <div className="flex items-start gap-3 text-slate-800 font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                  E-commerce automatizado 24/7. Tu pedido en 2 minutos.
                </div>
              </div>
              <div className="p-6 bg-white">
                <div className="text-slate-400 font-black text-sm mb-3 uppercase tracking-wider">Otros Proveedores</div>
                <div className="flex items-start gap-3 text-slate-500 font-medium text-lg">
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  Esperar horas a que respondan en WhatsApp.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><ShieldCheck className="w-5 h-5" /></div>
              <h3 className="font-black text-slate-700 text-lg">Calidad de Esencia</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="p-6 bg-indigo-50/30">
                <div className="text-indigo-800 font-black text-sm mb-3 uppercase tracking-wider">🏆 Aromaniak</div>
                <div className="flex items-start gap-3 text-slate-800 font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                  Puras sin diluir. Calidad Europea AAA+.
                </div>
              </div>
              <div className="p-6 bg-white">
                <div className="text-slate-400 font-black text-sm mb-3 uppercase tracking-wider">Otros Proveedores</div>
                <div className="flex items-start gap-3 text-slate-500 font-medium text-lg">
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  Esencias genéricas o rebajadas.
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Truck className="w-5 h-5" /></div>
              <h3 className="font-black text-slate-700 text-lg">Logística y Envíos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="p-6 bg-indigo-50/30">
                <div className="text-indigo-800 font-black text-sm mb-3 uppercase tracking-wider">🏆 Aromaniak</div>
                <div className="flex items-start gap-3 text-slate-800 font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                  Envíos express seguros con C807 a todo el país.
                </div>
              </div>
              <div className="p-6 bg-white">
                <div className="text-slate-400 font-black text-sm mb-3 uppercase tracking-wider">Otros Proveedores</div>
                <div className="flex items-start gap-3 text-slate-500 font-medium text-lg">
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  Limitado a San Salvador o envíos informales.
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
`;

// Replace the old comparative table section
const regex = /\{\/\* COMPARATIVE TABLE - Clean Claymorphism \*\/\}[\s\S]*?(?=\{\/\* DYNAMIC CTA & CATALOG REVEAL - Light Mode \*\/)/;
code = code.replace(regex, newComparative);

fs.writeFileSync(path, code);
