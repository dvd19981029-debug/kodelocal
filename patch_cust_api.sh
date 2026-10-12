sed -i '' -e '/tierId,/a\
      customDiscountPct,\
' src/app/api/customers/route.ts

sed -i '' -e '/tierId: tierId || null,/a\
          customDiscountPct: customDiscountPct != null ? Number(customDiscountPct) : null,\
' src/app/api/customers/route.ts
