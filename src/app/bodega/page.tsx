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
  Filter
} from 'lucide-react';
import { SaleRecord, ProductItem, PERFUME_CATEGORIES, getStoredProducts } from '@/lib/store';
import { getActiveUser, UserAccount } from '@/lib/auth';

export default function BodegaPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [bodegaTab, setBodegaTab] = useState<'comandas' | 'ventanilla' | 'inventario' | 'despachos'>('comandas');

  // Ventas / Comandas
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

  // Inventario físico (para consulta por puesto en estante)
  const [products] = useState<ProductItem[]>(() => getStoredProducts());
  const [stockSearch, setStockSearch] = useState('');
  const [selectedStockCategory, setSelectedStockCategory] = useState('Todos');

  const [searchQuery, setSearchQuery] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentUser(getActiveUser());
  }, []);

  useEffect(() => {
    localStorage.setItem('kodelocal_sales', JSON.stringify(sales));
  }, [sales]);

  const handleToggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMarkAsReady = (orderId: string) => {
    setSales(prev => prev.map(s => {
      if (s.id === orderId) {
        return { ...s, status: 'READY_AT_WINDOW' };
      }
      return s;
    }));
  };

  const handleMarkAsCompleted = (orderId: string) => {
    setSales(prev => prev.map(s => {
      if (s.id === orderId) {
        return { ...s, status: 'COMPLETED' };
      }
      return s;
    }));
  };

  const pendingCount = sales.filter(s => s.status === 'PENDING_PREPARATION' || !s.status).length;
  const readyCount = sales.filter(s => s.status === 'READY_AT_WINDOW').length;
  const completedCount = sales.filter(s => s.status === 'COMPLETED').length;

  // Filtrado de comandas
  const filteredOrders = useMemo(() => {
    return sales.filter(s => {
      const isPending = s.status === 'PENDING_PREPARATION' || !s.status;
      const isReady = s.status === 'READY_AT_WINDOW';
      const isCompleted = s.status === 'COMPLETED';

      if (bodegaTab === 'comandas' && !isPending) return false;
      if (bodegaTab === 'ventanilla' && !isReady) return false;
      if (bodegaTab === 'despachos' && !isCompleted) return false;

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

  // Filtrado de stock físico para bodega
  const filteredStock = useMemo(() => {
    const q = stockSearch.toLowerCase().trim();
    return products.filter(p => {
      const matchCat = selectedStockCategory === 'Todos' || p.category === selectedStockCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.puesto && p.puesto.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    });
  }, [products, stockSearch, selectedStockCategory]);

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      
      {/* Cabecera Principal */}
      <div className="clay-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800">Bodega & Preparación de Pedidos</h1>
              <span className="clay-badge bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5">
                Área Operativa
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Ubicación por Puesto de Estantería (📍 A1) • <strong className="text-amber-800 font-bold">Vista libre de dinero y costos</strong>
            </p>
          </div>
        </div>

        {/* Resumen rápido de pedidos */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Por Preparar: <strong>{pendingCount}</strong></span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>En Ventanilla: <strong>{readyCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Estructura: Menú Lateral a la Izquierda + Área de Trabajo a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* MENÚ LATERAL IZQUIERDO DE BODEGA                                         */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="clay-card p-3 space-y-2">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Operaciones de Bodega
            </p>

            <button
              onClick={() => setBodegaTab('comandas')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'comandas'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(217,119,6,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Por Preparar</span>
              </div>
              <span className={`clay-badge text-[10px] font-black px-2 py-0.5 ${
                bodegaTab === 'comandas' ? 'bg-white text-amber-900' : 'bg-amber-100 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setBodegaTab('ventanilla')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'ventanilla'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(16,185,129,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>En Ventanilla</span>
              </div>
              <span className={`clay-badge text-[10px] font-black px-2 py-0.5 ${
                bodegaTab === 'ventanilla' ? 'bg-white text-emerald-900' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {readyCount}
              </span>
            </button>

            <button
              onClick={() => setBodegaTab('inventario')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'inventario'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Stock & Puestos (A1)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setBodegaTab('despachos')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                bodegaTab === 'despachos'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Historial Despachados</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {completedCount}
              </span>
            </button>
          </div>

          <div className="clay-card p-3.5 bg-amber-50/50 border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
            <span className="font-black block">📍 Instrucción de Surtido:</span>
            <p className="text-amber-800/90 leading-relaxed">
              Las comandas indican el estante y nivel (ej: <strong>A1</strong>). Marca la casilla al tomar cada frasco antes de pasarlo a ventanilla.
            </p>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* ÁREA DE CONTENIDO PRINCIPAL A LA DERECHA                                  */}
        {/* ========================================================================= */}
        <main className="lg:col-span-9 space-y-4">
          
          {/* VISTAS 1, 2 Y 4: COMANDAS, VENTANILLA Y DESPACHADOS */}
          {bodegaTab !== 'inventario' && (
            <div className="space-y-4">
              
              {/* Buscador de comandas */}
              <div className="clay-card p-3.5 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por comanda (#CMD-1081), fragancia, cliente o puesto (A1)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="clay-input w-full pl-9 pr-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Listado de Comandas */}
              {filteredOrders.length === 0 ? (
                <div className="clay-card p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2.5 opacity-30 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-700">No hay comandas en este estado</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {bodegaTab === 'comandas' 
                      ? 'Los pedidos enviados desde caja aparecerán aquí en tiempo real para ser surtidos.' 
                      : 'No se registran pedidos en esta pestaña.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOrders.map((order) => {
                    const isPending = order.status === 'PENDING_PREPARATION' || !order.status;
                    const isReady = order.status === 'READY_AT_WINDOW';
                    const isCompleted = order.status === 'COMPLETED';
                    const allItemsChecked = order.items.every((_, idx) => checkedItems[`${order.id}-${idx}`]);

                    return (
                      <div 
                        key={order.id} 
                        className={`clay-card p-4 flex flex-col justify-between transition-all ${
                          isPending ? 'border-l-4 border-amber-500' : isReady ? 'border-l-4 border-emerald-500' : 'border-l-4 border-slate-400'
                        }`}
                      >
                        <div>
                          {/* Encabezado */}
                          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-indigo-700">
                                  #{order.saleNumber}
                                </span>
                                <span className={`clay-badge text-[9.5px] font-bold py-0.5 px-2 ${
                                  isPending 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                    : isReady
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {isPending ? '⏳ Por Preparar' : isReady ? '✅ En Ventanilla' : '📦 Despachado'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span>{order.cliente?.nombre || 'Consumidor Final'}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Ítems</span>
                              <span className="text-xs font-black text-slate-700 block font-mono">
                                {order.items.reduce((a, b) => a + b.quantity, 0)} {order.items.some(i => i.unit === 'Onza') ? 'Oz' : 'Un.'}
                              </span>
                            </div>
                          </div>

                          {/* Ítems para preparar con su PUESTO */}
                          <div className="space-y-1.5 mb-3">
                            {order.items.map((item, idx) => {
                              const isChecked = checkedItems[`${order.id}-${idx}`];
                              return (
                                <div 
                                  key={idx}
                                  onClick={() => handleToggleItemCheck(order.id, idx)}
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                    isChecked 
                                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 line-through opacity-75' 
                                      : 'bg-white border-slate-200 hover:border-indigo-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <input
                                      type="checkbox"
                                      checked={!!isChecked}
                                      onChange={() => {}}
                                      className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer pointer-events-none"
                                    />
                                    <div className="truncate">
                                      <h4 className="font-black text-xs text-slate-800 truncate">
                                        {item.name}
                                      </h4>
                                      <span className="text-[10px] font-bold text-slate-500">
                                        Cantidad: <strong className="text-indigo-700">{item.quantity} {item.unit || 'Oz'}</strong>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Badge de Puesto de Estante */}
                                  <span className="clay-badge text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 shrink-0 font-mono shadow-sm">
                                    📍 Puesto: {item.puesto || products.find(p => p.id === item.productId)?.puesto || 'General'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {order.vendedor ? `Atendido por: ${order.vendedor}` : 'Caja 1'}
                          </span>

                          {isPending && (
                            <button
                              onClick={() => handleMarkAsReady(order.id)}
                              className={`clay-btn px-3 py-1.5 text-xs font-black flex items-center gap-1.5 transition-all ${
                                allItemsChecked ? 'clay-btn-primary !bg-emerald-600' : 'clay-btn-light text-amber-800'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{allItemsChecked ? '¡Listo! Pasar a Ventanilla' : 'Marcar Listo'}</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => handleMarkAsCompleted(order.id)}
                              className="clay-btn clay-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5 !bg-indigo-600"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Entregado en Ventanilla</span>
                            </button>
                          )}

                          {isCompleted && (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Despacho completado</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VISTA 3: STOCK FÍSICO & PUESTOS (SIN DINERO NI PRECIOS) */}
          {bodegaTab === 'inventario' && (
            <div className="space-y-4">
              
              <div className="clay-card p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span>Catálogo de Stock Físico en Estantería</span>
                      <span className="clay-badge text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                        {filteredStock.length} productos
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ubicación de frascos e insumos por puesto • Sin visualización de precios comerciales
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por fragancia, contratipo, SKU (#100) o Puesto (A1)..."
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      className="clay-input w-full pl-9 pr-3 py-2 text-xs font-bold"
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
                        <th className="py-2.5 px-3" style={{ width: '15%' }}>Ubicación Física</th>
                        <th className="py-2.5 px-3" style={{ width: '45%' }}>Descripción del Producto</th>
                        <th className="py-2.5 px-3" style={{ width: '15%' }}>Categoría</th>
                        <th className="py-2.5 px-3 text-right" style={{ width: '15%' }}>Existencia Física</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStock.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No se encontraron productos coincidentes.
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

        </main>
      </div>

    </div>
  );
}
