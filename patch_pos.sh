sed -i '' -e '/const \[custSpecialBottlePrice/a\
  const [custTierId, setCustTierId] = useState("");\
  const [customerTiers, setCustomerTiers] = useState<any[]>([]);\
' src/app/pos/page.tsx

sed -i '' -e '/const fetchCustomers = async/i\
  const fetchTiers = async () => {\
    try {\
      const res = await fetch("/api/customers/tiers");\
      const data = await res.json();\
      if (data.success) setCustomerTiers(data.tiers);\
    } catch (e) { console.error("Error fetching tiers", e); }\
  };\
' src/app/pos/page.tsx

sed -i '' -e '/fetchCustomers();/a\
    fetchTiers();\
' src/app/pos/page.tsx

sed -i '' -e '/setCustNotas(cust.notas || "");/a\
    setCustTierId(cust.tierId || "");\
' src/app/pos/page.tsx

sed -i '' -e '/setCustNotas("");/a\
    setCustTierId("");\
' src/app/pos/page.tsx

sed -i '' -e '/specialBottlePrice: custSpecialBottlePrice/a\
      tierId: custTierId || null,\
' src/app/pos/page.tsx

sed -i '' -e '/custDireccion={custDireccion}/a\
        custTierId={custTierId}\
        setCustTierId={setCustTierId}\
        customerTiers={customerTiers}\
' src/app/pos/page.tsx
