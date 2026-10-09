const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let code = fs.readFileSync(file, 'utf8');

// The block to remove starts at {/* Selector Rápido de Usuarios para probar roles */}
// and ends after the closing </Link> </div> </div> </>.

const searchStr = `{isSwitchUserOpen && (`;
const idx = code.indexOf(searchStr);
if (idx > -1) {
  const nextDiv = code.indexOf(')}', idx);
  code = code.slice(0, idx) + code.slice(nextDiv + 2);
}

// Remove onClick that references setIsSwitchUserOpen
code = code.replace(/onClick=\{.*?setIsSwitchUserOpen.*?\}/g, '');

fs.writeFileSync(file, code);
