'use client';

import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Plus,
  Package,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  FileText,
  Building,
  User,
  Printer,
  ChevronDown
} from 'lucide-react';
import { KardexMovement, KardexMovementType } from '@/lib/kardex';
import { ProductItem } from '@/lib/store';

interface KardexModuleProps {
  kardexMovements: KardexMovement[];
  onAddKardexMovement: (movement: KardexMovement) => void;
  products: ProductItem[];
  onUpdateProducts: (products: ProductItem[]) => void;
  initialSelectedProductId?: string | null;
  onClearSelectedProduct?: () => void;
}

export default function KardexModule({
  kardexMovements,
  onAddKardexMovement,
  products,
  onUpdateProducts,
  initialSelectedProductId = null,
  onClearSelectedProduct
}: KardexModuleProps) {
  // Filtros
  const [selectedProductId, setSelectedProductId] = useState<string>(initialSelectedProductId || 'ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Modal de Ajuste Manual de Stock
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjProductId, setAdjProductId] = useState<string>(products[0]?.id || '');
  const [adjType, setAdjType] = useState<'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUB' | 'OUT_DAMAGE'>('ADJUSTMENT_ADD');
  const [adjQuantity, setAdjQuantity] = useState<number>(1);
  const [adjReason, setAdjReason] = useState<string>('Conteo físico de inventario');
  const [adjNotes, setAdjNotes] = useState<string>('');

  // Producto seleccionado para ajuste
  const currentAdjProduct = useMemo(() => {
    return products.find(p => p.id === adjProductId);
  }, [products, adjProductId]);

  // Cálculo del nuevo stock proyectado en el modal
  const projectedStock = useMemo(() => {
    if (!currentAdjProduct) return 0;
    const current = currentAdjProduct.stock || 0;
    if (adjType === 'ADJUSTMENT_ADD') {
      return current + adjQuantity;
    } else {
      return Math.max(0, current - adjQuantity);
    }
  }, [currentAdjProduct, adjType, adjQuantity]);

  // Filtrado de movimientos
  const filteredMovements = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return kardexMovements.filter(m => {
      // Filtro por producto
      if (selectedProductId !== 'ALL' && m.productId !== selectedProductId) {
        return false;
      }

      // Filtro por tipo
      if (typeFilter !== 'ALL' && m.type !== typeFilter) {
        return false;
      }

      // Filtro por fecha
      if (dateFilter !== 'ALL') {
        const movDate = new Date(m.createdAt);
        const now = new Date();
        if (dateFilter === 'TODAY') {
          if (movDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'WEEK') {
          const weekAgo = new Date(now.getTime() - 7 * 86400000);
          if (movDate < weekAgo) return false;
        } else if (dateFilter === 'MONTH') {
          if (movDate.getMonth() !== now.getMonth() || movDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Búsqueda de texto
      if (q) {
        const matchName = m.productName.toLowerCase().includes(q);
        const matchSku = m.productSku.toLowerCase().includes(q);
        const matchRef = m.reference.toLowerCase().includes(q);
        const matchDte = m.dteNumber ? m.dteNumber.toLowerCase().includes(q) : false;
        const matchNotes = m.notes ? m.notes.toLowerCase().includes(q) : false;
        const matchUser = m.user ? m.user.toLowerCase().includes(q) : false;
        return matchName || matchSku || matchRef || matchDte || matchNotes || matchUser;
      }

      return true;
    });
  }, [kardexMovements, selectedProductId, typeFilter, searchTerm, dateFilter]);

  // Cálculos de Resumen
  const totalEntradas = useMemo(() => {
    return filteredMovements
      .filter(m => m.type === 'IN_PURCHASE' || (m.type === 'ADJUSTMENT' && m.newStock > m.previousStock))
      .reduce((sum, m) => sum + m.quantity, 0);
  }, [filteredMovements]);

  const totalSalidas = useMemo(() => {
    return filteredMovements
      .filter(m => m.type === 'OUT_SALE' || m.type === 'OUT_DAMAGE' || (m.type === 'ADJUSTMENT' && m.newStock < m.previousStock))
      .reduce((sum, m) => sum + m.quantity, 0);
  }, [filteredMovements]);

  const totalMermas = useMemo(() => {
    return filteredMovements
      .filter(m => m.type === 'OUT_DAMAGE')
      .reduce((sum, m) => sum + m.quantity, 0);
  }, [filteredMovements]);

  // Guardar ajuste manual
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdjProduct || adjQuantity <= 0) return;

    const previousStock = currentAdjProduct.stock || 0;
    let newStock = previousStock;
    let movementType: KardexMovementType = 'ADJUSTMENT';

    if (adjType === 'ADJUSTMENT_ADD') {
      newStock = previousStock + adjQuantity;
      movementType = 'ADJUSTMENT';
    } else if (adjType === 'ADJUSTMENT_SUB') {
      newStock = Math.max(0, previousStock - adjQuantity);
      movementType = 'ADJUSTMENT';
    } else if (adjType === 'OUT_DAMAGE') {
      newStock = Math.max(0, previousStock - adjQuantity);
      movementType = 'OUT_DAMAGE';
    }

    // 1. Actualizar producto en inventario
    const updatedProducts = products.map(p => {
      if (p.id === currentAdjProduct.id) {
        return { ...p, stock: newStock };
      }
      return p;
    });
    onUpdateProducts(updatedProducts);

    // 2. Crear movimiento en Kárdex
    const newMovement: KardexMovement = {
      id: `kdx-${Date.now()}`,
      productId: currentAdjProduct.id,
      productName: currentAdjProduct.name,
      productSku: currentAdjProduct.sku,
      puesto: currentAdjProduct.puesto,
      unit: currentAdjProduct.unit,
      type: movementType,
      quantity: adjQuantity,
      previousStock,
      newStock,
      costPrice: currentAdjProduct.cost,
      unitPrice: currentAdjProduct.price,
      reference: adjReason,
      notes: adjNotes.trim() || undefined,
      user: 'Gerente General',
      createdAt: new Date().toISOString()
    };

    onAddKardexMovement(newMovement);
    setIsAdjustmentModalOpen(false);
    setAdjNotes('');
  };

  const selectedProductObj = useMemo(() => {
    if (selectedProductId === 'ALL') return null;
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header del Kárdex */}
      <div className="clay-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-[3px_4px_10px_rgba(79,70,229,0.35)]">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800">Kárdex de Movimientos de Inventario</h2>
              <span className="clay-badge bg-indigo-50 text-indigo-700 text-[10px] font-bold py-0.5 px-2.5">
                Trazabilidad Oficial
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Historial de entradas por compras, salidas por ventas en mostrador y ajustes físicos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="clay-btn clay-btn-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ajuste Manual de Stock</span>
          </button>
        </div>
      </div>

      {/* Tarjeta de enfoque si hay un producto seleccionado específicamente */}
      {selectedProductObj && (
        <div className="clay-card p-4 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border-indigo-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-indigo-600 shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="clay-badge text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                  SKU #{selectedProductObj.sku}
                </span>
                {selectedProductObj.puesto && (
                  <span className="clay-badge text-[10px] font-mono font-black bg-amber-100 text-amber-900 border border-amber-300">
                    📍 PUESTO: {selectedProductObj.puesto}
                  </span>
                )}
                <h3 className="text-sm font-black text-slate-800">{selectedProductObj.name}</h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Categoría: <strong>{selectedProductObj.category}</strong> • Costo: <strong>${selectedProductObj.cost.toFixed(2)}</strong> • PVP: <strong>${selectedProductObj.price.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Existencias Actuales
              </span>
              <span className="text-lg font-mono font-black text-indigo-700">
                {selectedProductObj.stock} {selectedProductObj.unit === 'Onza' ? 'Oz' : 'Unidades'}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedProductId('ALL');
                if (onClearSelectedProduct) onClearSelectedProduct();
              }}
              className="clay-btn clay-btn-light px-2.5 py-1.5 text-xs font-bold text-slate-600 flex items-center gap-1"
              title="Quitar filtro de producto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ver Todos</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards de Movimientos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clay-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Movimientos Totales</p>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <History className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{filteredMovements.length}</h3>
          <span className="text-[11px] text-slate-500 font-medium">Registros en el período</span>
        </div>

        <div className="clay-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entradas (Compras/Ajustes)</p>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">+{totalEntradas}</h3>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            Unidades / Oz ingresadas
          </span>
        </div>

        <div className="clay-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salidas (Ventas Mostrador)</p>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-blue-600 mt-1">-{totalSalidas}</h3>
          <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            Despachos a clientes
          </span>
        </div>

        <div className="clay-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mermas / Roturas</p>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-rose-600 mt-1">{totalMermas}</h3>
          <span className="text-[11px] text-rose-700 font-medium">Frascos rotos o evaporación</span>
        </div>
      </div>

      {/* Barra de Filtros del Kárdex */}
      <div className="clay-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Selector de Producto Específico */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Filtrar por Producto / Insumo
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="clay-input w-full text-xs font-bold truncate"
            >
              <option value="ALL">📦 Todos los Productos e Insumos</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.sku}) {p.puesto ? `[Puesto: ${p.puesto}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Tipo de Movimiento */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Tipo de Movimiento
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="clay-input w-full text-xs font-bold"
            >
              <option value="ALL">Todos los Movimientos</option>
              <option value="IN_PURCHASE">📥 Entradas (Compras a Proveedores)</option>
              <option value="OUT_SALE">📤 Salidas (Ventas en Punto de Venta)</option>
              <option value="ADJUSTMENT">⚖️ Ajustes de Inventario Físico</option>
              <option value="OUT_DAMAGE">⚠️ Mermas / Daños / Roturas</option>
              <option value="RETURN">🔄 Devoluciones</option>
            </select>
          </div>

          {/* Filtro de Fecha */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="clay-input w-full text-xs font-bold"
            >
              <option value="ALL">Todo el Histórico</option>
              <option value="TODAY">Solo Hoy</option>
              <option value="WEEK">Últimos 7 días</option>
              <option value="MONTH">Este Mes</option>
            </select>
          </div>

          {/* Buscador de Texto */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Búsqueda Rápida
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="SKU, # Factura, DTE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clay-input w-full pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Tabla del Kárdex */}
      <div className="clay-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Producto & Puesto</th>
                <th className="py-3 px-4 text-center">Tipo Movimiento</th>
                <th className="py-3 px-4 text-right">Cantidad</th>
                <th className="py-3 px-4 text-center">Balance Stock</th>
                <th className="py-3 px-4">Referencia / DTE</th>
                <th className="py-3 px-4 text-right">Valor Unitario</th>
                <th className="py-3 px-4">Responsable / Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron movimientos de Kárdex con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isIncoming = mov.type === 'IN_PURCHASE' || (mov.type === 'ADJUSTMENT' && mov.newStock > mov.previousStock);
                  const isDamage = mov.type === 'OUT_DAMAGE';

                  const badgeConfig = {
                    IN_PURCHASE: { bg: 'bg-emerald-100 text-emerald-800', label: '📥 ENTRADA COMPRA' },
                    OUT_SALE: { bg: 'bg-blue-100 text-blue-800', label: '📤 VENTA POS' },
                    ADJUSTMENT: { bg: 'bg-purple-100 text-purple-800', label: '⚖️ AJUSTE FÍSICO' },
                    OUT_DAMAGE: { bg: 'bg-rose-100 text-rose-800', label: '⚠️ MERMA / ROTURA' },
                    RETURN: { bg: 'bg-amber-100 text-amber-800', label: '🔄 DEVOLUCIÓN' }
                  }[mov.type] || { bg: 'bg-slate-100 text-slate-800', label: mov.type };

                  const dateFormatted = new Date(mov.createdAt).toLocaleString('es-SV', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={mov.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-bold whitespace-nowrap">
                        {dateFormatted}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1 rounded">
                            #{mov.productSku}
                          </span>
                          <span className="font-bold text-slate-800">{mov.productName}</span>
                        </div>
                        {mov.puesto && (
                          <span className="inline-block text-[10px] font-mono font-black text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-0.5">
                            📍 Puesto: {mov.puesto}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`clay-badge text-[10px] font-black py-0.5 px-2.5 ${badgeConfig.bg}`}>
                          {badgeConfig.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-mono font-black text-sm ${
                          isIncoming ? 'text-emerald-600' : isDamage ? 'text-rose-600' : 'text-blue-600'
                        }`}>
                          {isIncoming ? '+' : '-'}{mov.quantity} {mov.unit === 'Onza' ? 'Oz' : mov.unit === 'Galón' ? 'Gal' : 'Un.'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-mono text-xs">
                          <span className="text-slate-400 line-through">{mov.previousStock}</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {mov.newStock}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-700 line-clamp-1" title={mov.reference}>
                          {mov.reference}
                        </p>
                        {mov.dteNumber && (
                          <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[150px]" title={mov.dteNumber}>
                            {mov.dteNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                        {mov.costPrice ? `$${mov.costPrice.toFixed(2)}` : mov.unitPrice ? `$${mov.unitPrice.toFixed(2)}` : '-'}
                      </td>

                      <td className="py-3 px-4">
                        {mov.user && (
                          <span className="text-[11px] font-medium text-slate-600 block">
                            👤 {mov.user}
                          </span>
                        )}
                        {mov.notes && (
                          <span className="text-[10px] text-slate-400 italic line-clamp-1" title={mov.notes}>
                            {mov.notes}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: AJUSTE MANUAL DE INVENTARIO (CONTEO / MERMA)                       */}
      {/* ========================================================================= */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsAdjustmentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">Ajuste de Stock en Kárdex</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registra ajustes por conteo físico, mermas de alcohol o roturas de frascos con trazabilidad oficial.
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Producto / Insumo a Ajustar *
                </label>
                <select
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="clay-input w-full text-xs font-bold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.sku}) • Stock actual: {p.stock} {p.unit === 'Onza' ? 'Oz' : 'Un.'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tipo de Operación *
                </label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="clay-input w-full text-xs font-bold"
                >
                  <option value="ADJUSTMENT_ADD">➕ Entrada por Conteo Físico / Inventario Inicial</option>
                  <option value="ADJUSTMENT_SUB">➖ Salida por Diferencia de Conteo Físico</option>
                  <option value="OUT_DAMAGE">⚠️ Merma / Rotura de Frasco / Evaporación</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cantidad a Ajustar ({currentAdjProduct?.unit === 'Onza' ? 'Oz' : 'Un.'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(parseFloat(e.target.value) || 0)}
                    className="clay-input w-full text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stock Resultante Proyectado
                  </label>
                  <div className="p-2 rounded-xl bg-slate-100 text-center font-mono font-black text-sm text-indigo-700 border border-slate-200">
                    {projectedStock} {currentAdjProduct?.unit === 'Onza' ? 'Oz' : 'Un.'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Motivo / Concepto del Ajuste *
                </label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Ej. Auditoría de fin de mes, frasco quebrado en bodega..."
                  className="clay-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="Detalles sobre el ajuste..."
                  className="clay-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-black"
                >
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
