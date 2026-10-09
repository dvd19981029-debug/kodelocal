const fs = require('fs');

function removeBackdoor(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // The backdoor block:
  const backdoorRegex = /if \(\!isStaff\) \{\n\s*const host = request\.headers\.get\('host'\) \|\| '';\n\s*const referer = request\.headers\.get\('referer'\) \|\| '';\n\s*const isInternalLocal = [^}]+\}\n\s*\}/g;
  code = code.replace(backdoorRegex, '');

  const backdoorRegex2 = /if \(\!isStaff\) \{\n\s*const host = request\.headers\.get\('host'\) \|\| '';\n\s*const referer = request\.headers\.get\('referer'\) \|\| '';\n\s*if \([^}]+\) \{\n\s*isStaff = true;\n\s*\}\n\s*\}/g;
  code = code.replace(backdoorRegex2, '');

  fs.writeFileSync(file, code);
  console.log('Removed backdoors from ' + file);
}

removeBackdoor('src/app/api/products/route.ts');
removeBackdoor('src/app/api/kardex/route.ts');
