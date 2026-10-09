const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /if \(data\.success && data\.metrics\?\.stockOutProjections\) \{[\s\S]*?setProyeccionAgotamiento\(data\.metrics\.stockOutProjections\);[\s\S]*?\}/,
  `if (data.success && data.proyeccionAgotamiento) {
          setProyeccionAgotamiento(data.proyeccionAgotamiento);
        }`
);

fs.writeFileSync(path, code);
console.log("Fixed projection fetch");
