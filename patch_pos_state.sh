sed -i '' -e '/const \[custTierId, setCustTierId\] = useState("");/a\
  const [custCustomDiscountPct, setCustCustomDiscountPct] = useState<string>("");\
' src/app/pos/page.tsx

sed -i '' -e '/setCustTierId(cust.tierId || "");/a\
    setCustCustomDiscountPct(cust.customDiscountPct ? String(cust.customDiscountPct) : "");\
' src/app/pos/page.tsx

sed -i '' -e '/setCustTierId("");/a\
    setCustCustomDiscountPct("");\
' src/app/pos/page.tsx

sed -i '' -e '/tierId: custTierId || null,/a\
      customDiscountPct: custCustomDiscountPct ? Number(custCustomDiscountPct) : null,\
' src/app/pos/page.tsx

sed -i '' -e '/setCustTierId={setCustTierId}/a\
        custCustomDiscountPct={custCustomDiscountPct}\
        setCustCustomDiscountPct={setCustCustomDiscountPct}\
' src/app/pos/page.tsx
