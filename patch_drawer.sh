sed -i '' -e 's/subtotal,/subtotal,\n    rawSubtotal,\n    discountTotal,/g' src/components/ecommerce/CartDrawer.tsx

sed -i '' -e '/<span>Subtotal:<\/span>/c\
                  <span>Subtotal:</span>\
                  <span className={discountTotal > 0 ? "font-bold text-slate-500 line-through" : "font-black text-slate-900"}>\
                    ${rawSubtotal.toFixed(2)}\
                  </span>\
' src/components/ecommerce/CartDrawer.tsx

sed -i '' -e '/<span className={discountTotal > 0 ?/i\
                {discountTotal > 0 && (\
                  <div className="flex items-center justify-between text-indigo-700 font-bold">\
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Descuento VIP:</span>\
                    <span>-${discountTotal.toFixed(2)}</span>\
                  </div>\
                )}\
' src/components/ecommerce/CartDrawer.tsx

sed -i '' -e '/import { ShoppingBag/c\
import { ShoppingBag, X, Trash2, Tag, Truck } from "lucide-react";\
' src/components/ecommerce/CartDrawer.tsx
