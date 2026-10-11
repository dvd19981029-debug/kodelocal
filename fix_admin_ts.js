const fs = require('fs');

// 1. Fix AbastecimientoModule.tsx (getStaffToken await)
const abastPath = 'src/components/admin/AbastecimientoModule.tsx';
let abastCode = fs.readFileSync(abastPath, 'utf8');
abastCode = abastCode.replace('const token = getStaffToken();', 'const token = await getStaffToken();');
fs.writeFileSync(abastPath, abastCode);

// 2. Fix api/products/route.ts
const prodPath = 'src/app/api/products/route.ts';
let prodCode = fs.readFileSync(prodPath, 'utf8');

// Include category in existing query
prodCode = prodCode.replace(
  'existing = await prisma.product.findUnique({ where: { id } });',
  'existing = await prisma.product.findUnique({ where: { id }, include: { category: true } });'
);
prodCode = prodCode.replace(
  'existing = await prisma.product.findUnique({ where: { sku: String(sku).trim() } });',
  'existing = await prisma.product.findUnique({ where: { sku: String(sku).trim() }, include: { category: true } });'
);
prodCode = prodCode.replace(
  `existing = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: String(id).trim() },
            { barcode: String(id).trim() },
          ],
        },
      });`,
  `existing = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: String(id).trim() },
            { barcode: String(id).trim() },
          ],
        },
        include: { category: true }
      });`
);
fs.writeFileSync(prodPath, prodCode);

// 3. Fix abastecimiento/route.ts to use DB cost as fallback for new products!
const apiAbastPath = 'src/app/api/admin/abastecimiento/route.ts';
let apiAbastCode = fs.readFileSync(apiAbastPath, 'utf8');
apiAbastCode = apiAbastCode.replace(
  'supplierPriceKg: supplierItem ? supplierItem.price_per_kg : 45.0, // Default $45 si no match',
  'supplierPriceKg: supplierItem ? supplierItem.price_per_kg : (p.cost ? Number(p.cost) * OZ_PER_KG : 45.0), // Uso del costo de la BD de la nueva esencia'
);
apiAbastCode = apiAbastCode.replace(
  'roiScore: (p.price || 0) / (supplierItem ? supplierItem.price_per_kg / OZ_PER_KG : 45.0 / OZ_PER_KG)',
  'roiScore: Number(p.price || 0) / (supplierItem ? supplierItem.price_per_kg / OZ_PER_KG : (p.cost ? Number(p.cost) : 45.0 / OZ_PER_KG))'
);
fs.writeFileSync(apiAbastPath, apiAbastCode);

console.log('Fixed TS & connected predictor to new products DB cost!');
