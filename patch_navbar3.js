const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace handleLogout and handleQuickSwitch
const oldBlock = `  const handleLogout = () => {
    setActiveUser(null);
    router.push('/login');
  };

  const handleQuickSwitch = (u: UserAccount) => {
    setActiveUser(u);
    setCurrentUser(u);
    setIsSwitchUserOpen(false);
    // Redirigir a una vista que tenga permitida
    const targetRole = roles.find(r => r.code === u.role);
    if (u.role === 'ADMIN') {
      router.push('/admin');
    } else if (targetRole?.allowedViews.includes('bodega')) {
      router.push('/bodega');
    } else if (targetRole?.allowedViews.includes('pos')) {
      router.push('/pos');
    } else {
      router.push('/pos');
    }
  };`;

const newBlock = `  const handleLogout = async () => {
    try {
      await fetch('/api/kode/auth/logout', { method: 'POST' });
    } catch(e) {}
    if (typeof document !== 'undefined') {
      document.cookie = 'kode_session_ui=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    setActiveUser(null);
    router.push('/login');
  };`;

code = code.replace(oldBlock, newBlock);

const oldJSX = `{/* Selector Rápido de Usuarios para probar roles */}
              {isSwitchUserOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSwitchUserOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 clay-card p-3 z-50 animate-in fade-in zoom-in-95 space-y-1">
                    <Link
                      href="/pos"
                      onClick={() => setIsSwitchUserOpen(false)}
                      className="w-full text-left p-2 rounded-xl text-xs flex items-center gap-2 bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100 transition-colors mb-1"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Ir a Punto de Venta (POS)</span>
                    </Link>

                    <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                      Cambiar de Rol / Usuario:
                    </p>
                    {users.map(u => {
                      const uRole = roles.find(r => r.code === u.role);
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => handleQuickSwitch(u)}
                          className={\`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all \${
                            isSelected 
                              ? 'clay-btn-primary !shadow-[2px_3px_6px_rgba(79,70,229,0.3)]' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }\`}
                        >
                          <div>
                            <span className="font-bold block">{u.name}</span>
                            <span className="text-[9px] opacity-80">{uRole?.name || u.role}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}`;

code = code.replace(oldJSX, "");

fs.writeFileSync(file, code);
console.log('Patched');
