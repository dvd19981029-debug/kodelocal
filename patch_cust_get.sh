sed -i '' -e '/tierId: c.tierId || null,/a\
      customDiscountPct: c.customDiscountPct || null,\
' src/app/api/customers/route.ts
