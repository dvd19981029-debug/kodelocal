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
  Download,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { KardexMovement, KardexMovementType } from '@/lib/kardex';
import { ProductItem, SaleRecord } from '@/lib/store';
import { PurchaseRecord } from '@/lib/purchases';

interface KardexModuleProps {
  products: ProductItem[];
  onUpdateProducts: (products: ProductItem[]) => void;
  purchases?: PurchaseRecord[];
  sales?: SaleRecord[];
  manualMovements: KardexMovement[];
  onAddManualMovement: (movement: KardexMovement) => void;
  initialSelectedProductId?: string | null;
  onClearSelectedProduct?: () => void;
}

export default function KardexModule({
  products,
  onUpdateProducts,
  purchases = [],
  sales = [],
  manualMovements = [],
  onAddManualMovement,
  initialSelectedProductId = null,
  onClearSelectedProduct
}: KardexModuleProps) {
  // Filtros
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'COMPRA' | 'VENTA' | 'AJUSTE'>('ALL');
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

  // Sincronizar initialSelectedProductId si cambia desde fuera
  React.useEffect(() => {
    if (initialSelectedProductId) {
      setSelectedProductId(initialSelectedProductId);
    }
  }, [initialSelectedProductId]);

  // Producto seleccionado para ajuste manual
  const currentAdjProduct = useMemo(() => {
    return products.find(p => p.id === adjProductId);
  }, [products, adjProductId]);

  const projectedStock = useMemo(() => {
    if (!currentAdjProduct) return 0;
    const current = currentAdjProduct.stock || 0;
    if (adjType === 'ADJUSTMENT_ADD') {
      return current + adjQuantity;
    } else {
      return Math.max(0, current - adjQuantity);
    }
  }, [currentAdjProduct, adjType, adjQuantity]);

  // =========================================================================
  // COMBINAR MOVIMIENTOS: COMPRAS DTE + VENTAS DTE + AJUSTES (Estilo Mecanic OS)
  // =========================================================================
  const allKardexMovements = useMemo(() => {
    // 1. Entradas desde el Módulo de Compras (DTEs de Compra)
    const purchaseMovs: KardexMovement[] = purchases.flatMap(pur => {
      const isNC = pur.tipoDte === 'NC';
      const dteDisplay = pur.controlNumber || pur.docNumber || 'S/N';
      return pur.items.map((it, idx) => {
        const prod = products.find(p => p.id === it.productId);
        const unitVal = it.costPrice || prod?.cost || 0;
        return {
          id: `pur-kdx-${pur.id}-${it.productId}-${idx}`,
          productId: it.productId,
          productName: it.productName || prod?.name || 'Insumo / Esencia',
          productSku: it.productSku || prod?.sku || '',
          puesto: prod?.puesto,
          unit: it.unit || prod?.unit || 'Onza',
          type: isNC ? ('RETURN' as const) : ('IN_PURCHASE' as const),
          quantity: it.quantity,
          previousStock: prod ? Math.max(0, prod.stock - it.quantity) : 0,
          newStock: prod?.stock || it.quantity,
          costPrice: unitVal,
          unitPrice: prod?.price,
          reference: `Factura ${pur.tipoDte} • ${pur.supplierName}`,
          dteNumber: dteDisplay,
          dteTipo: pur.tipoDte,
          sourceCategory: 'COMPRA' as const,
          notes: pur.receptionStatus === 'PENDIENTE'
            ? `⚠️ Compra DTE registrada • Pendiente de recepción física en bodega`
            : (pur.receivedNotes ? `Recepción confirmada en bodega (${pur.receivedNotes})` : `Recepción física confirmada y aplicada en bodega`),
          user: pur.receptionStatus === 'RECIBIDO' ? (pur.receivedBy || 'Bodega') : 'Compras / Administración',
          createdAt: pur.receivedAt || pur.createdAt || `${pur.purchaseDate}T10:00:00.000Z`
        };
      });
    });

    // 2. Salidas desde el Punto de Venta (DTEs de Venta POS)
    const saleMovs: KardexMovement[] = sales.flatMap(sale => {
      const dteDisplay = sale.dteInfo?.numeroControl || sale.dteInfo?.codigoGeneracion || sale.saleNumber;
      const dteTypeLabel = sale.tipoComprobante === '03' ? 'CCF-03' : sale.tipoComprobante === '01' ? 'FE-01' : 'TICKET';
      return sale.items.map((it, idx) => {
        const prod = products.find(p => p.id === it.productId);
        const unitVal = it.price || prod?.price || 0;
        return {
          id: `sale-kdx-${sale.id}-${it.productId}-${idx}`,
          productId: it.productId,
          productName: it.name || prod?.name || 'Fragancia',
          productSku: prod?.sku || '',
          puesto: it.puesto || prod?.puesto,
          unit: it.unit || prod?.unit || 'Onza',
          type: 'OUT_SALE' as const,
          quantity: it.quantity,
          previousStock: prod ? prod.stock + it.quantity : it.quantity,
          newStock: prod?.stock || 0,
          costPrice: prod?.cost,
          unitPrice: unitVal,
          reference: `Venta Mostrador ${sale.saleNumber} • ${sale.cliente?.nombre || 'Consumidor Final'}`,
          dteNumber: dteDisplay,
          dteTipo: dteTypeLabel,
          sourceCategory: 'VENTA' as const,
          notes: `Despachado en ${sale.vendedor || 'Caja 1'}`,
          user: sale.vendedor || 'Cajero de Turno',
          createdAt: sale.createdAt
        };
      });
    });

    // 3. Ajustes de Inventario Manuales (excluye compras y ventas que ya se generan desde sus respectivos módulos)
    const manualMovs = manualMovements
      .filter(m => m.type !== 'IN_PURCHASE' && m.type !== 'OUT_SALE' && !m.reference?.startsWith('Compra '))
      .map(m => ({
        ...m,
        sourceCategory: 'AJUSTE' as const,
        dteTipo: m.type === 'OUT_DAMAGE' ? 'MERMA' : 'AJUSTE'
      }));

    // Combinar y ordenar cronológicamente de más reciente a más antiguo
    return [...purchaseMovs, ...saleMovs, ...manualMovs].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [purchases, sales, manualMovements, products]);

  // =========================================================================
  // FILTRADO DINÁMICO
  // =========================================================================
  const filteredMovements = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return allKardexMovements.filter(m => {
      // Filtro de pestaña rápida (Todas, Compras, Ventas, Ajustes)
      if (activeCategoryFilter !== 'ALL' && m.sourceCategory !== activeCategoryFilter) {
        return false;
      }

      // Filtro por producto específico
      if (selectedProductId !== 'ALL' && m.productId !== selectedProductId) {
        return false;
      }

      // Filtro por tipo de movimiento
      if (typeFilter !== 'ALL' && m.type !== typeFilter) {
        return false;
      }

      // Filtro de período
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

      // Buscador predictivo
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
  }, [allKardexMovements, activeCategoryFilter, selectedProductId, typeFilter, searchTerm, dateFilter]);

  // Contadores por categoría
  const countCompras = useMemo(() => allKardexMovements.filter(m => m.sourceCategory === 'COMPRA').length, [allKardexMovements]);
  const countVentas = useMemo(() => allKardexMovements.filter(m => m.sourceCategory === 'VENTA').length, [allKardexMovements]);
  const countAjustes = useMemo(() => allKardexMovements.filter(m => m.sourceCategory === 'AJUSTE').length, [allKardexMovements]);

  // Totales de cantidades
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

    // 1. Actualizar producto en el estado de inventario
    const updatedProducts = products.map(p => {
      if (p.id === currentAdjProduct.id) {
        return { ...p, stock: newStock };
      }
      return p;
    });
    onUpdateProducts(updatedProducts);

    // 2. Registrar movimiento manual en el Kárdex
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

    onAddManualMovement(newMovement);
    setIsAdjustmentModalOpen(false);
    setAdjNotes('');
  };

  // Exportar a CSV (Compatible con Excel, como en Mecanic OS)
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) return;

    const headers = [
      'Fecha Movimiento',
      'Código (SKU)',
      'Puesto',
      'Descripción / Producto',
      'Tipo Movimiento',
      'Cantidad',
      'Unidad',
      'Valor Unitario ($)',
      'Monto Total ($)',
      'Número DTE',
      'Observación / Referencia',
      'Responsable'
    ];

    const rows = filteredMovements.map(m => {
      const val = m.costPrice || m.unitPrice || 0;
      const sub = m.quantity * val;
      return [
        new Date(m.createdAt).toLocaleString('es-SV'),
        m.productSku,
        m.puesto || '-',
        `"${m.productName.replace(/"/g, '""')}"`,
        m.type,
        m.quantity,
        m.unit,
        val.toFixed(2),
        sub.toFixed(2),
        `"${(m.dteNumber || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.reference || '').replace(/"/g, '""')}"`,
        `"${(m.user || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kardex_KodeLocal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedProductObj = useMemo(() => {
    if (selectedProductId === 'ALL') return null;
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  return (
    <div className="space-y-4 animate-in fade-in duration-150 text-xs">
      
      {/* Header Compacto del Kárdex */}
      <div className="clay-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-[2px_3px_8px_rgba(79,70,229,0.35)] shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-800 leading-tight">
                Kárdex de Movimientos de Inventario
              </h2>
              <span className="clay-badge bg-indigo-50 text-indigo-700 text-[9px] font-bold py-0.5 px-2">
                Auditoría DTE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Trazabilidad de DTEs de Compra (Proveedores), DTEs de Venta (POS) y Ajustes de Stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="clay-btn clay-btn-light px-2.5 py-1.5 text-[11px] font-bold flex items-center gap-1.5 text-emerald-700"
            title="Exportar movimientos a CSV / Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Kárdex</span>
          </button>

          <button
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="clay-btn clay-btn-primary px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ajuste de Stock</span>
          </button>
        </div>
      </div>

      {/* Tarjeta de Producto Seleccionado Específico */}
      {selectedProductObj && (
        <div className="clay-card p-3 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border-indigo-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white text-indigo-600 shadow-sm shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="clay-badge text-[9px] font-mono font-bold bg-indigo-100 text-indigo-800">
                  #{selectedProductObj.sku}
                </span>
                {selectedProductObj.puesto && (
                  <span className="clay-badge text-[9px] font-mono font-black bg-amber-100 text-amber-900 border border-amber-300">
                    📍 {selectedProductObj.puesto}
                  </span>
                )}
                <h3 className="text-xs font-black text-slate-800">{selectedProductObj.name}</h3>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {selectedProductObj.category} • Costo: <strong>${selectedProductObj.cost.toFixed(2)}</strong> • PVP: <strong>${selectedProductObj.price.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Existencias</span>
              <span className="text-sm font-mono font-black text-indigo-700">
                {selectedProductObj.stock} {selectedProductObj.unit === 'Onza' ? 'Oz' : 'Un.'}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedProductId('ALL');
                if (onClearSelectedProduct) onClearSelectedProduct();
              }}
              className="clay-btn clay-btn-light px-2 py-1 text-[10px] font-bold text-slate-600 flex items-center gap-1"
              title="Quitar filtro de producto"
            >
              <X className="w-3 h-3" />
              <span>Ver Todos</span>
            </button>
          </div>
        </div>
      )}

      {/* Pestañas Rápidas de Filtrado (Mecanic OS Style) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
        <button
          onClick={() => setActiveCategoryFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 ${
            activeCategoryFilter === 'ALL'
              ? 'clay-btn-primary !shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3 h-3" />
          <span>Todos los Movimientos</span>
          <span className="text-[9.5px] ml-0.5 px-1.5 py-0.2 rounded-full bg-white/30 text-white font-mono">
            {allKardexMovements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategoryFilter('COMPRA')}
          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 ${
            activeCategoryFilter === 'COMPRA'
              ? 'clay-btn-primary !shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-3 h-3 text-emerald-500" />
          <span>📥 DTEs de Compra</span>
          <span className="text-[9.5px] ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
            {countCompras}
          </span>
        </button>

        <button
          onClick={() => setActiveCategoryFilter('VENTA')}
          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 ${
            activeCategoryFilter === 'VENTA'
              ? 'clay-btn-primary !shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3 h-3 text-blue-500" />
          <span>📤 DTEs de Venta (POS)</span>
          <span className="text-[9.5px] ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
            {countVentas}
          </span>
        </button>

        <button
          onClick={() => setActiveCategoryFilter('AJUSTE')}
          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 ${
            activeCategoryFilter === 'AJUSTE'
              ? 'clay-btn-primary !shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3 text-purple-500" />
          <span>⚖️ Ajustes & Mermas</span>
          <span className="text-[9.5px] ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
            {countAjustes}
          </span>
        </button>
      </div>

      {/* Barra de Filtros Compacta */}
      <div className="clay-card p-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Selector de Producto */}
          <div>
            <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">
              Producto / Contratipo
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="clay-input w-full text-[10.5px] font-bold py-1 px-2"
            >
              <option value="ALL">📦 Todos los Productos e Insumos</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.sku}) {p.puesto ? `[Puesto: ${p.puesto}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Movimiento */}
          <div>
            <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">
              Operación
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="clay-input w-full text-[10.5px] font-bold py-1 px-2"
            >
              <option value="ALL">Todas las Operaciones</option>
              <option value="IN_PURCHASE">📥 Entrada (Compra DTE)</option>
              <option value="OUT_SALE">📤 Salida (Venta POS DTE)</option>
              <option value="ADJUSTMENT">⚖️ Ajuste Físico</option>
              <option value="OUT_DAMAGE">⚠️ Merma / Rotura</option>
              <option value="RETURN">🔄 Devolución (NC)</option>
            </select>
          </div>

          {/* Período */}
          <div>
            <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="clay-input w-full text-[10.5px] font-bold py-1 px-2"
            >
              <option value="ALL">Todo el Historial</option>
              <option value="TODAY">Solo Hoy</option>
              <option value="WEEK">Últimos 7 días</option>
              <option value="MONTH">Este Mes</option>
            </select>
          </div>

          {/* Buscador de Texto */}
          <div>
            <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">
              Buscar DTE / Referencia / SKU
            </label>
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="DTE-01..., SKU, Proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clay-input w-full pl-6 pr-2 py-1 text-[10.5px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABLA PRINCIPAL DEL KÁRDEX (Ultra-Compacta, Basada en Mecanic OS)         */}
      {/* ========================================================================= */}
      <div className="clay-card overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-[10.5px]">
            <thead className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200/90 bg-slate-50/95 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-2 px-2.5 whitespace-nowrap">Fecha / Hora</th>
                <th className="py-2 px-2 whitespace-nowrap">Código / Puesto</th>
                <th className="py-2 px-2.5 whitespace-nowrap">Descripción</th>
                <th className="py-2 px-2 text-center whitespace-nowrap">Tipo</th>
                <th className="py-2 px-2 text-center whitespace-nowrap">Cant.</th>
                <th className="py-2 px-2 text-right whitespace-nowrap">Costo Unit. ($)</th>
                <th className="py-2 px-2 text-right whitespace-nowrap">Total ($)</th>
                <th className="py-2 px-2.5 whitespace-nowrap">Concepto / Motivo</th>
                <th className="py-2 px-2.5 whitespace-nowrap">Documento / DTE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                    No se encontraron movimientos registrados en el Kárdex con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isIncoming = mov.type === 'IN_PURCHASE' || (mov.type === 'ADJUSTMENT' && mov.newStock > mov.previousStock);
                  const isSale = mov.type === 'OUT_SALE';
                  const isDamage = mov.type === 'OUT_DAMAGE';
                  
                  const val = mov.costPrice || mov.unitPrice || 0;
                  const total = mov.quantity * val;

                  // Badge según tipo Mecanic OS
                  const badgeTag = {
                    IN_PURCHASE: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'ENTRADA' },
                    OUT_SALE: { bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'SALIDA' },
                    ADJUSTMENT: { bg: 'bg-purple-100 text-purple-800 border-purple-200', text: 'AJUSTE' },
                    OUT_DAMAGE: { bg: 'bg-amber-100 text-amber-900 border-amber-200', text: 'MERMA' },
                    RETURN: { bg: 'bg-orange-100 text-orange-800 border-orange-200', text: 'DEVOLUCIÓN' }
                  }[mov.type] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: mov.type };

                  // Formato de fecha compacto
                  const dateStr = new Date(mov.createdAt).toLocaleString('es-SV', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={mov.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Fecha Movimiento */}
                      <td className="py-1.5 px-2.5 font-mono text-[9.5px] text-slate-600 font-semibold whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Código Producto (SKU) & Puesto */}
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <code className="text-[9.5px] font-mono font-bold text-indigo-700 bg-indigo-50/90 px-1 py-0.5 rounded border border-indigo-100">
                            #{mov.productSku || 'S/N'}
                          </code>
                          {mov.puesto && (
                            <span className="text-[8.5px] font-mono font-black text-amber-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200" title={`Puesto / Estante: ${mov.puesto}`}>
                              📍{mov.puesto}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Descripción */}
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-[10.5px] block truncate max-w-[150px] xl:max-w-[190px]" title={mov.productName}>
                          {mov.productName}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-1.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-block text-[8.5px] font-black py-0.5 px-1.5 rounded border ${badgeTag.bg}`}>
                          {badgeTag.text}
                        </span>
                      </td>

                      {/* Cantidad */}
                      <td className="py-1.5 px-2 text-center font-mono font-black text-[10.5px] whitespace-nowrap">
                        <span className={isIncoming ? 'text-emerald-600' : isSale ? 'text-rose-600' : 'text-slate-700'}>
                          {isIncoming ? '+' : '-'}{mov.quantity}
                        </span>
                        <span className="text-[8.5px] text-slate-400 font-sans ml-0.5">
                          {mov.unit === 'Onza' ? 'Oz' : mov.unit === 'Galón' ? 'Gal' : 'Un.'}
                        </span>
                      </td>

                      {/* Costo / Valor Unitario ($) */}
                      <td className="py-1.5 px-2 text-right font-mono text-[9.5px] text-slate-600 whitespace-nowrap">
                        ${val.toFixed(2)}
                      </td>

                      {/* Monto Total ($) */}
                      <td className="py-1.5 px-2 text-right font-mono font-black text-[10.5px] text-slate-800 whitespace-nowrap">
                        ${total.toFixed(2)}
                      </td>

                      {/* Observación / Concepto */}
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        <span className="text-[9.5px] text-slate-600 block truncate max-w-[150px] xl:max-w-[200px]" title={mov.reference}>
                          {mov.reference}
                        </span>
                        {mov.notes && mov.notes !== mov.reference && (
                          <span className="text-[8.5px] text-slate-400 italic block truncate max-w-[150px] xl:max-w-[200px]">
                            {mov.notes}
                          </span>
                        )}
                      </td>

                      {/* Número DTE */}
                      <td className="py-1.5 px-2.5 whitespace-nowrap">
                        {mov.dteNumber && mov.dteNumber !== 'N/A' ? (
                          <div className="flex items-center gap-1">
                            <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded font-mono border ${
                              mov.sourceCategory === 'COMPRA'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : mov.sourceCategory === 'VENTA'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {mov.sourceCategory === 'COMPRA' ? 'DTE COMPRA' : mov.sourceCategory === 'VENTA' ? 'DTE VENTA' : 'INT'}
                            </span>
                            <span className="text-[9.5px] font-mono font-bold text-slate-800 truncate max-w-[130px] xl:max-w-[170px]" title={mov.dteNumber}>
                              {mov.dteNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic font-mono">
                            N/A (Interno)
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

        {/* Footer Informativo */}
        <div className="p-2 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center text-[9.5px] text-slate-500 gap-2">
          <div>
            Mostrando <strong>{filteredMovements.length}</strong> movimientos de Kárdex registrados
          </div>
          <div className="flex items-center gap-4 font-mono font-bold">
            <span className="text-emerald-700">
              Total Entradas: +{totalEntradas}
            </span>
            <span className="text-rose-700">
              Total Salidas: -{totalSalidas}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: AJUSTE MANUAL DE INVENTARIO (CONTEO / MERMA)                       */}
      {/* ========================================================================= */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-5 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsAdjustmentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-800 mb-0.5">Ajuste de Stock en Kárdex</h3>
            <p className="text-[11px] text-slate-500 mb-3.5">
              Registra ajustes por conteo físico o mermas de frascos con trazabilidad oficial.
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Producto / Insumo a Ajustar *
                </label>
                <select
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="clay-input w-full text-xs font-bold py-1.5"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.sku}) • Stock actual: {p.stock} {p.unit === 'Onza' ? 'Oz' : 'Un.'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tipo de Operación *
                </label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="clay-input w-full text-xs font-bold py-1.5"
                >
                  <option value="ADJUSTMENT_ADD">➕ Entrada por Conteo Físico / Inventario Inicial</option>
                  <option value="ADJUSTMENT_SUB">➖ Salida por Diferencia de Conteo Físico</option>
                  <option value="OUT_DAMAGE">⚠️ Merma / Rotura de Frasco / Evaporación</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Cantidad a Ajustar ({currentAdjProduct?.unit === 'Onza' ? 'Oz' : 'Un.'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(parseFloat(e.target.value) || 0)}
                    className="clay-input w-full text-xs font-mono font-bold py-1.5"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Stock Resultante Proyectado
                  </label>
                  <div className="p-1.5 rounded-xl bg-slate-100 text-center font-mono font-black text-xs text-indigo-700 border border-slate-200">
                    {projectedStock} {currentAdjProduct?.unit === 'Onza' ? 'Oz' : 'Un.'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Motivo / Concepto del Ajuste *
                </label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Ej. Conteo físico fin de mes, frasco quebrado..."
                  className="clay-input w-full text-xs py-1.5"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
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

              <div className="flex gap-2.5 pt-2">
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
