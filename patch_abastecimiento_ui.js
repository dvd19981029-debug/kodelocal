const fs = require('fs');
const path = 'src/components/admin/AbastecimientoModule.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex1 = /if \(!file\) \{[\s\S]*?alert\("Por favor sube el archivo de excel.*"\);[\s\S]*?return;[\s\S]*?\}/;
const replacement1 = `// Archivo es opcional, si no hay archivo, usamos array vacío que hará que la API use el default
      if (!file) {
        parsedData = [];
      }`;
code = code.replace(regex1, replacement1);

const regex2 = /<p>Sube el Excel o CSV de "Pedido Preliminar"<\/p>/;
const replacement2 = `<p>Sube un CSV (Opcional - Si no subes nada, usaré los precios de tu último Excel "Pedido Preliminar")</p>`;
code = code.replace(regex2, replacement2);

fs.writeFileSync(path, code);
