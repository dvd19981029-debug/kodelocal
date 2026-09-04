'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Globe, 
  DollarSign, 
  Layers, 
  Edit3, 
  Trash2, 
  X,
  ArrowUpDown,
  Barcode
} from 'lucide-react';
import { INITIAL_PRODUCTS, ProductItem } from '@/lib/store';

export default function InventarioPage() {
  const [products, setProducts] = useState<ProductItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kodelocal_products');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ProductItem>>({
    name: '',
    sku: '',
    barcode: '',
    category: 'General',
    price: 0,
    cost: 0,
    stock: 10,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
    isAvailableOnline: true
  });

  useEffect(() => {
    localStorage.setItem('kodelocal_products', JSON.stringify(products));
  }, [products]);

  // Categorías
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtrado
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Métricas
  const totalStockItems = useMemo(() => products.reduce((acc, p) => acc + p.stock, 0), [products]);
  const totalInventoryValue = useMemo(() => products.reduce((acc, p) => acc + (p.price * p.stock), 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock <= p.minStock).length, [products]);
  const ecommerceCount = useMemo(() => products.filter(p => p.isAvailableOnline).length, [products]);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Por favor ingresa nombre y precio.');
      return;
    }

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formData } as ProductItem : p));
    } else {
      const newProduct: ProductItem = {
        id: `prod-${Date.now()}`,
        name: formData.name || 'Nuevo Producto',
        sku: formData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: formData.barcode || `${Math.floor(741000000000 + Math.random() * 99999999)}`,
        category: formData.category || 'General',
        price: Number(formData.price),
        cost: Number(formData.cost || 0),
        stock: Number(formData.stock || 0),
        minStock: Number(formData.minStock || 5),
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
        isAvailableOnline: Boolean(formData.isAvailableOnline)
      };
      setProducts(prev => [newProduct, ...prev]);
    }

    setIsNewProductOpen(false);
    setEditingProduct(null);
  };

  const handleAdjustStock = (productId: string, amount: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextStock = Math.max(0, p.stock + amount);
        return { ...p, stock: nextStock };
      }
      return p;
    }));
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header & KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos Totales</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{products.length}</h3>
            <span className="text-xs text-slate-500 font-medium">{totalStockItems} unidades en stock</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(99,102,241,0.2)]">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Inventario (PVP)</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">${totalInventoryValue.toFixed(2)}</h3>
            <span className="text-xs text-slate-500 font-medium">Precios de venta al público</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(16,185,129,0.2)]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Crítico / Bajo</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{lowStockCount}</h3>
            <span className="text-xs text-slate-500 font-medium">Requieren reposición</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="clay-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sincronizados con Web</p>
            <h3 className="text-2xl font-black text-purple-600 mt-1">{ecommerceCount}</h3>
            <span className="text-xs text-slate-500 font-medium">Disponibles en E-commerce</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-[2px_3px_8px_rgba(168,85,247,0.2)]">
            <Globe className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Barra de Acciones y Filtros */}
      <div className="clay-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Buscador */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por producto, SKU o código de barras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-input w-full pl-11 pr-4 py-2.5 text-sm"
          />
        </div>

        {/* Botón Nuevo Producto */}
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '',
              sku: '',
              barcode: '',
              category: 'General',
              price: 0,
              cost: 0,
              stock: 10,
              minStock: 5,
              imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
              isAvailableOnline: true
            });
            setIsNewProductOpen(true);
          }}
          className="clay-btn clay-btn-primary w-full sm:w-auto px-6 py-3 text-sm rounded-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>

      </div>

      {/* Tabla de Productos Claymórfica */}
      <div className="clay-card overflow-hidden p-2 sm:p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">SKU / Código</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Precio</th>
                <th className="py-3 px-4">Stock Actual</th>
                <th className="py-3 px-4 text-center">E-Commerce</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.minStock;
                const isOut = p.stock === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Nombre e Imagen */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img 
                        src={p.imageUrl} 
                        alt={p.name} 
                        className="w-10 h-10 rounded-xl object-cover shadow-[1px_2px_4px_rgba(164,177,198,0.3)]" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">{p.name}</span>
                        <span className="text-xs text-slate-400">Costo: ${p.cost.toFixed(2)}</span>
                      </div>
                    </td>

                    {/* SKU y Código */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      <div>{p.sku}</div>
                      <div className="text-[11px] text-slate-400">{p.barcode}</div>
                    </td>

                    {/* Categoría */}
                    <td className="py-3 px-4">
                      <span className="clay-badge bg-slate-100 text-slate-600 text-xs py-1 px-3">
                        {p.category}
                      </span>
                    </td>

                    {/* Precio */}
                    <td className="py-3 px-4 font-black text-indigo-600 text-base">
                      ${p.price.toFixed(2)}
                    </td>

                    {/* Stock y Ajuste Rápido */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`clay-badge text-xs py-1 px-2.5 font-bold ${
                          isOut 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : isLow 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {p.stock} un.
                        </span>
                        
                        {/* Botones de ajuste +/- */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAdjustStock(p.id, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold active:scale-95"
                            title="Restar 1"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAdjustStock(p.id, 5)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold active:scale-95"
                            title="Sumar 5"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* E-Commerce Toggle Status */}
                    <td className="py-3 px-4 text-center">
                      {p.isAvailableOnline ? (
                        <span className="clay-badge bg-purple-50 text-purple-700 border border-purple-200 text-[11px] py-1 px-2.5 inline-flex items-center gap-1">
                          <Globe className="w-3 h-3" /> En Línea
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Solo Local</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setFormData(p);
                            setIsNewProductOpen(true);
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors shadow-[1px_2px_4px_rgba(164,177,198,0.2)]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors shadow-[1px_2px_4px_rgba(164,177,198,0.2)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo / Editar Producto */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
            
            <button 
              onClick={() => setIsNewProductOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">
              {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Configura los detalles del producto para caja física y e-commerce.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Teclado Inalámbrico"
                  className="clay-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="TEC-001"
                    className="clay-input w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="741001234509"
                    className="clay-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Audio, Periféricos, etc."
                    className="clay-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL de Imagen</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="clay-input w-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Costo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                    className="clay-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="clay-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mínimo</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="onlineCheck"
                  checked={formData.isAvailableOnline}
                  onChange={(e) => setFormData({ ...formData, isAvailableOnline: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="onlineCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Publicar en E-Commerce (Sincronización en Tiempo Real)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="clay-btn clay-btn-light flex-1 py-2.5 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2.5 text-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
