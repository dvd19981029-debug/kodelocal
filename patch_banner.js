const fs = require('fs');
const path = 'src/components/pos/StockWarningBanner.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(days === null \|\| days > 5\) return null;/;
const replacement = `if (days === null || days > 5) return null;

  const handleDismiss = () => {
    localStorage.setItem(\`snooze_restock_\${product}\`, Date.now().toString());
    setDays(null);
  };`;
code = code.replace(regex, replacement);

const apiRegex = /if \(d\.success && d\.daysToOrder !== 999\) \{/;
const apiReplacement = `if (d.success && d.daysToOrder !== 999) {
          const snoozedAt = localStorage.getItem(\`snooze_restock_\${d.criticalProduct}\`);
          if (snoozedAt) {
             const daysSinceSnooze = (Date.now() - Number(snoozedAt)) / (1000 * 60 * 60 * 24);
             if (daysSinceSnooze < 14) {
               return; // Silenciado temporalmente por 14 días porque ya se pidió
             }
          }
`;
code = code.replace(apiRegex, apiReplacement);

const returnRegex = /<p>[\s\n]*\{isLate[\s\S]*?\}[\s\n]*<\/p>/;
const returnReplacement = `<p className="flex-1">
        {isLate 
          ? \`¡URGENTE! Ruptura de stock inminente para \${product}. Tienes un retraso de \${Math.abs(days)} días para hacer el pedido a APAESA.\`
          : \`¡ATENCIÓN! Tienes \${days} días para ordenar \${product} antes de que su nivel caiga por debajo de los 14 días de tránsito.\`}
      </p>
      <button 
        onClick={handleDismiss}
        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors flex items-center gap-1 shrink-0"
        title="Ocultar esta alerta por 14 días"
      >
        <span className="text-[10px] uppercase tracking-wider">Ya lo pedí</span>
      </button>`;
code = code.replace(returnRegex, returnReplacement);

const importRegex = /import \{ AlertTriangle, Clock \} from 'lucide-react';/;
const importReplacement = `import { AlertTriangle, Clock, Check } from 'lucide-react';`;
code = code.replace(importRegex, importReplacement);

fs.writeFileSync(path, code);
