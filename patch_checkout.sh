sed -i '' -e '/<span>Subtotal productos:<\/span>/c\
                  <span>Subtotal productos:</span>\
                  <span className={discountTotal > 0 ? "font-bold text-slate-400 line-through" : "font-bold text-slate-800"}>\
                    ${rawSubtotal.toFixed(2)}\
                  </span>\
' src/app/checkout/page.tsx

sed -i '' -e '/<span className={discountTotal > 0 ? "font-bold text-slate-400 line-through" : "font-bold text-slate-800"}>/i\
                {discountTotal > 0 && (\
                  <div className="flex items-center justify-between text-indigo-700 font-bold mb-1">\
                    <span>Descuento VIP ({customer?.tier?.name}):</span>\
                    <span>-${discountTotal.toFixed(2)}</span>\
                  </div>\
                )}\
' src/app/checkout/page.tsx

