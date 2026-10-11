const fs = require('fs');

const path = 'src/app/api/customers/route.ts';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');

  // Update GET mapping
  code = code.replace(
    /notas: c\.notes \|\| '',/,
    "notas: c.notes || '',\n      specialEssencePrice: c.specialEssencePrice ? Number(c.specialEssencePrice) : null,\n      specialBottlePrice: c.specialBottlePrice ? Number(c.specialBottlePrice) : null,"
  );

  // Update POST destructuring
  code = code.replace(
    /notas,\n    } = body;/,
    "notas,\n      specialEssencePrice,\n      specialBottlePrice,\n    } = body;"
  );

  // Update POST data object
  code = code.replace(
    /notes: notas\?\.trim\(\) \|\| null,/,
    "notes: notas?.trim() || null,\n      specialEssencePrice: specialEssencePrice ? Number(specialEssencePrice) : null,\n      specialBottlePrice: specialBottlePrice ? Number(specialBottlePrice) : null,"
  );

  fs.writeFileSync(path, code);
  console.log('Patched /api/customers/route.ts');
}
