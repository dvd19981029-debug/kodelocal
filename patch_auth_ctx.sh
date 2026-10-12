sed -i '' -e '/sessionToken?: string;/a\
  tierId?: string | null;\
  tier?: any | null;\
  customDiscountPct?: number | null;\
' src/context/CustomerAuthContext.tsx
