const fs = require('fs');

// 1. Fix visits.ts hardcoded 'Sep'
const visitsPath = 'src/lib/visits.ts';
let visitsCode = fs.readFileSync(visitsPath, 'utf8');
visitsCode = visitsCode.replace("label: \\`${d} Sep\\`", "label: \\`${d} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(mStr, 10) - 1]}\\`");
fs.writeFileSync(visitsPath, visitsCode);

// 2. Fix UI in AromaniakDashboardModule.tsx
const uiPath = 'src/components/admin/AromaniakDashboardModule.tsx';
let uiCode = fs.readFileSync(uiPath, 'utf8');

const regex = /\{\/\* Eje X de Etiquetas \*\/\}[\s\S]*?<\/div>/;
const newAxis = `{/* Eje X de Etiquetas Inteligente */}
          <div className="w-full flex items-start gap-1 sm:gap-2 pt-1.5 px-1 overflow-hidden">
            {graficaVisitas.length > 0 &&
              graficaVisitas.map((point, idx) => {
                let showLabel = false;
                if (period === 'hoy') {
                  showLabel = idx % 3 === 0 || idx === graficaVisitas.length - 1; 
                } else if (period === '7d') {
                  showLabel = true;
                } else if (period === 'mes') {
                  showLabel = idx % 5 === 0 || idx === graficaVisitas.length - 1;
                } else {
                  showLabel = true;
                }

                return (
                  <div key={idx} className="flex-1 flex justify-center min-w-0">
                    {showLabel ? (
                      <span className="text-[9px] text-slate-400 font-mono truncate text-center block">
                        {period === '7d' ? point.label.split(' ')[0] : period === 'hoy' ? point.label.replace(':00', 'h') : point.label.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-[9px] text-transparent hidden sm:block">-</span>
                    )}
                  </div>
                );
              })}
          </div>`;

uiCode = uiCode.replace(regex, newAxis);
fs.writeFileSync(uiPath, uiCode);
console.log("Fixed chart issues");
