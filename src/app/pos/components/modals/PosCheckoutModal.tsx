import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  X, 
  CheckCircle2, 
  Users, 
  FileCheck, 
  ShieldCheck, 
  Banknote, 
  CreditCard, 
  Building, 
  QrCode 
} from 'lucide-react';
import { CustomerRecord } from '@/lib/customers';
import { 
  DEPARTAMENTOS_CATALOG, 
  getMunicipiosByDepartamento 
} from '@/lib/svTerritory';
import { PaymentMethod, TipoComprobante } from '../../types';

export interface PosCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToInvoice: any | null;
  customers: CustomerRecord[];
  selectedCustomerId: string;
  handleSelectCustomer: (customerId: string) => void;
  handleOpenNewCustomerModal: () => void;
  tipoComprobante: TipoComprobante;
  setTipoComprobante: (tipo: TipoComprobante) => void;
  clienteNombre: string;
  setClienteNombre: (val: string) => void;
  clienteDoc: string;
  setClienteDoc: (val: string) => void;
  clienteNrc: string;
  setClienteNrc: (val: string) => void;
  clienteGiro: string;
  setClienteGiro: (val: string) => void;
  clienteEmail: string;
  setClienteEmail: (val: string) => void;
  clienteDepartamento: string;
  setClienteDepartamento: (val: string) => void;
  clienteMunicipio: string;
  setClienteMunicipio: (val: string) => void;
  clienteDireccion: string;
  setClienteDireccion: (val: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  cashAmount: string;
  setCashAmount: (val: string) => void;
  currentBillingTotal: number;
  isProcessing: boolean;
  handleCompleteSale: () => void;
}

export const PosCheckoutModal: React.FC<PosCheckoutModalProps> = ({
  isOpen,
  onClose,
  orderToInvoice,
  customers,
  selectedCustomerId,
  handleSelectCustomer,
  handleOpenNewCustomerModal,
  tipoComprobante,
  setTipoComprobante,
  clienteNombre,
  setClienteNombre,
  clienteDoc,
  setClienteDoc,
  clienteNrc,
  setClienteNrc,
  clienteGiro,
  setClienteGiro,
  clienteEmail,
  setClienteEmail,
  clienteDepartamento,
  setClienteDepartamento,
  clienteMunicipio,
  setClienteMunicipio,
  clienteDireccion,
  setClienteDireccion,
  paymentMethod,
  setPaymentMethod,
  cashAmount,
  setCashAmount,
  currentBillingTotal,
  isProcessing,
  handleCompleteSale,
}) => {
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 30);
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter(c => 
      (c.name?.toLowerCase().includes(q)) || 
      (c.email?.toLowerCase().includes(q)) || 
      (c.numDocumento?.includes(q)) || 
      (c.nrc?.includes(q)) ||
      (c.phone?.includes(q))
    ).slice(0, 30);
  }, [customers, customerSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="clay-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150 bg-white">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h3 className="text-xl font-black text-slate-800 mb-0.5">
            {orderToInvoice ? `Facturar Orden #${orderToInvoice.orderNumber || orderToInvoice.saleNumber}` : 'Finalizar Venta de Perfumería'}
          </h3>
          <p className="text-xs text-slate-500">
            {orderToInvoice ? 'Orden preparada en ventanilla lista para emisión oficial de DTE' : 'Selecciona el cliente y comprobante legal a emitir.'}
          </p>
        </div>

        {/* Resumen de items si se factura orden de ventanilla */}
        {orderToInvoice && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Items preparados en comanda ({orderToInvoice.items.length})</span>
              </span>
              <span className="font-mono font-black text-emerald-800">
                Total: ${orderToInvoice.total.toFixed(2)}
              </span>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto divide-y divide-emerald-100/80 text-[11px]">
              {orderToInvoice.items.map((it: any, idx: number) => (
                <div key={idx} className="pt-1 first:pt-0 flex justify-between items-center text-slate-700">
                  <span className="truncate max-w-[260px] font-medium">{it.name} ({it.quantity} {it.unit || 'Oz'})</span>
                  <span className="font-mono font-bold text-slate-900">${it.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selector de Cliente para Facturación */}
        <div className="mb-4 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cliente para Facturación</span>
            </label>
            <button
              type="button"
              onClick={handleOpenNewCustomerModal}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
            >
              <UserPlus className="w-3 h-3" /> + Nuevo Cliente
            </button>
          </div>

          {!isCustomerDropdownOpen && (selectedCustomerObj || (clienteNombre && clienteNombre !== 'Consumidor Final')) ? (
            <div className="p-3 rounded-xl bg-white border border-indigo-200/90 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base shrink-0">👤</span>
                  <p className="font-extrabold text-xs text-slate-800 truncate">
                    {selectedCustomerObj ? selectedCustomerObj.name : clienteNombre}
                  </p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    (selectedCustomerObj?.nrc || clienteNrc) ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {(selectedCustomerObj?.nrc || clienteNrc) ? 'CCF (03)' : 'FC (01)'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10.5px] text-slate-500 font-medium">
                  {(selectedCustomerObj?.numDocumento || clienteDoc) && (
                    <span className="font-mono">Doc: {selectedCustomerObj?.numDocumento || clienteDoc}</span>
                  )}
                  {(selectedCustomerObj?.nrc || clienteNrc) && (
                    <span className="font-mono text-purple-700 font-bold">NRC: {selectedCustomerObj?.nrc || clienteNrc}</span>
                  )}
                  {selectedCustomerObj?.phone && (
                    <span>Tel: {selectedCustomerObj.phone}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerDropdownOpen(true)}
                className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg shrink-0 border border-indigo-200 transition-colors"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              {isCustomerDropdownOpen && (
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsCustomerDropdownOpen(false)} 
                />
              )}

              <div className="relative flex items-center z-40">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <input
                  type="text"
                  autoFocus={isCustomerDropdownOpen}
                  placeholder="Buscar cliente por Nombre, Correo, DUI o NRC..."
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  className="w-full text-xs font-medium pl-9 pr-7 py-2 rounded-xl bg-white border border-indigo-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 shadow-xs"
                />
                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                    title="Limpiar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCustomer('');
                      setCustomerSearchQuery('');
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="w-full p-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">👤</span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs truncate">Consumidor Final</p>
                        <p className="text-[10px] text-slate-400 truncate">Venta genérica sin datos fiscales</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                      FC (01)
                    </span>
                  </button>

                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center">
                      <p className="text-xs text-slate-500 font-medium">No se encontró cliente con ese término</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomerDropdownOpen(false);
                          handleOpenNewCustomerModal();
                        }}
                        className="mt-1 text-[11px] font-black text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Registrar nuevo cliente</span>
                      </button>
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          handleSelectCustomer(c.id);
                          setCustomerSearchQuery('');
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="w-full p-2 text-left hover:bg-indigo-50/80 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-900">
                            {c.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                            {c.numDocumento && (
                              <span className="font-mono">Doc: {c.numDocumento}</span>
                            )}
                            {c.nrc && (
                              <span className="font-mono text-purple-700 font-bold">NRC: {c.nrc}</span>
                            )}
                            {c.phone && <span>Tel: {c.phone}</span>}
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          c.nrc ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {c.nrc ? 'CCF (03)' : 'FC (01)'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selector de Comprobante */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
            Tipo de Comprobante
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTipoComprobante('TICKET')}
              className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                tipoComprobante === 'TICKET' ? 'clay-btn-primary' : 'clay-btn-light'
              }`}
            >
              Ticket Local
            </button>
            <button
              type="button"
              onClick={() => setTipoComprobante('01')}
              className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                tipoComprobante === '01' ? 'clay-btn-primary' : 'clay-btn-light'
              }`}
            >
              Factura (01)
            </button>
            <button
              type="button"
              onClick={() => setTipoComprobante('03')}
              className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                tipoComprobante === '03' ? 'clay-btn-primary' : 'clay-btn-light'
              }`}
            >
              Crédito Fiscal (03)
            </button>
          </div>
        </div>

        {/* Datos del Cliente para DTE */}
        {(tipoComprobante === '01' || tipoComprobante === '03') && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Datos Fiscales para Hacienda (DTE {tipoComprobante === '03' ? 'CCF-03' : 'FC-01'})</span>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[10.5px] font-semibold text-slate-600 block">
                  {tipoComprobante === '03' ? 'Razón Social *' : 'Nombre del Cliente'}
                </label>
                
              </div>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Nombre o Empresa"
                className="clay-input w-full text-xs py-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                  {tipoComprobante === '03' ? 'NIT *' : 'DUI o NIT'}
                </label>
                <input
                  type="text"
                  value={clienteDoc}
                  onChange={(e) => setClienteDoc(e.target.value)}
                  placeholder="00000000-0"
                  className="clay-input w-full text-xs py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                  {tipoComprobante === '03' ? 'NRC *' : 'NRC (Opcional)'}
                </label>
                <input
                  type="text"
                  value={clienteNrc}
                  onChange={(e) => setClienteNrc(e.target.value)}
                  placeholder="123456-7"
                  className="clay-input w-full text-xs py-1.5 font-mono"
                />
              </div>
            </div>

            {tipoComprobante === '03' && (
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                  Giro / Actividad Económica *
                </label>
                <input
                  type="text"
                  value={clienteGiro}
                  onChange={(e) => setClienteGiro(e.target.value)}
                  placeholder="Ej. Venta al por menor de cosméticos"
                  className="clay-input w-full text-xs py-1.5"
                />
              </div>
            )}

            <div>
              <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                Correo para envío de DTE
              </label>
              <input
                type="email"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="correo@cliente.com"
                className="clay-input w-full text-xs py-1.5 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                  Departamento *
                </label>
                <select
                  value={clienteDepartamento}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setClienteDepartamento(newDept);
                    const munis = getMunicipiosByDepartamento(newDept);
                    if (munis.length > 0) {
                      setClienteMunicipio(munis[0].nombre);
                    }
                  }}
                  className="clay-input w-full text-xs py-1.5 font-bold"
                >
                  {DEPARTAMENTOS_CATALOG.map((dep) => (
                    <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                  Municipio / Distrito (MH) *
                </label>
                <select
                  value={clienteMunicipio}
                  onChange={(e) => setClienteMunicipio(e.target.value)}
                  className="clay-input w-full text-xs py-1.5 font-bold"
                >
                  {getMunicipiosByDepartamento(clienteDepartamento).map((m) => (
                    <option key={m.id} value={m.nombre}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">
                Dirección (Calle, Colonia o Local)
              </label>
              <input
                type="text"
                value={clienteDireccion}
                onChange={(e) => setClienteDireccion(e.target.value)}
                placeholder="Ej. Colonia Escalón, Calle El Mirador #42"
                className="clay-input w-full text-xs py-1.5"
              />
            </div>
          </div>
        )}

        {/* Método de Pago */}
        {orderToInvoice && orderToInvoice.paymentStatus === 'COMPLETED' && orderToInvoice.paymentMethod !== 'CASH' ? (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                PAGO YA PROCESADO EN LÍNEA ({orderToInvoice.paymentMethod === 'CARD' ? 'TARJETA (WOMPI)' : orderToInvoice.paymentMethod === 'TRANSFER' ? 'TRANSFERENCIA' : orderToInvoice.paymentMethod})
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 space-y-1">
              <p>
                Monto Cobrado: <strong className="font-mono text-xs font-black text-emerald-950">${orderToInvoice.total.toFixed(2)} USD</strong> (Transacción Aprobada)
              </p>
              {orderToInvoice.notes && (
                <p className="text-[10px] text-slate-600 font-mono bg-white/80 p-1.5 rounded-lg border border-emerald-100 truncate" title={orderToInvoice.notes}>
                  {orderToInvoice.notes}
                </p>
              )}
              <p className="text-[10px] text-emerald-700 font-medium">
                ✅ Esta orden fue pagada en la tienda online. No requiere cobro en caja; solo emitir el DTE y entregar el paquete al cliente.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Método de Pago
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'CASH', label: 'Efectivo', icon: Banknote },
                  { id: 'CARD', label: 'Tarjeta', icon: CreditCard },
                  { id: 'TRANSFER', label: 'Transf.', icon: Building },
                  { id: 'BITCOIN', label: 'Bitcoin', icon: QrCode },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === method.id ? 'clay-btn-primary' : 'clay-btn-light'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Efectivo recibido */}
            {paymentMethod === 'CASH' && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 mb-4 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-amber-950 block">
                  Efectivo Recibido
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center rounded-xl bg-white border border-amber-300 shadow-inner overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                    <span className="px-3.5 py-2.5 bg-amber-100/90 border-r border-amber-200 text-amber-950 font-black text-sm select-none">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full px-3 py-2 text-base font-mono font-bold text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCashAmount(currentBillingTotal.toFixed(2))}
                    className="clay-btn clay-btn-light px-3.5 text-xs font-bold whitespace-nowrap text-amber-950 bg-amber-100/70 border border-amber-200 hover:bg-amber-100"
                  >
                    Exacto (${currentBillingTotal.toFixed(2)})
                  </button>
                </div>
                {parseFloat(cashAmount) >= currentBillingTotal && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-800 pt-1">
                    <span>Cambio a devolver:</span>
                    <span className="font-mono text-base font-black">
                      ${(parseFloat(cashAmount) - currentBillingTotal).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Resumen Final y Botón Confirmar */}
        <div className="pt-3 border-t border-slate-200 flex justify-between items-center mb-4">
          <div>
            <span className="text-xs text-slate-500 block">Total a Pagar:</span>
            <span className="text-2xl font-black text-indigo-600 font-mono">
              ${currentBillingTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="clay-btn clay-btn-light px-4 py-2.5 text-xs font-bold"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCompleteSale}
              className="clay-btn clay-btn-success px-5 py-2.5 text-xs font-black flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isProcessing 
                  ? 'Emitiendo DTE ante Hacienda...' 
                  : orderToInvoice && orderToInvoice.paymentStatus === 'COMPLETED' && orderToInvoice.paymentMethod !== 'CASH'
                  ? `Emitir ${tipoComprobante === '03' ? 'Crédito Fiscal (03)' : tipoComprobante === '01' ? 'Factura (01)' : 'Ticket'} y Entregar`
                  : `Cobrar y Emitir ${tipoComprobante === '03' ? 'Crédito Fiscal (03)' : tipoComprobante === '01' ? 'Factura (01)' : 'Ticket'}`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
