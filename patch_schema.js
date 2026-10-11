const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('specialEssencePrice')) {
  schema = schema.replace(
    'preferredDoc    String?           @default("01")',
    'preferredDoc    String?           @default("01")\n  specialEssencePrice Decimal?      @db.Decimal(10, 2)\n  specialBottlePrice  Decimal?      @db.Decimal(10, 2)'
  );
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('Added special prices to schema');
} else {
  console.log('Already added');
}
