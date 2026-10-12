sed -i '' -e '1i\
import { useState, useMemo } from "react";\
' src/app/pos/components/modals/PosCheckoutModal.tsx

sed -i '' -e '/if (!isOpen) return null;/i\
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");\
  const filteredCustomers = useMemo(() => {\
    if (!customerSearchQuery.trim()) return customers.slice(0, 50);\
    const q = customerSearchQuery.toLowerCase().trim();\
    return customers.filter(c => \
      (c.name?.toLowerCase().includes(q)) || \
      (c.email?.toLowerCase().includes(q)) || \
      (c.numDocumento?.includes(q)) || \
      (c.nrc?.includes(q))\
    ).slice(0, 50);\
  }, [customers, customerSearchQuery]);\
' src/app/pos/components/modals/PosCheckoutModal.tsx

sed -i '' -e '/<select/i\
          <input\
            type="text"\
            placeholder="Buscar por nombre, correo, DUI o NRC..."\
            value={customerSearchQuery}\
            onChange={(e) => setCustomerSearchQuery(e.target.value)}\
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-full mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"\
          />\
' src/app/pos/components/modals/PosCheckoutModal.tsx

sed -i '' -e 's/{customers.map((c) => (/{filteredCustomers.map((c) => (/g' src/app/pos/components/modals/PosCheckoutModal.tsx
