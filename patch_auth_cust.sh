sed -i '' -e '/tier: customer.tier || null,/a\
          customDiscountPct: customer.customDiscountPct || null,\
' src/app/api/customer/auth/route.ts

sed -i '' -e '/tier: updated.tier || null,/a\
          customDiscountPct: updated.customDiscountPct || null,\
' src/app/api/customer/auth/route.ts
