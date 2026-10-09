const fs = require('fs');

const path = 'src/app/bodega/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Añadir handleCancelOrder
const oldMarkReady = `  // Marcar pedido como listo para ventanilla
  const handleMarkAsReady = async (orderId: string) => {`;

const newCancelFunction = `  // Cancelar pedido desde bodega
  const handleCancelOrder = async (orderId: string, channel?: 'POS' | 'ONLINE') => {
    if (!confirm('¿Estás seguro de cancelar esta comanda? El inventario será devuelto automáticamente.')) return;
    
    const isWeb = channel === 'ONLINE';
    const staffToken = await getStaffToken();
    
    if (isWeb) {
      fetch('/api/ecommerce/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({ orderId, orderStatus: 'CANCELADO', restock: true })
      }).catch(() => {});
    } else {
      fetch('/api/sales', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(staffToken ? { 'x-staff-token': staffToken } : {}),
        },
        body: JSON.stringify({ id: orderId, orderStatus: 'CANCELADO' })
      }).catch(() => {});
    }

    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === orderId) {
          return { ...s, status: 'CANCELLED' as const };
        }
        return s;
      });
      localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
      window.dispatchEvent(new Event('kodelocal_sales_updated'));
      return updated;
    });
    
    showToast('❌ Comanda cancelada. El inventario ha sido devuelto.');
  };

  // Marcar pedido como listo para ventanilla
  const handleMarkAsReady = async (orderId: string) => {`;

code = code.replace(oldMarkReady, newCancelFunction);

// 2. Modificar el bloque de botones
const oldButtons = `                        {/* Botones de Acción */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {order.vendedor ? \`Caja: \${order.vendedor}\` : 'Caja 1'}
                          </span>

                          <button
                            onClick={() => handleMarkAsReady(order.id)}
                            className={\`clay-btn px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 transition-all \${
                              allItemsChecked 
                                ? 'clay-btn-primary !bg-emerald-600 !shadow-[3px_4px_10px_rgba(16,185,129,0.35)]' 
                                : 'clay-btn-light text-amber-800'
                            }\`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{allItemsChecked ? '¡Listo! Pasar a Ventanilla' : 'Marcar Listo'}</span>
                          </button>
                        </div>`;

const newButtons = `                        {/* Botones de Acción */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {order.vendedor ? \`Caja: \${order.vendedor}\` : 'Caja 1'}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCancelOrder(order.id, order.channel)}
                              title="Cancelar y devolver inventario"
                              className="clay-btn clay-btn-light px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Anular</span>
                            </button>
                            <button
                              onClick={() => handleMarkAsReady(order.id)}
                              className={\`clay-btn px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 transition-all \${
                                allItemsChecked 
                                  ? 'clay-btn-primary !bg-emerald-600 !shadow-[3px_4px_10px_rgba(16,185,129,0.35)]' 
                                  : 'clay-btn-light text-amber-800'
                              }\`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{allItemsChecked ? '¡Listo! Pasar a Ventanilla' : 'Marcar Listo'}</span>
                            </button>
                          </div>
                        </div>`;

code = code.replace(oldButtons, newButtons);

fs.writeFileSync(path, code);
console.log('Patched', path);
