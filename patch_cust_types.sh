sed -i '' -e '/tierId?: string | null;/a\
  customDiscountPct?: number | null;\
' src/lib/customers.ts
