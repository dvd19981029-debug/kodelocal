const fs = require('fs');
const file = 'src/app/login/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace local mock login with fetch to API
const newLoginLogic = `
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginWithPin = async (pinValue: string) => {
    setError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/kode/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'cajero1@kodelocal.com', password: pinValue, isPin: true })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.user.rol === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/pos');
        }
      } else {
        setError(data.error || 'PIN incorrecto.');
      }
    } catch (e) {
      setError('Error de red.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };
`;

code = code.replace(/const handleLoginWithCredentials = \([\s\S]*?const handleQuickLogin = \(targetEmail: string\) => \{[\s\S]*?\};/, newLoginLogic);

// Add the Google button to UI
const googleBtn = `
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 font-bold border border-slate-300 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Acceso Administradores (Google)
            </button>
          </div>
`;

code = code.replace(/\{loginMode === 'credentials' \? \([\s\S]*?\) : \(/, googleBtn + '\n          {loginMode === \'credentials\' ? (\n            <div className="text-center text-slate-500 font-medium py-4 text-sm">Usa el botón de Google para administradores.</div>\n          ) : (');

fs.writeFileSync(file, code);
console.log('Patched Login UI');
