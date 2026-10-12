sed -i '' -e '/import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from '"'"'react'"'"';/a\
import { useCustomerAuth } from "@/context/CustomerAuthContext";\
' src/context/EcommerceCartContext.tsx

sed -i '' -e '/const \[isMounted, setIsMounted\] = useState(false);/a\
  const { customer } = useCustomerAuth();\
' src/context/EcommerceCartContext.tsx

sed -i '' -e '/const subtotal = useMemo(() =>/c\
  const subtotal = useMemo(() => {\
    const rawSubtotal = cart.reduce((acc, it) => acc + it.totalPrice, 0);\
    if (customer?.tier?.discountPct) {\
      const pct = Number(customer.tier.discountPct);\
      if (pct > 0) {\
        return Number((rawSubtotal * (1 - (pct / 100))).toFixed(2));\
      }\
    }\
    return Number(rawSubtotal.toFixed(2));\
  }, [cart, customer?.tier?.discountPct]);\
' src/context/EcommerceCartContext.tsx

