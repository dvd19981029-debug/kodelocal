const fs = require('fs');
const path = 'src/components/ecommerce/LandingMarquee.tsx';
let code = fs.readFileSync(path, 'utf8');

// Remover pausa en hover
code = code.replace(/\.animate-marquee-left:hover, \.animate-marquee-right:hover \{\n\s*animation-play-state: paused;\n\s*\}/g, "");

// Cambiar "Más de 500 Aromas"
code = code.replace(/"Más de 500 Aromas"/g, '"Extenso Catálogo de Aromas"');

fs.writeFileSync(path, code);
