const fs = require('fs');
const file = 'src/app/login/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove the test users section
code = code.replace(/<div className="mt-8 pt-5 border-t border-slate-100">[\s\S]*?Usuarios de Prueba[\s\S]*?<\/div>\s*<\/div>/, '');

// 2. Add Google button right before the email form in CREDENTIALS mode
const googleBtn = `
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 font-bold border border-slate-300 py-3.5 rounded-xl hover:bg-slate-50 hover:shadow-md transition-all shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Acceso Administradores (Google)
            </button>
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">O inicia sesión como empleado</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </div>
`;

code = code.replace(/\{mode === 'CREDENTIALS' \? \(\s*<form/, "        {mode === 'CREDENTIALS' ? (\n          <>\n" + googleBtn + "          <form");
code = code.replace(/<\/form>\s*\) : \(/, "</form>\n          </>\n        ) : (");

fs.writeFileSync(file, code);
console.log('Fixed UI successfully');
