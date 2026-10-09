const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(!selectedFile\) return;\s*setFile\(selectedFile\);/;
const fix = `if (!selectedFile) return;
    if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      alert("⚠️ Has subido un archivo Excel (.xlsx).\\n\\nPor favor, abre el archivo en Excel y guárdalo como 'CSV (delimitado por comas)' antes de subirlo, ya que el algoritmo solo puede procesar texto plano para máxima velocidad.");
      return;
    }
    setFile(selectedFile);`;

code = code.replace(regex, fix);
fs.writeFileSync(path, code);
