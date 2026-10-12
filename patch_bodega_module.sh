sed -i '' -e '/handleMarkOrderDeliveredFromPos: (id: string) => void;/i\
  handleMarkOrderReadyFromPos: (id: string) => void;\
' src/components/pos/PosBodegaModule.tsx

sed -i '' -e '/handleMarkOrderDeliveredFromPos,/i\
  handleMarkOrderReadyFromPos,\
' src/components/pos/PosBodegaModule.tsx

sed -i '' -e '/{isPending && (/a\
                    <button\
                      type="button"\
                      onClick={() => handleMarkOrderReadyFromPos(order.id)}\
                      className="clay-btn clay-btn-primary px-4 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-amber-500 !shadow-[3px_4px_12px_rgba(245,158,11,0.4)]"\
                    >\
                      <CheckCircle2 className="w-4 h-4" />\
                      <span>Marcar como Lista</span>\
                    </button>\
' src/components/pos/PosBodegaModule.tsx
