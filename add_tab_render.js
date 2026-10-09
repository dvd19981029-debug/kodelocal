const fs = require('fs');
const path = 'src/app/admin/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* ================= TAB 12: CONFIGURACIÓN KODE ================= \*\/\}[\s\S]*?<\/div>\s*\)\}/;

const newTab = `{/* ================= TAB 12: CONFIGURACIÓN KODE ================= */}
        {activeTab === 'configuracion-kode' && (
          <div className="animate-in fade-in duration-150">
            <ConfiguracionKodeModule />
          </div>
        )}

        {/* ================= TAB 13: ABASTECIMIENTO INTELIGENTE ================= */}
        {activeTab === 'abastecimiento' && (
          <div className="animate-in fade-in duration-150">
            <AbastecimientoInteligentePage />
          </div>
        )}`;

if (code.match(regex)) {
  code = code.replace(regex, newTab);
  fs.writeFileSync(path, code);
  console.log("Added tab render");
} else {
  console.log("Failed to match regex");
}
