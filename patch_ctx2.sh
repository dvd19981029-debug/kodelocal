sed -i '' -e '/subtotal: number;/a\
  rawSubtotal: number;\
  discountTotal: number;\
' src/context/EcommerceCartContext.tsx

sed -i '' -e '/const subtotal = useMemo/i\
  const rawSubtotal = useMemo(() => Number(cart.reduce((acc, it) => acc + it.totalPrice, 0).toFixed(2)), [cart]);\
  const discountTotal = useMemo(() => {\
    if (customer?.tier?.discountPct && rawSubtotal > 0) {\
      const pct = Number(customer.tier.discountPct);\
      if (pct > 0) return Number((rawSubtotal * (pct / 100)).toFixed(2));\
    }\
    return 0;\
  }, [rawSubtotal, customer?.tier?.discountPct]);\
' src/context/EcommerceCartContext.tsx

sed -i '' -e '/const subtotal = useMemo(() => {/,/}, \[cart, customer?.tier?.discountPct\]);/c\
  const subtotal = useMemo(() => Number((rawSubtotal - discountTotal).toFixed(2)), [rawSubtotal, discountTotal]);\
' src/context/EcommerceCartContext.tsx

sed -i '' -e '/subtotal,/a\
    rawSubtotal,\
    discountTotal,\
' src/context/EcommerceCartContext.tsx

