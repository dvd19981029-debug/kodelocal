const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

const skeletonUi = `
        {/* Tarjetas de Proyección de Días Restantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 pt-1">
          {isLoadingProyeccion ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 animate-pulse h-[140px]" />
            ))
          ) : proyeccionAgotamiento.length > 0 ? (
            proyeccionAgotamiento.slice(0, 6).map((item) => {
`;

code = code.replace(
  /\{\/\* Tarjetas de Proyección de Días Restantes \*\/\}[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2\.5 sm:gap-4 pt-1">[\s\S]*?\{proyeccionAgotamiento\.slice\(0, 6\)\.map\(\(item\) => \{/,
  skeletonUi
);

const closeSkeleton = `
            );
          })
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400 font-medium text-sm">
              No hay datos de proyección suficientes en este momento.
            </div>
          )}
        </div>
      </div>
`;

code = code.replace(
  /            \);\n          \}\)\}\n        <\/div>\n      <\/div>/,
  closeSkeleton
);

fs.writeFileSync(path, code);
console.log("Added skeleton");
