const fs = require('fs');

const path = 'src/app/login/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldRouting = `        if (data.user.rol === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/pos');
        }`;

const newRouting = `        if (data.user.rol === 'ADMIN') {
          router.push('/admin');
        } else if (data.user.rol === 'BODEGA') {
          router.push('/bodega');
        } else {
          router.push('/pos');
        }`;

code = code.replace(new RegExp(oldRouting.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newRouting);

fs.writeFileSync(path, code);
console.log('Patched', path);
