const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let code = fs.readFileSync(file, 'utf8');

// We need to completely remove the user switching dropdown and isSwitchUserOpen
code = code.replace(/\{isSwitchUserOpen && \([\s\S]*?\)\}/, '');
code = code.replace(/<div \n\s*onClick=\{\(\) => setIsSwitchUserOpen\(!isSwitchUserOpen\)\}/, '<div');
code = code.replace(/onClick=\{\(\) => setIsSwitchUserOpen\(!isSwitchUserOpen\)\}/, '');

fs.writeFileSync(file, code);
console.log('Fixed navbar');
