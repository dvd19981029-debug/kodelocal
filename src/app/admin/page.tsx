'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Percent, 
  DollarSign, 
  Layers, 
  KeyRound, 
  Sliders, 
  CheckCircle2, 
  X, 
  Trash2, 
  Edit2, 
  TrendingUp, 
  Store, 
  Building,
  Lock,
  Sparkles,
  Droplets,
  Package,
  Plus
} from 'lucide-react';
import { getStoredUsers, UserAccount, UserRole } from '@/lib/auth';
import { INITIAL_PRODUCTS, ProductItem, PERFUME_CATEGORIES } from '@/lib/store';

export default function AdminPage() {
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

  const [categories, setCategories] = useState<string[]>(PERFUME_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');

  // Modales
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  // Formulario Nuevo Usuario
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPin, setUserPin] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('CASHIER');
  const [userRegister, setUserRegister] = useState('Caja 1');

  // Actualizador Masivo de Precios
  const [bulkPrice, setBulkPrice] = useState('3.25');
  const [bulkCost, setBulkCost] = useState('1.95');

  useEffect(() => {
    localStorage.setItem('kodelocal_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kodelocal_products', JSON.stringify(products));
  }, [products]);

  // Métricas Financieras
  const totalEsencias = useMemo(() => products.filter(p => p.category === 'Esencias para Perfume').length, [products]);
  const totalStockOnzas = useMemo(() => products.filter(p => p.category === 'Esencias para Perfume').reduce((a, b) => a + b.stock, 0), [products]);
  const valorVentaTotal = useMemo(() => products.reduce((acc, p) => acc + (p.price * p.stock), 0), [products]);
  const valorCostoTotal = useMemo(() => products.reduce((acc, p) => acc + (p.cost * p.stock), 0), [products]);
  const gananciaPotencial = valorVentaTotal - valorCostoTotal;
  const margenPorcentual = valorVentaTotal > 0 ? ((gananciaPotencial / valorVentaTotal) * 100) : 0;

  // Manejo de Usuarios
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) {
      alert('Por favor ingresa nombre y correo.');
      return;
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: userName,
      email: userEmail,
      password: userPassword || '123456',
      pin: userPin || String(Math.floor(1000 + Math.random() * 9000)),
      role: userRole,
      cashRegister: userRegister,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    setIsUserModalOpen(false);

    // Limpiar form
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserPin('');
    setUserRole('CASHIER');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('¿Seguro que deseas eliminar este usuario de caja?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  // Actualización masiva de precios para esencias
  const handleApplyBulkPrices = (e: React.FormEvent) => {
    e.preventDefault();
    const newP = parseFloat(bulkPrice);
    const newC = parseFloat(bulkCost);

    if (isNaN(newP) || isNaN(newC)) {
      alert('Por favor ingresa números válidos.');
      return;
    }

    setProducts(prev => prev.map(prod => {
      if (prod.category === 'Esencias para Perfume') {
        return { ...prod, price: newP, cost: newC };
      }
      return prod;
    }));

    alert(`¡Precios actualizados para las ${totalEsencias} esencias con éxito!`);
    setIsPriceModalOpen(false);
  };

  // Agregar categoría
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (categories.includes(newCatName.trim())) {
      alert('Esta categoría ya existe.');
      return;
    }
    setCategories(prev => [...prev, newCatName.trim()]);
    setNewCatName('');
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      
      {/* Encabezado Principal de Gerencia */}
      <div className="clay-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-[4px_6px_14px_rgba(79,70,229,0.4)] font-black text-2xl">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800">Panel de Gerencia & Administración</h1>
              <span className="clay-badge bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">
                Acceso Total
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Control financiero, personal de tienda y catálogo maestro</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsPriceModalOpen(true)}
            className="clay-btn clay-btn-light px-4 py-2.5 text-xs flex-1 md:flex-initial"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Actualizar Precios Masivos</span>
          </button>

          <button
            onClick={() => setIsUserModalOpen(true)}
            className="clay-btn clay-btn-primary px-4 py-2.5 text-xs flex-1 md:flex-initial"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Usuario de Caja</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Financieras y Márgenes Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Valor de Inventario al Público */}
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Venta (PVP)</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">${valorVentaTotal.toFixed(2)}</h3>
            <span className="text-[11px] text-slate-500 font-medium">En tienda y web</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(99,102,241,0.2)]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Costo de Adquisición */}
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo de Inversión</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">${valorCostoTotal.toFixed(2)}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Pagado a proveedores</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(164,177,198,0.2)]">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Ganancia Bruta Proyectada */}
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ganancia Bruta</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">${gananciaPotencial.toFixed(2)}</h3>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              +{margenPorcentual.toFixed(1)}% Margen
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(16,185,129,0.2)]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Esencias Registradas */}
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Esencias Activas</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">{totalEsencias}</h3>
            <span className="text-[11px] text-slate-500 font-medium">{totalStockOnzas} Oz en stock total</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(168,85,247,0.2)]">
            <Droplets className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SECCIÓN 1: GESTIÓN DE USUARIOS Y CAJEROS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-800">Personal de Tienda y Usuarios de Caja</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{users.length} usuarios registrados</span>
        </div>

        <div className="clay-card p-4 sm:p-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nombre / Empleado</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">PIN Rápido</th>
                  <th className="py-3 px-4">Caja Asignada</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`clay-badge text-[11px] py-0.5 px-2.5 ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'CASHIER'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {u.role === 'ADMIN' ? '👑 Gerente' : u.role === 'CASHIER' ? '🛒 Cajero' : '📦 Logística'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {u.pin || 'Sin PIN'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                      {u.cashRegister || 'Sin asignar'}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`clay-badge text-[10px] py-0.5 px-2 cursor-pointer ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? '● Activo' : '○ Inactivo'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* SECCIÓN 2: CONTROL DE CATEGORÍAS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-800">Categorías de Productos</h2>
          </div>
        </div>

        <div className="clay-card p-5 flex flex-col md:flex-row gap-6 items-start justify-between">
          {/* Lista de Categorías */}
          <div className="flex-1 w-full">
            <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Categorías Activas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <div key={cat} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-[inset_1px_1px_3px_rgba(164,177,198,0.15)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                        {cat.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{cat}</h4>
                        <span className="text-[11px] text-slate-400">{count} productos vinculados</span>
                      </div>
                    </div>
                    <span className="clay-badge bg-white text-slate-600 text-[10px] py-0.5 px-2">
                      Activa
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulario Agregar Categoría */}
          <div className="w-full md:w-80 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <h4 className="font-bold text-xs text-indigo-900 mb-1">Nueva Categoría</h4>
            <p className="text-[11px] text-slate-500 mb-3">Se reflejará en el POS y en el E-Commerce.</p>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej. Tapas y Atomizadores"
                className="clay-input w-full text-xs py-2"
              />
              <button
                type="submit"
                className="clay-btn clay-btn-primary w-full py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Categoría</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: CREAR NUEVO USUARIO DE CAJA */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">Crear Usuario de Tienda</h3>
            <p className="text-xs text-slate-500 mb-5">Define el rol y credenciales para el colaborador.</p>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ej. Sofía Quintanilla"
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">PIN de Caja (4 dígitos)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value)}
                    placeholder="1234"
                    className="clay-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rol de Acceso</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="clay-input w-full text-xs font-medium"
                  >
                    <option value="CASHIER">Cajero / Vendedor</option>
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
                    placeholder="Caja 1 - Mostrador"
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                🔒 <strong>Nota de Seguridad:</strong> Los usuarios con rol <strong>Cajero</strong> no tendrán acceso a los costos de compra ($1.95) ni al margen de ganancia.
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

      {/* MODAL: ACTUALIZADOR MASIVO DE PRECIOS */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsPriceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">Actualizar Precios Masivos</h3>
            <p className="text-xs text-slate-500 mb-4">
              Cambia el precio y costo de las <strong>{totalEsencias} esencias</strong> en 1 solo clic.
            </p>

            <form onSubmit={handleApplyBulkPrices} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio Venta por Oz ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className="clay-input w-full text-base font-black text-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Costo Compra por Oz ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bulkCost}
                    onChange={(e) => setBulkCost(e.target.value)}
                    className="clay-input w-full text-base font-black text-slate-700"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <p><strong>Margen resultante por Oz:</strong> ${(parseFloat(bulkPrice) - parseFloat(bulkCost)).toFixed(2)}</p>
                <p><strong>Porcentaje de ganancia:</strong> {(((parseFloat(bulkPrice) - parseFloat(bulkCost)) / parseFloat(bulkPrice)) * 100).toFixed(1)}%</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="clay-btn clay-btn-light flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2.5 text-xs"
                >
                  Aplicar a Todas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
