sed -i '' -e '868i\
  const handleMarkOrderReadyFromPos = async (orderId: string) => {\
    const targetSale = sales.find(s => s.id === orderId || s.saleNumber === orderId);\
    try {\
      const staffToken = await getStaffToken();\
      if (!targetSale || targetSale.channel === "ONLINE") {\
        fetch("/api/ecommerce/orders", {\
          method: "PATCH",\
          headers: {\
            "Content-Type": "application/json",\
            ...(staffToken ? { "x-staff-token": staffToken } : {}),\
          },\
          body: JSON.stringify({ orderId, orderStatus: "READY_AT_WINDOW" }),\
        }).catch(err => console.error(err));\
      }\
      if (!targetSale || targetSale.channel !== "ONLINE") {\
        fetch("/api/sales", {\
          method: "PATCH",\
          headers: { "Content-Type": "application/json" },\
          body: JSON.stringify({ id: orderId, saleNumber: targetSale?.saleNumber, orderStatus: "READY_AT_WINDOW" }),\
        }).catch(() => {});\
      }\
    } catch (e) {}\
    setSales(prev => prev.map(s => (s.id === orderId || s.saleNumber === orderId) ? { ...s, status: "READY_AT_WINDOW" } : s));\
    triggerSalesSync();\
  };\
' src/app/pos/page.tsx
