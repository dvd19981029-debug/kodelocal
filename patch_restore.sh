sed -i '' -e '/const formatCartItem/i\
  const getItemPriceDetails = (item: CartItem) => {\
    let listPrice = item.product.price;\
    const isEssence = item.product.category === "Esencias para Perfume" || !item.product.category;\
    const isBottle = item.product.category === "Botes" || item.product.category === "Botes & Envases";\
\
    if (isEssence && activeCustomer?.specialEssencePrice) {\
      listPrice = Number(activeCustomer.specialEssencePrice);\
    } else if (isBottle && activeCustomer?.specialBottlePrice) {\
      listPrice = Number(activeCustomer.specialBottlePrice);\
    }\
\
    if (item.presentation === "MEDIA_ONZA") {\
      if (isEssence && activeCustomer?.specialEssencePrice) {\
        listPrice = Number((activeCustomer.specialEssencePrice / 2).toFixed(2));\
      } else if (item.product.priceHalfOunce != null) {\
        listPrice = Number(item.product.priceHalfOunce);\
      } else {\
        listPrice = Number((listPrice / 2).toFixed(2));\
      }\
    }\
\
    let finalPrice = listPrice;\
    let discountAmt = 0;\
    const customerTier = customerTiers.find(t => t.id === custTierId) || activeCustomer?.tier;\
    if (customerTier && customerTier.discountPct) {\
      const pct = Number(customerTier.discountPct);\
      if (pct > 0) {\
        discountAmt = Number((listPrice * (pct / 100)).toFixed(4));\
        finalPrice = Number((listPrice - discountAmt).toFixed(2));\
      }\
    }\
    return { listPrice, finalPrice, discountAmt };\
  };\
\
  const getItemUnitPrice = (item: CartItem): number => getItemPriceDetails(item).finalPrice;\
' src/app/pos/page.tsx
