const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

// Remove XLSX import
const importRegex = /import \* as XLSX from 'xlsx';\n/;
code = code.replace(importRegex, '');

// Replace handleDownloadCsv
const dlRegex = /const handleDownloadCsv = \(\) => \{[\s\S]*?XLSX\.writeFile\(wb, "Orden_Sugerida_APAESA\.xlsx"\);\s*\};/;
const dlReplacement = `const handleDownloadCsv = () => {
    if (!draftResult || !draftResult.draft) return;
    
    // El separador debe ser punto y coma para que Excel (Latinoamérica) lo reconozca
    const separator = ';';
    // Agregar BOM al inicio del archivo para que Excel reconozca correctamente los acentos y UTF-8
    let csvContent = '\\uFEFF'; 
    
    // Encabezados
    csvContent += \`Código Proveedor\${separator}Fragancia (Contratipo)\${separator}Cantidad Sugerida (Kg)\${separator}Precio Unit. ($/Kg)\${separator}Subtotal ($)\\n\`;
    
    let total = 0;
    draftResult.draft.forEach((item) => {
      csvContent += \`"\${item.supplierCode}"\${separator}"\${item.productName}"\${separator}\${item.suggestedKg}\${separator}\${item.pricePerKg}\${separator}\${item.totalCost}\\n\`;
      total += item.totalCost;
    });
    
    csvContent += \`\${separator}\${separator}\${separator}TOTAL ESTIMADO:\${separator}\${total.toFixed(2)}\\n\`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "Orden_Sugerida_APAESA.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };`;

code = code.replace(dlRegex, dlReplacement);

// Change button text
const btnRegex = /Descargar Archivo CSV/;
const btnReplacement = `Descargar Archivo CSV`;
code = code.replace(btnRegex, btnReplacement);

fs.writeFileSync(path, code);
