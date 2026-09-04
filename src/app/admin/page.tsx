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
  FileCheck,
  Box,
  Check,
  ShoppingCart,
  History,
  RotateCcw
} from 'lucide-react';
import { 
  getStoredUsers, 
  UserAccount, 
  UserRole, 
  getStoredRoles, 
  saveStoredRoles, 
  CustomRole, 
  SYSTEM_VIEWS 
} from '@/lib/auth';
import { INITIAL_PRODUCTS, ProductItem, PERFUME_CATEGORIES, SaleRecord, resetDatabaseToZeroStock, getStoredProducts, DATA_VERSION } from '@/lib/store';
import ComprasModule from '@/components/admin/ComprasModule';
import KardexModule from '@/components/admin/KardexModule';
import {
  getStoredPurchases,
  saveStoredPurchases,
  getStoredSuppliers,
  saveStoredSuppliers,
  PurchaseRecord,
  Supplier
} from '@/lib/purchases';
import {
  getStoredKardex,
  saveStoredKardex,
  KardexMovement
} from '@/lib/kardex';

type AdminTab = 
  | 'dashboard' 
  | 'productos' 
  | 'categorias' 
  | 'kardex'
  | 'ventas-dia' 
  | 'reportes-periodo' 
  | 'reportes-financieros' 
  | 'compras'
  | 'usuarios' 
  | 'roles' 
  | 'configuracion';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Datos
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [products, setProducts] = useState<ProductItem[]>(() => getStoredProducts());

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const currentVersion = localStorage.getItem('kodelocal_data_version');
      if (currentVersion !== DATA_VERSION) return [];
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

  // Estado Usuario
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Precios Masivos
  const [bulkPrice, setBulkPrice] = useState('3.25');
  const [bulkCost, setBulkCost] = useState('1.95');

  // Reporte Filtro Período
  const [periodFilter, setPeriodFilter] = useState<'HOY' | 'MES' | 'ANIO'>('HOY');

  // Roles y Privilegios
  const [roles, setRoles] = useState<CustomRole[]>(() => getStoredRoles());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  // Compras y Proveedores (Inspirado en Mecanic OS)
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => getStoredPurchases());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredSuppliers());

  useEffect(() => {
    localStorage.setItem('kodelocal_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kodelocal_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    saveStoredRoles(roles);
  }, [roles]);

  useEffect(() => {
    saveStoredPurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    saveStoredSuppliers(suppliers);
  }, [suppliers]);

  // Kárdex de Inventario
  const [kardexMovements, setKardexMovements] = useState<KardexMovement[]>(() => getStoredKardex());
  const [kardexFilterProduct, setKardexFilterProduct] = useState<string | null>(null);

  useEffect(() => {
    saveStoredKardex(kardexMovements);
  }, [kardexMovements]);

  const handleAddKardexMovement = (movement: KardexMovement) => {
    setKardexMovements(prev => [movement, ...prev]);
  };

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

  const handleOpenNewUser = () => {
    setEditingUser({
      id: `usr-${Date.now()}`,
      name: '',
      email: '',
      password: '',
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      role: 'CASHIER',
      cashRegister: 'Caja 1 - Mostrador Principal',
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setIsUserModalOpen(true);
  };

  const handleStartEditUser = (u: UserAccount) => {
    setEditingUser({ ...u });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name.trim() || !editingUser.email.trim()) return;

    setUsers(prev => {
      const exists = prev.some(u => u.id === editingUser.id);
      if (exists) {
        return prev.map(u => u.id === editingUser.id ? editingUser : u);
      } else {
        return [...prev, editingUser];
      }
    });

    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleToggleUserStatus = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (target.role === 'ADMIN') {
      alert('No se puede desactivar la cuenta del Administrador General.');
      return;
    }
    const newStatus = target.isActive === false ? true : false;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: newStatus } : u));
  };

  const handleGenerateRandomPin = () => {
    if (!editingUser) return;
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setEditingUser({ ...editingUser, pin: randomPin });
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

  const handleStartEditRole = (r: CustomRole) => {
    setEditingRole({ ...r, allowedViews: [...r.allowedViews] });
    setIsRoleModalOpen(true);
  };

  const handleOpenNewRole = () => {
    setEditingRole({
      id: `role_${Date.now()}`,
      code: `ROL_${roles.length + 1}`,
      name: '',
      description: '',
      color: 'indigo',
      allowedViews: ['pos'],
      canSeeCosts: false,
      canEditPrices: false,
      isSystem: false,
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editingRole.name.trim()) return;

    setRoles(prev => {
      const exists = prev.some(r => r.id === editingRole.id);
      if (exists) {
        return prev.map(r => r.id === editingRole.id ? editingRole : r);
      } else {
        return [...prev, editingRole];
      }
    });

    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    if (!roleToDelete || roleToDelete.isSystem) {
      alert('No se pueden eliminar los roles base del sistema.');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el rol "${roleToDelete.name}"?`)) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
    }
  };

  const handleToggleViewInRole = (viewId: string) => {
    if (!editingRole) return;
    const currentViews = editingRole.allowedViews;
    const hasView = currentViews.includes(viewId);
    setEditingRole({
      ...editingRole,
      allowedViews: hasView 
        ? currentViews.filter(v => v !== viewId)
        : [...currentViews, viewId]
    });
  };

  const handleResetToZeroStock = () => {
    if (confirm('⚠️ ¿Estás seguro de reiniciar los movimientos y poner stock en cero?\n\n- Se pondrán las existencias de todos los productos en 0.\n- Se eliminarán las compras registradas.\n- Se eliminarán las ventas registradas.\n- El Kárdex quedará en cero.\n\nEl catálogo de fragancias, botes e insumos se mantendrá intacto con stock 0.')) {
      const resetProds = resetDatabaseToZeroStock();
      setProducts(resetProds);
      setPurchases([]);
      setSales([]);
      setKardexMovements([]);
      alert('✅ Base de datos limpia:\n\n- Todo el catálogo tiene stock 0.\n- Sin ventas, compras ni movimientos en Kárdex.\nListo para simular compras y ventas desde cero.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 pb-20 items-start w-full">
      
      {/* ================= BARRA LATERAL IZQUIERDA (MENU FORMAL ERP) ================= */}
      <aside className="w-full md:w-56 lg:w-60 shrink-0 flex flex-col gap-4 sticky top-20">
        
        {/* Encabezado del Menú Lateral */}
        <div className="clay-card p-3.5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-[2px_3px_8px_rgba(79,70,229,0.35)] shrink-0">
            👑
          </div>
          <div>
            <h2 className="font-extrabold text-xs text-slate-800 leading-tight">Mando Gerencial</h2>
            <p className="text-[10px] text-slate-500 font-medium">Control de Operaciones</p>
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

              <button
                onClick={() => {
                  setKardexFilterProduct(null);
                  setActiveTab('kardex');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'kardex'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4" />
                  <span>Kárdex de Inventario</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100/50 text-indigo-700">
                  {kardexMovements.length}
                </span>
              </button>
            </div>
          </div>

          {/* SECCIÓN: COMPRAS & SUMINISTROS */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Compras & Suministros
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('compras')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'compras'
                    ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Compras & Proveedores</span>
                </div>
                {purchases.filter(p => p.paymentStatus === 'PENDIENTE').length > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                    {purchases.filter(p => p.paymentStatus === 'PENDIENTE').length} CxP
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100/50 text-indigo-700">
                    {purchases.length}
                  </span>
                )}
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

          {/* HERRAMIENTA: LIMPIAR MOVIMIENTOS A CEROS */}
          <div className="pt-2 border-t border-slate-200/80">
            <button
              onClick={handleResetToZeroStock}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[10.5px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all text-center shadow-sm"
              title="Pone el catálogo en stock 0 y borra ventas, compras y kardex para iniciar pruebas limpias"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Movimientos a Cero</span>
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
                  onClick={() => {
                    setKardexFilterProduct(null);
                    setActiveTab('kardex');
                  }}
                  className="clay-btn clay-btn-light px-3.5 py-2.5 text-xs flex items-center gap-1.5 font-bold text-indigo-700"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Kárdex General</span>
                </button>
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setKardexFilterProduct(p.id);
                                  setActiveTab('kardex');
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all inline-flex items-center gap-1 shadow-sm active:scale-95 text-[11px]"
                                title={`Ver movimientos de ${p.name} en el Kárdex`}
                              >
                                <History className="w-3 h-3 text-indigo-600" />
                                <span>Kárdex</span>
                              </button>
                              <button
                                onClick={() => handleStartEdit(p)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 font-bold transition-all inline-flex items-center gap-1 shadow-sm active:scale-95 text-[11px]"
                                title="Editar producto, precios y stock"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                            </div>
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
                onClick={handleOpenNewUser}
                className="clay-btn clay-btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5 font-bold"
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
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold">{u.name}</span>
                            {u.role === 'ADMIN' && (
                              <span className="text-[9px] text-purple-600 font-bold uppercase">Super Administrador</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{u.email}</td>
                        <td className="py-3 px-3">
                          <span className={`clay-badge text-[10px] py-0.5 px-2 font-bold ${
                            u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' :
                            u.role === 'BODEGA' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            u.role === 'DESPACHO' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            'bg-indigo-50 text-indigo-700'
                          }`}>
                            {roles.find(r => r.code === u.role)?.name || u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {u.pin}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{u.cashRegister || 'Sin asignar'}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                              u.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                            title={u.isActive !== false ? 'Cuenta activa (clic para suspender)' : 'Cuenta desactivada (clic para reactivar)'}
                          >
                            <span className={`w-2 h-2 rounded-full ${u.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <span>{u.isActive !== false ? 'Activo' : 'Inactivo'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditUser(u)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-all inline-flex items-center gap-1 text-[11px] shadow-sm active:scale-95"
                              title="Editar datos, rol, PIN y contraseña"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar el usuario "${u.name}"?`)) {
                                    setUsers(prev => prev.filter(x => x.id !== u.id));
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 8: MATRIZ DE ROLES Y CONTROL DE ACCESOS ================= */}
        {activeTab === 'roles' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            <div className="clay-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Matriz de Roles y Accesos a Vistas</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Crea roles personalizados y define exactamente a qué pantallas (Punto de Venta, Bodega, Inventario, Caja, Gerencia) tiene acceso cada colaborador.
                </p>
              </div>
              <button
                onClick={handleOpenNewRole}
                className="clay-btn clay-btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5 font-bold whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Rol</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {roles.map((r) => {
                const assignedUsersCount = users.filter(u => u.role === r.code).length;

                return (
                  <div key={r.id} className="clay-card p-5 space-y-4 flex flex-col justify-between">
                    <div>
                      {/* Cabecera del Rol */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {r.code === 'ADMIN' ? '👑' : r.code === 'BODEGA' ? '📦' : r.code === 'DESPACHO' ? '🚚' : '🛒'}
                            </span>
                            <h3 className="font-black text-sm text-slate-800">{r.name}</h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`clay-badge text-[10px] py-0.5 px-2.5 font-mono font-bold ${
                            r.code === 'ADMIN' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                            r.code === 'BODEGA' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                            r.code === 'DESPACHO' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                            'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          }`}>
                            {r.code}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {assignedUsersCount} {assignedUsersCount === 1 ? 'usuario' : 'usuarios'}
                          </span>
                        </div>
                      </div>

                      {/* Vistas Permitidas */}
                      <div className="pt-3 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Vistas Habilitadas en el Menú ({r.allowedViews.length} de {SYSTEM_VIEWS.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {SYSTEM_VIEWS.map((sv) => {
                            const isAllowed = r.allowedViews.includes(sv.id);
                            return (
                              <span
                                key={sv.id}
                                className={`text-[11px] font-bold py-1 px-2.5 rounded-xl border flex items-center gap-1 transition-all ${
                                  isAllowed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-40 line-through'
                                }`}
                              >
                                {isAllowed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                                <span>{sv.name}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Permisos Especiales de Seguridad */}
                      <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-center gap-2">
                          {r.canSeeCosts ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                          <span className={r.canSeeCosts ? 'text-slate-700 font-medium' : 'text-rose-600 font-bold'}>
                            {r.canSeeCosts ? 'Acceso a costos de compra ($1.95) y márgenes' : '🔒 Costos ($1.95) y márgenes estrictamente ocultos'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {r.canEditPrices ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className={r.canEditPrices ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                            {r.canEditPrices ? 'Puede modificar precios oficiales' : 'Bloqueado cambio de precios'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones del Rol */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">
                        {r.isSystem ? 'Rol predeterminado' : 'Rol personalizado'}
                      </span>

                      <div className="flex items-center gap-2">
                        {!r.isSystem && (
                          <button
                            onClick={() => handleDeleteRole(r.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Eliminar Rol"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEditRole(r)}
                          className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 text-indigo-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Configurar Accesos</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ================= TAB: KÁRDEX DE INVENTARIO ================= */}
        {activeTab === 'kardex' && (
          <KardexModule
            products={products}
            onUpdateProducts={setProducts}
            purchases={purchases}
            sales={sales}
            manualMovements={kardexMovements}
            onAddManualMovement={handleAddKardexMovement}
            initialSelectedProductId={kardexFilterProduct}
            onClearSelectedProduct={() => setKardexFilterProduct(null)}
          />
        )}

        {/* ================= TAB: COMPRAS & PROVEEDORES ================= */}
        {activeTab === 'compras' && (
          <ComprasModule
            products={products}
            onUpdateProducts={setProducts}
            suppliers={suppliers}
            onUpdateSuppliers={setSuppliers}
            purchases={purchases}
            onUpdatePurchases={setPurchases}
            onAddKardexMovement={handleAddKardexMovement}
          />
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

      {/* ================= MODAL: CREAR / EDITAR USUARIO ================= */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="clay-card w-full max-w-lg p-6 relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-slate-800">
                {users.some(u => u.id === editingUser.id) ? 'Editar Usuario y Accesos' : 'Nuevo Usuario de Sistema'}
              </h3>
              <span className={`clay-badge text-[10px] font-bold py-0.5 px-2.5 ${
                editingUser.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {editingUser.isActive !== false ? '● Activo' : '○ Inactivo'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Gestiona credenciales, sucursal, rol asignado y restablecimiento de contraseña.
            </p>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Nombre y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="Ej. Sofía Martínez"
                    className="clay-input w-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="sofia@kodelocal.com"
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Rol y Sucursal / Caja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rol de Acceso</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="clay-input w-full text-xs font-bold"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sucursal / Terminal Asignada</label>
                  <input
                    type="text"
                    value={editingUser.cashRegister || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, cashRegister: e.target.value })}
                    placeholder="Ej. Caja 1 - Mostrador Principal"
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Credenciales y Reset de Contraseña / PIN */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                    Credenciales de Seguridad & Acceso
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Restablece clave o PIN en cualquier momento
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Contraseña Web
                    </label>
                    <input
                      type="text"
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      placeholder="Nueva contraseña..."
                      className="clay-input w-full text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Visible solo para Gerencia</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        PIN de Caja (4 dígitos)
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomPin}
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Generar Aleatorio</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      value={editingUser.pin || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, pin: e.target.value.replace(/\D/g, '') })}
                      placeholder="1234"
                      className="clay-input w-full text-sm font-mono font-black text-indigo-600 text-center tracking-widest"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block text-center">Para cobro rápido en mostrador</span>
                  </div>
                </div>
              </div>

              {/* Estado de la Cuenta (Activo / Inactivo) */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Estado de Acceso</h4>
                  <p className="text-[11px] text-slate-500">
                    {editingUser.isActive !== false 
                      ? 'El colaborador puede iniciar sesión y operar en el sistema.' 
                      : 'Acceso suspendido: el usuario no podrá iniciar sesión en ninguna terminal.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive !== false}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }}
                  className="clay-btn clay-btn-light flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2.5 text-xs font-bold"
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

      {/* ================= MODAL: CREAR / EDITAR ROL ================= */}
      {isRoleModalOpen && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="clay-card w-full max-w-xl p-6 relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => { setIsRoleModalOpen(false); setEditingRole(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">
              {roles.some(r => r.id === editingRole.id) ? 'Configurar Rol y Accesos' : 'Crear Nuevo Rol'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Define el nombre del puesto y selecciona exactamente a qué vistas y datos podrá acceder este colaborador.
            </p>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nombre del Rol <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    placeholder="Ej. Bodega / Preparador"
                    className="clay-input w-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Código <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingRole.isSystem}
                    value={editingRole.code}
                    onChange={(e) => setEditingRole({ ...editingRole, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="BODEGA"
                    className="clay-input w-full text-xs font-mono font-black uppercase text-indigo-600 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descripción del Puesto
                </label>
                <input
                  type="text"
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  placeholder="Ej. Responsable de preparar pedidos en estante y entrega en ventanilla"
                  className="clay-input w-full text-xs"
                />
              </div>

              {/* Selección de Vistas con Acceso Permitido */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                    Vistas y Módulos Permitidos
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600">
                    {editingRole.allowedViews.length} de {SYSTEM_VIEWS.length} seleccionadas
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Las pantallas no seleccionadas estarán completamente ocultas y bloqueadas para este usuario.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {SYSTEM_VIEWS.map((sv) => {
                    const isChecked = editingRole.allowedViews.includes(sv.id);
                    return (
                      <div
                        key={sv.id}
                        onClick={() => handleToggleViewInRole(sv.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-white border-indigo-300 shadow-sm'
                            : 'bg-white/40 border-slate-200 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded text-indigo-600 cursor-pointer pointer-events-none"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-800">{sv.name}</p>
                          <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                            {sv.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permisos Especiales de Seguridad */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Permisos Financieros Especiales
                </span>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRole.canSeeCosts}
                    onChange={(e) => setEditingRole({ ...editingRole, canSeeCosts: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span>
                    Permitir ver <strong>costos de compra ($1.95)</strong> y márgenes de ganancia
                  </span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRole.canEditPrices}
                    onChange={(e) => setEditingRole({ ...editingRole, canEditPrices: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span>
                    Permitir modificar precios oficiales de venta y catálogo
                  </span>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsRoleModalOpen(false); setEditingRole(null); }}
                  className="clay-btn clay-btn-light flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  Guardar Rol y Privilegios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
