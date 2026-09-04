'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  DollarSign,
  Calendar,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownRight,
  FileText,
  Trash2,
  Edit3,
  X,
  Package,
  RotateCcw,
  Check,
  Phone,
  Mail,
  MapPin,
  Tag
} from 'lucide-react';
import {
  PurchaseRecord,
  Supplier,
  PurchaseItem,
  PurchasePayment,
  TipoDteCompra,
  applyPurchaseToProducts
} from '@/lib/purchases';
import { ProductItem, PERFUME_CATEGORIES } from '@/lib/store';
import { KardexMovement } from '@/lib/kardex';

interface ComprasModuleProps {
  products: ProductItem[];
  onUpdateProducts: (products: ProductItem[]) => void;
  suppliers: Supplier[];
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  purchases: PurchaseRecord[];
  onUpdatePurchases: (purchases: PurchaseRecord[]) => void;
  onAddKardexMovement?: (movement: KardexMovement) => void;
}

export default function ComprasModule({
  products,
  onUpdateProducts,
  suppliers,
  onUpdateSuppliers,
  purchases,
  onUpdatePurchases,
  onAddKardexMovement
}: ComprasModuleProps) {
  // Subpestaña activa dentro del módulo de Compras
  const [subTab, setSubTab] = useState<'historial' | 'registrar' | 'proveedores'>('historial');

  // Filtros en Historial de Compras
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDIENTE' | 'PAGADO'>('TODOS');
  const [tipoDteFilter, setTipoDteFilter] = useState<string>('TODOS');

  // Modales
  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<PurchaseRecord | null>(null);
  const [activeAbonoPurchase, setActiveAbonoPurchase] = useState<PurchaseRecord | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);

  // Modal Buscador de Productos para Compra
  const [pickerRowIndex, setPickerRowIndex] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('Todos');

  const filteredPickerProducts = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    return products.filter(p => {
      const matchCat = pickerCategory === 'Todos' || p.category === pickerCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.puesto && p.puesto.toLowerCase().includes(q))
      );
    });
  }, [products, pickerSearch, pickerCategory]);

  // Formulario: Registrar Nueva Compra
  const [formTipoDte, setFormTipoDte] = useState<TipoDteCompra>('CCF');
  const [formSupplierId, setFormSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [formPurchaseDate, setFormPurchaseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formCondicion, setFormCondicion] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE'>('TRANSFERENCIA');
  const [formDocNumber, setFormDocNumber] = useState<string>('');
  const [formControlNumber, setFormControlNumber] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  
  // Renglones de productos en la compra actual (Inician en cantidad 0 y sin producto preseleccionado)
  const [formItems, setFormItems] = useState<Array<{
    productId: string;
    productName: string;
    productSku: string;
    unit: string;
    quantity: number;
    costPrice: number;
    subtotal: number;
  }>>([
    {
      productId: '',
      productName: '',
      productSku: '',
      unit: 'Onza',
      quantity: 0,
      costPrice: 0,
      subtotal: 0
    }
  ]);

  // Formulario: Abono
  const [abonoAmount, setAbonoAmount] = useState<string>('');
  const [abonoDate, setAbonoDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [abonoMethod, setAbonoMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE'>('TRANSFERENCIA');
  const [abonoRef, setAbonoRef] = useState<string>('');
  const [abonoNotes, setAbonoNotes] = useState<string>('');

  // Formulario: Nuevo Producto Rápido
  const [quickProdName, setQuickProdName] = useState('');
  const [quickProdCategory, setQuickProdCategory] = useState(PERFUME_CATEGORIES[0]);
  const [quickProdUnit, setQuickProdUnit] = useState('Onza');
  const [quickProdCost, setQuickProdCost] = useState('1.95');
  const [quickProdPrice, setQuickProdPrice] = useState('3.25');

  // Mensaje de notificación temporal
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- CÁLCULOS KPI HISTORIAL ---
  const totalComprado = useMemo(() => {
    return purchases
      .filter(p => p.paymentStatus !== 'ANULADO')
      .reduce((sum, p) => sum + (p.tipoDte === 'NC' ? -p.total : p.total), 0);
  }, [purchases]);

  const totalDeudaCxP = useMemo(() => {
    return purchases
      .filter(p => p.paymentStatus === 'PENDIENTE')
      .reduce((sum, p) => sum + p.saldoPendiente, 0);
  }, [purchases]);

  const totalPagadoReal = useMemo(() => {
    return totalComprado - totalDeudaCxP;
  }, [totalComprado, totalDeudaCxP]);

  // Filtrado de compras
  const filteredPurchases = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return purchases.filter(p => {
      const matchQ = !q || 
        p.supplierName.toLowerCase().includes(q) || 
        p.docNumber.toLowerCase().includes(q) || 
        (p.controlNumber && p.controlNumber.toLowerCase().includes(q)) ||
        p.purchaseNumber.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'TODOS' || p.paymentStatus === statusFilter;
      const matchTipo = tipoDteFilter === 'TODOS' || p.tipoDte === tipoDteFilter;

      return matchQ && matchStatus && matchTipo;
    });
  }, [purchases, searchTerm, statusFilter, tipoDteFilter]);

  // Cálculos del formulario de compra en tiempo real
  const formSubtotalNeto = useMemo(() => {
    return formItems.reduce((acc, it) => acc + (it.quantity * it.costPrice), 0);
  }, [formItems]);

  const formIva = useMemo(() => {
    if (formTipoDte === 'CCF') {
      return parseFloat((formSubtotalNeto * 0.13).toFixed(2));
    }
    return 0;
  }, [formSubtotalNeto, formTipoDte]);

  const formTotal = useMemo(() => {
    const total = formSubtotalNeto + formIva;
    return parseFloat(total.toFixed(2));
  }, [formSubtotalNeto, formIva]);

  // Proveedor seleccionado actualmente en el formulario
  const currentSupplier = useMemo(() => {
    return suppliers.find(s => s.id === formSupplierId);
  }, [suppliers, formSupplierId]);

  // Manejo de cambio de producto en un renglón mediante buscador predictivo
  const handleSelectProductInRow = (index: number, prod: ProductItem) => {
    setFormItems(prev => {
      const copy = [...prev];
      const qty = copy[index].quantity;
      const cost = prod.cost || 0;
      copy[index] = {
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        unit: prod.unit,
        quantity: qty,
        costPrice: cost,
        subtotal: parseFloat((qty * cost).toFixed(2))
      };
      return copy;
    });
  };

  const handleClearProductInRow = (index: number) => {
    setFormItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: '',
        productName: '',
        productSku: '',
        costPrice: 0,
        subtotal: 0
      };
      return copy;
    });
  };

  // Manejo de cambio de cantidad o costo
  const handleUpdateItemValue = (index: number, field: 'quantity' | 'costPrice', value: number) => {
    setFormItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index] };
      if (field === 'quantity') item.quantity = value;
      if (field === 'costPrice') item.costPrice = value;
      item.subtotal = parseFloat((item.quantity * item.costPrice).toFixed(2));
      copy[index] = item;
      return copy;
    });
  };

  // Agregar renglón vacío con cantidad en cero
  const handleAddItemRow = () => {
    setFormItems(prev => [
      ...prev,
      {
        productId: '',
        productName: '',
        productSku: '',
        unit: 'Onza',
        quantity: 0,
        costPrice: 0,
        subtotal: 0
      }
    ]);
  };

  // Eliminar renglón
  const handleRemoveItemRow = (index: number) => {
    if (formItems.length <= 1) {
      showToast('La factura debe tener al menos un producto o insumo.');
      return;
    }
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  // Guardar nueva compra
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formSupplierId) {
      showToast('Por favor selecciona un proveedor.');
      return;
    }
    if (!formDocNumber.trim()) {
      showToast('Ingresa el Código de Generación o Número de Factura.');
      return;
    }
    if (formItems.length === 0 || formItems.some(it => Number(it.quantity) <= 0 || !it.productId)) {
      showToast('Verifica los renglones: debes seleccionar el producto y especificar una cantidad mayor a 0.');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === formSupplierId);
    const supplierName = supplierObj?.name || 'Proveedor General';
    const creditDays = supplierObj?.creditDays || 0;

    // Calcular fecha de vencimiento si es crédito
    let dueDate = formPurchaseDate;
    if (formCondicion === 'CREDITO' && creditDays > 0) {
      const d = new Date(formPurchaseDate + 'T00:00:00');
      d.setDate(d.getDate() + creditDays);
      dueDate = d.toISOString().split('T')[0];
    }

    const purchaseNumber = `CMP-${String(purchases.length + 45).padStart(4, '0')}`;
    const isNC = formTipoDte === 'NC';

    const newPurchase: PurchaseRecord = {
      id: `pur-${Date.now()}`,
      purchaseNumber,
      tipoDte: formTipoDte,
      supplierId: formSupplierId,
      supplierName,
      purchaseDate: formPurchaseDate,
      dueDate,
      creditDays,
      docNumber: formDocNumber.trim(),
      controlNumber: formControlNumber.trim() || undefined,
      condicion: formCondicion,
      paymentMethod: formCondicion === 'CONTADO' ? formPaymentMethod : undefined,
      paymentStatus: formCondicion === 'CONTADO' ? 'PAGADO' : 'PENDIENTE',
      subtotalNeto: isNC ? -formSubtotalNeto : formSubtotalNeto,
      iva: isNC ? -formIva : formIva,
      total: isNC ? -formTotal : formTotal,
      saldoPendiente: formCondicion === 'CONTADO' ? 0 : (isNC ? 0 : formTotal),
      items: formItems.map(it => ({
        productId: it.productId,
        productName: it.productName,
        productSku: it.productSku,
        unit: it.unit,
        quantity: it.quantity,
        costPrice: it.costPrice,
        subtotal: it.subtotal
      })),
      payments: formCondicion === 'CONTADO' ? [{
        id: `pay-${Date.now()}`,
        purchaseId: `pur-${Date.now()}`,
        date: formPurchaseDate,
        amount: formTotal,
        paymentMethod: formPaymentMethod,
        reference: 'PAGO-CONTADO-INICIAL',
        notes: `Liquidación al contado mediante ${formPaymentMethod}.`
      }] : [],
      notes: formNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    // 1. Actualizar el inventario (stock y costo de adquisición)
    const updatedProducts = applyPurchaseToProducts(newPurchase, products);
    onUpdateProducts(updatedProducts);

    // 2. Movimientos en Kárdex:
    // Se generan de forma reactiva y automática en el Kárdex a partir del historial oficial de compras (purchases).
    // No se inserta movimiento manual duplicado para evitar doble conteo.

    // 3. Guardar la compra en el historial
    onUpdatePurchases([newPurchase, ...purchases]);

    // 3. Limpiar formulario y regresar a la vista de historial
    setFormDocNumber('');
    setFormControlNumber('');
    setFormNotes('');
    setFormItems([
      {
        productId: '',
        productName: '',
        productSku: '',
        unit: 'Onza',
        quantity: 0,
        costPrice: 0,
        subtotal: 0
      }
    ]);
    setSubTab('historial');
    showToast(`✅ Factura ${newPurchase.purchaseNumber} registrada. Se actualizó el stock y costo de los productos.`);
  };

  // Abrir modal de abono
  const handleOpenAbono = (purchase: PurchaseRecord) => {
    setActiveAbonoPurchase(purchase);
    setAbonoAmount(purchase.saldoPendiente.toFixed(2));
    setAbonoDate(new Date().toISOString().split('T')[0]);
    setAbonoRef('');
    setAbonoNotes('');
  };

  // Registrar abono
  const handleSaveAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAbonoPurchase) return;

    const amount = parseFloat(abonoAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Por favor ingresa un monto válido.');
      return;
    }

    if (amount > activeAbonoPurchase.saldoPendiente + 0.01) {
      showToast('El abono no puede exceder el saldo pendiente.');
      return;
    }

    const newSaldo = Math.max(0, parseFloat((activeAbonoPurchase.saldoPendiente - amount).toFixed(2)));
    const newStatus = newSaldo <= 0.001 ? 'PAGADO' : 'PENDIENTE';

    const newPayment: PurchasePayment = {
      id: `pay-${Date.now()}`,
      purchaseId: activeAbonoPurchase.id,
      date: abonoDate,
      amount,
      paymentMethod: abonoMethod,
      reference: abonoRef.trim() || undefined,
      notes: abonoNotes.trim() || undefined
    };

    const updatedPurchases = purchases.map(p => {
      if (p.id === activeAbonoPurchase.id) {
        return {
          ...p,
          saldoPendiente: newSaldo,
          paymentStatus: newStatus as 'PAGADO' | 'PENDIENTE',
          payments: [...(p.payments || []), newPayment]
        };
      }
      return p;
    });

    onUpdatePurchases(updatedPurchases);
    setActiveAbonoPurchase(null);
    showToast(`✅ Abono de $${amount.toFixed(2)} registrado correctamente.`);
  };

  // Guardar o Crear Proveedor
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name.trim()) return;

    const exists = suppliers.some(s => s.id === editingSupplier.id);
    let updated: Supplier[];
    if (exists) {
      updated = suppliers.map(s => s.id === editingSupplier.id ? editingSupplier : s);
    } else {
      updated = [...suppliers, editingSupplier];
    }

    onUpdateSuppliers(updated);
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
    showToast(`✅ Proveedor "${editingSupplier.name}" guardado.`);
  };

  // Eliminar Proveedor
  const handleDeleteSupplier = (id: string) => {
    const s = suppliers.find(sup => sup.id === id);
    if (!s) return;
    if (confirm(`¿Estás seguro de eliminar al proveedor "${s.name}"?`)) {
      onUpdateSuppliers(suppliers.filter(sup => sup.id !== id));
      showToast(`Proveedor eliminado.`);
    }
  };

  // Crear Producto Rápido al Vuelo
  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProdName.trim()) return;

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      sku: `INS-${String(products.length + 101)}`,
      barcode: `74100${String(products.length + 101).padStart(7, '0')}`,
      name: quickProdName.trim(),
      brand: 'Kode Insumos',
      category: quickProdCategory,
      unit: quickProdUnit,
      price: parseFloat(quickProdPrice) || 3.25,
      cost: parseFloat(quickProdCost) || 1.95,
      stock: 0,
      minStock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
      isAvailableOnline: true
    };

    onUpdateProducts([newProd, ...products]);
    setIsQuickProductModalOpen(false);

    // Agregar al primer renglón del formulario si está libre o añadir renglón
    setFormItems(prev => {
      if (prev.length === 1 && !prev[0].productId) {
        return [{
          productId: newProd.id,
          productName: newProd.name,
          productSku: newProd.sku,
          unit: newProd.unit,
          quantity: 0,
          costPrice: newProd.cost,
          subtotal: 0
        }];
      }
      return [
        ...prev,
        {
          productId: newProd.id,
          productName: newProd.name,
          productSku: newProd.sku,
          unit: newProd.unit,
          quantity: 0,
          costPrice: newProd.cost,
          subtotal: 0
        }
      ];
    });

    setQuickProdName('');
    showToast(`✅ Insumo "${newProd.name}" creado e insertado en la compra.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 clay-card bg-emerald-50 border-emerald-300 text-emerald-900 px-4 py-3 text-xs font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Encabezado Principal y Sub-Navegación */}
      <div className="clay-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-800">Módulo de Compras & Proveedores</h2>
              <p className="text-xs text-slate-500 font-medium">
                Entradas de mercadería (esencias, botes, empaque), control de stock automático y Cuentas por Pagar (CxP)
              </p>
            </div>
          </div>
        </div>

        {/* Subpestañas operativas */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSubTab('historial')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'historial'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Historial & CxP</span>
            <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded-full bg-white/30 text-white font-mono">
              {purchases.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('registrar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'registrar'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Compra</span>
          </button>

          <button
            onClick={() => setSubTab('proveedores')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'proveedores'
                ? 'clay-btn-primary !shadow-[3px_4px_10px_rgba(79,70,229,0.35)]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Proveedores</span>
            <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
              {suppliers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBPESTAÑA 1: HISTORIAL DE COMPRAS & CUENTAS POR PAGAR (CxP)             */}
      {/* ========================================================================= */}
      {subTab === 'historial' && (
        <div className="space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="clay-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Comprado</p>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <ShoppingCart className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mt-1">${totalComprado.toFixed(2)}</h3>
              <span className="text-[11px] text-slate-500 font-medium">Compras netas con IVA</span>
            </div>

            <div className="clay-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pagado</p>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">${totalPagadoReal.toFixed(2)}</h3>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Flujo desembolsado
              </span>
            </div>

            <div className="clay-card p-5 border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuentas x Pagar (CxP)</p>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-2xl font-black text-amber-600 mt-1">${totalDeudaCxP.toFixed(2)}</h3>
              <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {purchases.filter(p => p.paymentStatus === 'PENDIENTE').length} facturas por liquidar
              </span>
            </div>

            <div className="clay-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proveedores Activos</p>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Building className="w-4 h-4" />
                </span>
              </div>
              <h3 className="text-2xl font-black text-purple-600 mt-1">{suppliers.length}</h3>
              <span className="text-[11px] text-slate-500 font-medium">Esencias, botes y alcohol</span>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="clay-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por proveedor, # DTE, # Control o # Compra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="clay-input w-full pl-9 pr-4 py-2 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="PENDIENTE">A Crédito (Pendientes)</option>
                  <option value="PAGADO">Pagadas (Liquidadas)</option>
                </select>
              </div>

              <select
                value={tipoDteFilter}
                onChange={(e) => setTipoDteFilter(e.target.value)}
                className="clay-input text-xs font-bold py-1.5"
              >
                <option value="TODOS">Todos los DTE</option>
                <option value="CCF">Crédito Fiscal (CCF)</option>
                <option value="FAC">Factura (FAC)</option>
                <option value="FSE">Sujeto Excluido (FSE)</option>
                <option value="NC">Nota de Crédito (NC)</option>
              </select>

              <button
                onClick={() => setSubTab('registrar')}
                className="clay-btn clay-btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5 font-bold shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Compra</span>
              </button>
            </div>
          </div>

          {/* Tabla de Historial de Compras */}
          <div className="clay-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Comprobante DTE</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Condición</th>
                    <th className="py-3 px-4 text-right">Total Factura</th>
                    <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No se encontraron registros de compras con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((pur) => {
                      const isPending = pur.paymentStatus === 'PENDIENTE';
                      const isNC = pur.tipoDte === 'NC';

                      return (
                        <tr key={pur.id} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-bold whitespace-nowrap">
                            {pur.purchaseDate}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`clay-badge text-[10px] font-black py-0.5 px-2 ${
                                pur.tipoDte === 'CCF' ? 'bg-blue-100 text-blue-800' :
                                pur.tipoDte === 'NC' ? 'bg-rose-100 text-rose-800' :
                                pur.tipoDte === 'FSE' ? 'bg-purple-100 text-purple-800' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {pur.tipoDte}
                              </span>
                              <span className="font-mono font-bold text-slate-800">
                                {pur.purchaseNumber}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[160px]" title={pur.docNumber}>
                              {pur.controlNumber || pur.docNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-800 line-clamp-1 max-w-[220px]" title={pur.supplierName}>
                              {pur.supplierName}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {pur.items.length} {pur.items.length === 1 ? 'insumo' : 'insumos'} adquiridos
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {pur.condicion === 'CONTADO' ? (
                              <div className="flex items-center gap-1 text-slate-700 font-medium">
                                <span className="text-emerald-600 font-bold">Contado</span>
                                <span className="text-[10px] text-slate-400">({pur.paymentMethod || 'Efectivo'})</span>
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-amber-700">Crédito ({pur.creditDays}d)</span>
                                {pur.dueDate && (
                                  <span className="text-[10px] text-slate-500 block">
                                    Vence: {pur.dueDate}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-slate-800">
                            {isNC ? '-' : ''}${Math.abs(pur.total).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            {pur.saldoPendiente > 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-black">
                                ${pur.saldoPendiente.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium">$0.00</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`clay-badge text-[10px] font-bold py-0.5 px-2.5 ${
                              pur.paymentStatus === 'PAGADO' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pur.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedPurchaseDetail(pur)}
                                className="clay-btn clay-btn-light p-1.5 text-xs text-indigo-700"
                                title="Ver Detalle de la Compra"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {isPending && pur.saldoPendiente > 0 && (
                                <button
                                  onClick={() => handleOpenAbono(pur)}
                                  className="clay-btn clay-btn-primary px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                                  title="Abonar a esta compra"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>Abonar</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPESTAÑA 2: REGISTRAR ENTRADA DE FACTURA DE COMPRA                     */}
      {/* ========================================================================= */}
      {subTab === 'registrar' && (
        <div className="clay-card p-6 max-w-4xl mx-auto animate-in fade-in zoom-in-98">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-200 mb-5">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <span>Registrar Entrada de Factura de Compra</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Carga las compras de esencias, botes o materias primas para registrar el ingreso a stock y actualizar costos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('historial')}
              className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-slate-600"
            >
              Volver al Historial
            </button>
          </div>

          <form onSubmit={handleSavePurchase} className="space-y-6">
            
            {/* Fila 1: Tipo DTE, Proveedor, Fecha, Condición de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tipo de Comprobante / DTE *
                </label>
                <select
                  value={formTipoDte}
                  onChange={(e) => setFormTipoDte(e.target.value as TipoDteCompra)}
                  className="clay-input w-full text-xs font-bold"
                >
                  <option value="CCF">Crédito Fiscal (CCF - 13% IVA)</option>
                  <option value="FAC">Factura Consumidor Final</option>
                  <option value="FSE">Sujeto Excluido (FSE)</option>
                  <option value="NC">Nota de Crédito (NC - Devolución)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Proveedor *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplier({
                        id: `prov-${Date.now()}`,
                        name: '',
                        category: 'Esencias & Fragancias',
                        creditDays: 30
                      });
                      setIsSupplierModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nuevo</span>
                  </button>
                </div>
                <select
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  required
                  className="clay-input w-full text-xs font-bold"
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.creditDays}d crédito)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Fecha de Emisión / Compra *
                </label>
                <input
                  type="date"
                  required
                  value={formPurchaseDate}
                  onChange={(e) => setFormPurchaseDate(e.target.value)}
                  className="clay-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Condición de Pago *
                </label>
                <select
                  value={formCondicion}
                  onChange={(e) => setFormCondicion(e.target.value as any)}
                  className="clay-input w-full text-xs font-bold"
                >
                  <option value="CONTADO">Contado (Pagado ya)</option>
                  <option value="CREDITO">Crédito (Cuenta x Pagar)</option>
                </select>
              </div>
            </div>

            {/* Fila 2: Código Generación, Número Control, Forma de Pago (si es contado) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Código de Generación DTE / # Factura *
                </label>
                <input
                  type="text"
                  required
                  value={formDocNumber}
                  onChange={(e) => setFormDocNumber(e.target.value)}
                  placeholder="Ej: 4B17731D-B09B-89A8-5BFD-..."
                  className="clay-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Número de Control Hacienda (Opcional)
                </label>
                <input
                  type="text"
                  value={formControlNumber}
                  onChange={(e) => setFormControlNumber(e.target.value)}
                  placeholder="Ej: DTE-03-M001P001-000000000001509"
                  className="clay-input w-full text-xs font-mono"
                />
              </div>

              {formCondicion === 'CONTADO' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Forma de Pago
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="EFECTIVO">💵 Efectivo (Caja Chica)</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                    <option value="TARJETA">💳 Tarjeta Débito/Crédito</option>
                    <option value="CHEQUE">📝 Cheque</option>
                  </select>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex flex-col justify-center">
                  <span className="font-bold text-amber-900">Crédito acordado</span>
                  <span className="text-[11px] text-amber-700">
                    {currentSupplier?.creditDays || 0} días para pagar (CxP automática)
                  </span>
                </div>
              )}
            </div>

            {/* Fila 3: Tabla Dinámica de Renglones de Productos / Insumos */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                    Detalle de Fragancias / Botes / Insumos
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Al guardar la compra, el inventario se incrementará automáticamente y se actualizará el costo unitario.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickProductModalOpen(true)}
                  className="clay-btn clay-btn-light px-3 py-1 text-xs font-bold text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nuevo Insumo</span>
                </button>
              </div>

              <div className="clay-card overflow-hidden !bg-white/60">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3" style={{ width: '45%' }}>Producto / Insumo</th>
                      <th className="py-2.5 px-3" style={{ width: '18%' }}>Cantidad</th>
                      <th className="py-2.5 px-3" style={{ width: '18%' }}>Costo Unitario ($)</th>
                      <th className="py-2.5 px-3 text-right" style={{ width: '14%' }}>Subtotal ($)</th>
                      <th className="py-2.5 px-3 text-center" style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {formItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        {/* Producto / Insumo con Buscador Modal */}
                        <td className="p-2.5">
                          {item.productId ? (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/90 border border-indigo-200 shadow-sm">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                                  #{item.productSku || 'S/N'}
                                </span>
                                {products.find(p => p.id === item.productId)?.puesto && (
                                  <span className="text-[9px] font-mono font-black text-amber-900 bg-amber-100 px-1 py-0.5 rounded border border-amber-200 shrink-0" title={`Puesto: ${products.find(p => p.id === item.productId)?.puesto}`}>
                                    📍{products.find(p => p.id === item.productId)?.puesto}
                                  </span>
                                )}
                                <span className="font-black text-xs text-slate-800 truncate max-w-[180px] sm:max-w-[280px]" title={item.productName}>
                                  {item.productName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0 hidden md:inline">
                                  [{products.find(p => p.id === item.productId)?.category || item.unit}]
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPickerRowIndex(idx);
                                    setPickerSearch('');
                                    setPickerCategory('Todos');
                                  }}
                                  className="text-[10.5px] font-bold text-indigo-600 hover:text-indigo-900 hover:underline"
                                  title="Buscar o cambiar por otro producto"
                                >
                                  Cambiar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClearProductInRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Quitar producto seleccionado"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setPickerRowIndex(idx);
                                setPickerSearch('');
                                setPickerCategory('Todos');
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-800 text-xs font-bold transition-all text-left group shadow-sm"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Search className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
                                <span className="text-slate-600 font-medium truncate">
                                  🔍 Clic aquí para buscar fragancia, bote o insumo (Sauvage, 100, Bote)...
                                </span>
                              </div>
                              <span className="clay-badge text-[10px] font-black bg-indigo-600 text-white shrink-0 ml-2">
                                Buscar
                              </span>
                            </button>
                          )}
                        </td>

                        {/* Cantidad (Inicia en 0, editable a mano) */}
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              placeholder="0"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                handleUpdateItemValue(idx, 'quantity', isNaN(val) ? 0 : val);
                              }}
                              className="clay-input w-full text-xs font-mono font-bold text-center"
                              title="Cantidad comprada (ingrésala a mano)"
                            />
                            <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap min-w-[20px]">
                              {item.unit === 'Onza' ? 'Oz' : item.unit === 'Galón' ? 'Gal' : 'Un.'}
                            </span>
                          </div>
                        </td>

                        {/* Costo Unitario ($) (Editable por centavos) */}
                        <td className="p-2.5">
                          <div className="clay-input flex items-center gap-1">
                            <span className="text-slate-400 font-bold">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              placeholder="0.00"
                              value={item.costPrice === 0 ? '' : item.costPrice}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                handleUpdateItemValue(idx, 'costPrice', isNaN(val) ? 0 : val);
                              }}
                              className="bg-transparent border-none outline-none w-full text-xs font-mono font-black text-slate-800"
                              title="Costo unitario de compra (puedes ajustarlo por centavos)"
                            />
                          </div>
                        </td>

                        {/* Subtotal */}
                        <td className="p-2.5 text-right font-mono font-black text-slate-800 whitespace-nowrap">
                          ${(item.quantity * item.costPrice).toFixed(2)}
                        </td>

                        {/* Eliminar Fila */}
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar renglón"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddItemRow}
                className="clay-btn clay-btn-light px-3.5 py-2 text-xs font-bold text-indigo-700 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Renglón</span>
              </button>
            </div>

            {/* Observaciones y Resumen de Totales */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
              <div className="md:col-span-7">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notas u Observaciones del Comprobante
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej. Lote de esencias concentradas de alta fijación. Botes de 50ml con atomizador dorado."
                  className="clay-input w-full text-xs"
                ></textarea>
              </div>

              <div className="md:col-span-5">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Neto:</span>
                    <strong className="font-mono text-slate-800">${formSubtotalNeto.toFixed(2)}</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>
                      IVA Crédito Fiscal (13%):
                      {formTipoDte !== 'CCF' && <span className="text-[10px] text-slate-400 ml-1">(No aplica)</span>}
                    </span>
                    <strong className="font-mono text-slate-800">${formIva.toFixed(2)}</strong>
                  </div>

                  <div className="pt-2 border-t border-indigo-200 flex justify-between text-sm font-black text-indigo-900">
                    <span>Total Factura:</span>
                    <strong className="font-mono text-base text-indigo-600">${formTotal.toFixed(2)}</strong>
                  </div>

                  {formCondicion === 'CREDITO' && (
                    <div className="pt-1 text-[11px] text-amber-800 font-bold">
                      ⚠️ Se creará una Cuenta por Pagar de ${formTotal.toFixed(2)} a favor de {currentSupplier?.name || 'Proveedor'}.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de Envío */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSubTab('historial')}
                className="clay-btn clay-btn-light px-5 py-2.5 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="clay-btn clay-btn-primary px-6 py-2.5 text-xs font-black flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Registrar Compra e Ingresar a Inventario</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBPESTAÑA 3: DIRECTORIO DE PROVEEDORES                                  */}
      {/* ========================================================================= */}
      {subTab === 'proveedores' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-800">Directorio de Proveedores</h3>
              <p className="text-xs text-slate-500 font-medium">
                Fabricantes e importadores de esencias, frascos de cristal, cajas y soluciones químicas
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSupplier({
                  id: `prov-${Date.now()}`,
                  name: '',
                  category: 'Esencias & Fragancias',
                  creditDays: 30
                });
                setIsSupplierModalOpen(true);
              }}
              className="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Proveedor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map(prov => {
              // Calcular saldo pendiente acumulado con este proveedor
              const provDeuda = purchases
                .filter(p => p.supplierId === prov.id && p.paymentStatus === 'PENDIENTE')
                .reduce((acc, p) => acc + p.saldoPendiente, 0);

              const provComprasCount = purchases.filter(p => p.supplierId === prov.id).length;

              return (
                <div key={prov.id} className="clay-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="clay-badge text-[10px] font-bold py-0.5 px-2 bg-indigo-50 text-indigo-700 mb-1 inline-block">
                        {prov.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-800">{prov.name}</h4>
                      {prov.contactPerson && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Contacto: {prov.contactPerson}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSupplier(prov);
                          setIsSupplierModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Editar Proveedor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(prov.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Eliminar Proveedor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600">
                    {prov.nit && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">NIT:</span>
                        <span className="font-mono text-xs">{prov.nit}</span>
                      </div>
                    )}
                    {prov.nrc && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">NRC:</span>
                        <span className="font-mono text-xs">{prov.nrc}</span>
                      </div>
                    )}
                    {prov.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{prov.phone}</span>
                      </div>
                    )}
                    {prov.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{prov.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Crédito acordado:</span>
                      <strong className="text-slate-700">{prov.creditDays} días</strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Saldo por Pagar:</span>
                      <strong className={`font-mono ${provDeuda > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'}`}>
                        ${provDeuda.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VER DETALLE COMPLETO DE COMPRA                                     */}
      {/* ========================================================================= */}
      {selectedPurchaseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="clay-card w-full max-w-2xl p-6 relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedPurchaseDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="clay-badge text-xs font-black py-0.5 px-2.5 bg-blue-100 text-blue-800">
                {selectedPurchaseDetail.tipoDte}
              </span>
              <h3 className="text-xl font-black text-slate-800">
                Detalle de Compra {selectedPurchaseDetail.purchaseNumber}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comprobante emitido por {selectedPurchaseDetail.supplierName} el {selectedPurchaseDetail.purchaseDate}
            </p>

            {/* Datos del DTE */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Código Generación DTE:</span>
                <span className="font-mono text-slate-800 font-bold truncate block" title={selectedPurchaseDetail.docNumber}>
                  {selectedPurchaseDetail.docNumber}
                </span>
              </div>
              {selectedPurchaseDetail.controlNumber && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Número de Control:</span>
                  <span className="font-mono text-slate-800 font-bold truncate block">
                    {selectedPurchaseDetail.controlNumber}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Condición:</span>
                <span className="font-bold text-slate-800">
                  {selectedPurchaseDetail.condicion} {selectedPurchaseDetail.creditDays ? `(${selectedPurchaseDetail.creditDays} días)` : ''}
                </span>
              </div>
            </div>

            {/* Renglones de Insumos */}
            <div className="clay-card overflow-hidden !bg-white/60 mb-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Producto / Fragancia</th>
                    <th className="py-2.5 px-3 text-center">Cantidad</th>
                    <th className="py-2.5 px-3 text-right">Costo Unitario</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPurchaseDetail.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-800">
                        {it.productName}
                        {it.productSku && <span className="text-[10px] text-slate-400 font-mono ml-1.5">#{it.productSku}</span>}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-indigo-700">
                        {it.quantity} {it.unit === 'Onza' ? 'Oz' : 'Un.'}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        ${it.costPrice.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-slate-800">
                        ${it.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Desglose de totales */}
            <div className="flex justify-end mb-4">
              <div className="w-64 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Neto:</span>
                  <strong className="font-mono text-slate-800">${selectedPurchaseDetail.subtotalNeto.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA Crédito Fiscal (13%):</span>
                  <strong className="font-mono text-slate-800">${selectedPurchaseDetail.iva.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-slate-800 text-sm">
                  <span>Total Factura:</span>
                  <strong className="font-mono text-indigo-600">${selectedPurchaseDetail.total.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                  <span>Saldo Pendiente:</span>
                  <strong className={`font-mono ${selectedPurchaseDetail.saldoPendiente > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'}`}>
                    ${selectedPurchaseDetail.saldoPendiente.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Historial de Abonos */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Historial de Pagos & Abonos Registrados
              </h4>
              {(!selectedPurchaseDetail.payments || selectedPurchaseDetail.payments.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No hay abonos registrados en esta compra.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedPurchaseDetail.payments.map((p) => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{p.date}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="text-slate-600">{p.paymentMethod}</span>
                        {p.reference && <span className="text-[10px] text-slate-400 ml-1.5 font-mono">Ref: {p.reference}</span>}
                      </div>
                      <strong className="font-mono font-black text-emerald-600">+${p.amount.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedPurchaseDetail(null)}
                className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR ABONO A COMPRA A CRÉDITO                                */}
      {/* ========================================================================= */}
      {activeAbonoPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveAbonoPurchase(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-1">Registrar Abono a Proveedor</h3>
            <p className="text-xs text-slate-500 mb-4">
              Compra <strong>{activeAbonoPurchase.purchaseNumber}</strong> • {activeAbonoPurchase.supplierName}
            </p>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-4 flex justify-between items-center">
              <span>Saldo Pendiente Actual:</span>
              <strong className="font-mono text-base text-rose-600 font-black">
                ${activeAbonoPurchase.saldoPendiente.toFixed(2)}
              </strong>
            </div>

            <form onSubmit={handleSaveAbono} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Monto a Abonar ($) *</label>
                  <button
                    type="button"
                    onClick={() => setAbonoAmount(activeAbonoPurchase.saldoPendiente.toFixed(2))}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    Pagar Deuda Total
                  </button>
                </div>
                <div className="clay-input flex items-center gap-1.5 focus-within:border-indigo-400">
                  <span className="font-black text-slate-400 text-base">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={activeAbonoPurchase.saldoPendiente}
                    required
                    value={abonoAmount}
                    onChange={(e) => setAbonoAmount(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-base font-black text-indigo-600 p-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fecha del Pago *</label>
                  <input
                    type="date"
                    required
                    value={abonoDate}
                    onChange={(e) => setAbonoDate(e.target.value)}
                    className="clay-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Método de Pago *</label>
                  <select
                    value={abonoMethod}
                    onChange={(e) => setAbonoMethod(e.target.value as any)}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Referencia Bancaria / # Comprobante
                </label>
                <input
                  type="text"
                  value={abonoRef}
                  onChange={(e) => setAbonoRef(e.target.value)}
                  placeholder="Ej: TRANSF-BAC-99421"
                  className="clay-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notas del Pago</label>
                <input
                  type="text"
                  value={abonoNotes}
                  onChange={(e) => setAbonoNotes(e.target.value)}
                  placeholder="Ej. Pago parcial acordado a 15 días"
                  className="clay-input w-full text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAbonoPurchase(null)}
                  className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-black"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR PROVEEDOR                                           */}
      {/* ========================================================================= */}
      {isSupplierModalOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="clay-card w-full max-w-lg p-6 relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => { setIsSupplierModalOpen(false); setEditingSupplier(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-800 mb-1">
              {suppliers.some(s => s.id === editingSupplier.id) ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa los datos de facturación fiscal (NIT, NRC) y plazos de crédito para compras.
            </p>

            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  placeholder="Ej. Importadora de Esencias Francesas S.A. de C.V."
                  className="clay-input w-full text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={editingSupplier.category}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, category: e.target.value as any })}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="Esencias & Fragancias">Esencias & Fragancias</option>
                    <option value="Envases & Botes">Envases & Botes</option>
                    <option value="Química & Alcohol">Química & Alcohol</option>
                    <option value="Empaque">Empaque</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    value={editingSupplier.contactPerson || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                    placeholder="Ej. Carlos Menjívar"
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">NIT / DUI</label>
                  <input
                    type="text"
                    value={editingSupplier.nit || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, nit: e.target.value })}
                    placeholder="0614-120590-101-2"
                    className="clay-input w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">NRC</label>
                  <input
                    type="text"
                    value={editingSupplier.nrc || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, nrc: e.target.value })}
                    placeholder="245678-9"
                    className="clay-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    placeholder="+503 2245-8800"
                    className="clay-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Días de Crédito Autorizados</label>
                  <input
                    type="number"
                    min="0"
                    value={editingSupplier.creditDays}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, creditDays: parseInt(e.target.value) || 0 })}
                    placeholder="30"
                    className="clay-input w-full text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editingSupplier.email || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                  placeholder="pedidos@proveedor.com"
                  className="clay-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={editingSupplier.address || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                  placeholder="Ej. Antiguo Cuscatlán, La Libertad"
                  className="clay-input w-full text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsSupplierModalOpen(false); setEditingSupplier(null); }}
                  className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-black"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR PRODUCTO / INSUMO AL VUELO                                  */}
      {/* ========================================================================= */}
      {isQuickProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="clay-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsQuickProductModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 mb-1">Crear Insumo / Producto al Vuelo</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registra un nuevo aroma o material directamente para cargarlo en esta compra.
            </p>

            <form onSubmit={handleSaveQuickProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre del Insumo / Fragancia *
                </label>
                <input
                  type="text"
                  required
                  value={quickProdName}
                  onChange={(e) => setQuickProdName(e.target.value)}
                  placeholder="Ej. Bote Cuadrado 30ml con Atomizador Negro"
                  className="clay-input w-full text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={quickProdCategory}
                    onChange={(e) => setQuickProdCategory(e.target.value)}
                    className="clay-input w-full text-xs font-bold"
                  >
                    {PERFUME_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidad de Medida</label>
                  <select
                    value={quickProdUnit}
                    onChange={(e) => setQuickProdUnit(e.target.value)}
                    className="clay-input w-full text-xs font-bold"
                  >
                    <option value="Onza">Onza (Oz)</option>
                    <option value="Unidad">Unidad (Un.)</option>
                    <option value="Galón">Galón</option>
                    <option value="Paquete">Paquete</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quickProdCost}
                    onChange={(e) => setQuickProdCost(e.target.value)}
                    className="clay-input w-full text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio Venta ($ PVP)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quickProdPrice}
                    onChange={(e) => setQuickProdPrice(e.target.value)}
                    className="clay-input w-full text-xs font-bold font-mono text-indigo-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickProductModalOpen(false)}
                  className="clay-btn clay-btn-light flex-1 py-2 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary flex-1 py-2 text-xs font-black"
                >
                  Crear e Insertar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUSCADOR DE PRODUCTOS / INSUMOS PARA RENGLÓN DE COMPRA             */}
      {/* ========================================================================= */}
      {pickerRowIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="clay-card w-full max-w-2xl p-5 relative animate-in zoom-in-95 flex flex-col max-h-[85vh] bg-white">
            <button
              type="button"
              onClick={() => setPickerRowIndex(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>🔍 Seleccionar Fragancia, Bote o Insumo</span>
                <span className="clay-badge text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                  {filteredPickerProducts.length} disponibles
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Busca por nombre, contratipo, SKU o puesto para agregarlo a la factura de compra.
              </p>
            </div>

            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Escribe el nombre o SKU (ej. Sauvage, 100, Bote, 50ml, Alcohol)..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="clay-input w-full pl-9 pr-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {['Todos', ...PERFUME_CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPickerCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                      pickerCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {filteredPickerProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No se encontraron productos que coincidan con &quot;{pickerSearch}&quot;.
                </div>
              ) : (
                filteredPickerProducts.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      handleSelectProductInRow(pickerRowIndex, prod);
                      setPickerRowIndex(null);
                    }}
                    className="p-3 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between transition-colors gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 group-hover:bg-white px-2 py-1 rounded-lg border border-indigo-200 shrink-0">
                        #{prod.sku}
                      </span>
                      {prod.puesto && (
                        <span className="text-[10px] font-mono font-black text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                          📍{prod.puesto}
                        </span>
                      )}
                      <div className="truncate">
                        <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-900 truncate">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {prod.category} • Presentación: <strong>{prod.unit === 'Onza' ? 'Oz' : prod.unit}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Costo sugerido</span>
                        <span className="text-xs font-mono font-black text-slate-800">
                          ${prod.cost.toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="clay-btn clay-btn-primary px-3 py-1 text-[11px] font-bold"
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
