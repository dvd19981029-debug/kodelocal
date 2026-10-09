const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add imports
code = code.replace(
  /FileSpreadsheet\n\} from 'lucide-react';/g,
  `FileSpreadsheet,\n  Hourglass,\n  ShoppingCart\n} from 'lucide-react';\nimport { BarChart3 } from 'lucide-react';`
);

code = code.replace(
  /import React, \{ useState \} from 'react';/g,
  `import React, { useState, useEffect } from 'react';`
);

// 2. Add state and useEffect inside component
const stateToAdd = `
  const [proyeccionAgotamiento, setProyeccionAgotamiento] = useState<any[]>([]);
  const [isLoadingProyeccion, setIsLoadingProyeccion] = useState(true);

  useEffect(() => {
    async function loadProyeccion() {
      try {
        const token = getStaffToken();
        const res = await fetch('/api/admin/dashboard?period=30d', {
          headers: {
            ...(token ? { 'x-staff-token': token } : {})
          }
        });
        const data = await res.json();
        if (data.success && data.metrics?.stockOutProjections) {
          setProyeccionAgotamiento(data.metrics.stockOutProjections);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingProyeccion(false);
      }
    }
    loadProyeccion();
  }, []);
`;

code = code.replace(
  /const \[catalogData, setCatalogData\] = useState<any\[\]>\(\[\]\);/,
  `const [catalogData, setCatalogData] = useState<any[]>([]);\n${stateToAdd}`
);

// 3. Add UI block
const uiBlockRaw = fs.readFileSync('blockContent.tsx', 'utf8');
const fixedUiBlock = uiBlockRaw.replace(
  /\{onNavigateTab && \(\s*<button[\s\S]*?<\/button>\s*\)\}/,
  `` // Remove the button that depends on onNavigateTab
);

code = code.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/,
  `${fixedUiBlock}\n\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`
);

fs.writeFileSync(path, code);
console.log("Patched AbastecimientoModule.tsx");
