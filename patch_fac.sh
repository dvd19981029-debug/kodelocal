sed -i '' -e '/precioUnitario: number;/a\
  montoDescuento?: number;\
' src/lib/facturalama.ts

sed -i '' -e '/unitPrice: precioNeto > 0 ? precioNeto : 0.01,/a\
        discount: it.montoDescuento || 0,\
' src/lib/facturalama.ts
