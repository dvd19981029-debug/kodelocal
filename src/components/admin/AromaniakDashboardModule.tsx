'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Eye,
  Droplets,
  Package,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Plus,
  History,
  AlertTriangle,
  Globe,
  Store,
  CreditCard,
  Building2,
  DollarSign,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Flame,
  Sparkles,
  Users,
  Smartphone,
  Laptop,
  Tablet,
  MapPin,
  ExternalLink,
  MessageCircle,
  Hourglass,
  Calendar,
  Download,
  Percent,
  Check,
  ShoppingBag,
  BookOpen,
  FileText,
} from 'lucide-react';

export type DashboardPeriod = 'hoy' | '7d' | 'mes' | 'anio' | 'todo';

export interface StockExhaustionItem {
  id: string;
  name: string;
  rawName: string;
  stock: number;
  minStock: number;
  unit: string;
  dailyRate: number;
  totalSold: number;
  daysLeft: number;
  urgency: 'CRITICO' | 'ALERTA' | 'OPTIMO';
  supplier: string;
  reorderSuggestion: number;
}

export interface AbandonedCartItem {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  itemsSummary: string;
  date: string;
}

export interface AromaniakDashboardData {
  period: DashboardPeriod;
  summary: {
    totalVentas: number;
    totalGastosCompras: number;
    margenOperativoBruto: number;
    margenPorcentual: number;
    totalPedidos: number;
    ticketPromedio: number;
    onzasVendidas: number;
    dteTransmitidos: number;
  };
  visitas: {
    totalVisitas: number;
    totalVistasPagina: number;
    tasaConversion: number;
    graficaVisitas?: Array<{
      label: string;
      dateKey?: string;
      visits: number;
      pageViews: number;
    }>;
  };
  traficoDetalle?: {
    fuentes: Array<{ name: string; visits: number; percentage: number }>;
    dispositivos: Array<{ device: string; percentage: number }>;
    zonasPrincipales: Array<{ zone: string; share: number }>;
  };
  armaTuPropioPerfume?: {
    totalArmados: number;
    totalFacturado: number;
    formulaPlusCount: number;
    formulaStandardCount: number;
    porcentajeVentas: number;
    topFraganciasArmadas: Array<{ name: string; count: number }>;
    compradores: Array<{
      orderNumber?: string;
      customerName: string;
      customerPhone: string;
      customerEmail?: string | null;
      fragrance: string;
      formula: string;
      unitPrice: number;
      quantity: number;
      total: number;
      date: string;
    }>;
  };
  clientesTop?: Array<{
    name: string;
    phone: string;
    email: string | null;
    department: string;
    ordersCount: number;
    totalSpent: number;
    lastOrderDate: string;
  }>;
  proyeccionAgotamiento?: StockExhaustionItem[];
  embudoCarritos?: {
    visitas: number;
    checkoutsIniciados: number;
    pedidosPagados: number;
    carritosAbandonados: number;
    tasaAbandono: number;
    listaAbandonados: AbandonedCartItem[];
  };
  retencionLtv?: {
    clientesUnicos: number;
    clientesRecurrentes: number;
    tasaRecompra: number;
    ltvPromedio: number;
  };
  distribucionGenero?: {
    caballero: { total: number; percentage: number };
    dama: { total: number; percentage: number };
    unisex: { total: number; percentage: number };
    familiasOlfativas: Array<{ name: string; percentage: number }>;
  };
  tiemposLogistica?: {
    tiempoPromedioHoras: number;
    tasaEfectividad: number;
    pedidosEnRuta: number;
    courierPrincipal: string;
  };
  postsSeo?: {
    totalPosts: number;
    totalVistas: number;
    promedioTiempoLecturaMin: number;
    posts: Array<{
      id: string;
      title: string;
      slug: string;
      category: string;
      views: number;
      readingTimeMin: number;
      publishedAt: string;
      url: string;
    }>;
  };
  pedidosEstado: {
    nuevos: { count: number; total: number };
    enPreparacion: { count: number; total: number };
    enRuta: { count: number; total: number };
    entregados: { count: number; total: number };
    cancelados: { count: number; total: number };
  };
  canales: {
    ecommerce: { count: number; total: number; percentage: number };
    pos: { count: number; total: number; percentage: number };
  };
  metodosPago: {
    wompiTarjeta: { count: number; total: number; percentage: number };
    transferencia: { count: number; total: number; percentage: number };
    efectivo: { count: number; total: number; percentage: number };
  };
  topFragancias: Array<{
    name: string;
    quantity: number;
    revenue: number;
    ounces: number;
  }>;
  topDepartamentos: Array<{
    department: string;
    count: number;
    total: number;
  }>;
  inventario: {
    totalProductos: number;
    totalStockOnzas: number;
    valorInventarioPvp: number;
    valorInventarioCosto: number;
    gananciaPotencial: number;
    stockCritico: Array<{
      id: string;
      name: string;
      stock: number;
      minStock: number;
      price: number;
      cost: number;
    }>;
  };
  recientes: Array<{
    id: string;
    number: string;
    customer: string;
    type: 'ECOMMERCE' | 'POS';
    status: string;
    total: number;
    paymentMethod: string;
    date: string;
  }>;
}

interface AromaniakDashboardModuleProps {
  onOpenBulkPriceModal?: () => void;
  onOpenNewProductModal?: () => void;
  onNavigateTab?: (tab: string) => void;
  activeEssencePrice?: number;
  activeEssenceCost?: number;
}

export default function AromaniakDashboardModule({
  onOpenBulkPriceModal,
  onOpenNewProductModal,
  onNavigateTab,
  activeEssencePrice = 3.25,
  activeEssenceCost = 1.95,
}: AromaniakDashboardModuleProps) {
  const [period, setPeriod] = useState<DashboardPeriod>('mes');
  const [data, setData] = useState<AromaniakDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchDashboardData = useCallback(async (selectedPeriod: DashboardPeriod) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?period=${selectedPeriod}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Error fetching Aromaniak dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(period);
  }, [period, fetchDashboardData]);

  // Exportar reporte contable a CSV
  const handleExportCsv = () => {
    if (!data) return;
    const s = data.summary;
    const rows = [
      ['REPORTE EJECUTIVO Y CONTABLE - AROMANIAK PERFUMERIA'],
      ['Periodo', period.toUpperCase()],
      ['Fecha de Emision', new Date().toLocaleString('es-SV')],
      [''],
      ['METRICA', 'VALOR'],
      ['Ventas Totales ($)', s.totalVentas.toFixed(2)],
      ['Gastos en Insumos / Compras ($)', s.totalGastosCompras.toFixed(2)],
      ['Margen Operativo Bruto ($)', s.margenOperativoBruto.toFixed(2)],
      ['Margen Porcentual (%)', `${s.margenPorcentual.toFixed(1)}%`],
      ['Total de Pedidos / Transacciones', s.totalPedidos.toString()],
      ['Ticket Promedio ($)', s.ticketPromedio.toFixed(2)],
      ['Onzas Despachadas', s.onzasVendidas.toString()],
      ['DTEs Transmitidos a Hacienda', s.dteTransmitidos.toString()],
      ['Visitas a la Tienda Web', data.visitas.totalVisitas.toString()],
      ['Tasa de Conversion (%)', `${data.visitas.tasaConversion.toFixed(2)}%`],
      [''],
      ['CANAL', 'PEDIDOS', 'TOTAL ($)', 'PORCENTAJE (%)'],
      ['Ecommerce Online', data.canales.ecommerce.count, data.canales.ecommerce.total.toFixed(2), `${data.canales.ecommerce.percentage}%`],
      ['Mostrador POS', data.canales.pos.count, data.canales.pos.total.toFixed(2), `${data.canales.pos.percentage}%`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Aromaniak_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary || {
    totalVentas: 0,
    totalGastosCompras: 0,
    margenOperativoBruto: 0,
    margenPorcentual: 0,
    totalPedidos: 0,
    ticketPromedio: 0,
    onzasVendidas: 0,
    dteTransmitidos: 0,
  };

  const visitas = data?.visitas || {
    totalVisitas: 0,
    totalVistasPagina: 0,
    tasaConversion: 0,
    graficaVisitas: [],
  };
  const graficaVisitas = visitas.graficaVisitas || [];

  const traficoDetalle = data?.traficoDetalle || {
    fuentes: [{ name: 'Tráfico Directo', visits: 0, percentage: 100 }],
    dispositivos: [
      { device: 'Móviles (iOS & Android)', percentage: 0 },
      { device: 'Computadoras (Desktop)', percentage: 0 },
      { device: 'Tablets', percentage: 0 },
    ],
    zonasPrincipales: [],
  };

  const armaTuPropioPerfume = data?.armaTuPropioPerfume || {
    totalArmados: 0,
    totalFacturado: 0,
    formulaPlusCount: 0,
    formulaStandardCount: 0,
    porcentajeVentas: 0,
    topFraganciasArmadas: [],
    compradores: [],
  };

  const proyeccionAgotamiento = data?.proyeccionAgotamiento || [];
  const embudoCarritos = data?.embudoCarritos || {
    visitas: 0,
    checkoutsIniciados: 0,
    pedidosPagados: 0,
    carritosAbandonados: 0,
    tasaAbandono: 0,
    listaAbandonados: [],
  };
  const retencionLtv = data?.retencionLtv || {
    clientesUnicos: 0,
    clientesRecurrentes: 0,
    tasaRecompra: 0,
    ltvPromedio: 0,
  };
  const distribucionGenero = data?.distribucionGenero || {
    caballero: { total: 0, percentage: 0 },
    dama: { total: 0, percentage: 0 },
    unisex: { total: 0, percentage: 0 },
    familiasOlfativas: [],
  };
  const tiemposLogistica = data?.tiemposLogistica || {
    tiempoPromedioHoras: 28,
    tasaEfectividad: 96.8,
    pedidosEnRuta: 0,
    courierPrincipal: 'C807 Express El Salvador',
  };

  const postsSeo = data?.postsSeo || {
    totalPosts: 0,
    totalVistas: 0,
    promedioTiempoLecturaMin: 3,
    posts: [],
  };

  const clientesTop = data?.clientesTop || [];

  const pedidosEstado = data?.pedidosEstado || {
    nuevos: { count: 0, total: 0 },
    enPreparacion: { count: 0, total: 0 },
    enRuta: { count: 0, total: 0 },
    entregados: { count: 0, total: 0 },
    cancelados: { count: 0, total: 0 },
  };

  const canales = data?.canales || {
    ecommerce: { count: 0, total: 0, percentage: 0 },
    pos: { count: 0, total: 0, percentage: 0 },
  };

  const metodosPago = data?.metodosPago || {
    wompiTarjeta: { count: 0, total: 0, percentage: 0 },
    transferencia: { count: 0, total: 0, percentage: 0 },
    efectivo: { count: 0, total: 0, percentage: 0 },
  };

  const topFragancias = data?.topFragancias || [];
  const topDepartamentos = data?.topDepartamentos || [];
  const inventario = data?.inventario || {
    totalProductos: 0,
    totalStockOnzas: 0,
    valorInventarioPvp: 0,
    valorInventarioCosto: 0,
    gananciaPotencial: 0,
    stockCritico: [],
  };
  const recientes = data?.recientes || [];

  const maxFragranceRevenue = topFragancias.length > 0 ? Math.max(...topFragancias.map((f) => f.revenue), 1) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ================= HEADER GERENCIAL & FILTROS ================= */}
      <div className="clay-card p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
              Dashboard de Inteligencia de Negocios
            </h2>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 shrink-0">
              Aromaniak Live
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Métricas ejecutivas de ventas, insumos, márgenes, visitas, clientes y proyección de stock
          </p>
        </div>

        {/* Controles de Período y Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Selector de Período */}
          <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs font-bold text-slate-600 scrollbar-none">
            <button
              onClick={() => setPeriod('hoy')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                period === 'hoy' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                period === '7d' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod('mes')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                period === 'mes' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setPeriod('anio')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                period === 'anio' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Año
            </button>
            <button
              onClick={() => setPeriod('todo')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                period === 'todo' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Todo
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Refrescar */}
            <button
              onClick={() => fetchDashboardData(period)}
              title="Refrescar métricas"
              disabled={isLoading}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Botón Exportar CSV Contable */}
            <button
              onClick={handleExportCsv}
              title="Descargar reporte contable en Excel/CSV"
              className="clay-btn clay-btn-light px-3 py-2 text-xs flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exportar CSV</span>
            </button>

            {/* Botón Ajustar Precios */}
            {onOpenBulkPriceModal && (
              <button
                onClick={onOpenBulkPriceModal}
                className="clay-btn clay-btn-light px-3 py-2 text-xs flex items-center gap-1.5 font-bold cursor-pointer shrink-0"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Precios (${activeEssencePrice.toFixed(2)})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
          <span>
            Mostrando datos correspondientes a:{' '}
            <strong className="text-slate-700 uppercase">
              {period === 'hoy'
                ? 'El Día de Hoy'
                : period === '7d'
                ? 'Últimos 7 Días'
                : period === 'mes'
                ? 'Este Mes en Curso'
                : period === 'anio'
                ? 'Año Fiscal 2026'
                : 'Histórico Completo'}
            </strong>
          </span>
          <span>Actualizado: {lastUpdated}</span>
        </div>
      )}

      {/* ================= BLOQUE 1: KPIs FINANCIEROS (ESTILO KODE BI) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Ventas Totales */}
        <div className="clay-card p-3.5 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Ventas Totales</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-emerald-600 font-mono mt-1 sm:mt-2">
            ${summary.totalVentas.toFixed(2)}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] gap-1">
            <span className="text-slate-500 font-medium truncate">{summary.totalPedidos} órdenes</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded truncate self-start sm:self-auto">
              ${summary.ticketPromedio.toFixed(2)} avg
            </span>
          </div>
        </div>

        {/* KPI 2: Gastos en Insumos */}
        <div className="clay-card p-3.5 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Gastos Insumos</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-rose-600 font-mono mt-1 sm:mt-2">
            ${summary.totalGastosCompras.toFixed(2)}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] gap-1">
            <span className="text-slate-500 font-medium truncate">Materia prima</span>
            <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded truncate self-start sm:self-auto">
              {summary.totalVentas > 0
                ? `${((summary.totalGastosCompras / summary.totalVentas) * 100).toFixed(0)}% ventas`
                : 'Costo base'}
            </span>
          </div>
        </div>

        {/* KPI 3: Margen Operativo Bruto */}
        <div className="clay-card p-3.5 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Margen Bruto</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-indigo-700 font-mono mt-1 sm:mt-2">
            ${summary.margenOperativoBruto.toFixed(2)}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] gap-1">
            <span className="text-slate-500 font-medium truncate">Ganancia libre</span>
            <span className="text-indigo-700 font-black bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate self-start sm:self-auto">
              +{summary.margenPorcentual.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 4: Total Pedidos & Operaciones */}
        <div className="clay-card p-3.5 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Total Pedidos</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-slate-900 font-mono mt-1 sm:mt-2">
            {summary.totalPedidos}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] gap-1">
            <span className="text-slate-500 font-medium truncate">{summary.onzasVendidas} Oz</span>
            <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded truncate self-start sm:self-auto">
              {summary.dteTransmitidos} DTEs
            </span>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 2: PROYECCIÓN DE AGOTAMIENTO DE STOCK (DÍAS DE INVENTARIO) ================= */}
      <div className="clay-card p-3.5 sm:p-6 space-y-3 sm:space-y-4 border-2 border-amber-200/70 bg-gradient-to-br from-white to-amber-50/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="font-extrabold text-xs sm:text-base text-slate-800 flex items-center gap-1.5 sm:gap-2">
                <Hourglass className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                <span>Proyección de Agotamiento de Stock (Días)</span>
              </h3>
              <span className="text-[9px] sm:text-[10px] font-black uppercase bg-rose-100 text-rose-800 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                Alerta APAESA
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Días de existencias para cada contratipo según el ritmo diario de ventas
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('compras')}
              className="clay-btn clay-btn-light px-2.5 sm:px-3 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Compras & Proveedores</span>
            </button>
          )}
        </div>

        {/* Tarjetas de Proyección de Días Restantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 pt-1">
          {proyeccionAgotamiento.slice(0, 6).map((item) => {
            const isCritical = item.urgency === 'CRITICO';
            const isWarning = item.urgency === 'ALERTA';
            return (
              <div
                key={item.id}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                  isCritical
                    ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                    : isWarning
                    ? 'bg-amber-50/80 border-amber-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-black text-slate-900 text-xs sm:text-sm block truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium truncate">
                      Proveedor: {item.supplier}
                    </span>
                  </div>
                  <span
                    className={`text-[9.5px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                      isCritical
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isCritical ? 'Reorden Urgente' : isWarning ? 'Atención' : 'Stock OK'}
                  </span>
                </div>

                {/* Contador Central de Días */}
                <div className="my-2 sm:my-3 flex items-baseline justify-between">
                  <div>
                    <span
                      className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                        isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {item.daysLeft > 180 ? '>180' : item.daysLeft}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 ml-1.5">
                      {item.daysLeft === 1 ? 'día restante' : 'días restantes'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-xs font-extrabold text-slate-800 block font-mono">
                      {item.stock} {item.unit}s
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">en bodega</span>
                  </div>
                </div>

                {/* Velocidad de Consumo y Sugerencia */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="text-slate-500 font-medium truncate pr-1">
                    Consumo: <strong className="text-slate-800 font-mono">{item.dailyRate} Oz/d</strong>
                  </span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                    Pedir: +{item.reorderSuggestion} Oz
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= BLOQUE 3: RETENCIÓN LTV & EMBUDO DE CARRITOS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Retención de Clientes & LTV */}
        <div className="clay-card p-3.5 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5 sm:gap-2">
              <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span>Retención de Clientes & LTV</span>
            </h3>
            <span className="text-[10.5px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Lealtad de Marca
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase block truncate">Clientes Únicos</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-0.5 block">
                {retencionLtv.clientesUnicos}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase block truncate">Recurrentes</span>
              <span className="text-lg sm:text-xl font-black text-indigo-700 font-mono mt-0.5 block">
                {retencionLtv.clientesRecurrentes}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 uppercase block truncate">Recompra</span>
              <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                {retencionLtv.tasaRecompra}%
              </span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-purple-700 uppercase block truncate">LTV Promedio</span>
              <span className="text-lg sm:text-xl font-black text-purple-700 font-mono mt-0.5 block">
                ${retencionLtv.ltvPromedio.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            💡 <strong>Análisis de Retención:</strong> Más del <strong>{retencionLtv.tasaRecompra}%</strong> de tus compradores vuelven a pedir, con un valor de vida promedio de <strong>${retencionLtv.ltvPromedio.toFixed(2)}</strong> por cliente.
          </div>
        </div>

        {/* Embudo de Carritos Abandonados */}
        <div className="clay-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-rose-600" />
              <span>Embudo de Conversión & Carritos Abandonados</span>
            </h3>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              {embudoCarritos.tasaAbandono}% Abandono
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Visitas</span>
              <span className="text-lg font-black text-slate-800 font-mono">{embudoCarritos.visitas}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-[10px] text-blue-600 font-bold uppercase block">Checkouts</span>
              <span className="text-lg font-black text-blue-700 font-mono">{embudoCarritos.checkoutsIniciados}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">Pagados</span>
              <span className="text-lg font-black text-emerald-700 font-mono">{embudoCarritos.pedidosPagados}</span>
            </div>
          </div>

          {/* Lista de Carritos Recuperables */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-black text-slate-500 uppercase block">
              Carritos Pendientes / No Completados:
            </span>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
              {embudoCarritos.listaAbandonados.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{item.customerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900">${item.total.toFixed(2)}</span>
                    {item.customerPhone && item.customerPhone !== 'N/A' && (
                      <a
                        href={`https://wa.me/503${item.customerPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                          item.customerName
                        )},%20vimos%20que%20dejaste%20tu%20pedido%20en%20Aromaniak.%20%C2%BFTe%20podemos%20ayudar%20a%20finalizarlo%3F`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        title="Contactar por WhatsApp para recuperar carrito"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 4: GÉNERO, FAMILIAS OLFATIVAS & TIEMPOS LOGÍSTICOS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Género & Familias */}
        <div className="clay-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-purple-600" />
              <span>Rendimiento por Género & Familia Olfativa</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">Preferencias</span>
          </div>

          {/* Barras de Género */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Caballero</span>
                <span className="font-mono text-indigo-700 font-black">
                  ${distribucionGenero.caballero.total.toFixed(2)} ({distribucionGenero.caballero.percentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${distribucionGenero.caballero.percentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Dama</span>
                <span className="font-mono text-rose-600 font-black">
                  ${distribucionGenero.dama.total.toFixed(2)} ({distribucionGenero.dama.percentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${distribucionGenero.dama.percentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Unisex</span>
                <span className="font-mono text-amber-600 font-black">
                  ${distribucionGenero.unisex.total.toFixed(2)} ({distribucionGenero.unisex.percentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${distribucionGenero.unisex.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Familias Olfativas */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-black text-slate-500 uppercase block">Familias Olfativas Líderes:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {distribucionGenero.familiasOlfativas.map((fam, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <span className="font-medium text-slate-700 truncate pr-1">{fam.name}</span>
                  <span className="font-black font-mono text-indigo-700">{fam.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tiempos de Entrega Logística */}
        <div className="clay-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Eficiencia & Tiempos Logísticos de Entrega</span>
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {tiemposLogistica.courierPrincipal}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Tiempo Promedio Entrega</span>
              <span className="text-3xl font-black text-blue-900 font-mono mt-1 block">
                {tiemposLogistica.tiempoPromedioHoras}h
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Taller ➔ Destino final</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Efectividad de Entrega</span>
              <span className="text-3xl font-black text-emerald-900 font-mono mt-1 block">
                {tiemposLogistica.tasaEfectividad}%
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Entregas exitosas sin fallos</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            🚚 <strong>Monitoreo de Envíos:</strong> Actualmente hay{' '}
            <strong className="text-slate-900">{tiemposLogistica.pedidosEnRuta} paquetes en ruta</strong> con C807 Express y mensajero propio con guía activa.
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 4.5: GRÁFICA DE VISITANTES (DÍA, SEMANA Y MES) ================= */}
      <div className="clay-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>
                  Gráfica de Visitantes (
                  {period === 'hoy'
                    ? 'Por Horas Hoy'
                    : period === '7d'
                    ? 'Últimos 7 Días'
                    : period === 'mes'
                    ? 'Día a Día del Mes'
                    : 'Mensual'}
                  )
                </span>
              </h3>
              <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                Tiempo Real
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Flujo de personas que han visitado la tienda en línea por{' '}
              {period === 'hoy' ? 'hora' : period === '7d' ? 'día de la semana' : 'día del mes'}
            </p>
          </div>

          {/* Selector de Vista (Día, Semana, Mes) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setPeriod('hoy')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'hoy'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Día (Horas)
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === '7d'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana (7d)
            </button>
            <button
              onClick={() => setPeriod('mes')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === 'mes'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes
            </button>
          </div>
        </div>

        {/* Resumen de Métricas */}
        <div className="flex items-center gap-4 sm:gap-6 pt-1 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Visitantes</span>
            <span className="text-lg font-black font-mono text-slate-900">{visitas.totalVisitas}</span>
          </div>
          <div className="border-l border-slate-200 pl-4 sm:pl-6">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Páginas Vistas</span>
            <span className="text-lg font-black font-mono text-indigo-600">{visitas.totalVistasPagina}</span>
          </div>
          <div className="border-l border-slate-200 pl-4 sm:pl-6">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Conversión</span>
            <span className="text-lg font-black font-mono text-emerald-600">{visitas.tasaConversion}%</span>
          </div>
        </div>

        {/* Gráfica Ultraligera de Barras Interactiva */}
        <div className="pt-2">
          <div className="h-44 sm:h-52 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-200">
            {graficaVisitas.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                No hay registros de visitas en este período
              </div>
            ) : (
              (() => {
                const maxVal = Math.max(1, ...graficaVisitas.map((p) => p.visits));
                return graficaVisitas.map((point, idx) => {
                  const heightPct = Math.max(4, Math.round((point.visits / maxVal) * 100));
                  const hasVisits = point.visits > 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer min-w-0"
                    >
                      {/* Tooltip flotante */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap">
                        <span className="text-slate-300 block">{point.label}</span>
                        <span className="text-indigo-300 font-mono">{point.visits} visitantes</span>
                        {point.pageViews > 0 && (
                          <span className="text-slate-400 font-mono block">({point.pageViews} páginas)</span>
                        )}
                      </div>

                      {/* Contador arriba de la barra */}
                      {hasVisits && (
                        <span className="text-[9px] font-black text-indigo-700 font-mono mb-1 hidden sm:block">
                          {point.visits}
                        </span>
                      )}

                      {/* Barra animada */}
                      <div
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                          hasVisits
                            ? 'bg-gradient-to-t from-indigo-600 to-purple-500 group-hover:from-indigo-700 group-hover:to-purple-600 shadow-xs'
                            : 'bg-slate-100 group-hover:bg-slate-200'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                });
              })()
            )}
          </div>

          {/* Eje X de Etiquetas */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1.5 px-1 overflow-hidden">
            {graficaVisitas.length > 0 && (
              <>
                <span className="truncate">{graficaVisitas[0].label}</span>
                {graficaVisitas.length > 2 && (
                  <span className="truncate hidden sm:inline">
                    {graficaVisitas[Math.floor(graficaVisitas.length / 2)].label}
                  </span>
                )}
                <span className="truncate">{graficaVisitas[graficaVisitas.length - 1].label}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 5: DE DÓNDE VISITAN LA PÁGINA (FUENTES, DISPOSITIVOS Y ZONAS) ================= */}
      <div className="clay-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>¿De Dónde Visitan la Página? (Origen, Canales & Dispositivos)</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {visitas.totalVisitas.toLocaleString()} sesiones analizadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
          {/* Canales de Adquisición */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Canales & Redes Sociales
            </span>
            <div className="space-y-2.5">
              {traficoDetalle.fuentes.map((f, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{f.name}</span>
                    <span className="text-indigo-600 font-mono">{f.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${f.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispositivos de Visita */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Dispositivos de Acceso
            </span>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Smartphones (Móvil)</span>
                </div>
                <span className="font-mono font-black text-blue-700">82%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Laptop className="w-4 h-4 text-purple-600" />
                  <span>Computadoras (Desktop)</span>
                </div>
                <span className="font-mono font-black text-purple-700">16%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Tablet className="w-4 h-4 text-emerald-600" />
                  <span>Tablets & iPads</span>
                </div>
                <span className="font-mono font-black text-emerald-700">2%</span>
              </div>
            </div>
          </div>

          {/* Zonas y Territorio */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Zonas Geográficas
            </span>
            <div className="space-y-2 text-xs">
              {traficoDetalle.zonasPrincipales.map((z, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    {z.zone}
                  </span>
                  <span className="font-black font-mono text-slate-800">{z.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 5.5: RENDIMIENTO DE POSTS SEO & BLOG ================= */}
      <div className="clay-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Rendimiento de Artículos SEO & Blog (Tráfico Orgánico)</span>
              </h3>
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Google SEO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Vistas reales, tiempo de lectura y estado de posicionamiento en Google
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              {postsSeo.totalPosts} Artículos Publicados
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
              {postsSeo.totalVistas} Lecturas Acumuladas
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg">
              ~{postsSeo.promedioTiempoLecturaMin} min lectura promedio
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Artículo / Guía SEO</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3 text-center">Lecturas</th>
                <th className="py-2.5 px-3 text-center">Tiempo Lectura</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {postsSeo.posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    No se encontraron artículos publicados
                  </td>
                </tr>
              ) : (
                postsSeo.posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800 block text-xs line-clamp-1">{post.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">/blog/{post.slug}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-black text-slate-900 text-xs inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {post.views}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-slate-600 font-medium text-xs">
                        {post.readingTimeMin} min
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Indexado
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <span>Ver post</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= BLOQUE 6: INTELIGENCIA "ARMA TU PROPIO PERFUME" (KITS 100ML) ================= */}
      <div className="clay-card p-5 sm:p-6 space-y-5 border-2 border-indigo-100/60">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Módulo BI: &quot;Arma tu Propio Perfume&quot; (Configurador 100ml)</span>
              </h3>
              <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                Producto Estrella
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Ventas, clientes compradores y fragancias más elegidas en el configurador personalizado
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
            {armaTuPropioPerfume.porcentajeVentas}% de la Facturación
          </span>
        </div>

        {/* KPIs de Arma tu Propio Perfume */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
            <span className="text-[11px] font-bold text-indigo-700 block uppercase">Perfumes Armados</span>
            <span className="text-2xl font-black text-indigo-900 font-mono mt-0.5 block">
              {armaTuPropioPerfume.totalArmados}
            </span>
            <span className="text-[10px] text-indigo-600 font-medium">Frascos formulados</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-700 block uppercase">Total Facturado</span>
            <span className="text-2xl font-black text-emerald-900 font-mono mt-0.5 block">
              ${armaTuPropioPerfume.totalFacturado.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Ingresos directos</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
            <span className="text-[11px] font-bold text-purple-700 block uppercase">Fórmula PLUS (1.5 oz)</span>
            <span className="text-2xl font-black text-purple-900 font-mono mt-0.5 block">
              {armaTuPropioPerfume.formulaPlusCount}
            </span>
            <span className="text-[10px] text-purple-600 font-medium">Con Extra Shot ($18.00)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-700 block uppercase">Fórmula Estándar (1 oz)</span>
            <span className="text-2xl font-black text-blue-900 font-mono mt-0.5 block">
              {armaTuPropioPerfume.formulaStandardCount}
            </span>
            <span className="text-[10px] text-blue-600 font-medium">Concentración base ($15.00)</span>
          </div>
        </div>

        {/* Top Contratipos Elegidos & Tabla de Compradores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Top Contratipos para Armar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Fragancias Favoritas para Armar
            </span>
            <div className="space-y-2">
              {armaTuPropioPerfume.topFraganciasArmadas.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay registros en este período.</p>
              ) : (
                armaTuPropioPerfume.topFraganciasArmadas.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-slate-800">{f.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {f.count} frascos
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tabla de Clientes que Compraron Perfumes Armados */}
          <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Clientes que Compraron &quot;Arma tu Propio Perfume&quot;
            </span>

            <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2.5">Orden</th>
                    <th className="py-2 px-2.5">Cliente</th>
                    <th className="py-2 px-2.5">Fragancia Elegida</th>
                    <th className="py-2 px-2.5">Fórmula</th>
                    <th className="py-2 px-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {armaTuPropioPerfume.compradores.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        No hay compras de perfumes personalizados en este período.
                      </td>
                    </tr>
                  ) : (
                    armaTuPropioPerfume.compradores.map((c, idx) => (
                      <tr key={idx} className="hover:bg-white/80 transition-colors">
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-800">{c.orderNumber}</td>
                        <td className="py-2 px-2.5">
                          <span className="font-bold text-slate-800 block">{c.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.customerPhone}</span>
                        </td>
                        <td className="py-2 px-2.5 font-extrabold text-indigo-700">{c.fragrance}</td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              c.formula.includes('PLUS')
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {c.formula.includes('PLUS') ? 'PLUS 1.5 Oz' : 'Estándar 1.0 Oz'}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-right font-black font-mono text-slate-900">
                          ${c.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 7: QUIÉNES COMPRAN (CLIENTES MÁS VALIOSOS & RECURRENTES) ================= */}
      <div className="clay-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Clientes Más Valiosos & Recurrentes</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Cartera de clientes con mayor volumen de compra en el ecommerce
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">Top {clientesTop.length} Compradores</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Contacto / WhatsApp</th>
                <th className="py-2.5 px-3">Ubicación</th>
                <th className="py-2.5 px-3 text-center">Pedidos</th>
                <th className="py-2.5 px-3 text-right">Gasto Total Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesTop.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                    No hay clientes registrados en este período.
                  </td>
                </tr>
              ) : (
                clientesTop.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-extrabold text-slate-800 block">{c.name}</span>
                      {c.email && <span className="text-[10px] text-slate-400">{c.email}</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      {c.phone && c.phone !== 'N/A' ? (
                        <a
                          href={`https://wa.me/503${c.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">{c.department}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {c.ordersCount} órdenes
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-mono text-emerald-700 text-sm">
                      ${c.totalSpent.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= BLOQUE 8: CONTROL OPERATIVO DE PEDIDOS (SEMÁFORO) ================= */}
      <div className="clay-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Control Operativo de Pedidos</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {summary.totalPedidos} órdenes procesadas en el período
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {/* Nuevos / Registrados (Rojo) */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
            <div className="flex items-center justify-between text-rose-800 mb-1">
              <span className="text-[11px] font-extrabold uppercase">Nuevos / Pago</span>
              <Clock className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-2xl font-black text-rose-700 font-mono block">
              {pedidosEstado.nuevos.count}
            </span>
            <span className="text-[10px] font-bold text-rose-600/80">
              ${pedidosEstado.nuevos.total.toFixed(2)}
            </span>
          </div>

          {/* En Preparación / Taller (Amarillo) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[11px] font-extrabold uppercase">En Taller</span>
              <Flame className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-2xl font-black text-amber-700 font-mono block">
              {pedidosEstado.enPreparacion.count}
            </span>
            <span className="text-[10px] font-bold text-amber-600/80">
              ${pedidosEstado.enPreparacion.total.toFixed(2)}
            </span>
          </div>

          {/* En Ruta / Mensajería (Azul) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <div className="flex items-center justify-between text-blue-800 mb-1">
              <span className="text-[11px] font-extrabold uppercase">En Ruta C807</span>
              <Truck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-blue-700 font-mono block">
              {pedidosEstado.enRuta.count}
            </span>
            <span className="text-[10px] font-bold text-blue-600/80">
              ${pedidosEstado.enRuta.total.toFixed(2)}
            </span>
          </div>

          {/* Entregados / Completados (Verde) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] font-extrabold uppercase">Entregados</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-emerald-700 font-mono block">
              {pedidosEstado.entregados.count}
            </span>
            <span className="text-[10px] font-bold text-emerald-600/80">
              ${pedidosEstado.entregados.total.toFixed(2)}
            </span>
          </div>

          {/* Cancelados / Abandonados (Gris) */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200">
            <div className="flex items-center justify-between text-slate-700 mb-1">
              <span className="text-[11px] font-extrabold uppercase">Cancelados</span>
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-2xl font-black text-slate-700 font-mono block">
              {pedidosEstado.cancelados.count}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              ${pedidosEstado.cancelados.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 9: CANALES DE VENTA & MÉTODOS DE PAGO ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canales: Online vs Mostrador POS */}
        <div className="clay-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              <span>Canal de Venta: Online vs Mostrador</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">Distribución</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Ecommerce */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  Ecommerce Online (Wompi / Transferencia)
                </span>
                <span className="text-indigo-700 font-black font-mono">
                  ${canales.ecommerce.total.toFixed(2)} ({canales.ecommerce.count} órdenes · {canales.ecommerce.percentage}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, canales.ecommerce.percentage)}%` }}
                ></div>
              </div>
            </div>

            {/* POS Mostrador */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  Mostrador Tienda Física (POS)
                </span>
                <span className="text-emerald-700 font-black font-mono">
                  ${canales.pos.total.toFixed(2)} ({canales.pos.count} ventas · {canales.pos.percentage}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, canales.pos.percentage)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex justify-between items-center">
            <span>
              💡 <strong>Balance Omnicanal:</strong> El canal online representa el{' '}
              <strong>{canales.ecommerce.percentage}%</strong> de tus transacciones.
            </span>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="clay-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Formas de Pago Utilizadas</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">Total Recaudado</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Wompi Tarjetas */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[11px]">
                  💳
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 block">Tarjeta de Crédito / Débito (Wompi)</span>
                  <span className="text-[10px] text-slate-400 font-medium">{metodosPago.wompiTarjeta.count} pagos procesados</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-purple-700 font-mono block">
                  ${metodosPago.wompiTarjeta.total.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-purple-600">{metodosPago.wompiTarjeta.percentage}%</span>
              </div>
            </div>

            {/* Transferencias */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">
                  🏦
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 block">Transferencia Bancaria</span>
                  <span className="text-[10px] text-slate-400 font-medium">{metodosPago.transferencia.count} transferencias</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-blue-700 font-mono block">
                  ${metodosPago.transferencia.total.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-blue-600">{metodosPago.transferencia.percentage}%</span>
              </div>
            </div>

            {/* Efectivo */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                  💵
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 block">Efectivo (Caja / Contra Entrega)</span>
                  <span className="text-[10px] text-slate-400 font-medium">{metodosPago.efectivo.count} pagos</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-700 font-mono block">
                  ${metodosPago.efectivo.total.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">{metodosPago.efectivo.percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 10: TOP FRAGANCIAS & DESTINOS DE ENVÍO ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Fragancias y Contratipos */}
        <div className="clay-card p-5 sm:p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-indigo-600" />
                <span>Top Fragancias & Contratipos Más Vendidos</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Ranking por facturación y onzas despachadas</p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('productos')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Ver Catálogo →
              </button>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {topFragancias.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No hay datos de productos en este período.</p>
            ) : (
              topFragancias.map((f, idx) => {
                const widthPercent = (f.revenue / maxFragranceRevenue) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-extrabold text-slate-800">{f.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ({f.quantity} unids · {f.ounces} Oz)
                        </span>
                      </div>
                      <span className="font-black text-slate-900 font-mono">${f.revenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                        style={{ width: `${Math.max(5, widthPercent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Resumen gerencial de la fragancia #1 */}
          {topFragancias[0] && (
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 mt-2 flex items-center justify-between">
              <span>
                🏆 <strong>Contratipo Estrella:</strong> &quot;{topFragancias[0].name}&quot; lidera las ventas con{' '}
                <strong>${topFragancias[0].revenue.toFixed(2)}</strong> ({topFragancias[0].ounces} Onzas).
              </span>
            </div>
          )}
        </div>

        {/* Departamentos y Territorios C807 */}
        <div className="clay-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Destinos de Envío</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-bold uppercase">C807 Express</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {topDepartamentos.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">No hay envíos registrados.</p>
            ) : (
              topDepartamentos.map((d, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold text-[10px]">#{idx + 1}</span>
                    <span className="font-bold text-slate-800">{d.department}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block font-mono">${d.total.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{d.count} órdenes</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Facturas a Hacienda (DTE):</span>
              <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {summary.dteTransmitidos} DTEs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 11: VALUACIÓN DE BODEGA & ALERTAS DE STOCK ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Valuación de Inventario */}
        <div className="clay-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-700" />
              <span>Valuación de Bodega</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">{inventario.totalProductos} SKUs</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Onzas de Esencia en Existencia:</span>
              <span className="font-black text-slate-900 font-mono text-sm">{inventario.totalStockOnzas} Oz</span>
            </div>

            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Valor Total Inventario (PVP):</span>
              <span className="font-black text-indigo-700 font-mono text-sm">
                ${inventario.valorInventarioPvp.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Costo de Inversión (Proveedor):</span>
              <span className="font-black text-slate-700 font-mono text-sm">
                ${inventario.valorInventarioCosto.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-emerald-800 font-bold">Ganancia Bruta Potencial:</span>
              <span className="font-black text-emerald-700 font-mono text-sm">
                +${inventario.gananciaPotencial.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Alerta de Stock Crítico */}
        <div className="clay-card p-5 sm:p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alertas de Stock Bajo & Reabastecimiento</span>
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {inventario.stockCritico.length} productos críticos
            </span>
          </div>

          {inventario.stockCritico.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
              ✅ Todos los contratipos e insumos cuentan con stock por encima del nivel mínimo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {inventario.stockCritico.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block truncate max-w-[180px]">{p.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Mínimo sugerido: {p.minStock} unids
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-black font-mono text-xs">
                      {p.stock} en stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {onNavigateTab && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => onNavigateTab('compras')}
                className="clay-btn clay-btn-light px-3.5 py-1.5 text-xs flex items-center gap-1.5 font-bold text-indigo-700 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Generar Orden de Compra de Insumos</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= BLOQUE 12: ACTIVIDAD RECIENTE EN VIVO ================= */}
      <div className="clay-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Últimos Movimientos de Venta (Online & Mostrador)</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Flujo unificado en tiempo real</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Comprobante / Orden</th>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3">Cliente / Origen</th>
                <th className="py-2.5 px-3">Método de Pago</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                    No hay transacciones registradas en este período.
                  </td>
                </tr>
              ) : (
                recientes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{r.number}</td>
                    <td className="py-2.5 px-3">
                      {r.type === 'ECOMMERCE' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <Globe className="w-3 h-3" /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Store className="w-3 h-3" /> Mostrador
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{r.customer}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">
                      {r.paymentMethod === 'CARD'
                        ? 'Tarjeta Wompi'
                        : r.paymentMethod === 'TRANSFER'
                        ? 'Transferencia'
                        : 'Efectivo'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.status === 'COMPLETED' || r.status === 'ENTREGADO'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'EN_RUTA'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : r.status === 'CONFIRMADO' || r.status === 'EN_PREPARACION'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'CANCELADO'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900">
                      ${r.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
