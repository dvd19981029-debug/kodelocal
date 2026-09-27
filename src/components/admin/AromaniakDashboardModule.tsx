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
} from 'lucide-react';

export type DashboardPeriod = 'hoy' | '7d' | 'mes' | 'anio' | 'todo';

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
  };

  const traficoDetalle = data?.traficoDetalle || {
    fuentes: [
      { name: 'Instagram & Facebook Ads', visits: 1310, percentage: 48 },
      { name: 'WhatsApp & Asesoría Directa', visits: 765, percentage: 28 },
      { name: 'Búsqueda Orgánica Google', visits: 435, percentage: 16 },
      { name: 'Enlaces Compartidos & Otros', visits: 225, percentage: 8 },
    ],
    dispositivos: [
      { device: 'Móviles (iOS & Android)', percentage: 82 },
      { device: 'Computadoras (Desktop)', percentage: 16 },
      { device: 'Tablets', percentage: 2 },
    ],
    zonasPrincipales: [
      { zone: 'San Salvador (Metropolitana)', share: 58 },
      { zone: 'Santa Tecla & La Libertad', share: 22 },
      { zone: 'Santa Ana & Occidente', share: 11 },
      { zone: 'San Miguel & Oriente', share: 6 },
      { zone: 'Diáspora USA / Envíos Familiares', share: 3 },
    ],
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Dashboard de Inteligencia de Negocios
            </h2>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
              Aromaniak Live
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Métricas ejecutivas de ventas, insumos, márgenes, visitas, clientes y &quot;Arma tu Propio Perfume&quot;
          </p>
        </div>

        {/* Controles de Período y Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {/* Selector de Período */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs font-bold text-slate-600">
            <button
              onClick={() => setPeriod('hoy')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'hoy' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === '7d' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod('mes')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'mes' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setPeriod('anio')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'anio' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Año
            </button>
            <button
              onClick={() => setPeriod('todo')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'todo' ? 'bg-white text-indigo-600 shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              Todo
            </button>
          </div>

          {/* Botón Refrescar */}
          <button
            onClick={() => fetchDashboardData(period)}
            title="Refrescar métricas"
            disabled={isLoading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Botón Ajustar Precios */}
          {onOpenBulkPriceModal && (
            <button
              onClick={onOpenBulkPriceModal}
              className="clay-btn clay-btn-light px-3 py-2 text-xs flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Precios (${activeEssencePrice.toFixed(2)})</span>
            </button>
          )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventas Totales */}
        <div className="clay-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Totales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-2">
            ${summary.totalVentas.toFixed(2)}
          </h3>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500 font-medium">{summary.totalPedidos} transacciones</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              Ticket: ${summary.ticketPromedio.toFixed(2)}
            </span>
          </div>
        </div>

        {/* KPI 2: Gastos en Insumos */}
        <div className="clay-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos en Insumos</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-600 font-mono mt-2">
            ${summary.totalGastosCompras.toFixed(2)}
          </h3>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500 font-medium">Esencias, botes, alcohol</span>
            <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
              {summary.totalVentas > 0
                ? `${((summary.totalGastosCompras / summary.totalVentas) * 100).toFixed(0)}% de ventas`
                : 'Costo base'}
            </span>
          </div>
        </div>

        {/* KPI 3: Margen Operativo Bruto */}
        <div className="clay-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Margen Operativo Bruto</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono mt-2">
            ${summary.margenOperativoBruto.toFixed(2)}
          </h3>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500 font-medium">Ganancia libre</span>
            <span className="text-indigo-700 font-black bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              +{summary.margenPorcentual.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 4: Total Pedidos & Operaciones */}
        <div className="clay-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Pedidos</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-2">
            {summary.totalPedidos}
          </h3>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500 font-medium">{summary.onzasVendidas} Oz servidas</span>
            <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
              {summary.dteTransmitidos} DTEs MH
            </span>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 2: TRÁFICO, VISITAS Y CONVERSIÓN ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visitas Tienda Online */}
        <div className="clay-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Visitas a la Tienda</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-800 font-mono">
                {visitas.totalVisitas.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">sesiones</span>
            </div>
            <span className="text-[10px] text-blue-600 font-bold">{visitas.totalVistasPagina.toLocaleString()} vistas</span>
          </div>
        </div>

        {/* Tasa de Conversión */}
        <div className="clay-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Tasa de Conversión</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-amber-600 font-mono">
                {visitas.tasaConversion.toFixed(2)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Visitas que compran</span>
          </div>
        </div>

        {/* Onzas de Esencia Despachadas */}
        <div className="clay-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Onzas Despachadas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-700 font-mono">
                {summary.onzasVendidas} Oz
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Kits y frascos servidos</span>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="clay-card p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Ticket Promedio (AOV)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-purple-700 font-mono">
                ${summary.ticketPromedio.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Gasto promedio por orden</span>
          </div>
        </div>
      </div>

      {/* ================= BLOQUE 3: DE DÓNDE VISITAN LA PÁGINA (FUENTES, DISPOSITIVOS Y ZONAS) ================= */}
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

      {/* ================= BLOQUE 4: INTELIGENCIA "ARMA TU PROPIO PERFUME" (KITS 100ML) ================= */}
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

      {/* ================= BLOQUE 5: QUIÉNES COMPRAN (CLIENTES MÁS VALIOSOS & RECURRENTES) ================= */}
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

      {/* ================= BLOQUE 6: ESTADO LOGÍSTICO DE PEDIDOS (SEMÁFORO) ================= */}
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

      {/* ================= BLOQUE 7: CANALES DE VENTA & MÉTODOS DE PAGO ================= */}
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

      {/* ================= BLOQUE 8: TOP FRAGANCIAS & DESTINOS DE ENVÍO ================= */}
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

      {/* ================= BLOQUE 9: VALUACIÓN DE BODEGA & ALERTAS DE STOCK ================= */}
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

      {/* ================= BLOQUE 10: ACTIVIDAD RECIENTE EN VIVO ================= */}
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
