const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let code = fs.readFileSync(file, 'utf8');

// The block to replace:
const regex = /\{currentUser \? \([\s\S]*?\n\s*\}\) \: \(/;
const newJSX = `{currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5 bg-white/90 p-1 sm:p-1.5 pl-2 sm:pl-3 rounded-xl sm:rounded-2xl shadow-[2px_3px_8px_rgba(164,177,198,0.25)] border border-white max-w-[170px] sm:max-w-none">
                <div className="text-left min-w-0">
                  <span className="text-[11px] sm:text-xs font-black text-slate-800 block leading-tight truncate">
                    {currentUser.name}
                  </span>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className={\`text-[9px] sm:text-[10px] font-black truncate \${
                      currentUser.role === 'ADMIN' ? 'text-purple-600' : 
                      currentUser.role === 'BODEGA' ? 'text-amber-600' : 'text-indigo-600'
                    }\`}>
                      {currentRole?.name || currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors ml-0.5 sm:ml-1 shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
            </div>
          ) : (`;

code = code.replace(regex, newJSX);
fs.writeFileSync(file, code);
console.log('Patched JSX');
