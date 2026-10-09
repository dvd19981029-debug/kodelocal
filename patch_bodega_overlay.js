const fs = require('fs');

const path = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Añadir el estado hasInteracted
const stateHookPos = `const [isSyncing, setIsSyncing] = useState(false);`;
const stateHookReplacement = `const [hasInteracted, setHasInteracted] = useState(false);\n  const [isSyncing, setIsSyncing] = useState(false);`;
code = code.replace(stateHookPos, stateHookReplacement);

// 2. Añadir el overlay al inicio del return (después del contenedor principal)
const returnPos = `return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0 overflow-x-hidden">`;

const overlayCode = `return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0 overflow-x-hidden">
      {/* OVERLAY PARA DESBLOQUEAR AUDIO Y NOTIFICACIONES */}
      {!hasInteracted && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Volume2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Asistente de Bodega</h2>
            <p className="text-sm text-slate-600 mb-6">
              Haz clic para activar las notificaciones visuales y el asistente de voz para nuevos pedidos.
            </p>
            <button
              onClick={() => {
                setHasInteracted(true);
                if (typeof window !== 'undefined') {
                  if ('Notification' in window) {
                    Notification.requestPermission();
                  }
                  if (window.speechSynthesis) {
                    const u = new SpeechSynthesisUtterance('Asistente de bodega activado');
                    u.lang = 'es-US';
                    u.rate = 1.2;
                    u.volume = 0.5;
                    window.speechSynthesis.speak(u);
                  }
                }
              }}
              className="w-full clay-btn clay-btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Activar y Empezar
            </button>
          </div>
        </div>
      )}`;

code = code.replace(returnPos, overlayCode);

fs.writeFileSync(path, code);
console.log('Patched', path);
