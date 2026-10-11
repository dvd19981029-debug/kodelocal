const fs = require('fs');

const path = 'src/app/pos/page.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  const filterRegex = /c\.phone\.toLowerCase\(\)\.includes\(q\)\)/;
  const filterNew = "c.phone.toLowerCase().includes(q)) ||\n      (c.email && c.email.toLowerCase().includes(q))";

  code = code.replace(filterRegex, filterNew);

  fs.writeFileSync(path, code);
  console.log('Patched customer filter to include email');
}

const panelPath = 'src/app/pos/components/terminal/PosCartPanel.tsx';
if (fs.existsSync(panelPath)) {
  let code = fs.readFileSync(panelPath, 'utf8');
  
  code = code.replace(
    /Buscar cliente \(Nombre, DUI o NRC\)\.\.\./,
    "Buscar cliente (Nombre, Correo, DUI o NRC)..."
  );
  
  fs.writeFileSync(panelPath, code);
}
