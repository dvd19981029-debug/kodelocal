sed -i '' -e '/discount: it.montoDescuento || 0,/d' src/lib/facturalama.ts
sed -i '' -e '/montoDescuento?: number;/d' src/lib/facturalama.ts

sed -i '' -e '/montoDescuento: Number(it.discountAmt || it.montoDescuento || 0),/d' src/app/api/dte/route.ts
