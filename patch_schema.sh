sed -i '' -e '/model Customer {/i\
model CustomerTier {\
  id          String     @id @default(cuid())\
  name        String     @unique\
  discountPct Decimal    @db.Decimal(5, 2)\
  badgeColor  String?    @default("blue")\
  customers   Customer[]\
  createdAt   DateTime   @default(now())\
  updatedAt   DateTime   @updatedAt\
}\
' prisma/schema.prisma
sed -i '' -e '/preferredDoc    String?/a\
  tierId          String?\
  tier            CustomerTier?     @relation(fields: [tierId], references: [id], onDelete: SetNull)\
' prisma/schema.prisma
