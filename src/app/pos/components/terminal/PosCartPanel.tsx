import React from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  User, 
  X, 
  UserPlus, 
  Search, 
  Box, 
  Droplets, 
  Minus, 
  Plus, 
  FileText, 
  Banknote,
  Truck,
  Store
} from 'lucide-react';
import { CartItem } from '@/lib/store';
import { getProductImage } from '@/lib/perfumeImages';
import { isHalloweenPromoProduct, HALLOWEEN_PROMO_PRICE_1OZ, HALLOWEEN_PROMO_PRICE_HALF_OZ } from '@/lib/halloweenPromo';
import { CustomerRecord } from '@/lib/customers';
import { DEPARTAMENTOS_CATALOG, getMunicipiosByDepartamento } from '@/lib/svTerritory';
import { TipoComprobante, PosTab } from '../../types';

export interface PosCartPanelProps {
  cart: CartItem[];
  totalItemsCount: number;
  clearCart: () => void;
  // Customer selection
  selectedCustomerObj: CustomerRecord | null;
  tipoComprobante: TipoComprobante;
  cartCustomerQuery: string;
  setCartCustomerQuery: (query: string) => void;
  isCartCustomerDropdownOpen: boolean;
  setIsCartCustomerDropdownOpen: (isOpen: boolean) => void;
  filteredCartCustomers: CustomerRecord[];
  handleSelectCustomer: (customerId: string, explicitCustomer?: CustomerRecord) => void;
  handleOpenNewCustomerModal: () => void;
  setCustName: (name: string) => void;
  // Domicilio toggle & fields
  isOrderDomicilio?: boolean;
  setIsOrderDomicilio?: (val: boolean) => void;
  domicilioPhone?: string;
  setDomicilioPhone?: (val: string) => void;
  domicilioDepartment?: string;
  setDomicilioDepartment?: (val: string) => void;
  domicilioMunicipality?: string;
  setDomicilioMunicipality?: (val: string) => void;
  domicilioAddress?: string;
  setDomicilioAddress?: (val: string) => void;
  domicilioReference?: string;
  setDomicilioReference?: (val: string) => void;
  domicilioPaymentMode?: 'CONTRA_ENTREGA' | 'TARJETA' | 'TRANSFERENCIA';
  setDomicilioPaymentMode?: (val: 'CONTRA_ENTREGA' | 'TARJETA' | 'TRANSFERENCIA') => void;
  // Bodega order toast
  orderSentToast: { orderNumber: string } | null;
  setPosTab: (tab: PosTab) => void;
  // Cart item management
  getItemUnitPrice: (item: CartItem) => number;
  removeFromCart: (productId: string, presentation?: 'ONZA_COMPLETA' | 'MEDIA_ONZA') => void;
  setItemPresentation: (
    productId: string, 
    currentPresentation: 'ONZA_COMPLETA' | 'MEDIA_ONZA', 
    newPresentation: 'ONZA_COMPLETA' | 'MEDIA_ONZA'
  ) => void;
  updateQuantity: (productId: string, delta: number, presentation?: 'ONZA_COMPLETA' | 'MEDIA_ONZA') => void;
  // Financial totals
  subtotalNeto: number;
  ivaCalculado: number;
  cartSubtotal: number;
  // Actions
  handleSendOrderToBodega: () => void;
  handleOpenQuoteModal: () => void;
  onOpenQuoteHistory?: () => void;
  onOpenCheckout: () => void;
  /** Número de la prefactura cargada para edición (si aplica) */
  editingQuoteNumber?: string | null;
}

export const PosCartPanel: React.FC<PosCartPanelProps> = ({
  cart,
  totalItemsCount,
  clearCart,
  selectedCustomerObj,
  tipoComprobante,
  cartCustomerQuery,
  setCartCustomerQuery,
  isCartCustomerDropdownOpen,
  setIsCartCustomerDropdownOpen,
  filteredCartCustomers,
  handleSelectCustomer,
  handleOpenNewCustomerModal,
  setCustName,
  isOrderDomicilio = false,
  setIsOrderDomicilio,
  domicilioPhone = '',
  setDomicilioPhone,
  domicilioDepartment = 'San Salvador',
  setDomicilioDepartment,
  domicilioMunicipality = 'San Salvador',
  setDomicilioMunicipality,
  domicilioAddress = '',
  setDomicilioAddress,
  domicilioReference = '',
  setDomicilioReference,
  domicilioPaymentMode = 'CONTRA_ENTREGA',
  setDomicilioPaymentMode,
  orderSentToast,
  setPosTab,
  getItemUnitPrice,
  removeFromCart,
  setItemPresentation,
  updateQuantity,
  subtotalNeto,
  ivaCalculado,
  cartSubtotal,
  handleSendOrderToBodega,
  handleOpenQuoteModal,
  onOpenQuoteHistory,
  onOpenCheckout,
  editingQuoteNumber,
}) => {
  return (
    <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
      <div className="clay-card p-3 sm:p-4 flex flex-col h-auto xl:sticky xl:top-20">
        
        {/* Header del Carrito */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner font-bold">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-800 leading-none">Orden Actual</h2>
              <span className="text-[10px] text-slate-400 font-medium">{totalItemsCount} unidades</span>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Vaciar
            </button>
          )}
        </div>

        {editingQuoteNumber && (
          <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-bold flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-px" />
            <span>
              Editando prefactura <span className="font-mono">{editingQuoteNumber}</span>. Al enviarla a prefactura de nuevo
              reemplaza la anterior; al enviarla a bodega queda confirmada.
            </span>
          </div>
        )}

        {/* Selector de Cliente para Cotización y Venta (Buscador Interactivo) */}
        <div className="mt-2.5 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100/80 space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cliente:</span>
              {selectedCustomerObj && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-black tracking-tight ${
                  tipoComprobante === '03' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {tipoComprobante === '03' ? 'CCF (03)' : 'FC (01)'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {selectedCustomerObj ? (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectCustomer('');
                    setCartCustomerQuery('');
                    setIsCartCustomerDropdownOpen(false);
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-bold flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-rose-50 transition-colors"
                  title="Cambiar cliente y volver a Consumidor Final"
                >
                  <X className="w-3 h-3" /> Quitar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsCartCustomerDropdownOpen(false);
                    handleOpenNewCustomerModal();
                  }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-md border border-indigo-200/70 hover:bg-indigo-50 shadow-2xs transition-colors"
                >
                  <UserPlus className="w-3 h-3" /> + Nuevo
                </button>
              )}
            </div>
          </div>

          {/* Estado A: Cliente ya seleccionado */}
          {selectedCustomerObj ? (
            <div className="p-2 rounded-lg bg-white border border-indigo-200/80 shadow-2xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-extrabold text-xs text-slate-800 truncate leading-tight">
                    {selectedCustomerObj.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                  {selectedCustomerObj.numDocumento && (
                    <span>DUI: {selectedCustomerObj.numDocumento}</span>
                  )}
                  {selectedCustomerObj.nrc && (
                    <span className="font-mono text-purple-700 font-bold">NRC: {selectedCustomerObj.nrc}</span>
                  )}
                  {selectedCustomerObj.phone && (
                    <span>Tel: {selectedCustomerObj.phone}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleSelectCustomer('');
                  setCartCustomerQuery('');
                  setIsCartCustomerDropdownOpen(true);
                }}
                className="px-2 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md shrink-0 transition-colors"
                title="Buscar otro cliente"
              >
                Cambiar
              </button>
            </div>
          ) : (
            /* Estado B: Buscador de Cliente Interactivo */
            <div className="relative">
              {isCartCustomerDropdownOpen && (
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsCartCustomerDropdownOpen(false)} 
                />
              )}

              <div className="relative flex items-center z-40">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Buscar cliente (Nombre, Correo, DUI o NRC)..."
                  value={cartCustomerQuery}
                  onChange={(e) => {
                    setCartCustomerQuery(e.target.value);
                    setIsCartCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCartCustomerDropdownOpen(true)}
                  className="w-full text-xs font-medium pl-9 pr-7 py-1.5 rounded-lg bg-white border border-indigo-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-2xs"
                />
                {cartCustomerQuery && (
                  <button
                    type="button"
                    onClick={() => setCartCustomerQuery('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-600"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Dropdown de resultados de búsqueda */}
              {isCartCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* Opción rápida: Consumidor Final */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCustomer('');
                      setCartCustomerQuery('');
                      setIsCartCustomerDropdownOpen(false);
                    }}
                    className="w-full p-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">👤</span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs truncate">Consumidor Final</p>
                        <p className="text-[10px] text-slate-400 truncate">Venta Rápida sin datos fiscales</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                      FC (01)
                    </span>
                  </button>

                  {/* Listado de clientes que coinciden con la búsqueda */}
                  {filteredCartCustomers.length === 0 ? (
                    <div className="p-3 text-center">
                      <p className="text-xs text-slate-500 font-medium">No se encontró cliente con ese nombre o documento</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCartCustomerDropdownOpen(false);
                          handleOpenNewCustomerModal();
                          setCustName(cartCustomerQuery);
                        }}
                        className="mt-1 text-[11px] font-black text-indigo-600 hover:underline"
                      >
                        + Registrar &quot;{cartCustomerQuery}&quot; ahora
                      </button>
                    </div>
                  ) : (
                    filteredCartCustomers.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => {
                          handleSelectCustomer(cust.id, cust);
                          setCartCustomerQuery('');
                          setIsCartCustomerDropdownOpen(false);
                        }}
                        className="w-full p-2 text-left hover:bg-indigo-50/80 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-900">
                              {cust.name}
                            </p>
                            {cust.nombreComercial && (
                              <span className="text-[10px] text-slate-400 truncate">({cust.nombreComercial})</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {cust.numDocumento && <span>DUI: {cust.numDocumento}</span>}
                            {cust.nrc && <span className="font-mono text-purple-700 font-bold">NRC: {cust.nrc}</span>}
                            {cust.phone && <span>Tel: {cust.phone}</span>}
                          </p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                          cust.nrc || cust.tipoPersona === 'JURIDICA' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {cust.nrc || cust.tipoPersona === 'JURIDICA' ? 'CCF (03)' : 'FC (01)'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selector de Tipo de Entrega: Mostrador vs Domicilio */}
          {setIsOrderDomicilio && (
            <div className="pt-1.5 border-t border-indigo-200/60 space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsOrderDomicilio(false)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    !isOrderDomicilio
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Mostrador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrderDomicilio(true)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    isOrderDomicilio
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Domicilio</span>
                </button>
              </div>

              {isOrderDomicilio && (
                <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200/90 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-wide flex items-center gap-1">
                      <Truck className="w-3 h-3 text-blue-600" />
                      <span>Datos de Envío (Guía C807)</span>
                    </span>
                    {selectedCustomerObj ? (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 truncate max-w-[170px]">
                        ✓ Precargado de {selectedCustomerObj.name.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Selecciona cliente arriba
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Teléfono *</label>
                      <input
                        type="text"
                        value={domicilioPhone || selectedCustomerObj?.phone || ''}
                        onChange={(e) => setDomicilioPhone && setDomicilioPhone(e.target.value)}
                        placeholder="7000-0000"
                        className="w-full px-2 py-1 text-[11px] rounded-md border border-blue-200 bg-white font-mono font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Departamento *</label>
                      <select
                        value={domicilioDepartment || selectedCustomerObj?.departamento || 'San Salvador'}
                        onChange={(e) => {
                          const d = e.target.value;
                          if (setDomicilioDepartment) setDomicilioDepartment(d);
                          const munis = getMunicipiosByDepartamento(d);
                          if (munis.length > 0 && setDomicilioMunicipality) {
                            setDomicilioMunicipality(munis[0].nombre);
                          }
                        }}
                        className="w-full px-1.5 py-1 text-[11px] rounded-md border border-blue-200 bg-white font-bold text-slate-800"
                      >
                        {DEPARTAMENTOS_CATALOG.map((dep) => (
                          <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Municipio (Tradicional C807) *</label>
                    <select
                      value={domicilioMunicipality}
                      onChange={(e) => setDomicilioMunicipality && setDomicilioMunicipality(e.target.value)}
                      className="w-full px-1.5 py-1 text-[11px] rounded-md border border-blue-200 bg-white font-bold text-slate-800"
                    >
                      {getMunicipiosByDepartamento(domicilioDepartment || selectedCustomerObj?.departamento || 'San Salvador').map((m) => (
                        <option key={m.id} value={m.nombre}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Dirección detallada de entrega *</label>
                    <input
                      type="text"
                      value={domicilioAddress || selectedCustomerObj?.direccion || ''}
                      onChange={(e) => setDomicilioAddress && setDomicilioAddress(e.target.value)}
                      placeholder="Colonia, calle, pasaje, # de casa..."
                      className="w-full px-2 py-1 text-[11px] rounded-md border border-blue-200 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Referencia (Opcional)</label>
                    <input
                      type="text"
                      value={domicilioReference}
                      onChange={(e) => setDomicilioReference && setDomicilioReference(e.target.value)}
                      placeholder="Ej. Frente a parque, portón negro..."
                      className="w-full px-2 py-1 text-[11px] rounded-md border border-blue-200 bg-white text-slate-800"
                    />
                  </div>
                  <div className="pt-1 border-t border-blue-200/70">
                    <label className="text-[9.5px] font-black text-blue-950 uppercase tracking-wide block mb-1">
                      Tipo de Servicio / Cobro en Guía C807 *
                    </label>
                    <div className="grid grid-cols-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setDomicilioPaymentMode && setDomicilioPaymentMode('CONTRA_ENTREGA')}
                        className={`w-full px-2.5 py-1.5 rounded-md text-[10.5px] font-bold text-left flex items-center justify-between border transition-all ${
                          domicilioPaymentMode === 'CONTRA_ENTREGA'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50/50'
                        }`}
                      >
                        <span>💵 Contra Entrega en Efectivo</span>
                        <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                          domicilioPaymentMode === 'CONTRA_ENTREGA'
                            ? 'bg-amber-700/60 text-white'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          CCE • Cobrar ${cartSubtotal.toFixed(2)}
                        </span>
                      </button>

                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setDomicilioPaymentMode && setDomicilioPaymentMode('TARJETA')}
                          className={`px-2 py-1.5 rounded-md text-[10px] font-bold text-left flex flex-col justify-between border transition-all ${
                            domicilioPaymentMode === 'TARJETA'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50/50'
                          }`}
                        >
                          <span>💳 Ya Pagó (Tarjeta)</span>
                          <span className={`text-[8.5px] font-mono font-black mt-0.5 ${
                            domicilioPaymentMode === 'TARJETA' ? 'text-emerald-100' : 'text-emerald-700'
                          }`}>
                            Regular (SER) • $0.00
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDomicilioPaymentMode && setDomicilioPaymentMode('TRANSFERENCIA')}
                          className={`px-2 py-1.5 rounded-md text-[10px] font-bold text-left flex flex-col justify-between border transition-all ${
                            domicilioPaymentMode === 'TRANSFERENCIA'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50/50'
                          }`}
                        >
                          <span>🏦 Ya Pagó (Transfer.)</span>
                          <span className={`text-[8.5px] font-mono font-black mt-0.5 ${
                            domicilioPaymentMode === 'TRANSFERENCIA' ? 'text-emerald-100' : 'text-emerald-700'
                          }`}>
                            Regular (SER) • $0.00
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toast de Orden Enviada a Bodega */}
        {orderSentToast && (
          <div className="mt-2 p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Box className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <div className="min-w-0">
                <p className="font-black text-[11px] leading-tight truncate">¡Orden #{orderSentToast.orderNumber} enviada!</p>
                <p className="text-[9px] text-emerald-100 leading-tight">En preparación para caja.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPosTab('caja_facturacion')}
              className="px-2 py-0.5 text-[9px] font-black rounded bg-white text-emerald-800 shadow-2xs hover:bg-emerald-50 shrink-0"
            >
              Ver en Caja
            </button>
          </div>
        )}

        {/* Lista de productos en el carrito */}
        <div className="py-2 space-y-1.5 pr-0.5">
          {cart.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400 text-center p-3">
              <Droplets className="w-8 h-8 mb-1.5 opacity-30 text-indigo-400" />
              <p className="font-bold text-xs text-slate-600">Orden Vacía</p>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-[180px]">
                Elige esencias o envases del catálogo para cotizar y cobrar
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const itemPres = item.presentation || 'ONZA_COMPLETA';
              const cat = item.product.category || '';
              const isEssence = cat === 'Esencias para Perfume' || cat === 'Esencias & Fragancias' || item.product.unit === 'Onza';
              const isBottle = cat === 'Botes' || cat === 'Botes & Envases' || cat === 'Envases & Botes' || item.product.name.toLowerCase().startsWith('bote') || item.product.name.toLowerCase().includes('frasco');
              const unitPrice = getItemUnitPrice(item);
              const isHalloweenPromo = isEssence && isHalloweenPromoProduct(item.product);
              const fullPriceVal = isHalloweenPromo
                ? HALLOWEEN_PROMO_PRICE_1OZ
                : (isEssence && selectedCustomerObj?.specialEssencePrice) 
                ? Number(selectedCustomerObj.specialEssencePrice) 
                : (isBottle && selectedCustomerObj?.specialBottlePrice ? Number(selectedCustomerObj.specialBottlePrice) : item.product.price);
              const halfPriceVal = isHalloweenPromo
                ? HALLOWEEN_PROMO_PRICE_HALF_OZ
                : (isEssence && selectedCustomerObj?.specialHalfEssencePrice) 
                ? Number(selectedCustomerObj.specialHalfEssencePrice) 
                : (item.product.priceHalfOunce != null ? Number(item.product.priceHalfOunce) : 1.90);

              return (
                <div 
                  key={`${item.product.id}-${itemPres}`}
                  className="p-2 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs hover:border-indigo-200 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-8 h-10 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={item.product.imageUrl || getProductImage(item.product)}
                        alt={item.product.officialName || item.product.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded shrink-0">
                          #{item.product.sku}
                        </span>
                        <h4 className="font-bold text-[11px] text-slate-800 truncate leading-tight">
                          {item.product.officialName || item.product.name}
                        </h4>
                      </div>
                      {item.product.officialName && item.product.officialName !== item.product.name && (
                        <p className="text-[10.5px] text-slate-600 font-semibold leading-snug truncate">
                          {isEssence ? (
                            <>Inspirado en <span className="font-black text-slate-950">{item.product.name}</span></>
                          ) : (
                            <span>{item.product.name}</span>
                          )}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                        <span className="font-medium text-slate-700">
                          ${unitPrice.toFixed(2)}/{itemPres === 'MEDIA_ONZA' ? '½ Oz' : item.product.unit}
                        </span>
                        {item.product.puesto && (
                          <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded font-medium truncate">
                            📍 {item.product.puesto}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón eliminar item */}
                    {(() => {
                      const presArg = itemPres === 'MEDIA_ONZA' || itemPres === 'ONZA_COMPLETA' ? itemPres : undefined;
                      return (
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id, presArg)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                          title="Quitar producto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      );
                    })()}
                  </div>

                  {/* Selector de Presentación para Esencias y Controles de Cantidad */}
                  <div className="flex items-center justify-between gap-2 flex-wrap gap-y-1.5 pt-1 border-t border-slate-100/80">
                    {isEssence ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setItemPresentation(item.product.id, itemPres as any, 'ONZA_COMPLETA')}
                          className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded transition-all ${
                            itemPres === 'ONZA_COMPLETA'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`1 Onza: ${fullPriceVal.toFixed(2)}`}
                        >
                          1 Oz (${fullPriceVal.toFixed(2)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemPresentation(item.product.id, itemPres as any, 'MEDIA_ONZA')}
                          className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded transition-all ${
                            itemPres === 'MEDIA_ONZA'
                              ? 'bg-violet-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`½ Onza: ${halfPriceVal.toFixed(2)}`}
                        >
                          ½ Oz (${halfPriceVal.toFixed(2)})
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.product.unit}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-200/80 shrink-0">
                        {(() => {
                          const presArg = itemPres === 'MEDIA_ONZA' || itemPres === 'ONZA_COMPLETA' ? itemPres : undefined;
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, -1, presArg)}
                                className="w-4 h-4 rounded bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center active:scale-90 shadow-2xs"
                                title="Reducir cantidad"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-[11px] font-black w-4 text-center text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, 1, presArg)}
                                className="w-4 h-4 rounded bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center active:scale-90 shadow-2xs"
                                title="Aumentar cantidad"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </>
                          );
                        })()}
                      </div>

                      {/* Subtotal del item */}
                      <div className="text-right min-w-[48px] shrink-0">
                        <span className="font-black text-[11.5px] font-mono text-slate-900">
                          ${(unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desglose de Totales e Impuestos */}
        {cart.length > 0 && (
          <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-1 shrink-0">
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Subtotal (Neto):</span>
              <span>${subtotalNeto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>IVA (13%):</span>
              <span>${ivaCalculado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-black text-slate-900 pt-1.5 border-t border-slate-100 items-baseline">
              <span>Total Estimado:</span>
              <span className="text-indigo-600 text-lg font-black">
                ${cartSubtotal.toFixed(2)}
              </span>
            </div>

            {/* Botón Principal: Mandar a Bodega (compacto y ergonómico) */}
            <button
              type="button"
              onClick={handleSendOrderToBodega}
              className="clay-btn clay-btn-primary w-full py-2 px-3 text-xs mt-1 rounded-xl shadow-md flex items-center justify-center gap-1.5 font-bold !bg-gradient-to-r !from-indigo-600 !to-indigo-800 text-white hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <Box className="w-3.5 h-3.5 text-amber-300" />
              <span>Enviar a Preparar (Bodega)</span>
            </button>

            {/* Fila de Botones Secundarios: Prefactura y Cobro Directo */}
            <div className="grid grid-cols-2 gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={handleOpenQuoteModal}
                className="clay-btn clay-btn-light py-1.5 px-2 text-[11px] rounded-lg flex items-center justify-center gap-1 font-bold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-all"
                title="Guardar como prefactura (cotización) para confirmar con el cliente; podrás enviarla a bodega después"
              >
                <FileText className="w-3 h-3 text-indigo-600" />
                <span>Enviar a prefactura</span>
              </button>

              <button
                type="button"
                onClick={onOpenCheckout}
                className="clay-btn clay-btn-success py-1.5 px-2 text-[11px] rounded-lg flex items-center justify-center gap-1 font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-all"
                title="Cobrar directamente sin enviar a bodega"
              >
                <Banknote className="w-3 h-3 text-emerald-700" />
                <span>Cobro Directo</span>
              </button>
            </div>
          </div>
        )}

        {onOpenQuoteHistory && (
          <button
            type="button"
            onClick={onOpenQuoteHistory}
            className="clay-btn clay-btn-light w-full py-1.5 px-2 text-[11px] rounded-lg flex items-center justify-center gap-1 font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-all shrink-0"
            title="Ver las prefacturas pendientes de confirmar"
          >
            <FileText className="w-3 h-3 text-amber-600" />
            <span>Ver prefacturas</span>
          </button>
        )}
      </div>
    </div>
  );
};
