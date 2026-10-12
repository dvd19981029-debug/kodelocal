sed -i '' -e '/precioUnitario: Number(it.price || it.precioUnitario || 0),/a\
        montoDescuento: Number(it.discountAmt || it.montoDescuento || 0),\
' src/app/api/dte/route.ts
