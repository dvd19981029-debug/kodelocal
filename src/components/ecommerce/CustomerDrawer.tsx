'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  Clock,
  Truck,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Search,
  LogIn
} from 'lucide-react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { DEPARTAMENTOS_CATALOG, MUNICIPIOS_CATALOG } from '@/lib/svTerritory';
import { getGuestOrders, addGuestOrderNumber, getGuestShippingProfile, saveGuestShippingProfile } from '@/lib/guestOrderStorage';

export default function CustomerDrawer() {
  const { 
    customer, 
    isDrawerOpen, 
    closeDrawer, 
    drawerTab, 
    setDrawerTab, 
    updateCustomerProfile,
    logout,
    openAuthModal 
  } = useCustomerAuth();

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Guest order manual search state
  const [searchOrderInput, setSearchOrderInput] = useState('');
  const [isSearchingOrder, setIsSearchingOrder] = useState(false);
  const [searchOrderError, setSearchOrderError] = useState('');

  // Profile Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [documentType, setDocumentType] = useState('DUI');
  const [documentNum, setDocumentNum] = useState('');
  const [department, setDepartment] = useState('San Salvador');
  const [municipality, setMunicipality] = useState('San Salvador Centro');
  const [address, setAddress] = useState('');
  const [isCreditFiscal, setIsCreditFiscal] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [nrc, setNrc] = useState('');
  const [activityDesc, setActivityDesc] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Lock body scroll on open & handle Escape key
  useEffect(() => {
    if (!isDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  // Sync profile form with customer data or guest shipping profile
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setDocumentType(customer.documentType || 'DUI');
      setDocumentNum(customer.documentNum || '');
      setDepartment(customer.department || 'San Salvador');
      setMunicipality(customer.municipality || 'San Salvador Centro');
      setAddress(customer.address || '');
      setBusinessName(customer.businessName || '');
      setNrc(customer.nrc || '');
      setActivityDesc(customer.activityDesc || '');
      setIsCreditFiscal(Boolean(customer.nrc || customer.businessName));
    } else {
      const guest = getGuestShippingProfile();
      setName(guest.name || '');
      setPhone(guest.phone || '');
      setDocumentType(guest.documentType || 'DUI');
      setDocumentNum(guest.documentNum || '');
      setDepartment(guest.department || 'San Salvador');
      setMunicipality(guest.municipality || 'San Salvador Centro');
      setAddress(guest.address || '');
      setBusinessName(guest.businessName || '');
      setNrc(guest.nrc || '');
      setActivityDesc(guest.activityDesc || '');
      setIsCreditFiscal(Boolean(guest.nrc || guest.businessName));
    }
  }, [customer, isDrawerOpen]);

  // Fetch orders when drawer is open (supports both registered customers and guests)
  useEffect(() => {
    if (!isDrawerOpen) return;

    let isMounted = true;
    setIsLoadingOrders(true);
    setOrdersError('');

    let endpoint = '';
    const headers: Record<string, string> = {};

    if (customer?.id) {
      endpoint = `/api/ecommerce/orders?customerId=${customer.id}`;
      if (customer.sessionToken) {
        headers['Authorization'] = `Bearer ${customer.sessionToken}`;
      }
    } else {
      // Modo invitado: cargar desde localStorage
      const guestOrders = getGuestOrders();
      if (guestOrders.length === 0) {
        setOrders([]);
        setIsLoadingOrders(false);
        return;
      }
      const orderNumbers = guestOrders.map(g => g.orderNumber).filter(Boolean);
      endpoint = `/api/ecommerce/orders?orderNumbers=${encodeURIComponent(orderNumbers.join(','))}`;
    }

    fetch(endpoint, { headers })
      .then(async (res) => {
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setOrders(data.orders || []);
          } else {
            setOrdersError(data.error || 'No se pudieron cargar los pedidos');
          }
        }
      })
      .catch((err) => {
        if (isMounted) setOrdersError(err.message || 'Error de conexión');
      })
      .finally(() => {
        if (isMounted) setIsLoadingOrders(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isDrawerOpen, customer?.id]);

  if (!isDrawerOpen) return null;

  // Mostrar todos los pedidos del usuario o del dispositivo sin ocultar compras recientes en verificación
  const visibleOrders = orders;

  // Filter available municipalities by selected department
  const selectedDeptObj = DEPARTAMENTOS_CATALOG.find(
    (d) => d.nombre.toLowerCase() === department.toLowerCase()
  );
  const availableMunicipios = selectedDeptObj
    ? MUNICIPIOS_CATALOG.filter((m) => m.departamentoId === selectedDeptObj.id)
    : [];

  const handleManualOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = searchOrderInput.trim().toUpperCase();
    if (!cleanNum) return;

    setIsSearchingOrder(true);
    setSearchOrderError('');

    try {
      const res = await fetch(`/api/ecommerce/orders?orderNumber=${encodeURIComponent(cleanNum)}`);
      const data = await res.json();
      if (data.success && data.orders && data.orders.length > 0) {
        const foundOrder = data.orders[0];
        addGuestOrderNumber(foundOrder.orderNumber, {
          total: foundOrder.total,
          paymentMethod: foundOrder.paymentMethod,
          customerName: foundOrder.customerName,
          customerEmail: foundOrder.customerEmail,
        });
        setOrders((prev) => {
          const filtered = prev.filter((o) => o.orderNumber !== foundOrder.orderNumber);
          return [foundOrder, ...filtered];
        });
        setSearchOrderInput('');
      } else {
        setSearchOrderError('No se encontró ningún pedido con ese número. Verifica el código (ej. WEB-1234).');
      }
    } catch (err: any) {
      setSearchOrderError('Error de conexión al consultar la orden.');
    } finally {
      setIsSearchingOrder(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      if (customer?.id) {
        const res = await updateCustomerProfile({
          name,
          phone,
          documentType,
          documentNum,
          department,
          municipality,
          address,
          businessName: isCreditFiscal ? businessName : '',
          nrc: isCreditFiscal ? nrc : '',
          activityDesc: isCreditFiscal ? activityDesc : '',
        });

        if (res.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          setSaveError(res.error || 'No se pudieron guardar los cambios');
        }
      } else {
        // Modo Invitado: Guardar perfil de despacho en localStorage para este navegador
        saveGuestShippingProfile({
          name,
          phone,
          documentType,
          documentNum,
          department,
          municipality,
          address,
          businessName: isCreditFiscal ? businessName : '',
          nrc: isCreditFiscal ? nrc : '',
          activityDesc: isCreditFiscal ? activityDesc : '',
          tipoComprobante: isCreditFiscal ? '03' : '01',
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string, payStatus?: string) => {
    if (payStatus === 'REJECTED' || status?.toUpperCase() === 'CANCELLED' || status?.toUpperCase() === 'CANCELADO') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"><AlertCircle className="w-3 h-3" /> Cancelado</span>;
    }
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
      case 'ENTREGADO':
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Entregado</span>;
      case 'SHIPPED':
      case 'EN_RUTA':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200"><Truck className="w-3 h-3" /> En camino</span>;
      case 'PREPARING':
      case 'EN_PREPARACION':
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200"><Clock className="w-3 h-3" /> En preparación</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"><Clock className="w-3 h-3" /> Recibido</span>;
    }
  };

  const getPaymentBadge = (payStatus: string, payMethod: string) => {
    const isWompi = payMethod === 'CARD';
    if (payStatus === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
          <CreditCard className="w-2.5 h-2.5 text-emerald-600" />
          {isWompi ? 'Pagado (Tarjeta)' : 'Pagado'}
        </span>
      );
    }
    if (payStatus === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-300">
          <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
          No Pagado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-300">
        <Clock className="w-2.5 h-2.5 text-amber-600" />
        {isWompi ? 'Pendiente Tarjeta' : 'Pendiente Transferencia'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop oscuro con blur que cierra el drawer al hacer clic */}
      <div 
        onClick={closeDrawer}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer"
        title="Clic fuera para cerrar"
      />

      {/* Drawer deslizable pegado al lado izquierdo */}
      <div className="fixed inset-y-0 left-0 w-full sm:w-[480px] max-w-full flex">
        <div className="w-full h-full bg-[#f8fafc] shadow-2xl flex flex-col border-r border-slate-200/90 relative z-10 overscroll-contain animate-in slide-in-from-left duration-300">
          
          {/* ================= HEADER DEL DRAWER ================= */}
          <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 shrink-0">
            <div className="flex items-start justify-between gap-3">
              {customer ? (
                <div className="flex items-center gap-3 min-w-0">
                  {customer.avatarUrl ? (
                    <img
                      src={customer.avatarUrl}
                      alt={customer.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-200 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                      {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 leading-tight truncate">
                        {customer.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                        <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                        Cliente Verificado
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {customer.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        Mis Pedidos y Envíos
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                        Modo Invitado
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      Guardados en este dispositivo
                    </p>
                  </div>
                </div>
              )}

              {/* Botón Cerrar */}
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Banner informativo para Invitados */}
            {!customer && (
              <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-100 rounded-2xl flex items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-slate-600 font-medium text-[11px] leading-tight">
                    Inicia sesión con Google para sincronizar tus compras en cualquier dispositivo.
                  </span>
                </div>
                <button
                  onClick={() => openAuthModal('login')}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Acceder
                </button>
              </div>
            )}

            {/* Selector de Pestañas (Tabs) */}
            <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setDrawerTab('orders')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  drawerTab === 'orders'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Mis Pedidos</span>
                {visibleOrders.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                    {visibleOrders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setDrawerTab('profile')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  drawerTab === 'profile'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4 text-indigo-600" />
                <span>Datos & Facturación</span>
              </button>
            </div>
          </div>

          {/* ================= CONTENIDO DEL DRAWER ================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
            
            {/* ---------------- PESTAÑA 1: MIS PEDIDOS ---------------- */}
            {drawerTab === 'orders' && (
              <div className="space-y-3">
                {/* Buscador de orden para modo invitado */}
                {!customer && (
                  <div className="space-y-1.5">
                    <form onSubmit={handleManualOrderLookup} className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                      <input
                        type="text"
                        value={searchOrderInput}
                        onChange={(e) => setSearchOrderInput(e.target.value)}
                        placeholder="Rastrear otra orden (ej. WEB-1234)..."
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none uppercase"
                      />
                      <button
                        type="submit"
                        disabled={isSearchingOrder || !searchOrderInput.trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {isSearchingOrder ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Search className="w-3 h-3" />
                            <span>Buscar</span>
                          </>
                        )}
                      </button>
                    </form>
                    {searchOrderError && (
                      <p className="text-[11px] text-rose-600 font-medium px-1">
                        {searchOrderError}
                      </p>
                    )}
                  </div>
                )}

                {isLoadingOrders ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-xs font-semibold">Consultando estado de tus paquetes...</p>
                  </div>
                ) : ordersError ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{ordersError}</span>
                  </div>
                ) : visibleOrders.length === 0 ? (
                  <div className="py-16 px-4 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900">
                      {!customer ? 'No hay pedidos guardados en este dispositivo' : 'Aún no tienes pedidos'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-[260px] mt-1 mb-4 leading-relaxed">
                      {!customer 
                        ? 'Si realizaste un pedido recientemente, ingresa tu número de orden arriba o haz tu primera compra.'
                        : 'Explora nuestro catálogo de perfumes y haz tu primer pedido con entrega a todo El Salvador.'}
                    </p>
                    <button
                      onClick={closeDrawer}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-95"
                    >
                      Explorar Catálogo
                    </button>
                  </div>
                ) : (
                  visibleOrders.map((order) => {
                    const orderDate = new Date(order.createdAt).toLocaleDateString('es-SV', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={order.id || order.orderNumber}
                        className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition-shadow space-y-3"
                      >
                        {/* Cabecera del pedido */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[11px] font-black text-indigo-700 font-mono">
                              #{order.orderNumber || order.id?.slice(-8).toUpperCase()}
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">{orderDate}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                            {getStatusBadge(order.orderStatus, order.paymentStatus)}
                          </div>
                        </div>

                        {/* Información de Courier y Rastreo si ya fue despachado */}
                        {(order.courierName || order.trackingNumber) && (
                          <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-[11px] text-purple-900 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>
                                Envío: <strong>{order.courierName || 'Mensajería Express'}</strong>
                              </span>
                            </div>
                            {order.trackingNumber && (
                              <span className="font-mono font-black text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                                Guía: {order.trackingNumber}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Artículos del pedido con nombre oficial e inspiración dinámica */}
                        <div className="space-y-2">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-start justify-between text-xs gap-2">
                              <div className="flex flex-col min-w-0 pr-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-800 text-[11px]">
                                    {item.quantity}x
                                  </span>
                                  <span className="text-slate-800 font-bold truncate text-[11px]">
                                    {item.productName}
                                  </span>
                                  {item.presentation && (
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px] font-bold shrink-0">
                                      {item.presentation}
                                    </span>
                                  )}
                                </div>
                                {item.inspiredBy && (
                                  <span className="text-[10px] text-indigo-600 font-semibold pl-4">
                                    Inspirado en: <strong className="text-slate-600 font-medium">{item.inspiredBy}</strong>
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-slate-900 text-[11px] shrink-0 font-mono">
                                ${(item.total || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Resumen de Total */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Total Pagado / A Pagar</span>
                          <span className="text-sm font-black text-slate-900 font-mono">
                            ${(order.total || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Ficha de Envío y Destino */}
                        {(order.department || order.shippingAddress || order.customerName) && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Destino de Envío</span>
                            </div>
                            {order.customerName && (
                              <p className="text-slate-700 pl-5">
                                Recibe: <strong>{order.customerName}</strong> {order.customerPhone ? `(${order.customerPhone})` : ''}
                              </p>
                            )}
                            {order.shippingAddress && (
                              <p className="text-slate-600 pl-5 leading-relaxed">
                                {order.shippingAddress}
                              </p>
                            )}
                            {order.deliveryReference && (
                              <p className="text-slate-500 italic text-[10px] pl-5">
                                Ref: {order.deliveryReference}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ---------------- PESTAÑA 2: DATOS Y FACTURACIÓN ---------------- */}
            {drawerTab === 'profile' && (
              <>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {!customer && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-amber-900 font-medium text-[11px] leading-tight">
                          <strong>Modo Invitado:</strong> Tus datos de entrega se guardan en este dispositivo y se autocompletarán en el checkout.
                        </span>
                      </div>
                    </div>
                  )}
                    {saveSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>¡Información actualizada correctamente!</span>
                      </div>
                    )}

                    {saveError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{saveError}</span>
                      </div>
                    )}

                    {/* Datos Personales Básicos */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        Datos Personales
                      </h4>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Tu nombre completo"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="7000-0000"
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo Documento</label>
                          <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                          >
                            <option value="DUI">DUI</option>
                            <option value="NIT">NIT</option>
                            <option value="PASAPORTE">Pasaporte</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Número de Documento</label>
                        <input
                          type="text"
                          value={documentNum}
                          onChange={(e) => setDocumentNum(e.target.value)}
                          placeholder="00000000-0"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Dirección de Entrega Habitual */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        Dirección de Envío Habitual
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Departamento</label>
                          <select
                            value={department}
                            onChange={(e) => {
                              const newDept = e.target.value;
                              setDepartment(newDept);
                              const found = DEPARTAMENTOS_CATALOG.find(d => d.nombre.toLowerCase() === newDept.toLowerCase());
                              if (found) {
                                const newMunis = MUNICIPIOS_CATALOG.filter(m => m.departamentoId === found.id);
                                if (newMunis.length > 0) setMunicipality(newMunis[0].nombre);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                          >
                            {DEPARTAMENTOS_CATALOG.map((d) => (
                              <option key={d.id} value={d.nombre}>{d.nombre}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Municipio</label>
                          <select
                            value={municipality}
                            onChange={(e) => setMunicipality(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                          >
                            {availableMunicipios.map((m) => (
                              <option key={m.id} value={m.nombre}>{m.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Dirección Exacta</label>
                        <textarea
                          rows={2}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Colonia, calle, número de casa..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                        />
                      </div>
                    </div>

                    {/* Datos Fiscales (CCF) */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          Facturación con Crédito Fiscal
                        </h4>
                        <input
                          type="checkbox"
                          id="creditFiscalToggle"
                          checked={isCreditFiscal}
                          onChange={(e) => setIsCreditFiscal(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </div>

                      {isCreditFiscal && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Razón Social / Nombre Comercial</label>
                            <input
                              type="text"
                              value={businessName}
                              onChange={(e) => setBusinessName(e.target.value)}
                              placeholder="Nombre de la empresa o negocio"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">NRC</label>
                              <input
                                type="text"
                                value={nrc}
                                onChange={(e) => setNrc(e.target.value)}
                                placeholder="000000-0"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Giro / Actividad Económica</label>
                              <input
                                type="text"
                                value={activityDesc}
                                onChange={(e) => setActivityDesc(e.target.value)}
                                placeholder="Ej. Comercio al por menor"
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botón Guardar Cambios */}
                    <button
                      type="submit"
                      disabled={isSaving || saveSuccess}
                      className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                        saveSuccess
                          ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-400/50'
                          : isSaving
                          ? 'bg-slate-400 text-white cursor-not-allowed opacity-80'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-lg'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{customer ? 'Guardando cambios en tu perfil...' : 'Guardando en este dispositivo...'}</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                          <span className="tracking-wide">
                            {customer ? '¡Información Guardada con Éxito! ✓' : '¡Datos de Envío Guardados en tu Dispositivo! ✓'}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{customer ? 'Guardar Cambios de Perfil' : 'Guardar Datos de Envío (Modo Invitado)'}</span>
                        </>
                      )}
                    </button>

                    {!customer && (
                      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-center space-y-2">
                        <p className="text-[11px] text-slate-600 leading-snug">
                          ¿Deseas sincronizar tus pedidos y direcciones en todos tus dispositivos?
                        </p>
                        <button
                          type="button"
                          onClick={() => openAuthModal('login')}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          Iniciar Sesión / Registrarme
                        </button>
                      </div>
                    )}
                  </form>
              </>
            )}

          </div>

          {/* ================= FOOTER DEL DRAWER ================= */}
          <div className="p-4 bg-white border-t border-slate-200/80 shrink-0 flex items-center justify-between gap-3">
            {customer ? (
              <button
                onClick={() => {
                  logout();
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión / Registro</span>
              </button>
            )}

            {/* Ayuda / WhatsApp Oficial */}
            <a
              href="https://wa.me/50378339470?text=Hola%20Aromaniak,%20necesito%20ayuda%20con%20mi%20pedido"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <span>WhatsApp: 7833-9470</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
