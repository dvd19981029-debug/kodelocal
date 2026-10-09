const fs = require('fs');

const path = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldBtn = `onClick={() => Notification.requestPermission()}`;
const newBtn = `onClick={() => {
                Notification.requestPermission();
                if (window.speechSynthesis) {
                  const u = new SpeechSynthesisUtterance('');
                  u.volume = 0;
                  window.speechSynthesis.speak(u);
                }
              }}`;

code = code.replace(oldBtn, newBtn);

fs.writeFileSync(path, code);
console.log('Patched', path);
