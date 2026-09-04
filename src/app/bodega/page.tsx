'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  CheckCircle2, 
  Clock, 
  Droplets, 
  Search, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Printer,
  RotateCcw,
  Package,
  Truck,
  MapPin,
  Layers,
  Tag,
  Filter,
  ArrowDownToLine,
  FileCheck,
  ClipboardCheck,
  Check,
  AlertTriangle,
  FileText,
  User,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { 
  SaleRecord, 
  ProductItem, 
  PERFUME_CATEGORIES, 
  getStoredProducts, 
  saveStoredProducts 
} from '@/lib/store';
import { 
  PurchaseRecord, 
  getStoredPurchases, 
  saveStoredPurchases, 
  applyBodegaReceptionToProducts 
} from '@/lib/purchases';
import { getActiveUser, UserAccount } from '@/lib/auth';

type BodegaTab = 'por_preparar' | 'listos' | 'entregados' | 'inventario' | 'ingreso_compras';

export default function BodegaPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [bodegaTab, setBodegaTab] = useState<BodegaTab>('por_preparar');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Ventas / Comandas
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const currentVersion = localStorage.getItem('kodelocal_data_version');
      if (currentVersion !== '2026_zero_stock_v3') return [];
      const saved = localStorage.getItem('kodelocal_sales');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  // 2. Inventario Físico (Catálogo de productos con puestos en estantería)
  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());
  const [stockSearch, setStockSearch] = useState('');
  const [selectedStockCategory, setSelectedStockCategory] = useState('Todos');
  const [stockFilterType, setStockFilterType] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // 3. Compras registradas en el sistema (para recepción y confrontación en Bodega)
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => getStoredPurchases());
  const [comprasSubTab, setComprasSubTab] = useState<'pendientes' | 'historial'>('pendientes');
  
  // Estado para la confrontación activa de una compra
  const [activeConfrontationPurchase, setActiveConfrontationPurchase] = useState<PurchaseRecord | null>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [inspectedItems, setInspectedItems] = useState<Record<string, boolean>>({});
  const [receptionNotes, setReceptionNotes] = useState<string>('');
  const [receivedByPerson, setReceivedByPerson] = useState<string>('');

  // Estados de control de comandas
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Cargar usuario activo y registrar listeners de sincronización
  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user);
    setReceivedByPerson(user?.name || 'Bodeguero en Turno');

    const handleProductsUpdate = () => {
      setProducts(getStoredProducts());
    };
    const handlePurchasesUpdate = () => {
      setPurchases(getStoredPurchases());
    };
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'kodelocal_products') setProducts(getStoredProducts());
      if (e.key === 'kodelocal_purchases') setPurchases(getStoredPurchases());
      if (e.key === 'kodelocal_sales') {
        try {
          if (e.newValue) setSales(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    window.addEventListener('kodelocal_products_updated', handleProductsUpdate);
    window.addEventListener('kodelocal_purchases_updated', handlePurchasesUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('kodelocal_products_updated', handleProductsUpdate);
      window.removeEventListener('kodelocal_purchases_updated', handlePurchasesUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Guardar ventas al cambiar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kodelocal_sales', JSON.stringify(sales));
    }
  }, [sales]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Checklist de preparación en comanda
  const handleToggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Marcar pedido como listo para ventanilla
  const handleMarkAsReady = (orderId: string) => {
    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === orderId) {
          return { ...s, status: 'READY_AT_WINDOW' as const };
        }
        return s;
      });
      localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
      window.dispatchEvent(new Event('kodelocal_sales_updated'));
      return updated;
    });
    showToast('✅ Pedido preparado y enviado a Ventanilla.');
  };

  // Marcar pedido como entregado
  const handleMarkAsCompleted = (orderId: string) => {
    setSales(prev => {
      const updated = prev.map(s => {
        if (s.id === orderId) {
          return { ...s, status: 'COMPLETED' as const };
        }
        return s;
      });
      localStorage.setItem('kodelocal_sales', JSON.stringify(updated));
      window.dispatchEvent(new Event('kodelocal_sales_updated'));
      return updated;
    });
    showToast('📦 Pedido entregado al cliente / repartidor.');
  };

  // Contadores para insignias y menú
  const pendingCount = sales.filter(s => s.status === 'PENDING_PREPARATION' || !s.status).length;
  const readyCount = sales.filter(s => s.status === 'READY_AT_WINDOW').length;
  const completedCount = sales.filter(s => s.status === 'COMPLETED').length;

  const pendingPurchases = useMemo(() => {
    return purchases.filter(p => p.receptionStatus !== 'RECIBIDO');
  }, [purchases]);

  const receivedPurchases = useMemo(() => {
    return purchases.filter(p => p.receptionStatus === 'RECIBIDO');
  }, [purchases]);

  const pendingPurchasesCount = pendingPurchases.length;

  // Filtrado de comandas por tab
  const filteredOrders = useMemo(() => {
    return sales.filter(s => {
      const isPending = s.status === 'PENDING_PREPARATION' || !s.status;
      const isReady = s.status === 'READY_AT_WINDOW';
      const isCompleted = s.status === 'COMPLETED';

      if (bodegaTab === 'por_preparar' && !isPending) return false;
      if (bodegaTab === 'listos' && !isReady) return false;
      if (bodegaTab === 'entregados' && !isCompleted) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.saleNumber.toLowerCase().includes(q) ||
        (s.vendedor && s.vendedor.toLowerCase().includes(q)) ||
        (s.cliente?.nombre && s.cliente.nombre.toLowerCase().includes(q)) ||
        s.items.some(it => it.name.toLowerCase().includes(q) || (it.puesto && it.puesto.toLowerCase().includes(q)))
      );
    });
  }, [sales, bodegaTab, searchQuery]);

  // Filtrado de inventario físico para bodega (sin precios)
  const filteredStock = useMemo(() => {
    const q = stockSearch.toLowerCase().trim();
    return products.filter(p => {
      const matchCat = selectedStockCategory === 'Todos' || p.category === selectedStockCategory;
      if (!matchCat) return false;

      if (stockFilterType === 'IN_STOCK' && (p.stock || 0) <= 0) return false;
      if (stockFilterType === 'OUT_OF_STOCK' && (p.stock || 0) > 0) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.puesto && p.puesto.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    });
  }, [products, stockSearch, selectedStockCategory, stockFilterType]);

  // Abrir panel de confrontación de una compra
  const handleOpenConfrontation = (pur: PurchaseRecord) => {
    setActiveConfrontationPurchase(pur);
    // Inicializar cantidades recibidas con las cantidades esperadas del sistema
    const initialQtys: Record<string, number> = {};
    const initialInspected: Record<string, boolean> = {};
    pur.items.forEach(it => {
      initialQtys[it.productId] = it.quantity;
      initialInspected[it.productId] = false;
    });
    setReceivedQuantities(initialQtys);
    setInspectedItems(initialInspected);
    setReceptionNotes(pur.notes ? `Nota inicial: ${pur.notes}` : '');
  };

  // Botón rápido: Verificar todo coincide al 100%
  const handleVerifyAllMatch = () => {
    if (!activeConfrontationPurchase) return;
    const qtys: Record<string, number> = {};
    const insp: Record<string, boolean> = {};
    activeConfrontationPurchase.items.forEach(it => {
      qtys[it.productId] = it.quantity;
      insp[it.productId] = true;
    });
    setReceivedQuantities(qtys);
    setInspectedItems(insp);
    setReceptionNotes('Mercadería recibida al 100% en perfecto estado físico.');
    showToast('✨ Todas las cantidades confrontadas coinciden con el documento.');
  };

  // Confirmar y aplicar ingreso a bodega
  const handleApplyReception = () => {
    if (!activeConfrontationPurchase) return;

    // 1. Aplicar las cantidades físicas recibidas al inventario de productos
    const updatedProducts = applyBodegaReceptionToProducts(
      activeConfrontationPurchase,
      receivedQuantities,
      products
    );
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    // 2. Actualizar el registro de la compra con su estado RECIBIDO
    const receptionTimestamp = new Date().toISOString();
    const updatedPurchases = purchases.map(p => {
      if (p.id === activeConfrontationPurchase.id) {
        return {
          ...p,
          receptionStatus: 'RECIBIDO' as const,
          receivedAt: receptionTimestamp,
          receivedBy: receivedByPerson.trim() || currentUser?.name || 'Bodeguero en Turno',
          receivedNotes: receptionNotes.trim() || 'Ingreso verificado y aplicado en bodega',
          receivedItems: p.items.map(it => ({
            productId: it.productId,
            expectedQty: it.quantity,
            receivedQty: receivedQuantities[it.productId] ?? it.quantity,
            matched: (receivedQuantities[it.productId] ?? it.quantity) === it.quantity,
            notes: (receivedQuantities[it.productId] ?? it.quantity) !== it.quantity ? 'Discrepancia en recepción' : undefined
          }))
        };
      }
      return p;
    });

    setPurchases(updatedPurchases);
    saveStoredPurchases(updatedPurchases);

    // 3. Cerrar panel y notificar
    setActiveConfrontationPurchase(null);
    setComprasSubTab('historial');
    showToast(`✅ Ingreso de ${activeConfrontationPurchase.purchaseNumber} aplicado exitosamente al stock físico y Kárdex.`);
  };

  // Simular una compra de prueba pendiente para probar de inmediato la confrontación
  const handleSimulatePendingPurchase = () => {
    const sampleItems = products.slice(0, 3).map((p, idx) => ({
      productId: p.id,
      productName: p.name,
      productSku: p.sku,
      unit: p.unit || 'Onza',
      quantity: idx === 0 ? 16 : idx === 1 ? 32 : 10,
      costPrice: p.cost || 1.95,
      subtotal: (idx === 0 ? 16 : idx === 1 ? 32 : 10) * (p.cost || 1.95)
    }));

    const newSamplePurchase: PurchaseRecord = {
      id: `pur-sim-${Date.now()}`,
      purchaseNumber: `CMP-${String(purchases.length + 50).padStart(4, '0')}`,
      tipoDte: 'CCF',
      supplierId: 'prov-1',
      supplierName: 'Fragrance Oils & Essences de Centroamérica S.A.',
      purchaseDate: new Date().toISOString().split('T')[0],
      docNumber: `DTE-03-M001P001-${Date.now().toString().slice(-6)}`,
      controlNumber: `DTE-03-M001P001-000000000000123`,
      condicion: 'CONTADO',
      paymentMethod: 'TRANSFERENCIA',
      paymentStatus: 'PAGADO',
      subtotalNeto: 120.00,
      iva: 15.60,
      total: 135.60,
      saldoPendiente: 0,
      creditDays: 0,
      items: sampleItems,
      receptionStatus: 'PENDIENTE',
      notes: 'Envío de concentrados de perfume e insumos para perfumería.',
      createdAt: new Date().toISOString()
    };

    const updated = [newSamplePurchase, ...purchases];
    setPurchases(updated);
    saveStoredPurchases(updated);
    setComprasSubTab('pendientes');
    showToast(`📦 Compra simulada ${newSamplePurchase.purchaseNumber} creada. Lista para confrontar.`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 clay-card bg-emerald-50 border-emerald-300 text-emerald-900 px-4 py-3 text-xs font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="clay-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-xl shadow-md">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800">Bodega & Preparación de Pedidos</h1>
              <span className="clay-badge bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5">
                Módulo Operativo
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Gestión física de pedidos, puestos en estantería (📍 A1) y recepción confrontada de compras • <strong className="text-amber-800 font-bold">Sin precios ni dinero</strong>
            </p>
          </div>
        </div>

        {/* Resumen Rápido Superior */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${pendingCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`}></span>
            <span>Por Preparar: <strong className="font-mono text-sm">{pendingCount}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Listos: <strong className="font-mono text-sm">{readyCount}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Compras Pend.: <strong className="font-mono text-sm">{pendingPurchasesCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Menú Lateral a la Izquierda + Área de Trabajo a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* MENÚ LATERAL IZQUIERDO DE BODEGA                                         */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="clay-card p-3 space-y-1.5">
            <p className="px-3 py-1 text-[10.5px] font-black text-slate-400 uppercase tracking-wider">
              Menú de Bodega
            </p>

            {/* 1. Por preparar */}
            <button
              onClick={() => {
                setBodegaTab('por_preparar');
                setActiveConfrontationPurchase(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'por_preparar'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(225,29,72,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 ${bodegaTab === 'por_preparar' ? 'text-white' : 'text-rose-600'}`} />
                <span>Por preparar</span>
              </div>
              <span className={`px-2 py-0.5 text-xs font-black rounded-full font-mono shadow-sm ${
                bodegaTab === 'por_preparar' 
                  ? 'bg-white text-rose-700' 
                  : pendingCount > 0 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {pendingCount}
              </span>
            </button>

            {/* 2. Listos */}
            <button
              onClick={() => {
                setBodegaTab('listos');
                setActiveConfrontationPurchase(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'listos'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(16,185,129,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`w-4 h-4 ${bodegaTab === 'listos' ? 'text-white' : 'text-emerald-600'}`} />
                <span>Listos</span>
              </div>
              <span className={`px-2 py-0.5 text-xs font-black rounded-full font-mono ${
                bodegaTab === 'listos' 
                  ? 'bg-white text-emerald-800' 
                  : readyCount > 0 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {readyCount}
              </span>
            </button>

            {/* 3. Entregados */}
            <button
              onClick={() => {
                setBodegaTab('entregados');
                setActiveConfrontationPurchase(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'entregados'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className={`w-4 h-4 ${bodegaTab === 'entregados' ? 'text-white' : 'text-blue-600'}`} />
                <span>Entregados</span>
              </div>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full font-mono ${
                bodegaTab === 'entregados' 
                  ? 'bg-white text-indigo-800' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {completedCount}
              </span>
            </button>

            {/* 4. Inventario */}
            <button
              onClick={() => {
                setBodegaTab('inventario');
                setActiveConfrontationPurchase(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'inventario'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className={`w-4 h-4 ${bodegaTab === 'inventario' ? 'text-white' : 'text-indigo-600'}`} />
                <span>Inventario</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {products.length}
              </span>
            </button>

            {/* 5. Ingreso de compras */}
            <button
              onClick={() => {
                setBodegaTab('ingreso_compras');
                setActiveConfrontationPurchase(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'ingreso_compras'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(217,119,6,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowDownToLine className={`w-4 h-4 ${bodegaTab === 'ingreso_compras' ? 'text-white' : 'text-amber-600'}`} />
                <span>Ingreso de compras</span>
              </div>
              <span className={`px-2 py-0.5 text-xs font-black rounded-full font-mono ${
                bodegaTab === 'ingreso_compras'
                  ? 'bg-white text-amber-900'
                  : pendingPurchasesCount > 0
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {pendingPurchasesCount}
              </span>
            </button>
          </div>

          {/* Tarjeta Informativa de Puestos Físicos */}
          <div className="clay-card p-4 bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 space-y-1.5">
            <span className="font-black flex items-center gap-1.5 text-amber-900">
              <MapPin className="w-3.5 h-3.5" />
              <span>Puestos Físicos (A1, B2)</span>
            </span>
            <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
              Cada insumo tiene asignado un puesto en estantería para que el preparador surta los pedidos sin demoras ni dudas de ubicación.
            </p>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* ÁREA DE CONTENIDO PRINCIPAL A LA DERECHA                                  */}
        {/* ========================================================================= */}
        <main className="lg:col-span-9 space-y-4">

          {/* ======================================================================= */}
          {/* TAB 1: POR PREPARAR                                                     */}
          {/* ======================================================================= */}
          {bodegaTab === 'por_preparar' && (
            <div className="space-y-4">
              <div className="clay-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <span>Pedidos por Preparar</span>
                    <span className="clay-badge bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5">
                      {filteredOrders.length} {filteredOrders.length === 1 ? 'pendiente' : 'pendientes'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Revisa las fragancias y puestos asignados, marca el checklist y pásalo a ventanilla.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <input
                    type="text"
                    placeholder="Buscar comanda o fragancia..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="clay-input has-icon w-full pr-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="clay-card p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" />
                  <h3 className="text-sm font-bold text-slate-700">¡Todo al día! No hay pedidos pendientes de preparar</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Las comandas enviadas desde la terminal de Punto de Venta se reflejarán aquí automáticamente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOrders.map((order) => {
                    const allItemsChecked = order.items.every((_, idx) => checkedItems[`${order.id}-${idx}`]);

                    return (
                      <div 
                        key={order.id} 
                        className="clay-card p-4 flex flex-col justify-between border-l-4 border-rose-500 hover:shadow-md transition-all"
                      >
                        <div>
                          {/* Encabezado del Pedido */}
                          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-indigo-700">
                                  #{order.saleNumber}
                                </span>
                                <span className="clay-badge text-[10px] font-black py-0.5 px-2 bg-rose-100 text-rose-900 border border-rose-200">
                                  ⏳ Por Preparar
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5 font-medium">
                                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span>{order.cliente?.nombre || 'Consumidor Final'}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Volumen</span>
                              <span className="text-xs font-black text-slate-800 block font-mono">
                                {order.items.reduce((a, b) => a + b.quantity, 0)} {order.items.some(i => i.unit === 'Onza') ? 'Oz' : 'Un.'}
                              </span>
                            </div>
                          </div>

                          {/* Ítems para preparar con su PUESTO */}
                          <div className="space-y-2 mb-3">
                            {order.items.map((item, idx) => {
                              const isChecked = checkedItems[`${order.id}-${idx}`];
                              const shelfLocation = item.puesto || products.find(p => p.id === item.productId)?.puesto || 'A1';

                              return (
                                <div 
                                  key={idx}
                                  onClick={() => handleToggleItemCheck(order.id, idx)}
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                    isChecked 
                                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 line-through opacity-80' 
                                      : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <input
                                      type="checkbox"
                                      checked={!!isChecked}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer pointer-events-none"
                                    />
                                    <div className="truncate">
                                      <h4 className="font-black text-xs text-slate-800 truncate">
                                        {item.name}
                                      </h4>
                                      <span className="text-[10.5px] font-bold text-slate-500">
                                        Cantidad: <strong className="text-indigo-700">{item.quantity} {item.unit || 'Oz'}</strong>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Badge de Puesto de Estante */}
                                  <span className="clay-badge text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 shrink-0 font-mono shadow-sm">
                                    📍 Puesto: {shelfLocation}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {order.vendedor ? `Caja: ${order.vendedor}` : 'Caja 1'}
                          </span>

                          <button
                            onClick={() => handleMarkAsReady(order.id)}
                            className={`clay-btn px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 transition-all ${
                              allItemsChecked 
                                ? 'clay-btn-primary !bg-emerald-600 !shadow-[3px_4px_10px_rgba(16,185,129,0.35)]' 
                                : 'clay-btn-light text-amber-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{allItemsChecked ? '¡Listo! Pasar a Ventanilla' : 'Marcar Listo'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 2: LISTOS                                                           */}
          {/* ======================================================================= */}
          {bodegaTab === 'listos' && (
            <div className="space-y-4">
              <div className="clay-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <span>Pedidos Listos en Ventanilla</span>
                    <span className="clay-badge bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5">
                      {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido listo' : 'pedidos listos'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Pedidos preparados esperando que la vendedora o el cliente los recoja en ventanilla.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <input
                    type="text"
                    placeholder="Buscar pedido listo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="clay-input has-icon w-full pr-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="clay-card p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-700">No hay pedidos en ventanilla</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cuando marques un pedido como &quot;Listo&quot; en preparación, aparecerá aquí para ser entregado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="clay-card p-4 flex flex-col justify-between border-l-4 border-emerald-500 hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-emerald-700">
                                #{order.saleNumber}
                              </span>
                              <span className="clay-badge text-[10px] font-black py-0.5 px-2 bg-emerald-100 text-emerald-900 border border-emerald-200">
                                ✅ Listo en Ventanilla
                              </span>
                            </div>
                            <span className="text-[10.5px] text-slate-400 font-medium block mt-0.5">
                              Cliente: <strong>{order.cliente?.nombre || 'Consumidor Final'}</strong>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Ítems</span>
                            <span className="text-xs font-black text-slate-800 block font-mono">
                              {order.items.reduce((a, b) => a + b.quantity, 0)} {order.items.some(i => i.unit === 'Onza') ? 'Oz' : 'Un.'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                              <span className="font-bold text-slate-800">{item.name}</span>
                              <span className="font-mono font-black text-indigo-700">{item.quantity} {item.unit || 'Oz'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleMarkAsCompleted(order.id)}
                          className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-indigo-600 !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar como Entregado</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 3: ENTREGADOS                                                       */}
          {/* ======================================================================= */}
          {bodegaTab === 'entregados' && (
            <div className="space-y-4">
              <div className="clay-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <span>Historial de Pedidos Entregados</span>
                    <span className="clay-badge bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5">
                      {filteredOrders.length} entregados
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Registro de comandas despachadas y entregadas a clientes o vendedoras.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <input
                    type="text"
                    placeholder="Buscar entregado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="clay-input has-icon w-full pr-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="clay-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Hora</th>
                        <th className="py-3 px-4">Comanda</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Vendedor</th>
                        <th className="py-3 px-4 text-center">Volumen Despachado</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                            No se han registrado entregas todavía.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-4 font-mono text-slate-500 font-bold">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-black text-indigo-700">
                              #{order.saleNumber}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-800">
                              {order.cliente?.nombre || 'Consumidor Final'}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {order.vendedor || 'Caja 1'}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-black text-slate-700">
                              {order.items.reduce((a, b) => a + b.quantity, 0)} {order.items.some(i => i.unit === 'Onza') ? 'Oz' : 'Un.'}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="clay-badge text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-800">
                                📦 Entregado
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 4: INVENTARIO (CONSULTA SIN DINERO NI PRECIOS)                       */}
          {/* ======================================================================= */}
          {bodegaTab === 'inventario' && (
            <div className="space-y-4">
              
              <div className="clay-card p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <span>Consulta de Stock Físico & Puestos en Estantería</span>
                      <span className="clay-badge text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5">
                        {filteredStock.length} productos
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Ubicación de frascos, esencias e insumos • <strong className="text-amber-800 font-bold">Vista libre de precios comerciales</strong>
                    </p>
                  </div>

                  {/* Filtro rápido de existencia */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setStockFilterType('ALL')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        stockFilterType === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setStockFilterType('IN_STOCK')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        stockFilterType === 'IN_STOCK' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Con Stock (&gt;0)
                    </button>
                    <button
                      onClick={() => setStockFilterType('OUT_OF_STOCK')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        stockFilterType === 'OUT_OF_STOCK' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Stock Cero (0)
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                    <input
                      type="text"
                      placeholder="Buscar por fragancia, contratipo, SKU (#100) o Puesto (A1)..."
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      className="clay-input has-icon w-full pr-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {['Todos', ...PERFUME_CATEGORIES].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedStockCategory(cat)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold transition-all whitespace-nowrap ${
                          selectedStockCategory === cat
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabla de Existencias Físicas */}
              <div className="clay-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3" style={{ width: '10%' }}>SKU</th>
                        <th className="py-2.5 px-3" style={{ width: '18%' }}>Ubicación Física</th>
                        <th className="py-2.5 px-3" style={{ width: '42%' }}>Descripción del Producto</th>
                        <th className="py-2.5 px-3" style={{ width: '15%' }}>Categoría</th>
                        <th className="py-2.5 px-3 text-right" style={{ width: '15%' }}>Existencia Física</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStock.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400">
                            No se encontraron productos coincidentes con los filtros.
                          </td>
                        </tr>
                      ) : (
                        filteredStock.slice(0, 100).map(prod => (
                          <tr key={prod.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                              #{prod.sku}
                            </td>
                            <td className="py-2 px-3">
                              {prod.puesto ? (
                                <span className="clay-badge text-[10px] font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 border border-amber-300">
                                  📍 Puesto: {prod.puesto}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">General</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-extrabold text-slate-800 block text-xs">
                                {prod.name}
                              </span>
                              {prod.brand && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Contratipo / Marca: {prod.brand}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10.5px] text-slate-600 font-medium">
                                {prod.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                                prod.stock <= 0 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : prod.stock <= prod.minStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {prod.stock} {prod.unit === 'Onza' ? 'Oz' : prod.unit}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredStock.length > 100 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-bold">
                    Mostrando los primeros 100 productos de {filteredStock.length}. Utiliza el buscador para encontrar puestos específicos.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================================= */}
          {/* TAB 5: INGRESO DE COMPRAS (CONFRONTACIÓN FÍSICA Y APLICACIÓN)            */}
          {/* ======================================================================= */}
          {bodegaTab === 'ingreso_compras' && (
            <div className="space-y-4">
              
              {/* Encabezado con Sub-pestañas */}
              <div className="clay-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <span>Recepción e Ingreso de Compras a Bodega</span>
                    {pendingPurchasesCount > 0 && (
                      <span className="clay-badge bg-amber-100 text-amber-900 text-xs font-black px-2 py-0.5 animate-pulse">
                        {pendingPurchasesCount} {pendingPurchasesCount === 1 ? 'pendiente' : 'pendientes'}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Confronta la mercancía física contra el DTE del sistema. Al confirmar que las cantidades coinciden, aplícalas al stock oficial.
                  </p>
                </div>

                {/* Subpestañas */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => {
                      setComprasSubTab('pendientes');
                      setActiveConfrontationPurchase(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      comprasSubTab === 'pendientes'
                        ? 'clay-btn-primary !bg-amber-600 !shadow-[3px_4px_10px_rgba(217,119,6,0.35)]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Pendientes de Ingreso</span>
                    <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded-full bg-white/30 text-white font-mono">
                      {pendingPurchasesCount}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setComprasSubTab('historial');
                      setActiveConfrontationPurchase(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      comprasSubTab === 'historial'
                        ? 'clay-btn-primary !bg-indigo-600 !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Historial de Ingresos</span>
                    <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded-full bg-white/30 text-white font-mono">
                      {receivedPurchases.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Botón de Ayuda para Pruebas: Simular Compra */}
              {pendingPurchasesCount === 0 && comprasSubTab === 'pendientes' && (
                <div className="clay-card p-4 bg-indigo-50/50 border border-indigo-200/80 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-indigo-900">¿Deseas probar la confrontación de compras ahora?</h4>
                      <p className="text-[11px] text-indigo-700">
                        Genera una compra de prueba con DTE de Hacienda para verificar cómo el bodeguero confronta y aplica el stock.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSimulatePendingPurchase}
                    className="clay-btn clay-btn-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 shrink-0 !bg-indigo-600"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Simular Compra de Prueba</span>
                  </button>
                </div>
              )}

              {/* MODAL / PANEL DE CONFRONTACIÓN ACTIVA */}
              {activeConfrontationPurchase ? (
                <div className="clay-card p-5 space-y-4 border-2 border-amber-400 animate-in zoom-in-95 duration-150">
                  
                  {/* Encabezado de la Confrontación */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-amber-800">
                          {activeConfrontationPurchase.purchaseNumber}
                        </span>
                        <span className="clay-badge bg-blue-100 text-blue-800 text-[10.5px] font-black px-2 py-0.5">
                          {activeConfrontationPurchase.tipoDte}
                        </span>
                        <span className="clay-badge bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 animate-pulse">
                          🟡 En Proceso de Confrontación
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-bold mt-1">
                        Proveedor: <span className="text-slate-800">{activeConfrontationPurchase.supplierName}</span> • Factura/DTE: <span className="font-mono text-indigo-700">{activeConfrontationPurchase.controlNumber || activeConfrontationPurchase.docNumber}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleVerifyAllMatch}
                        className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-emerald-600 shadow-sm"
                        title="Marca todas las cantidades recibidas iguales a las facturadas"
                      >
                        <Check className="w-4 h-4" />
                        <span>Verificar Todo (100% Coincide)</span>
                      </button>
                      <button
                        onClick={() => setActiveConfrontationPurchase(null)}
                        className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>

                  {/* Tabla de Confrontación Producto por Producto */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                          <th className="py-2.5 px-3">Puesto Físico</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Descripción del Producto</th>
                          <th className="py-2.5 px-3 text-center">Cant. Facturada (Sistema)</th>
                          <th className="py-2.5 px-3 text-center">Cant. Física Recibida</th>
                          <th className="py-2.5 px-3 text-center">Estado Confrontación</th>
                          <th className="py-2.5 px-3 text-center">Inspección Física</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {activeConfrontationPurchase.items.map((item, idx) => {
                          const prod = products.find(p => p.id === item.productId);
                          const shelf = prod?.puesto || 'A1';
                          const expected = item.quantity;
                          const received = receivedQuantities[item.productId] ?? expected;
                          const isInspected = inspectedItems[item.productId] || false;
                          const diff = received - expected;

                          return (
                            <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                              <td className="py-3 px-3">
                                <span className="clay-badge text-[10px] font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 border border-amber-300">
                                  📍 Puesto: {shelf}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                                #{item.productSku || prod?.sku || 'S/N'}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-black text-slate-800 block">{item.productName}</span>
                                <span className="text-[10px] text-slate-400 font-medium">Unidad: {item.unit}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="font-mono font-black text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                  {expected} {item.unit}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={received}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setReceivedQuantities(prev => ({ ...prev, [item.productId]: val }));
                                    }}
                                    className="clay-input w-20 py-1 px-2 text-xs font-mono font-black text-center text-indigo-800"
                                  />
                                  <span className="text-[10px] font-bold text-slate-400">{item.unit}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {diff === 0 ? (
                                  <span className="clay-badge text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✅ Coincide Exacto
                                  </span>
                                ) : diff < 0 ? (
                                  <span className="clay-badge text-[10px] font-black px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300">
                                    ⚠️ Faltante ({diff} {item.unit})
                                  </span>
                                ) : (
                                  <span className="clay-badge text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300">
                                    ℹ️ Sobrante (+{diff} {item.unit})
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={isInspected}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setInspectedItems(prev => ({ ...prev, [item.productId]: checked }));
                                    }}
                                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                                  />
                                  <span>{isInspected ? 'Revisado' : 'Pendiente'}</span>
                                </label>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Notas de Recepción y Persona Responsable */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Responsable de Recepción en Bodega:
                      </label>
                      <input
                        type="text"
                        value={receivedByPerson}
                        onChange={(e) => setReceivedByPerson(e.target.value)}
                        placeholder="Nombre de quien recibe la mercadería..."
                        className="clay-input w-full py-1.5 px-3 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Observaciones / Estado del Envío:
                      </label>
                      <input
                        type="text"
                        value={receptionNotes}
                        onChange={(e) => setReceptionNotes(e.target.value)}
                        placeholder="Ej. Cajas selladas sin roturas, lote verificado..."
                        className="clay-input w-full py-1.5 px-3 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Botón de Aplicación Final */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-[11px] text-slate-500 font-medium">
                      ⚠️ Al confirmar, las cantidades físicas recibidas se sumarán directamente al stock y quedará registrado el movimiento en el Kárdex oficial.
                    </p>
                    <button
                      onClick={handleApplyReception}
                      className="clay-btn clay-btn-primary px-5 py-2.5 text-xs font-black flex items-center gap-2 !bg-emerald-600 !shadow-[3px_4px_12px_rgba(16,185,129,0.4)] shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar y Aplicar Ingreso a Bodega</span>
                    </button>
                  </div>

                </div>
              ) : null}

              {/* LISTADO DE COMPRAS PENDIENTES */}
              {comprasSubTab === 'pendientes' && !activeConfrontationPurchase && (
                <div className="space-y-3">
                  {pendingPurchases.length === 0 ? (
                    <div className="clay-card p-12 text-center text-slate-400">
                      <ClipboardCheck className="w-12 h-12 mx-auto mb-2 text-emerald-500/50" />
                      <h3 className="text-sm font-bold text-slate-700">No hay compras pendientes de ingreso</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Cuando en Administración se registre una factura de compra (CCF o Factura), aparecerá aquí para que confrontes la mercancía antes de ingresarla al inventario.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingPurchases.map(pur => (
                        <div 
                          key={pur.id} 
                          className="clay-card p-4 flex flex-col justify-between border-l-4 border-amber-500 hover:shadow-md transition-all space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-amber-800">
                                  {pur.purchaseNumber}
                                </span>
                                <span className="clay-badge text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-800">
                                  {pur.tipoDte}
                                </span>
                                <span className="clay-badge text-[9.5px] font-black px-2 py-0.5 bg-amber-100 text-amber-900 animate-pulse">
                                  🟡 Pendiente de Recibir
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                {pur.purchaseDate}
                              </span>
                            </div>

                            <div className="mt-2 space-y-1">
                              <h4 className="font-black text-xs text-slate-800 line-clamp-1" title={pur.supplierName}>
                                {pur.supplierName}
                              </h4>
                              <p className="text-[10.5px] text-slate-500 font-mono">
                                Factura / Control: <strong className="text-slate-700">{pur.controlNumber || pur.docNumber}</strong>
                              </p>
                            </div>

                            {/* Detalle de ítems esperados */}
                            <div className="mt-2.5 p-2 bg-slate-50 rounded-xl space-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                Insumos Facturados ({pur.items.length}):
                              </span>
                              {pur.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px]">
                                  <span className="font-bold text-slate-700 truncate max-w-[200px]">{it.productName}</span>
                                  <span className="font-mono font-black text-indigo-700 shrink-0">{it.quantity} {it.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10.5px] text-slate-400 font-medium">
                              Condición: <strong>{pur.condicion}</strong>
                            </span>
                            <button
                              onClick={() => handleOpenConfrontation(pur)}
                              className="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-amber-600 !shadow-[3px_4px_10px_rgba(217,119,6,0.35)]"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                              <span>Confrontar y Recibir</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* HISTORIAL DE COMPRAS YA INGRESADAS */}
              {comprasSubTab === 'historial' && !activeConfrontationPurchase && (
                <div className="clay-card overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Fecha Ingreso</th>
                          <th className="py-2.5 px-3">Compra</th>
                          <th className="py-2.5 px-3">Proveedor</th>
                          <th className="py-2.5 px-3">DTE / Factura</th>
                          <th className="py-2.5 px-3">Recibido por</th>
                          <th className="py-2.5 px-3">Observaciones de Bodega</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {receivedPurchases.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                              No hay compras ingresadas en el historial todavía.
                            </td>
                          </tr>
                        ) : (
                          receivedPurchases.map(pur => (
                            <tr key={pur.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                                {pur.receivedAt ? new Date(pur.receivedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : pur.purchaseDate}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-black text-indigo-700">
                                {pur.purchaseNumber}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                {pur.supplierName}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                {pur.controlNumber || pur.docNumber}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700">
                                {pur.receivedBy || 'Bodega'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 text-[11px] italic max-w-xs truncate" title={pur.receivedNotes}>
                                {pur.receivedNotes || 'Ingreso completo sin incidencias'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="clay-badge text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  🟢 Ingresado
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
