sed -i '' -e '/const refreshCustomers = async () => {/i\
  const refreshCustomerTiers = async () => {\
    try {\
      const res = await fetch("/api/customers/tiers");\
      const data = await res.json();\
      if (data.success && Array.isArray(data.tiers)) {\
        setCustomerTiers(data.tiers);\
      }\
    } catch (e) { console.error("Error fetching tiers", e); }\
  };\
' src/app/pos/page.tsx

sed -i '' -e '/refreshCustomers();/a\
    refreshCustomerTiers();\
' src/app/pos/page.tsx

