const fs = require('fs');

const path = 'src/app/admin/page.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');
  
  // Remove (tienda online) from the table header
  code = code.replace(
    /<span className="text-\[9px\] lowercase text-purple-600 font-extrabold block">\(tienda online\)<\/span>/g,
    ''
  );
  
  // Remove Ecommerce from bulk edit modal
  code = code.replace(
    /<span className="text-\[9\.5px\] text-purple-600 mt-0\.5 block font-bold">Ecommerce<\/span>/g,
    ''
  );
  
  // Remove tienda online from individual edit modal
  code = code.replace(
    /<span className="text-\[10px\] text-purple-600 mt-1 block font-bold">Precio mostrado por defecto en tienda online<\/span>/g,
    ''
  );
  
  fs.writeFileSync(path, code);
  console.log('Patched admin page labels');
}
