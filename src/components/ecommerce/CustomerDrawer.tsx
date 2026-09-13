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
  CreditCard
} from 'lucide-react';
import { useCustomerAuth, CustomerUser } from '@/context/CustomerAuthContext';
import { DEPARTAMENTOS_CATALOG, MUNICIPIOS_CATALOG } from '@/lib/svTerritory';

export default function CustomerDrawer() {
  const { 
    customer, 
    isDrawerOpen, 
    closeDrawer, 
    drawerTab, 
    setDrawerTab, 
    updateCustomerProfile,
    logout 
  } = useCustomerAuth();

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

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

  // Sync profile form with customer data
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
    }
  }, [customer, isDrawerOpen]);

  // Fetch orders when drawer is open
  useEffect(() => {
    if (!isDrawerOpen || !customer?.id) return;

    let isMounted = true;
    setIsLoadingOrders(true);
    setOrdersError('');

    fetch(`/api/ecommerce/orders?customerId=${customer.id}`, {
      headers: {
        ...(customer.sessionToken ? { 'Authorization': `Bearer ${customer.sessionToken}` } : {}),
      },
    })
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

  if (!isDrawerOpen || !customer) return null;

  // Para el cliente, mostrar únicamente compras confirmadas o pedidos reales.
  // Excluir intentos de pago con tarjeta abandonados o nunca pagados para no saturar su historial.
  const visibleOrders = orders.filter(
    (order) => !(order.paymentMethod === 'CARD' && (order.paymentStatus === 'PENDING' || order.paymentStatus === 'CANCELLED'))
  );

  // Filter available municipalities by selected department
  const selectedDeptObj = DEPARTAMENTOS_CATALOG.find(
    (d) => d.nombre.toLowerCase() === department.toLowerCase()
  );
  const availableMunicipios = selectedDeptObj
    ? MUNICIPIOS_CATALOG.filter((m) => m.departamentoId === selectedDeptObj.id)
    : [];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
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
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Entregado</span>;
      case 'SHIPPED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200"><Truck className="w-3 h-3" /> En camino</span>;
      case 'PREPARING':
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200"><Clock className="w-3 h-3" /> En preparación</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"><Clock className="w-3 h-3" /> En espera</span>;
    }
  };

  const getPaymentBadge = (payStatus: string, payMethod: string) => {
    const isWompi = payMethod === 'CARD';
    if (payStatus === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
          <CreditCard className="w-2.5 h-2.5 text-emerald-600" />
          {isWompi ? 'Pagado (Wompi)' : 'Pagado'}
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
        {isWompi ? 'Pendiente Wompi' : 'Pendiente Transferencia'}
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
          
          {/* ================= HEADER DEL CLIENTE ================= */}
          <div className="p-4 sm:p-5 bg-white border-b border-slate-200/80 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {customer.avatarUrl ? (
                  <img
                    src={customer.avatarUrl}
                    alt={customer.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
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

              {/* Botón Cerrar */}
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                {orders.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                    {orders.length}
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
                {isLoadingOrders ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-xs font-semibold">Cargando tus pedidos...</p>
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
                    <h4 className="text-sm font-black text-slate-900">Aún no tienes pedidos</h4>
                    <p className="text-xs text-slate-500 max-w-[240px] mt-1 mb-4">
                      Explora nuestro catálogo de perfumes y haz tu primer pedido con envío a todo el país.
                    </p>
                    <button
                      onClick={closeDrawer}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-95"
                    >
                      Ver Catálogo de Fragancias
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
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition-shadow space-y-3"
                      >
                        {/* Cabecera del pedido */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[11px] font-black text-indigo-700 font-mono">
                              #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">{orderDate}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                            {getStatusBadge(order.orderStatus, order.paymentStatus)}
                          </div>
                        </div>

                        {/* Artículos del pedido */}
                        <div className="space-y-1.5">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                <span className="font-bold text-slate-800 text-[11px]">
                                  {item.quantity}x
                                </span>
                                <span className="text-slate-700 font-medium truncate text-[11px]">
                                  {item.productName}
                                </span>
                                {item.presentation && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold shrink-0">
                                    {item.presentation}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-slate-900 text-[11px] shrink-0">
                                ${(item.total || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Resumen de Total */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Total</span>
                          <span className="text-sm font-black text-slate-900 font-mono">
                            ${(order.total || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Info de envío si existe */}
                        {(order.department || order.shippingAddress) && (
                          <div className="p-2 rounded-xl bg-slate-50 text-[10px] text-slate-500 flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate">
                              {[order.municipality, order.department].filter(Boolean).join(', ')}
                            </span>
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
              <form onSubmit={handleSaveProfile} className="space-y-4">
                
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
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. 7000-0000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>

                  {/* Documento para Factura Electrónica (DTE) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Documento</label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                      >
                        <option value="DUI">DUI</option>
                        <option value="NIT">NIT</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Número de Documento</label>
                      <input
                        type="text"
                        value={documentNum}
                        onChange={(e) => setDocumentNum(e.target.value)}
                        placeholder="00000000-0"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección y Ubicación de Entrega */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Dirección de Entrega
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Departamento</label>
                      <select
                        value={department}
                        onChange={(e) => {
                          const newDept = e.target.value;
                          setDepartment(newDept);
                          const deptObj = DEPARTAMENTOS_CATALOG.find((d) => d.nombre === newDept);
                          if (deptObj) {
                            const firstMun = MUNICIPIOS_CATALOG.find((m) => m.departamentoId === deptObj.id);
                            if (firstMun) setMunicipality(firstMun.nombre);
                          }
                        }}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                      >
                        {DEPARTAMENTOS_CATALOG.filter(d => d.id !== '00').map((d) => (
                          <option key={d.id} value={d.nombre}>
                            {d.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Municipio</label>
                      {availableMunicipios.length > 0 ? (
                        <select
                          value={municipality}
                          onChange={(e) => setMunicipality(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                        >
                          {availableMunicipios.map((m) => (
                            <option key={m.id} value={m.nombre}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={municipality}
                          onChange={(e) => setMunicipality(e.target.value)}
                          placeholder="Municipio"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Dirección Exacta y Referencias</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Colonia, calle, número de casa, punto de referencia para C807..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Crédito Fiscal para Empresas (Opcional) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-black text-slate-900">¿Requieres Crédito Fiscal?</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCreditFiscal}
                        onChange={(e) => setIsCreditFiscal(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {isCreditFiscal && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Razón Social o Empresa</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Nombre de la empresa S.A. de C.V."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">NRC</label>
                          <input
                            type="text"
                            value={nrc}
                            onChange={(e) => setNrc(e.target.value)}
                            placeholder="Ej. 123456-7"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Giro Comercial</label>
                          <input
                            type="text"
                            value={activityDesc}
                            onChange={(e) => setActivityDesc(e.target.value)}
                            placeholder="Actividad económica"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mensaje de Error */}
                {saveError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Botón Guardar Cambios con Feedback Visual Inmediato y Color de Marca Aromaniak */}
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
                      <span>Guardando cambios en tu perfil...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                      <span className="tracking-wide">¡Información Guardada con Éxito! ✓</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Información</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* ================= FOOTER DEL DRAWER ================= */}
          <div className="p-4 bg-white border-t border-slate-200/80 shrink-0 flex items-center justify-between gap-3">
            {/* Cerrar Sesión */}
            <button
              onClick={() => {
                logout();
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>

            {/* Ayuda / WhatsApp */}
            <a
              href="https://wa.me/50370000000?text=Hola%20Aromaniak,%20necesito%20ayuda%20con%20mi%20cuenta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <span>¿Necesitas ayuda?</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
