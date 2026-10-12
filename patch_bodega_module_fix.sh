sed -i '' -e '/handleMarkOrderDeliveredFromPos: (id: string) => void;/i\
  handleMarkOrderReadyFromPos: (id: string) => void;\
' src/components/pos/PosBodegaModule.tsx

sed -i '' -e '/handleMarkOrderDeliveredFromPos,/i\
  handleMarkOrderReadyFromPos,\
' src/components/pos/PosBodegaModule.tsx

sed -i '' -e '/{isPending && (/c\
                  {isPending && (\
                    <div className="flex items-center gap-3">\
                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">\
                        <Clock className="w-3.5 h-3.5 animate-spin" />\
                        <span>Bodega preparando...</span>\
                      </span>\
                      <button\
                        type="button"\
                        onClick={() => handleMarkOrderReadyFromPos(order.id)}\
                        className="clay-btn clay-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-amber-500 !shadow-[3px_4px_12px_rgba(245,158,11,0.4)]"\
                      >\
                        <CheckCircle2 className="w-3.5 h-3.5" />\
                        <span>Marcar Lista</span>\
                      </button>\
                    </div>\
                  )}\
' src/components/pos/PosBodegaModule.tsx

