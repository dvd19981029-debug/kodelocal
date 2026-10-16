'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Calculator,
  AlertTriangle,
  DollarSign,
  Download,
  BrainCircuit,
  FileSpreadsheet,
  Hourglass,
  ShoppingCart,
  CheckCircle2,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  ShieldAlert,
  Layers,
  ArrowRight,
  Printer,
  SlidersHorizontal,
  Info,
  Check,
  Sparkles,
  Truck,
} from 'lucide-react';
import { getStaffToken } from '@/lib/auth';

const OZ_PER_KG = 35.274;

interface DraftItem {
  productId: string;
  sku: string;
  productName: string;
  rawName: string;
  officialName: string;
  group: 'ESENCIAS' | 'BOTES' | 'INSUMOS';
  isEssence: boolean;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  orderUnitLabel: string;
  suggestedKg: number;
  suggestedOrderQty: number;
  suggestedBaseOz: number;
  idealOrderQty: number;
  pricePerKg: number;
  unitOrderPrice: number;
  unitCostBase: number;
  totalCost: number;
  currentStock: number;
  stockFull: number;
  stockHalfUnits: number;
  committedStock: number;
  inTransitStock: number;
  netInventoryPosition: number;
  currentDos: number;
  projectedDosAfterOrder: number;
  adr: number;
  safetyStock: number;
  reorderPoint: number;
  targetLevelS: number;
  abcXyz: string;
  stockStatus: 'AGOTADO' | 'CRITICO' | 'REORDEN' | 'PREVENTIVO' | 'OPTIMO' | 'SOBRESTOCK';
  trendType: 'ALZA_FUERTE' | 'ALZA' | 'ESTABLE' | 'BAJA' | 'SIN_MOVIMIENTO';
  grossMarginPct: number;
  expectedRevenue: number;
  expectedGrossProfit: number;
}

interface AnalysisItem {
  id: string;
  sku: string;
  name: string;
  rawName: string;
  officialName: string;
  brand: string;
  categoryName: string;
  group: 'ESENCIAS' | 'BOTES' | 'INSUMOS';
  isEssence: boolean;
  unit: string;
  orderUnitLabel: string;
  stockFull: number;
  stockHalfUnits: number;
  physicalStock: number;
  committedStock: number;
  inTransitStock: number;
  netInventoryPosition: number;
  minStock: number;
  totalSoldWindow: number;
  fullOzSold: number;
  halfOzSold: number;
  ordersCount: number;
  totalRevenueWindow: number;
  meanDaily: number;
  ewmaDaily: number;
  adr: number;
  sigmaDaily: number;
  cv: number;
  trendType: 'ALZA_FUERTE' | 'ALZA' | 'ESTABLE' | 'BAJA' | 'SIN_MOVIMIENTO';
  abcClass: 'A' | 'B' | 'C';
  xyzClass: 'X' | 'Y' | 'Z';
  abcXyz: string;
  safetyStock: number;
  leadTimeDemand: number;
  reorderPoint: number;
  targetLevelS: number;
  dos: number;
  daysUntilReorder: number;
  projectedStockAtArrival: number;
  stockStatus: 'AGOTADO' | 'CRITICO' | 'REORDEN' | 'PREVENTIVO' | 'OPTIMO' | 'SOBRESTOCK';
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierPriceKg: number;
  unitCostBase: number;
  unitOrderPrice: number;
  realizedAvgPrice: number;
  grossMarginPct: number;
  gmroiRatio: number;
  neededOz: number;
  neededBaseQty: number;
  neededKg: number;
  neededOrderQty: number;
  unconstrainedCost: number;
  urgencyScore: number;
  baseUnitsPerOrderStep: number;
  orderQtyPerStep: number;
}

interface EngineSummary {
  effectiveDays: number;
  historyDaysRequested: number;
  totalValidTransactions: number;
  totalSkusAnalyzed: number;
  skusWithSales: number;
  agotadosCount: number;
  criticosCount: number;
  reordenCount: number;
  preventivosCount: number;
  optimosCount: number;
  sobrestockCount: number;
  totalUnconstrainedCost: number;
  budgetRequested: number;
  budgetUsed: number;
  budgetCoveragePct: number;
  totalExpectedRevenue: number;
  totalExpectedProfit: number;
  portfolioRoiPct: number;
}

export function AbastecimientoModule() {
  // Parámetros del motor predictivo
  const [budget, setBudget] = useState<string>('3000');
  const [historyDays, setHistoryDays] = useState<number>(30);
  const [targetDos, setTargetDos] = useState<string>('60');
  const [leadTime, setLeadTime] = useState<string>('14');
  const [serviceLevelPct, setServiceLevelPct] = useState<number>(95);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'ESENCIAS' | 'BOTES' | 'INSUMOS'>('ALL');
  const [essenceOrderUnit, setEssenceOrderUnit] = useState<'KG' | 'HALF_KG' | 'OZ'>('KG');
  const [includeZeroSalesBelowMin, setIncludeZeroSalesBelowMin] = useState<boolean>(false);

  // Catálogo CSV opcional
  const [file, setFile] = useState<File | null>(null);
  const [catalogData, setCatalogData] = useState<any[]>([]);

  // Estado de resultados del motor
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [summary, setSummary] = useState<EngineSummary | null>(null);
  const [fullAnalysis, setFullAnalysis] = useState<AnalysisItem[]>([]);
  const [editableDraft, setEditableDraft] = useState<DraftItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<Array<{ id: string; name: string; category: string; creditDays: number }>>([]);

  // Navegación interna y filtros de tabla
  const [activeSubView, setActiveSubView] = useState<'orden_compra' | 'matriz_stock'>('orden_compra');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [abcFilter, setAbcFilter] = useState<string>('ALL');

  // Creación de Orden de Compra real en base de datos (/api/purchases)
  const [poCondicion, setPoCondicion] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
  const [poTipoDte, setPoTipoDte] = useState<'CCF' | 'FC'>('CCF');
  const [isCreatingPo, setIsCreatingPo] = useState<boolean>(false);
  const [createdPoBanner, setCreatedPoBanner] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const runPredictor = useCallback(
    async (overrideBudget?: number) => {
      setIsProcessing(true);
      try {
        const token = await getStaffToken();
        const effectiveBudget = overrideBudget !== undefined ? overrideBudget : Number(budget || 0);
        const res = await fetch('/api/admin/abastecimiento', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'x-staff-token': token } : {}),
          },
          body: JSON.stringify({
            budget: effectiveBudget,
            historyDays,
            targetDos: Number(targetDos || 60),
            leadTime: Number(leadTime || 14),
            serviceLevelPct,
            categoryFilter,
            essenceOrderUnit,
            includeZeroSalesBelowMin,
            catalog: catalogData,
          }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          setSummary(json.data.summary);
          setFullAnalysis(json.data.fullAnalysis || []);
          setEditableDraft(json.data.draft || []);
          if (Array.isArray(json.data.suppliers)) {
            setSuppliersList(json.data.suppliers);
          }
        } else {
          showToast('⚠️ Error en el motor predictivo: ' + (json.error || 'Desconocido'));
        }
      } catch (err) {
        console.error('Error ejecutando predictor:', err);
        showToast('⚠️ Error de conexión al consultar el motor predictivo.');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      budget,
      historyDays,
      targetDos,
      leadTime,
      serviceLevelPct,
      categoryFilter,
      essenceOrderUnit,
      includeZeroSalesBelowMin,
      catalogData,
    ]
  );

  // Ejecutar automáticamente al cargar o cuando cambian filtros estructurales
  useEffect(() => {
    runPredictor();
  }, [historyDays, categoryFilter, essenceOrderUnit, includeZeroSalesBelowMin, serviceLevelPct]);

  // Parseo de archivo CSV de proveedor APAESA
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const text = await selectedFile.text();
      const lines = text.split(/\r?\n/);
      const parsedCatalog: Array<{ id_proveedor: string; name: string; price_per_kg: number }> = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.toLowerCase().includes('código proveedor') || line.toLowerCase().includes('codigo proveedor')) {
          continue;
        }
        const sep = line.includes(';') ? ';' : ',';
        const cols = line.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());

        // Soportar tanto el formato original de 7 columnas como un CSV simple de 3 columnas (Código, Nombre, Precio/Kg)
        if (cols.length >= 7 && cols[1]) {
          const id_proveedor = cols[1];
          const name = cols[2];
          const price_per_kg = parseFloat(cols[6].replace(/[^0-9.]/g, ''));
          if (id_proveedor && !isNaN(price_per_kg) && price_per_kg > 0) {
            parsedCatalog.push({ id_proveedor, name, price_per_kg });
          }
        } else if (cols.length >= 3 && cols[0] && cols[1]) {
          const id_proveedor = cols[0];
          const name = cols[1];
          const price_per_kg = parseFloat(cols[2].replace(/[^0-9.]/g, ''));
          if (id_proveedor && !isNaN(price_per_kg) && price_per_kg > 0) {
            parsedCatalog.push({ id_proveedor, name, price_per_kg });
          }
        }
      }

      setCatalogData(parsedCatalog);
      showToast(`✅ Catálogo de proveedor cargado (${parsedCatalog.length} precios actualizados).`);
    }
  };

  // Modificar cantidad de un ítem en el borrador de Orden de Compra
  const handleUpdateDraftQty = (productId: string, newOrderQty: number) => {
    const cleanQty = Math.max(0, Number(newOrderQty.toFixed(2)));
    setEditableDraft((prev) => {
      if (cleanQty <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) => {
        if (item.productId !== productId) return item;
        const baseOz = item.isEssence
          ? essenceOrderUnit === 'OZ'
            ? cleanQty
            : Number((cleanQty * OZ_PER_KG).toFixed(1))
          : cleanQty;
        const totalCost = Number((cleanQty * item.unitOrderPrice).toFixed(2));
        const newStock = item.netInventoryPosition + baseOz;
        const projectedDos = item.adr > 0 ? Math.round(newStock / item.adr) : 180;
        const unitSellPrice =
          item.suggestedBaseOz > 0 ? item.expectedRevenue / item.suggestedBaseOz : item.unitCostBase * 2.2;
        const expectedRev = Number((baseOz * unitSellPrice).toFixed(2));
        return {
          ...item,
          suggestedKg: cleanQty,
          suggestedOrderQty: cleanQty,
          suggestedBaseOz: baseOz,
          totalCost,
          projectedDosAfterOrder: projectedDos,
          expectedRevenue: expectedRev,
          expectedGrossProfit: Number((expectedRev - totalCost).toFixed(2)),
        };
      });
    });
  };

  // Agregar manualmente cualquier SKU desde la Matriz Completa al borrador de Orden de Compra
  const handleAddFromMatrixToDraft = (item: AnalysisItem) => {
    const existing = editableDraft.find((d) => d.productId === item.id);
    const step = item.isEssence && essenceOrderUnit === 'HALF_KG' ? 0.5 : item.group === 'BOTES' ? 12 : 1;
    const defaultAddQty = item.neededOrderQty > 0 ? item.neededOrderQty : step;

    if (existing) {
      handleUpdateDraftQty(item.id, existing.suggestedOrderQty + step);
      showToast(`✅ Se incrementó +${step} ${item.orderUnitLabel} a ${item.name}.`);
      return;
    }

    const baseOz = item.isEssence
      ? essenceOrderUnit === 'OZ'
        ? defaultAddQty
        : Number((defaultAddQty * OZ_PER_KG).toFixed(1))
      : defaultAddQty;
    const totalCost = Number((defaultAddQty * item.unitOrderPrice).toFixed(2));
    const newStock = item.netInventoryPosition + baseOz;
    const projectedDos = item.adr > 0 ? Math.round(newStock / item.adr) : 180;
    const expectedRevenue = Number((baseOz * item.realizedAvgPrice).toFixed(2));

    const newDraftItem: DraftItem = {
      productId: item.id,
      sku: item.sku,
      productName: item.name,
      rawName: item.rawName,
      officialName: item.officialName,
      group: item.group,
      isEssence: item.isEssence,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      supplierCode: item.supplierCode,
      orderUnitLabel: item.orderUnitLabel,
      suggestedKg: defaultAddQty,
      suggestedOrderQty: defaultAddQty,
      suggestedBaseOz: baseOz,
      idealOrderQty: item.neededOrderQty,
      pricePerKg: item.unitOrderPrice,
      unitOrderPrice: item.unitOrderPrice,
      unitCostBase: item.unitCostBase,
      totalCost,
      currentStock: item.physicalStock,
      stockFull: item.stockFull,
      stockHalfUnits: item.stockHalfUnits,
      committedStock: item.committedStock,
      inTransitStock: item.inTransitStock,
      netInventoryPosition: item.netInventoryPosition,
      currentDos: Math.round(item.dos),
      projectedDosAfterOrder: projectedDos,
      adr: item.adr,
      safetyStock: item.safetyStock,
      reorderPoint: item.reorderPoint,
      targetLevelS: item.targetLevelS,
      abcXyz: item.abcXyz,
      stockStatus: item.stockStatus,
      trendType: item.trendType,
      grossMarginPct: item.grossMarginPct,
      expectedRevenue,
      expectedGrossProfit: Number((expectedRevenue - totalCost).toFixed(2)),
    };

    setEditableDraft((prev) => [newDraftItem, ...prev]);
    showToast(`✅ ${item.name} agregado a la Orden de Compra (${defaultAddQty} ${item.orderUnitLabel}).`);
  };

  // Totales dinámicos del borrador actual (responden en vivo a ediciones manuales)
  const draftTotals = useMemo(() => {
    const subtotalNeto = editableDraft.reduce((acc, it) => acc + it.totalCost, 0);
    const expectedRevenue = editableDraft.reduce((acc, it) => acc + it.expectedRevenue, 0);
    const expectedProfit = expectedRevenue - subtotalNeto;
    const totalKgEssences = editableDraft
      .filter((it) => it.isEssence)
      .reduce((acc, it) => acc + (essenceOrderUnit === 'OZ' ? it.suggestedOrderQty / OZ_PER_KG : it.suggestedOrderQty), 0);
    const totalUnitsOthers = editableDraft
      .filter((it) => !it.isEssence)
      .reduce((acc, it) => acc + it.suggestedOrderQty, 0);

    return {
      subtotalNeto: Number(subtotalNeto.toFixed(2)),
      iva: poTipoDte === 'CCF' ? Number((subtotalNeto * 0.13).toFixed(2)) : 0,
      totalConIva:
        poTipoDte === 'CCF' ? Number((subtotalNeto * 1.13).toFixed(2)) : Number(subtotalNeto.toFixed(2)),
      expectedRevenue: Number(expectedRevenue.toFixed(2)),
      expectedProfit: Number(expectedProfit.toFixed(2)),
      roiPct: subtotalNeto > 0 ? Number(((expectedProfit / subtotalNeto) * 100).toFixed(1)) : 0,
      totalKgEssences: Number(totalKgEssences.toFixed(2)),
      totalUnitsOthers,
    };
  }, [editableDraft, poTipoDte, essenceOrderUnit]);

  // Descargar archivo CSV profesional compatible con Excel Latinoamérica (; y UTF-8 BOM)
  const handleDownloadCsv = () => {
    if (editableDraft.length === 0) return;

    const sep = ';';
    let csv = '\uFEFF';
    csv += `Código Proveedor${sep}SKU Interno${sep}Producto / Fragancia${sep}Categoría${sep}Clase ABC-XYZ${sep}Estado Stock${sep}Stock Actual (Base)${sep}Consumo Real (ADR/día)${sep}Punto Reorden (ROP)${sep}Días Stock Actual${sep}Días Proyectados Post-Compra${sep}Cantidad a Pedir${sep}Unidad Compra${sep}Equivalente (Oz/Unid)${sep}Costo Unitario ($)${sep}Subtotal Neto ($)\n`;

    for (const item of editableDraft) {
      csv += `"${item.supplierCode}"${sep}"${item.sku}"${sep}"${item.productName}"${sep}"${item.group}"${sep}"${item.abcXyz}"${sep}"${item.stockStatus}"${sep}${item.netInventoryPosition}${sep}${item.adr}${sep}${item.reorderPoint}${sep}${item.currentDos}${sep}${item.projectedDosAfterOrder}${sep}${item.suggestedOrderQty}${sep}"${item.orderUnitLabel}"${sep}${item.suggestedBaseOz}${sep}${item.unitOrderPrice.toFixed(2)}${sep}${item.totalCost.toFixed(2)}\n`;
    }

    csv += `${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}SUBTOTAL NETO:${sep}${draftTotals.subtotalNeto.toFixed(2)}\n`;
    if (poTipoDte === 'CCF') {
      csv += `${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}IVA (13%):${sep}${draftTotals.iva.toFixed(2)}\n`;
      csv += `${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}${sep}TOTAL ORDEN:${sep}${draftTotals.totalConIva.toFixed(2)}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `Orden_Compra_Predictiva_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generar Orden(es) de Compra Oficial(es) en el sistema (/api/purchases) agrupadas por proveedor
  const handleCreateOfficialPurchaseOrders = async () => {
    if (editableDraft.length === 0) return;

    const confirmMsg = `¿Generar Orden de Compra Oficial en el sistema por $${draftTotals.subtotalNeto.toFixed(2)} neto ($${draftTotals.totalConIva.toFixed(2)} con IVA)?\n\nSe registrará como PENDIENTE de recepción en Bodega y se sumará al Stock en Tránsito para control de inventario.`;
    if (!window.confirm(confirmMsg)) return;

    setIsCreatingPo(true);
    setCreatedPoBanner(null);

    try {
      const token = await getStaffToken();
      // Agrupar ítems por supplierId para generar una orden limpia por cada proveedor involucrado
      const bySupplier = new Map<string, { supplierId: string; supplierName: string; items: DraftItem[] }>();

      for (const item of editableDraft) {
        const key = item.supplierId || 'prov-1';
        if (!bySupplier.has(key)) {
          bySupplier.set(key, {
            supplierId: key,
            supplierName: item.supplierName || 'APAESA GUATEMALA',
            items: [],
          });
        }
        bySupplier.get(key)!.items.push(item);
      }

      const createdNumbers: string[] = [];

      for (const [, groupData] of bySupplier.entries()) {
        const subNeto = Number(
          groupData.items.reduce((acc, it) => acc + it.totalCost, 0).toFixed(2)
        );
        const ivaVal = poTipoDte === 'CCF' ? Number((subNeto * 0.13).toFixed(2)) : 0;
        const totalVal = Number((subNeto + ivaVal).toFixed(2));
        const supInfo = suppliersList.find((s) => s.id === groupData.supplierId);
        const creditDays = poCondicion === 'CREDITO' ? supInfo?.creditDays || 30 : 0;
        const now = new Date();
        const dueDate =
          creditDays > 0
            ? new Date(now.getTime() + creditDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null;
        const poNumber = `OC-${now.toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

        // Importante: Para que cuando Bodega reciba la orden se sumen las Onzas exactas al stock del producto,
        // registramos la cantidad en Onzas equivalentes (suggestedBaseOz) para esencias y el costo por Onza (unitCostBase),
        // dejando en notas y SKU el detalle en Kg del proveedor.
        const purchaseItemsPayload = groupData.items.map((it) => {
          const baseQuantity = Math.max(1, Math.round(it.suggestedBaseOz));
          const costPerBaseUnit = Number((it.totalCost / baseQuantity).toFixed(4));
          return {
            productId: it.productId,
            productName: it.isEssence
              ? `${it.productName} [${it.suggestedOrderQty} ${it.orderUnitLabel} • ${it.supplierCode}]`
              : it.productName,
            productSku: it.supplierCode || it.sku,
            unit: it.isEssence ? 'Onza' : it.orderUnitLabel,
            quantity: baseQuantity,
            costPrice: costPerBaseUnit,
            subtotal: Number(it.totalCost.toFixed(2)),
          };
        });

        const res = await fetch('/api/purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'x-staff-token': token } : {}),
          },
          body: JSON.stringify({
            purchaseNumber: poNumber,
            tipoDte: poTipoDte,
            supplierId: groupData.supplierId,
            supplierName: groupData.supplierName,
            purchaseDate: now.toISOString().split('T')[0],
            dueDate,
            creditDays,
            docNumber: poNumber,
            condicion: poCondicion,
            paymentMethod: 'TRANSFERENCIA',
            paymentStatus: poCondicion === 'CREDITO' ? 'PENDIENTE' : 'PAGADO',
            subtotalNeto: subNeto,
            iva: ivaVal,
            total: totalVal,
            saldoPendiente: poCondicion === 'CREDITO' ? totalVal : 0,
            notes: `Generada automáticamente por el Motor Predictivo de Reabastecimiento (Cobertura objetivo: ${targetDos} días, Lead Time: ${leadTime} días, Nivel de servicio: ${serviceLevelPct}%).`,
            receptionStatus: 'PENDIENTE',
            items: purchaseItemsPayload,
          }),
        });

        const data = await res.json();
        if (data.success && data.purchase) {
          createdNumbers.push(data.purchase.purchaseNumber);
        } else {
          throw new Error(data.error || 'No se pudo registrar la orden de compra');
        }
      }

      const joined = createdNumbers.join(', ');
      setCreatedPoBanner(
        `✅ Orden(es) de Compra generada(s) exitosamente: ${joined}. Ya están disponibles en el módulo de Compras y en Recepción de Bodega (Stock en Tránsito actualizado).`
      );
      showToast(`✅ Orden de Compra ${joined} registrada en el sistema.`);
      // Recalcular motor para reflejar inmediatamente el nuevo Stock en Tránsito
      await runPredictor();
    } catch (err: any) {
      console.error('Error creando Orden de Compra:', err);
      showToast('❌ Error al crear Orden de Compra: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsCreatingPo(false);
    }
  };

  // Filtrado de la Matriz Completa de Stock
  const filteredAnalysis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return fullAnalysis.filter((item) => {
      if (statusFilter !== 'ALL' && item.stockStatus !== statusFilter) return false;
      if (abcFilter !== 'ALL' && item.abcClass !== abcFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.supplierCode.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q)
      );
    });
  }, [fullAnalysis, searchQuery, statusFilter, abcFilter]);

  const renderStatusBadge = (status: AnalysisItem['stockStatus']) => {
    switch (status) {
      case 'AGOTADO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-600 text-white animate-pulse">
            🚨 Agotado (0 Stock)
          </span>
        );
      case 'CRITICO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
            🔥 Crítico (&lt; Lead Time)
          </span>
        );
      case 'REORDEN':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
            ⚠️ Punto Reorden (≤ ROP)
          </span>
        );
      case 'PREVENTIVO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200">
            📈 Preventivo (&lt; {targetDos}d)
          </span>
        );
      case 'SOBRESTOCK':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-50 text-purple-800 border border-purple-200">
            📦 Sobrestock
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            ✅ Óptimo
          </span>
        );
    }
  };

  const renderAbcBadge = (abcXyz: string) => {
    const abc = abcXyz.charAt(0);
    const color =
      abc === 'A'
        ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
        : abc === 'B'
        ? 'bg-sky-100 text-sky-900 border-sky-300'
        : 'bg-slate-100 text-slate-700 border-slate-300';
    return (
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border ${color}`}
        title="Clasificación Pareto ABC (Ingresos/Margen) + Estabilidad de Demanda XYZ (Coeficiente de Variación)"
      >
        {abcXyz}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================= ENCABEZADO EJECUTIVO ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
              Estándar APICS / CPIM • EWMA + Punto de Reorden (ROP) + ABC-XYZ
            </span>
            {summary && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {summary.totalValidTransactions} ventas reales analizadas ({summary.effectiveDays}{' '}
                {summary.effectiveDays === 1 ? 'día activo' : 'días activos'})
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-600 shrink-0" />
            <span>Motor Predictivo de Reabastecimiento y Órdenes de Compra</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-3xl mt-1">
            Calcula la velocidad real de venta (1 Oz, ½ Oz, Botes e Insumos), el Stock de Seguridad estadístico
            (<span className="font-mono">SS = Z·σ·√LT</span>), el Punto de Reorden (<span className="font-mono">ROP</span>),
            la Posición Neta de Inventario y genera la Orden de Compra óptima por prioridad marginal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => runPredictor()}
            disabled={isProcessing}
            className="clay-btn clay-btn-light px-3.5 py-2 text-xs font-bold flex items-center gap-2 text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Recalcular Motor</span>
          </button>
          {summary && summary.totalUnconstrainedCost > 0 && (
            <button
              type="button"
              onClick={() => {
                const fullCost = Math.ceil(summary.totalUnconstrainedCost);
                setBudget(String(fullCost));
                runPredictor(fullCost);
              }}
              className="clay-btn clay-btn-light px-3.5 py-2 text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 flex items-center gap-1.5"
              title="Ajusta el presupuesto automáticamente para cubrir el 100% de la necesidad ideal proyectada"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cubrir 100% Ideal (${summary.totalUnconstrainedCost.toLocaleString()})</span>
            </button>
          )}
        </div>
      </div>

      {createdPoBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{createdPoBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setCreatedPoBanner(null)}
            className="text-xs font-black text-emerald-700 hover:underline shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ================= KPI SEMÁFORO DE SALUD DE INVENTARIO ================= */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'AGOTADO' ? 'ALL' : 'AGOTADO');
              setActiveSubView('matriz_stock');
            }}
            className={`clay-card p-3.5 text-left transition-all border-l-4 border-rose-600 ${
              statusFilter === 'AGOTADO' ? 'ring-2 ring-rose-500 bg-rose-50/50' : ''
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase text-rose-700 block">1. Ruptura (Stock 0)</span>
            <span className="text-2xl font-black font-mono text-rose-700 mt-0.5 block">
              {summary.agotadosCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Ventas perdidas hoy</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'CRITICO' ? 'ALL' : 'CRITICO');
              setActiveSubView('matriz_stock');
            }}
            className={`clay-card p-3.5 text-left transition-all border-l-4 border-orange-500 ${
              statusFilter === 'CRITICO' ? 'ring-2 ring-orange-500 bg-orange-50/50' : ''
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase text-orange-700 block">
              2. Críticos (≤ {leadTime}d)
            </span>
            <span className="text-2xl font-black font-mono text-orange-600 mt-0.5 block">
              {summary.criticosCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Riesgo en Lead Time</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'REORDEN' ? 'ALL' : 'REORDEN');
              setActiveSubView('matriz_stock');
            }}
            className={`clay-card p-3.5 text-left transition-all border-l-4 border-amber-500 ${
              statusFilter === 'REORDEN' ? 'ring-2 ring-amber-500 bg-amber-50/50' : ''
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
              3. Punto Reorden (≤ ROP)
            </span>
            <span className="text-2xl font-black font-mono text-amber-700 mt-0.5 block">
              {summary.reordenCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Momento exacto de pedir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'PREVENTIVO' ? 'ALL' : 'PREVENTIVO');
              setActiveSubView('matriz_stock');
            }}
            className={`clay-card p-3.5 text-left transition-all border-l-4 border-blue-500 ${
              statusFilter === 'PREVENTIVO' ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase text-blue-700 block">
              4. Preventivos (&lt; {targetDos}d)
            </span>
            <span className="text-2xl font-black font-mono text-blue-700 mt-0.5 block">
              {summary.preventivosCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Bajo cobertura meta</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'OPTIMO' ? 'ALL' : 'OPTIMO');
              setActiveSubView('matriz_stock');
            }}
            className={`clay-card p-3.5 text-left transition-all border-l-4 border-emerald-500 ${
              statusFilter === 'OPTIMO' ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">5. Stock Óptimo</span>
            <span className="text-2xl font-black font-mono text-emerald-700 mt-0.5 block">
              {summary.optimosCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Cobertura saludable</span>
          </button>

          <div className="clay-card p-3.5 border-l-4 border-indigo-600 bg-indigo-50/30">
            <span className="text-[10px] font-extrabold uppercase text-indigo-800 block">
              ROI Proyectado Orden
            </span>
            <span className="text-2xl font-black font-mono text-indigo-700 mt-0.5 block">
              +{draftTotals.roiPct}%
            </span>
            <span className="text-[10px] text-indigo-700 font-bold">
              Utilidad est.: ${draftTotals.expectedProfit.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* ================= PANEL DE PARÁMETROS DEL MOTOR PREDICTIVO ================= */}
      <div className="clay-card p-4 sm:p-6 space-y-4 border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <h2 className="font-black text-sm sm:text-base text-slate-800">
              Parámetros de Simulación y Reglas de Reabastecimiento
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
            <span>Fórmula de Punto de Reorden:</span>
            <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold">
              ROP = (ADR × LeadTime) + Z·σ·√LeadTime
            </code>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* 1. Presupuesto Disponible */}
          <div>
            <label className="text-[11px] font-black text-slate-600 block mb-1 uppercase">
              Presupuesto Máximo ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input
                type="number"
                min={0}
                step={50}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                onBlur={() => runPredictor()}
                onKeyDown={(e) => e.key === 'Enter' && runPredictor()}
                className="clay-input pl-8 w-full font-black text-sm text-emerald-800 bg-emerald-50/40"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Ideal sin tope: ${summary?.totalUnconstrainedCost.toLocaleString() || '0.00'}
            </span>
          </div>

          {/* 2. Rubro / Categoría */}
          <div>
            <label className="text-[11px] font-black text-slate-600 block mb-1 uppercase">
              Rubro a Abastecer
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="clay-input w-full text-xs font-bold text-slate-800"
            >
              <option value="ALL">Todos (Esencias + Botes + Insumos)</option>
              <option value="ESENCIAS">Solo Esencias (APAESA)</option>
              <option value="BOTES">Solo Botes y Envases</option>
              <option value="INSUMOS">Solo Insumos (Alcohol / Cajas)</option>
            </select>
            <span className="text-[10px] text-slate-400 block mt-0.5">Filtra la Orden de Compra</span>
          </div>

          {/* 3. Cobertura Meta (Target DOS) */}
          <div>
            <label className="text-[11px] font-black text-slate-600 block mb-1 uppercase">
              Cobertura Objetivo (Días)
            </label>
            <input
              type="number"
              min={7}
              max={180}
              value={targetDos}
              onChange={(e) => setTargetDos(e.target.value)}
              onBlur={() => runPredictor()}
              onKeyDown={(e) => e.key === 'Enter' && runPredictor()}
              className="clay-input w-full text-xs font-bold text-slate-800 font-mono"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">Días de stock deseados (S)</span>
          </div>

          {/* 4. Tiempo de Entrega del Proveedor (Lead Time) */}
          <div>
            <label className="text-[11px] font-black text-slate-600 block mb-1 uppercase">
              Lead Time Proveedor (Días)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              onBlur={() => runPredictor()}
              onKeyDown={(e) => e.key === 'Enter' && runPredictor()}
              className="clay-input w-full text-xs font-bold text-slate-800 font-mono"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">Tiempo en tránsito hasta bodega</span>
          </div>

          {/* 5. Nivel de Servicio (Factor Z) */}
          <div>
            <label className="text-[11px] font-black text-slate-600 block mb-1 uppercase">
              Nivel de Servicio (Stock Seg.)
            </label>
            <select
              value={serviceLevelPct}
              onChange={(e) => setServiceLevelPct(Number(e.target.value))}
              className="clay-input w-full text-xs font-bold text-slate-800"
            >
              <option value={90}>90% Conservador (Z = 1.28)</option>
              <option value={95}>95% Estándar Retail (Z = 1.65)</option>
              <option value={98}>98% Alta Disponibilidad (Z = 2.05)</option>
              <option value={99}>99% Cero Quiebres (Z = 2.33)</option>
            </select>
            <span className="text-[10px] text-slate-400 block mt-0.5">Protección ante picos de venta</span>
          </div>

          {/* 6. Unidad de Compra de Esencias */}
          <div>
            <label className="text-[11px] font-black text-slate-600 block mb-1 uppercase">
              Lote Mínimo Esencias
            </label>
            <select
              value={essenceOrderUnit}
              onChange={(e) => setEssenceOrderUnit(e.target.value as any)}
              className="clay-input w-full text-xs font-bold text-slate-800"
            >
              <option value="KG">Kilos Cerrados (1 Kg = 35.27 Oz)</option>
              <option value="HALF_KG">Medios Kilos (0.5 Kg = 17.64 Oz)</option>
              <option value="OZ">Onzas Exactas (1 Oz)</option>
            </select>
            <span className="text-[10px] text-slate-400 block mt-0.5">Empaque comercial APAESA</span>
          </div>
        </div>

        {/* Fila inferior de opciones adicionales y carga de CSV de proveedor */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={includeZeroSalesBelowMin}
                onChange={(e) => setIncludeZeroSalesBelowMin(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span>
                Incluir productos sin ventas recientes que estén debajo de su Stock Mínimo (ej. Botes nuevos en 0)
              </span>
            </label>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span>Ventana histórica:</span>
              {[7, 15, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setHistoryDays(d)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${
                    historyDays === d
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="supplier-csv-upload"
            />
            <label
              htmlFor="supplier-csv-upload"
              className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-700 border border-slate-200"
              title="Actualizar lista de precios por Kg desde archivo CSV de APAESA"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{file ? file.name : 'Actualizar Precios Proveedor (.csv)'}</span>
            </label>
            <button
              type="button"
              onClick={() => runPredictor()}
              className="clay-btn clay-btn-primary px-4 py-1.5 text-xs font-black flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Aplicar Parámetros</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= SELECTOR DE PESTAÑAS: ORDEN DE COMPRA VS MATRIZ COMPLETA ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-slate-200/80 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveSubView('orden_compra')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              activeSubView === 'orden_compra'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>1. Borrador de Orden de Compra ({editableDraft.length} ítems)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('matriz_stock')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
              activeSubView === 'matriz_stock'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Matriz Completa de Predicción ({fullAnalysis.length} SKUs)</span>
          </button>
        </div>

        {activeSubView === 'orden_compra' && editableDraft.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={poTipoDte}
              onChange={(e) => setPoTipoDte(e.target.value as 'CCF' | 'FC')}
              className="clay-input py-1.5 px-2.5 text-xs font-bold text-slate-700"
            >
              <option value="CCF">Crédito Fiscal (CCF +13% IVA)</option>
              <option value="FC">Factura / Internacional (Sin IVA local)</option>
            </select>
            <select
              value={poCondicion}
              onChange={(e) => setPoCondicion(e.target.value as 'CONTADO' | 'CREDITO')}
              className="clay-input py-1.5 px-2.5 text-xs font-bold text-slate-700"
            >
              <option value="CONTADO">Pago de Contado</option>
              <option value="CREDITO">Al Crédito (CxP)</option>
            </select>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="clay-btn clay-btn-light px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 text-slate-800 border border-slate-300"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exportar CSV Proveedor</span>
            </button>
            <button
              type="button"
              onClick={handleCreateOfficialPurchaseOrders}
              disabled={isCreatingPo}
              className="clay-btn clay-btn-success px-4 py-2 text-xs font-black flex items-center gap-1.5 shadow-md"
            >
              <Truck className="w-4 h-4" />
              <span>
                {isCreatingPo
                  ? 'Generando Orden...'
                  : `Generar Orden de Compra Oficial ($${draftTotals.totalConIva.toLocaleString()})`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ================= VISTA 1: BORRADOR INTERACTIVO DE ORDEN DE COMPRA ================= */}
      {activeSubView === 'orden_compra' && (
        <div className="space-y-4">
          {/* Resumen Financiero de la Orden */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className="clay-card p-4 bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-200">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">
                Inversión Neta de la Orden
              </span>
              <span className="text-2xl font-black font-mono text-emerald-700 mt-0.5 block">
                ${draftTotals.subtotalNeto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 mt-0.5 block">
                {poTipoDte === 'CCF'
                  ? `Con IVA (13%): $${draftTotals.totalConIva.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : 'Exento / Importación directa'}
              </span>
            </div>

            <div className="clay-card p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                Volumen Físico a Comprar
              </span>
              <span className="text-xl font-black font-mono text-slate-800 mt-0.5 block">
                {draftTotals.totalKgEssences} Kg Esencias
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                + {draftTotals.totalUnitsOthers} unid. de Botes / Insumos
              </span>
            </div>

            <div className="clay-card p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                Venta Proyectada del Lote
              </span>
              <span className="text-2xl font-black font-mono text-indigo-700 mt-0.5 block">
                ${draftTotals.expectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                Al vender las onzas/unidades sugeridas
              </span>
            </div>

            <div className="clay-card p-4 bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-200">
              <span className="text-[10px] font-black uppercase text-indigo-800 block">
                Utilidad Bruta Estimada
              </span>
              <span className="text-2xl font-black font-mono text-indigo-700 mt-0.5 block">
                +${draftTotals.expectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-bold text-indigo-800 mt-0.5 block">
                Retorno (GMROI): +{draftTotals.roiPct}% sobre costo
              </span>
            </div>
          </div>

          {/* Tabla Editable de la Orden de Compra */}
          <div className="clay-card overflow-hidden border border-slate-200/80">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
              <div>
                <h3 className="font-black text-sm text-slate-800">
                  Detalle de Productos a Ordenar (Priorizados por Urgencia Real y Margen)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Puedes ajustar las cantidades con los botones <strong>- / +</strong> antes de exportar el CSV o generar la Orden de Compra oficial en el sistema.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubView('matriz_stock')}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar otro producto desde la Matriz</span>
              </button>
            </div>

            {isProcessing ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  Analizando ventas reales, calculando volatilidad diaria (σ), Puntos de Reorden (ROP) y optimizando presupuesto...
                </p>
              </div>
            ) : editableDraft.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  No hay productos que requieran compra urgente con estos parámetros o el presupuesto es insuficiente.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Prueba incrementando el presupuesto, aumentando los Días de Cobertura Objetivo o activando la opción de incluir productos bajo Stock Mínimo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                      <th className="py-3 px-3">Código / SKU</th>
                      <th className="py-3 px-3">Producto / Proveedor</th>
                      <th className="py-3 px-2 text-center">ABC-XYZ</th>
                      <th className="py-3 px-2 text-center">Estado Riesgo</th>
                      <th className="py-3 px-2 text-right">Stock Neto</th>
                      <th className="py-3 px-2 text-right">Ventas / Día (ADR)</th>
                      <th className="py-3 px-2 text-right">Punto Reorden (ROP)</th>
                      <th className="py-3 px-2 text-center">Cobertura (Días)</th>
                      <th className="py-3 px-3 text-center">Cantidad a Pedir</th>
                      <th className="py-3 px-2 text-right">Costo Unit.</th>
                      <th className="py-3 px-3 text-right">Subtotal</th>
                      <th className="py-3 px-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {editableDraft.map((item) => {
                      const step =
                        item.isEssence && essenceOrderUnit === 'HALF_KG'
                          ? 0.5
                          : item.group === 'BOTES'
                          ? 6
                          : 1;
                      return (
                        <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-black text-indigo-700 whitespace-nowrap">
                            {item.supplierCode}
                            {item.sku && item.sku !== item.supplierCode && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                SKU #{item.sku}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-black text-slate-800 block">{item.productName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {item.supplierName} • Margen: {item.grossMarginPct}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">{renderAbcBadge(item.abcXyz)}</td>
                          <td className="py-3 px-2 text-center">{renderStatusBadge(item.stockStatus)}</td>
                          <td className="py-3 px-2 text-right font-mono">
                            <span className="font-black text-slate-800">
                              {item.netInventoryPosition} {item.isEssence ? 'Oz' : 'u'}
                            </span>
                            {item.isEssence && item.stockHalfUnits > 0 && (
                              <span className="block text-[9.5px] text-slate-400">
                                ({item.stockFull}×1Oz + {item.stockHalfUnits}×½Oz)
                              </span>
                            )}
                            {item.inTransitStock > 0 && (
                              <span className="block text-[9.5px] text-emerald-600 font-bold">
                                +{item.inTransitStock} en tránsito
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right font-mono">
                            <span className="font-bold text-slate-800">
                              {item.adr} {item.isEssence ? 'Oz/d' : 'u/d'}
                            </span>
                            <span className="block text-[9.5px] text-slate-400">
                              SS: {item.safetyStock}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-amber-800">
                            {item.reorderPoint} {item.isEssence ? 'Oz' : 'u'}
                          </td>
                          <td className="py-3 px-2 text-center font-mono">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                              <span className={item.currentDos <= Number(leadTime) ? 'text-rose-600 font-black' : ''}>
                                {item.currentDos > 365 ? '>365' : item.currentDos}d
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="text-emerald-700 font-black">
                                {item.projectedDosAfterOrder > 365 ? '>365' : item.projectedDosAfterOrder}d
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateDraftQty(item.productId, item.suggestedOrderQty - step)
                                }
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                step={step}
                                value={item.suggestedOrderQty}
                                onChange={(e) =>
                                  handleUpdateDraftQty(item.productId, Number(e.target.value || 0))
                                }
                                className="w-16 text-center font-mono font-black text-xs border border-indigo-200 rounded-lg py-1 bg-indigo-50/40 text-indigo-900"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateDraftQty(item.productId, item.suggestedOrderQty + step)
                                }
                                className="w-6 h-6 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 flex items-center justify-center font-black"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <span className="text-[11px] font-bold text-slate-600 ml-1">
                                {item.orderUnitLabel}
                              </span>
                            </div>
                            {item.isEssence && item.orderUnitLabel === 'Kg' && (
                              <span className="block text-center text-[9.5px] text-slate-400 font-mono mt-0.5">
                                ≈ {item.suggestedBaseOz} Oz (Ideal: {item.idealOrderQty} Kg)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-600">
                            ${item.unitOrderPrice.toFixed(2)}
                            <span className="block text-[9.5px] text-slate-400">
                              /{item.orderUnitLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                            ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateDraftQty(item.productId, 0)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Quitar de la Orden de Compra"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VISTA 2: MATRIZ COMPLETA DE PREDICCIÓN DE STOCK ================= */}
      {activeSubView === 'matriz_stock' && (
        <div className="clay-card overflow-hidden border border-slate-200/80 space-y-4 p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, contratipo, código APAESA o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-input pl-9 w-full text-xs font-semibold"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="clay-input py-1.5 px-2.5 text-xs font-bold text-slate-700"
              >
                <option value="ALL">Todos los Estados ({fullAnalysis.length})</option>
                <option value="AGOTADO">🚨 Agotados (Stock 0)</option>
                <option value="CRITICO">🔥 Críticos (≤ Lead Time)</option>
                <option value="REORDEN">⚠️ En Punto de Reorden (≤ ROP)</option>
                <option value="PREVENTIVO">📈 Preventivos (&lt; Cobertura Meta)</option>
                <option value="OPTIMO">✅ Óptimos</option>
                <option value="SOBRESTOCK">📦 Sobrestock</option>
              </select>

              <select
                value={abcFilter}
                onChange={(e) => setAbcFilter(e.target.value)}
                className="clay-input py-1.5 px-2.5 text-xs font-bold text-slate-700"
              >
                <option value="ALL">Todas las Clases ABC</option>
                <option value="A">Clase A (80% Ingresos/Margen)</option>
                <option value="B">Clase B (15% Ingresos/Margen)</option>
                <option value="C">Clase C (5% / Baja Rotación)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-2.5">Código</th>
                  <th className="py-3 px-2.5">Producto</th>
                  <th className="py-3 px-2 text-center">ABC-XYZ</th>
                  <th className="py-3 px-2 text-right">Stock Físico</th>
                  <th className="py-3 px-2 text-right">Posición Neta</th>
                  <th className="py-3 px-2 text-right">Vendido Ventana</th>
                  <th className="py-3 px-2 text-right">Velocidad (ADR)</th>
                  <th className="py-3 px-2 text-right">Stock Seg. (SS)</th>
                  <th className="py-3 px-2 text-right">Punto Reorden (ROP)</th>
                  <th className="py-3 px-2 text-right">Nivel Meta (S)</th>
                  <th className="py-3 px-2 text-center">Días Stock (DOS)</th>
                  <th className="py-3 px-2 text-center">Estado</th>
                  <th className="py-3 px-2 text-right">Pedido Ideal</th>
                  <th className="py-3 px-2.5 text-center">Orden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAnalysis.map((item) => {
                  const inDraft = editableDraft.some((d) => d.productId === item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {item.supplierCode}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.categoryName} • Costo: ${item.unitCostBase.toFixed(2)}/{item.isEssence ? 'Oz' : 'u'} • Margen: {item.grossMarginPct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">{renderAbcBadge(item.abcXyz)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        <span className="font-bold text-slate-800">
                          {item.physicalStock} {item.isEssence ? 'Oz' : 'u'}
                        </span>
                        {item.isEssence && (
                          <span className="block text-[9.5px] text-slate-400">
                            {item.stockFull}×1Oz | {item.stockHalfUnits}×½Oz
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-slate-900">
                        {item.netInventoryPosition} {item.isEssence ? 'Oz' : 'u'}
                        {(item.committedStock > 0 || item.inTransitStock > 0) && (
                          <span className="block text-[9.5px] font-normal text-slate-500">
                            {item.committedStock > 0 ? `-${item.committedStock} comp.` : ''}{' '}
                            {item.inTransitStock > 0 ? `+${item.inTransitStock} tráns.` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        <span className="font-bold text-slate-800">
                          {item.totalSoldWindow} {item.isEssence ? 'Oz' : 'u'}
                        </span>
                        {item.isEssence && item.totalSoldWindow > 0 && (
                          <span className="block text-[9.5px] text-slate-400">
                            {item.fullOzSold}×1Oz | {item.halfOzSold}×½Oz
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        <span className="font-black text-indigo-700">
                          {item.adr} {item.isEssence ? 'Oz/d' : 'u/d'}
                        </span>
                        <span className="block text-[9.5px] text-slate-400">
                          σ={item.sigmaDaily} (CV={item.cv})
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                        {item.safetyStock}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-800">
                        {item.reorderPoint}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                        {item.targetLevelS}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black">
                        <span
                          className={
                            item.dos <= Number(leadTime)
                              ? 'text-rose-600'
                              : item.dos <= Number(targetDos)
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }
                        >
                          {item.dos >= 999 ? '∞' : `${item.dos}d`}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">{renderStatusBadge(item.stockStatus)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        {item.neededOrderQty > 0 ? (
                          <>
                            <span className="font-black text-indigo-700">
                              +{item.neededOrderQty} {item.orderUnitLabel}
                            </span>
                            <span className="block text-[9.5px] text-slate-400">
                              ${item.unconstrainedCost.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleAddFromMatrixToDraft(item)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 mx-auto ${
                            inDraft
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                        >
                          {inDraft ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{inDraft ? 'En Orden (+)' : 'Agregar'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
