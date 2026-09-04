'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  CalendarDays, 
  FileSpreadsheet, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  Settings, 
  DollarSign, 
  Search, 
  Plus, 
  Sliders, 
  CheckCircle2, 
  X, 
  Trash2, 
  Edit3, 
  Building, 
  KeyRound, 
  Printer, 
  Droplets, 
  Filter,
  BarChart3,
  Calendar,
  Lock,
  ArrowUpRight,
  ReceiptText,
  FileCheck
} from 'lucide-react';
import { getStoredUsers, UserAccount, UserRole } from '@/lib/auth';
import { INITIAL_PRODUCTS, ProductItem, PERFUME_CATEGORIES, SaleRecord } from '@/lib/store';

type AdminTab = 
  | 'dashboard' 
  | 'productos' 
  | 'categorias' 
  | 'ventas-dia' 
  | 'reportes-periodo' 
  | 'reportes-financieros' 
  | 'usuarios' 
  | 'roles' 
  | 'configuracion';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Datos
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kodelocal_products');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kodelocal_sales');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [categories, setCategories] = useState<string[]>(PERFUME_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');

  // Filtros de Productos
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('Todos');

  // Modales
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Formulario Usuario
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPin, setUserPin] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('CASHIER');
  const [userRegister, setUserRegister] = useState('Caja 1 - Mostrador');

  // Precios Masivos
  const [bulkPrice, setBulkPrice] = useState('3.25');
  const [bulkCost, setBulkCost] = useState('1.95');

  // Reporte Filtro Período
  const [periodFilter, setPeriodFilter] = useState<'HOY' | 'MES' | 'ANIO'>('HOY');

  useEffect(() => {
    localStorage.setItem('kodelocal_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kodelocal_products', JSON.stringify(products));
  }, [products]);

  // Cálculos Financieros
  const totalEsencias = useMemo(() => products.filter(p => p.category === 'Esencias para Perfume').length, [products]);
  const totalStockOnzas = useMemo(() => products.filter(p => p.category === 'Esencias para Perfume').reduce((a, b) => a + b.stock, 0), [products]);
  const valorVentaTotal = useMemo(() => products.reduce((acc, p) => acc + (p.price * p.stock), 0), [products]);
  const valorCostoTotal = useMemo(() => products.reduce((acc, p) => acc + (p.cost * p.stock), 0), [products]);
  const gananciaPotencial = valorVentaTotal - valorCostoTotal;
  const margenPorcentual = valorVentaTotal > 0 ? ((gananciaPotencial / valorVentaTotal) * 100) : 0;

  // Cálculos de Ventas
  const totalVentasMonto = useMemo(() => sales.reduce((acc, s) => acc + s.total, 0), [sales]);
  const totalIvaFiscal = useMemo(() => sales.reduce((acc, s) => acc + s.ivaTotal, 0), [sales]);
  const totalDteCount = useMemo(() => sales.filter(s => s.tipoComprobante === '01' || s.tipoComprobante === '03').length, [sales]);

  // Filtrado de Productos para la tabla
  const filteredProducts = useMemo(() => {
    const q = prodSearch.toLowerCase().trim();
    return products.filter(p => {
      const matchCat = prodCatFilter === 'Todos' || p.category === prodCatFilter;
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)) || p.sku.toLowerCase() === q || (p.puesto && p.puesto.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [products, prodCatFilter, prodSearch]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: userName,
      email: userEmail,
      password: userPassword || '123456',
      pin: userPin || String(Math.floor(1000 + Math.random() * 9000)),
      role: userRole,
      cashRegister: userRegister,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    setIsUserModalOpen(false);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserPin('');
  };

  const handleApplyBulkPrices = (e: React.FormEvent) => {
    e.preventDefault();
    const np = parseFloat(bulkPrice);
    const nc = parseFloat(bulkCost);
    if (isNaN(np) || isNaN(nc)) return;

    setProducts(prev => prev.map(p => {
      if (p.category === 'Esencias para Perfume') {
        return { ...p, price: np, cost: nc };
      }
      return p;
    }));

    setIsBulkPriceModalOpen(false);
    alert(`¡Precios actualizados para las ${totalEsencias} esencias!`);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (categories.includes(newCatName.trim())) return;
    setCategories(prev => [...prev, newCatName.trim()]);
    setNewCatName('');
  };

  const handleStartEdit = (p: ProductItem) => {
    setEditingProduct({ ...p });
    setIsEditModalOpen(true);
  };

  const handleOpenNewProduct = () => {
    const nextSku = (products.length + 1).toString();
    setEditingProduct({
      id: `prod_${Date.now()}`,
      sku: nextSku,
      barcode: '',
      name: '',
      brand: '',
      puesto: '',
      gender: 'Unisex',
      category: 'Esencias para Perfume',
      unit: 'Onza',
      price: 3.25,
      cost: 1.95,
      stock: 20,
      minStock: 5,
      imageUrl: '',
      isAvailableOnline: true
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name.trim()) return;

    setProducts(prev => {
      const exists = prev.some(p => p.id === editingProduct.id);
      if (exists) {
        return prev.map(p => p.id === editingProduct.id ? editingProduct : p);
      } else {
        return [editingProduct, ...prev];
      }
    });

    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 pb-20 items-start">
      
      {/* ================= BARRA LATERAL IZQUIERDA (MENU FORMAL ERP) ================= */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-5 sticky top-24">
        
        {/* Encabezado del Menú Lateral */}
        <div className="clay-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-[3px_4px_10px_rgba(79,70,229,0.35)]">
            👑
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-800 leading-tight">Mando Gerencial</h2>
            <p className="text-[11px] text-slate-500 font-medium">Control de Operaciones</p>
          </div>
        </div>

        {/* Grupos de Navegación Vertical */}
        <div className="clay-card p-3 space-y-4">
          
          {/* SECCIÓN 1: DASHBOARD */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Principal
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'dashboard'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Ejecutivo</span>
            </button>
          </div>

          {/* SECCIÓN 2: CATÁLOGO Y PRODUCTOS */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Catálogo & Precios
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('productos')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'productos'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  <span>Productos</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100/50 text-indigo-700">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('categorias')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'categorias'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Categorías</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  {categories.length}
                </span>
              </button>
            </div>
          </div>

          {/* SECCIÓN 3: VENTAS Y REPORTES */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Ventas & Reportes
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('ventas-dia')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'ventas-dia'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Ventas del Día</span>
              </button>

              <button
                onClick={() => setActiveTab('reportes-periodo')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'reportes-periodo'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Reportes (Día, Mes, Año)</span>
              </button>

              <button
                onClick={() => setActiveTab('reportes-financieros')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'reportes-financieros'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Reportes Financieros</span>
              </button>
            </div>
          </div>

          {/* SECCIÓN 4: GESTIÓN DE PERSONAL */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Gestión de Personal
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'usuarios'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>Usuarios de Caja</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100/50 text-indigo-700">
                  {users.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'roles'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Roles & Permisos</span>
              </button>
            </div>
          </div>

          {/* SECCIÓN 5: CONFIGURACIÓN */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Sistema
            </p>
            <button
              onClick={() => setActiveTab('configuracion')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'configuracion'
                  ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Factura Llama & Negocio</span>
            </button>
          </div>

        </div>

      </aside>

      {/* ================= ÁREA DE CONTENIDO PRINCIPAL A LA DERECHA ================= */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">
        
        {/* ================= TAB 1: DASHBOARD EJECUTIVO ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Header */}
            <div className="clay-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Dashboard General de Operaciones</h2>
                <p className="text-xs text-slate-500 font-medium">Métricas clave en vivo de perfumería, ventas y márgenes</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBulkPriceModalOpen(true)}
                  className="clay-btn clay-btn-light px-3.5 py-2 text-xs flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ajustar Precios ($3.25)</span>
                </button>
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="clay-btn clay-btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Cajero</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Acumuladas</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">${totalVentasMonto.toFixed(2)}</h3>
                <span className="text-[11px] text-slate-500 font-medium">{sales.length} transacciones</span>
              </div>

              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Margen de Ganancia</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">+{margenPorcentual.toFixed(1)}%</h3>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  +$1.30 netos por Oz
                </span>
              </div>

              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Inventario (PVP)</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">${valorVentaTotal.toFixed(2)}</h3>
                <span className="text-[11px] text-slate-500 font-medium">{totalStockOnzas} Oz en bodega</span>
              </div>

              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">DTEs Transmitidos</p>
                <h3 className="text-2xl font-black text-purple-600 mt-1">{totalDteCount}</h3>
                <span className="text-[11px] text-slate-500 font-medium">Facturas a Hacienda</span>
              </div>
            </div>

            {/* Gráfico y Ventas Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Desglose de Rentabilidad */}
              <div className="clay-card p-6 lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-800">Estructura Financiera de Esencias</h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    641 Contratipos
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Precio Venta al Público (PVP):</span>
                      <span className="text-indigo-600 font-black text-sm">$3.25 / Oz</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full w-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Costo de Adquisición / Proveedor:</span>
                      <span className="text-slate-800 font-black text-sm">$1.95 / Oz (60.0%)</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full w-[60%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">Ganancia Bruta Libre:</span>
                      <span className="text-emerald-600 font-black text-sm">$1.30 / Oz (40.0%)</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[40%]"></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 mt-4 leading-relaxed">
                  💡 <strong>Análisis Gerencial:</strong> Por cada 100 onzas de fragancia vendidas en el mostrador o por envíos, generas <strong>$325.00 en caja</strong> con una utilidad directa de <strong>$130.00 libres</strong>.
                </div>
              </div>

              {/* Personal en Turno */}
              <div className="clay-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 mb-3">Cajeros & Turnos</h3>
                  <div className="space-y-2.5">
                    {users.slice(0, 3).map(u => (
                      <div key={u.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">{u.name}</span>
                          <span className="text-[11px] text-slate-400">{u.cashRegister}</span>
                        </div>
                        <span className="clay-badge bg-emerald-50 text-emerald-700 text-[10px] py-0.5 px-2 font-bold">
                          PIN: {u.pin}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('usuarios')}
                  className="clay-btn clay-btn-light w-full py-2.5 text-xs mt-4"
                >
                  Gestionar Todo el Personal
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: CATÁLOGO MAESTRO DE PRODUCTOS ================= */}
        {activeTab === 'productos' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            
            <div className="clay-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Catálogo Maestro de Productos</h2>
                <p className="text-xs text-slate-500 font-medium">Control de precios de venta, costos de compra y existencias</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenNewProduct}
                  className="clay-btn clay-btn-light px-4 py-2.5 text-xs flex items-center gap-1.5 font-bold"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Nuevo Producto</span>
                </button>
                <button
                  onClick={() => setIsBulkPriceModalOpen(true)}
                  className="clay-btn clay-btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Cambio Masivo de Precios</span>
                </button>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="clay-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por código (#100), nombre, marca o puesto (A1)..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="clay-input has-icon w-full text-xs py-2"
                />
              </div>

              <select
                value={prodCatFilter}
                onChange={(e) => setProdCatFilter(e.target.value)}
                className="clay-input text-xs py-2 w-full sm:w-56 font-bold"
              >
                <option value="Todos">Todas las Categorías</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Tabla de Productos con Margen y Costo visible para Gerencia */}
            <div className="clay-card p-4 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 sticky top-0 bg-white">
                    <tr>
                      <th className="py-3 px-3">Código</th>
                      <th className="py-3 px-3">Puesto</th>
                      <th className="py-3 px-3">Producto / Contratipo</th>
                      <th className="py-3 px-3">Marca</th>
                      <th className="py-3 px-3">Categoría</th>
                      <th className="py-3 px-3">Costo ($)</th>
                      <th className="py-3 px-3">PVP Venta ($)</th>
                      <th className="py-3 px-3">Margen Neto</th>
                      <th className="py-3 px-3">Stock</th>
                      <th className="py-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.slice(0, 100).map((p) => {
                      const margen = p.price - p.cost;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                            #{p.sku}
                          </td>
                          <td className="py-2.5 px-3">
                            {p.puesto ? (
                              <span className="clay-badge bg-amber-50 text-amber-900 border border-amber-200/80 font-mono font-black text-xs py-0.5 px-2 inline-flex items-center gap-1 shadow-sm" title="Ubicación física en estante">
                                📍 {p.puesto}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-[11px]">
                                -
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {p.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {p.brand || 'Kode'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="clay-badge bg-slate-100 text-slate-600 text-[10px] py-0.5 px-2">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-600 font-mono">
                            ${p.cost.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-black text-indigo-600 font-mono text-sm">
                            ${p.price.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600 font-mono">
                            +${margen.toFixed(2)} ({((margen/p.price)*100).toFixed(0)}%)
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                            {p.stock} {p.unit === 'Onza' ? 'Oz' : 'Un.'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 font-bold transition-all inline-flex items-center gap-1 shadow-sm active:scale-95"
                              title="Editar producto, precios y stock"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 p-2 border-t border-slate-100 mt-2 text-right">
                Mostrando {Math.min(filteredProducts.length, 100)} de {filteredProducts.length} productos
              </p>
            </div>

          </div>
        )}

        {/* ================= TAB 3: GESTIÓN DE CATEGORÍAS ================= */}
        {activeTab === 'categorias' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            <div className="clay-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Gestión de Categorías</h2>
                <p className="text-xs text-slate-500 font-medium">Clasificación para Punto de Venta y E-Commerce</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Lista */}
              <div className="lg:col-span-2 space-y-3">
                {categories.map((cat, idx) => {
                  const count = products.filter(p => p.category === cat).length;
                  return (
                    <div key={idx} className="clay-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                          {cat.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">{cat}</h4>
                          <span className="text-xs text-slate-400 font-medium">{count} productos asociados</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="clay-badge bg-emerald-50 text-emerald-700 text-xs py-0.5 px-2.5">
                          Activa en Tienda
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formulario Nueva Categoría */}
              <div className="clay-card p-5 h-fit">
                <h3 className="font-extrabold text-sm text-slate-800 mb-1">Nueva Categoría</h3>
                <p className="text-xs text-slate-500 mb-4">Crea una categoría para organizar el catálogo.</p>

                <form onSubmit={handleAddCategory} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Categoría</label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ej. Tapas y Atomizadores"
                      className="clay-input w-full text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="clay-btn clay-btn-primary w-full py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Categoría</span>
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 4: VENTAS DEL DÍA ================= */}
        {activeTab === 'ventas-dia' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="clay-card p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-800">Ventas y Cortes de Caja de Hoy</h2>
                <p className="text-xs text-slate-500 font-medium">Control de flujo de caja y comprobantes emitidos en el día</p>
              </div>
              <button
                onClick={() => window.print()}
                className="clay-btn clay-btn-light px-3.5 py-2 text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Corte de Caja</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cobrado Hoy</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">${totalVentasMonto.toFixed(2)}</h3>
              </div>
              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tickets / DTEs</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{sales.length}</h3>
              </div>
              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">IVA Recaudado (13%)</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">${totalIvaFiscal.toFixed(2)}</h3>
              </div>
            </div>

            <div className="clay-card p-5">
              <h3 className="font-extrabold text-sm text-slate-800 mb-3">Transacciones Realizadas</h3>
              {sales.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aún no se registran ventas el día de hoy.
                </div>
              ) : (
                <div className="space-y-2">
                  {sales.map(s => (
                    <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block font-mono">{s.saleNumber}</span>
                        <span className="text-[11px] text-slate-400">{s.cliente.nombre} • {s.paymentMethod}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm block">${s.total.toFixed(2)}</span>
                        <span className="clay-badge bg-emerald-50 text-emerald-700 text-[9px] py-0.2 px-1.5">
                          {s.tipoComprobante === '01' ? 'Factura 01' : s.tipoComprobante === '03' ? 'Crédito Fiscal 03' : 'Ticket'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: REPORTES DE VENTAS POR PERÍODO ================= */}
        {activeTab === 'reportes-periodo' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="clay-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Reportes de Ventas por Período</h2>
                <p className="text-xs text-slate-500 font-medium">Consolidado para análisis y declaraciones fiscales</p>
              </div>

              {/* Selector Día, Mes, Año */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                {(['HOY', 'MES', 'ANIO'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriodFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      periodFilter === p ? 'clay-btn-primary' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p === 'HOY' ? 'Día Actual' : p === 'MES' ? 'Mes (Septiembre)' : 'Año 2026'}
                  </button>
                ))}
              </div>
            </div>

            <div className="clay-card p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800">
                Resumen del Período ({periodFilter === 'HOY' ? 'Hoy' : periodFilter === 'MES' ? 'Mes Actual' : 'Año 2026'})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Ventas Gravadas (Neto)</span>
                  <span className="text-xl font-black text-slate-800">${(totalVentasMonto / 1.13).toFixed(2)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                  <span className="text-xs text-purple-700 font-bold block">Débito Fiscal IVA (13%)</span>
                  <span className="text-xl font-black text-purple-700">${totalIvaFiscal.toFixed(2)}</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-bold block">Total Recaudado</span>
                  <span className="text-xl font-black text-emerald-700">${totalVentasMonto.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="clay-btn clay-btn-light px-4 py-2.5 text-xs flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Descargar / Imprimir Reporte</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: REPORTES FINANCIEROS Y RENTABILIDAD ================= */}
        {activeTab === 'reportes-financieros' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="clay-card p-6">
              <h2 className="text-xl font-black text-slate-800">Reporte Financiero y Utilidad Real</h2>
              <p className="text-xs text-slate-500 font-medium">Margen bruto, costos de compra y proyecciones de ganancia</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inversión en Mercadería</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">${valorCostoTotal.toFixed(2)}</h3>
                <span className="text-[11px] text-slate-400 font-medium">A costo $1.95 por onza</span>
              </div>

              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retorno Proyectado</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">${valorVentaTotal.toFixed(2)}</h3>
                <span className="text-[11px] text-slate-400 font-medium">A venta $3.25 por onza</span>
              </div>

              <div className="clay-card p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ganancia Neta Proyectada</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">+${gananciaPotencial.toFixed(2)}</h3>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  40.0% Margen de Ganancia
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: GESTIÓN DE USUARIOS DE CAJA ================= */}
        {activeTab === 'usuarios' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="clay-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Gestión de Personal y Cajeros</h2>
                <p className="text-xs text-slate-500 font-medium">Crea usuarios, asigna PIN de 4 dígitos y define accesos</p>
              </div>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="clay-btn clay-btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Usuario</span>
              </button>
            </div>

            <div className="clay-card p-4 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Colaborador</th>
                      <th className="py-3 px-3">Correo</th>
                      <th className="py-3 px-3">Rol</th>
                      <th className="py-3 px-3">PIN de Caja</th>
                      <th className="py-3 px-3">Sucursal / Terminal</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{u.email}</td>
                        <td className="py-3 px-3">
                          <span className={`clay-badge text-[10px] py-0.5 px-2 ${
                            u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {u.role === 'ADMIN' ? '👑 Gerente' : '🛒 Cajero'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {u.pin}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{u.cashRegister}</td>
                        <td className="py-3 px-3">
                          <span className="text-emerald-600 font-bold text-[11px]">● Activo</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => setUsers(prev => prev.filter(x => x.id !== u.id))}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 8: MATRIZ DE ROLES Y PERMISOS ================= */}
        {activeTab === 'roles' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="clay-card p-6">
              <h2 className="text-xl font-black text-slate-800">Matriz de Roles y Privilegios de Seguridad</h2>
              <p className="text-xs text-slate-500 font-medium">Control estricto de qué información puede ver cada puesto de trabajo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Rol Administrador */}
              <div className="clay-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👑</span>
                    <h3 className="font-extrabold text-sm text-slate-800">Gerente / Administrador</h3>
                  </div>
                  <span className="clay-badge bg-purple-50 text-purple-700 text-[10px] py-0.5 px-2">Acceso Total</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ver costos de compra ($1.95) y márgenes de ganancia.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Crear, editar o desactivar cajeros y usuarios.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Actualización masiva de precios y catálogo.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Configuración fiscal con Factura Llama y Hacienda.</span>
                  </li>
                </ul>
              </div>

              {/* Rol Cajero */}
              <div className="clay-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛒</span>
                    <h3 className="font-extrabold text-sm text-slate-800">Cajero / Vendedor</h3>
                  </div>
                  <span className="clay-badge bg-indigo-50 text-indigo-700 text-[10px] py-0.5 px-2">Operativo</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Cobrar, buscar fragancias y emitir tickets o DTEs.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ingreso ultra rápido mediante PIN de 4 dígitos.</span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-600 font-semibold">
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    <span>🔒 Costos de compra ($1.95) y márgenes estrictamente ocultos.</span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-600 font-semibold">
                    <X className="w-3.5 h-3.5 text-rose-500" />
                    <span>No puede borrar categorías ni cambiar precios oficiales.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 9: CONFIGURACIÓN FACTURA LLAMA ================= */}
        {activeTab === 'configuracion' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="clay-card p-6">
              <h2 className="text-xl font-black text-slate-800">Configuración Fiscal de El Salvador</h2>
              <p className="text-xs text-slate-500 font-medium">Parámetros de Factura Llama y Ministerio de Hacienda</p>
            </div>

            <div className="clay-card p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900">Estado de Conexión: Activo</h4>
                  <p className="text-[11px] text-emerald-700">Conectado con https://api.facturallama.com</p>
                </div>
                <span className="clay-badge bg-emerald-100 text-emerald-800 font-bold text-xs py-1 px-3">
                  Modo Pruebas / Sandbox
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Comercial</label>
                  <input type="text" readOnly value="KodeLocal Store" className="clay-input w-full" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIT del Emisor</label>
                  <input type="text" readOnly value="0614-010190-101-1" className="clay-input w-full font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NRC</label>
                  <input type="text" readOnly value="123456-7" className="clay-input w-full font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giro Comercial</label>
                  <input type="text" readOnly value="Venta de esencias de perfumería y envases" className="clay-input w-full" />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ================= MODAL: CREAR USUARIO DE CAJA ================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">Nuevo Usuario de Caja</h3>
            <p className="text-xs text-slate-500 mb-5">Define el colaborador, su PIN de mostrador y sucursal.</p>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ej. Sofía Martínez"
                  className="clay-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="sofia@kodelocal.com"
                  className="clay-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="clay-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">PIN Rápido (4 dígitos)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value)}
                    placeholder="1234"
                    className="clay-input w-full text-xs font-mono font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rol de Acceso</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="CASHIER">Cajero / Cotizador</option>
                    <option value="LOGISTICS">Almacén y Envíos</option>
                    <option value="ADMIN">Gerente General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Caja Asignada</label>
                  <input
                    type="text"
                    value={userRegister}
                    onChange={(e) => setUserRegister(e.target.value)}
                    placeholder="Caja 1"
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="clay-btn clay-btn-light flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2.5 text-xs"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ACTUALIZADOR MASIVO DE PRECIOS ================= */}
      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsBulkPriceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">Cambio Masivo de Precios</h3>
            <p className="text-xs text-slate-500 mb-4">
              Aplica nuevo precio o costo a todas las <strong>{totalEsencias} esencias</strong> en 1 clic.
            </p>

            <form onSubmit={handleApplyBulkPrices} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio Venta ($ / Oz)</label>
                  <div className="clay-input flex items-center gap-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20">
                    <span className="font-black text-slate-400 select-none text-base">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-lg font-black text-indigo-600 p-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Costo Compra ($ / Oz)</label>
                  <div className="clay-input flex items-center gap-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20">
                    <span className="font-black text-slate-400 select-none text-base">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={bulkCost}
                      onChange={(e) => setBulkCost(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-lg font-black text-slate-700 p-0"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1 font-medium">
                <p><strong>Margen por onza:</strong> ${(parseFloat(bulkPrice) - parseFloat(bulkCost)).toFixed(2)}</p>
                <p><strong>Margen porcentual:</strong> {(((parseFloat(bulkPrice) - parseFloat(bulkCost)) / parseFloat(bulkPrice)) * 100).toFixed(1)}%</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkPriceModalOpen(false)}
                  className="clay-btn clay-btn-light flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2.5 text-xs"
                >
                  Actualizar Todas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR / CREAR PRODUCTO ================= */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="clay-card w-full max-w-xl p-6 relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="clay-badge bg-indigo-50 text-indigo-700 text-xs font-mono font-bold px-2.5 py-0.5">
                #{editingProduct.sku}
              </span>
              <h3 className="text-xl font-black text-slate-800">
                {products.some(p => p.id === editingProduct.id) ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Modifica precios de venta, costo de compra o nivel de existencias en tiempo real.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Nombre, Marca y Puesto */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nombre / Fragancia Contratipo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Ej. Sauvage H"
                    className="clay-input w-full text-xs font-bold"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Marca / Casa
                  </label>
                  <input
                    type="text"
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    placeholder="Ej. Dior"
                    className="clay-input w-full text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Puesto / Estante
                  </label>
                  <input
                    type="text"
                    value={editingProduct.puesto || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, puesto: e.target.value.toUpperCase() })}
                    placeholder="Ej. A1"
                    className="clay-input w-full text-xs font-mono font-black text-amber-900 bg-amber-50/40 uppercase"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Ej: A1 = Estante A, Nivel 1</span>
                </div>
              </div>

              {/* Categoría, Género y Unidad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="clay-input w-full text-xs font-bold"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Género</label>
                  <select
                    value={editingProduct.gender || 'Unisex'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gender: e.target.value })}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="Caballero">Caballero</option>
                    <option value="Dama">Dama</option>
                    <option value="Unisex">Unisex</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidad de Medida</label>
                  <select
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="Onza">Onza (Oz)</option>
                    <option value="Unidad">Unidad (Un.)</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Galón">Galón</option>
                  </select>
                </div>
              </div>

              {/* Precios y Costo */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                  Estructura de Precios y Margen
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Precio de Venta ($ PVP) <span className="text-rose-500">*</span>
                    </label>
                    <div className="clay-input flex items-center gap-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20">
                      <span className="font-bold text-slate-400 select-none text-base">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={editingProduct.price === 0 ? '' : editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="bg-transparent border-none outline-none w-full text-base font-black text-indigo-600 p-0"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Precio al cliente en el Punto de Venta</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Costo de Compra ($ Costo) <span className="text-rose-500">*</span>
                    </label>
                    <div className="clay-input flex items-center gap-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20">
                      <span className="font-bold text-slate-400 select-none text-base">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={editingProduct.cost === 0 ? '' : editingProduct.cost}
                        onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="bg-transparent border-none outline-none w-full text-base font-black text-slate-700 p-0"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Costo mayorista (solo Gerencia)</span>
                  </div>
                </div>

                {/* Margen Calculado en Tiempo Real */}
                {(() => {
                  const marginNet = (editingProduct.price || 0) - (editingProduct.cost || 0);
                  const marginPct = (editingProduct.price || 0) > 0 ? ((marginNet / editingProduct.price) * 100) : 0;
                  return (
                    <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Margen neto proyectado:</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-black font-mono text-sm ${marginNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {marginNet >= 0 ? '+' : ''}${marginNet.toFixed(2)}
                        </span>
                        <span className={`clay-badge text-[10px] py-0.5 px-2 ${marginNet >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {marginPct.toFixed(1)}% margen
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Control de Inventario y Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stock Disponible ({editingProduct.unit === 'Onza' ? 'Oz' : 'Unidades'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock === 0 ? '0' : editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="clay-input w-full text-sm font-bold text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stock Mínimo de Alerta
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.minStock === 0 ? '0' : editingProduct.minStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 0 })}
                    className="clay-input w-full text-sm font-bold text-slate-600 font-mono"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                  className="clay-btn clay-btn-light flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
