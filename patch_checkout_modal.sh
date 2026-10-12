sed -i '' -e '/export function PosCheckoutModal/i\
import { useState, useMemo } from "react";\
' src/app/pos/components/modals/PosCheckoutModal.tsx

sed -i '' -e '/export function PosCheckoutModal/a\
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

sed -i '' -e '/<label className="text-xs font-bold text-slate-600/c\
          <div className="flex items-center justify-between mb-1.5">\
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">\
              Cliente para la Facturación\
            </label>\
            <input\
              type="text"\
              placeholder="Buscar por nombre, correo, DUI o NRC..."\
              value={customerSearchQuery}\
              onChange={(e) => setCustomerSearchQuery(e.target.value)}\
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"\
            />\
          </div>\
' src/app/pos/components/modals/PosCheckoutModal.tsx

sed -i '' -e 's/{customers.map((c) => (/{filteredCustomers.map((c) => (/g' src/app/pos/components/modals/PosCheckoutModal.tsx
