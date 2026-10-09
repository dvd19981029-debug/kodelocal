const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

// Agregar import * as XLSX from 'xlsx'
const importRegex = /import \{ BrainCircuit, Calculator, FileSpreadsheet, Settings2 \} from 'lucide-react';/;
const importReplacement = `import { BrainCircuit, Calculator, FileSpreadsheet, Settings2 } from 'lucide-react';\nimport * as XLSX from 'xlsx';`;
code = code.replace(importRegex, importReplacement);

// Reemplazar handleDownloadCsv con versión Excel
const dlRegex = /const handleDownloadCsv = \(\) => \{[\s\S]*?document\.body\.removeChild\(link\);\s*\};/;
const dlReplacement = `const handleDownloadCsv = () => {
    if (!draftResult) return;
    
    const wsData = [
      ["ORDEN PRELIMINAR DE COMPRA - ESENCIAS FINAS A GRANEL"],
      ["Proveedor: APAESA", "Fecha: " + new Date().toLocaleDateString()],
      [],
      ["No.", "Código Proveedor", "Fragancia (Contratipo)", "Cantidad Sugerida (Kg)", "Precio Unit. ($/Kg)", "Subtotal ($)"]
    ];

    let totalGlobal = 0;
    
    draftResult.draft.forEach((item, index) => {
      wsData.push([
        index + 1,
        item.supplierCode,
        item.productName,
        item.suggestedKg,
        item.pricePerKg,
        item.totalCost
      ]);
      totalGlobal += item.totalCost;
    });

    wsData.push([]);
    wsData.push(["", "", "", "", "TOTAL ESTIMADO:", totalGlobal]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 45 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orden de Compra");
    
    XLSX.writeFile(wb, "Orden_Sugerida_APAESA.xlsx");
  };`;

code = code.replace(dlRegex, dlReplacement);

// Cambiar el texto del boton
code = code.replace(/>\s*Descargar CSV/g, '> Descargar Excel Oficial');

fs.writeFileSync(path, code);
