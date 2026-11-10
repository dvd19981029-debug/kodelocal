'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Pedido } from '../../types';

interface DashboardMetricasProps {
  metricas: {
    totalVentas: number;
    totalGastosCompras: number;
    total: number;
    [key: string]: any;
  };
  pedidos?: Pedido[];
  onBack: () => void;
}

function toSvDateKey(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function DashboardMetricas({ metricas, pedidos = [], onBack }: DashboardMetricasProps) {
  // Construir serie de los últimos 20 días en zona horaria de El Salvador
  const dailyData = useMemo(() => {
    const validPedidos = pedidos.filter(
      (p) => p.estado !== 'Cancelado' && p.estado !== 'CANCELADO' && p.created_at
    );

    // Determinar la fecha ancla (el día más reciente con pedido o el día actual)
    let latestMs = Date.now();
    for (const p of validPedidos) {
      const ms = new Date(p.created_at!).getTime();
      if (!isNaN(ms) && ms > latestMs) {
        latestMs = ms;
      }
    }

    const days: {
      dateKey: string;
      dayNum: string;
      shortLabel: string;
      pedidosCount: number;
      montoTotal: number;
      montoPatricia: number;
      montoDayana: number;
    }[] = [];

    const mapByDate = new Map<string, (typeof days)[number]>();

    for (let i = 19; i >= 0; i--) {
      const d = new Date(latestMs - i * 86400000);
      const dateKey = toSvDateKey(d);
      const parts = dateKey.split('-'); // YYYY-MM-DD
      const dayNum = parts[2] ? String(parseInt(parts[2], 10)) : '';
      const monthNum = parts[1] ? String(parseInt(parts[1], 10)) : '';
      const entry = {
        dateKey,
        dayNum,
        shortLabel: `${dayNum}/${monthNum}`,
        pedidosCount: 0,
        montoTotal: 0,
        montoPatricia: 0,
        montoDayana: 0,
      };
      days.push(entry);
      mapByDate.set(dateKey, entry);
    }

    for (const p of validPedidos) {
      const key = toSvDateKey(p.created_at!);
      const bucket = mapByDate.get(key);
      if (!bucket) continue;

      const monto = parseFloat(p.total?.toString() || '0') || 0;
      bucket.pedidosCount += 1;
      bucket.montoTotal += monto;

      const vend = (p.vendedora_nombre || '').toLowerCase();
      if (vend.includes('patricia')) {
        bucket.montoPatricia += monto;
      } else if (vend.includes('isis') || vend.includes('dayana')) {
        bucket.montoDayana += monto;
      }
    }

    return days;
  }, [pedidos]);

  // Cálculo de regresión lineal para la tendencia de ventas (sobre días con actividad o serie completa)
  const trendInfo = useMemo(() => {
    const activeDays = dailyData.filter((d) => d.montoTotal > 0);
    const series = activeDays.length >= 2 ? activeDays : dailyData;
    const n = series.length;
    if (n < 2) {
      return {
        status: 'PLANA' as 'ALZA' | 'BAJA' | 'PLANA',
        pctChange: 0,
        slope: 0,
        points: [] as { x: number; y: number; val: number; label: string }[],
        trendStart: 0,
        trendEnd: 0,
      };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    series.forEach((d, idx) => {
      sumX += idx;
      sumY += d.montoTotal;
      sumXY += idx * d.montoTotal;
      sumXX += idx * idx;
    });

    const denom = n * sumXX - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;

    const trendStart = Math.max(0, intercept);
    const trendEnd = Math.max(0, intercept + slope * (n - 1));
    const avg = sumY / n;

    // Variación porcentual de la recta de tendencia respecto al promedio diario
    const deltaTotal = slope * (n - 1);
    const pctChange = avg > 0 ? (deltaTotal / avg) * 100 : 0;

    let status: 'ALZA' | 'BAJA' | 'PLANA' = 'PLANA';
    if (pctChange > 5) status = 'ALZA';
    else if (pctChange < -5) status = 'BAJA';

    const maxVal = Math.max(...series.map((s) => s.montoTotal), trendStart, trendEnd, 1);

    const points = series.map((s, idx) => ({
      x: n > 1 ? (idx / (n - 1)) * 100 : 50,
      y: 100 - (s.montoTotal / maxVal) * 80 - 10,
      val: s.montoTotal,
      label: s.shortLabel,
    }));

    return {
      status,
      pctChange,
      slope,
      points,
      yStart: 100 - (trendStart / maxVal) * 80 - 10,
      yEnd: 100 - (trendEnd / maxVal) * 80 - 10,
    };
  }, [dailyData]);

  const maxPedidosDia = useMemo(
    () => Math.max(...dailyData.map((d) => d.pedidosCount), 1),
    [dailyData]
  );

  const maxMontoDia = useMemo(
    () => Math.max(...dailyData.map((d) => d.montoTotal), 1),
    [dailyData]
  );

  const maxMontoAsesoraDia = useMemo(
    () =>
      Math.max(
        ...dailyData.map((d) => Math.max(d.montoPatricia, d.montoDayana)),
        1
      ),
    [dailyData]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
        >
          ← Volver a Inteligencia de Negocios
        </button>
        <span className="text-xs text-slate-500 font-medium">Dashboard General</span>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clay-card p-4">
          <span className="text-xs font-bold text-slate-500 block mb-1">Ventas Totales</span>
          <span className="text-2xl font-black text-emerald-700 font-mono">
            ${metricas.totalVentas.toFixed(2)}
          </span>
        </div>

        <div className="clay-card p-4">
          <span className="text-xs font-bold text-slate-500 block mb-1">Gastos en Insumos</span>
          <span className="text-2xl font-black text-rose-600 font-mono">
            ${metricas.totalGastosCompras.toFixed(2)}
          </span>
        </div>

        <div className="clay-card p-4">
          <span className="text-xs font-bold text-slate-500 block mb-1">Margen Operativo Bruto</span>
          <span className="text-2xl font-black text-indigo-700 font-mono">
            ${(metricas.totalVentas - metricas.totalGastosCompras).toFixed(2)}
          </span>
        </div>

        <div className="clay-card p-4">
          <span className="text-xs font-bold text-slate-500 block mb-1">Total Pedidos</span>
          <span className="text-2xl font-black text-slate-900 font-mono">{metricas.total}</span>
        </div>
      </div>

      {/* FILA 1: Cantidad de Pedidos por Día (Últimos 20 días) + Tendencia de Ventas a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico 1: Cantidad de pedidos por día (Últimos 20 días) */}
        <div className="clay-card p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Cantidad de Pedidos por Día (Últimos 20 Días)
              </h3>
              <p className="text-[11px] text-slate-500">
                Total de pedidos diarios registrados con etiqueta de cantidad
              </p>
            </div>
          </div>

          <div className="h-56 flex items-end gap-1.5 pt-6 pb-1 px-1 border-b border-slate-200/80 overflow-x-auto">
            {dailyData.map((d) => {
              const heightPct = d.pedidosCount > 0 ? Math.max((d.pedidosCount / maxPedidosDia) * 100, 8) : 2;
              return (
                <div
                  key={d.dateKey}
                  className="flex-1 min-w-[26px] h-full flex flex-col items-center justify-end group"
                  title={`${d.shortLabel}: ${d.pedidosCount} pedidos`}
                >
                  <span
                    className={`text-[10px] font-mono font-extrabold mb-1 ${
                      d.pedidosCount > 0 ? 'text-indigo-700' : 'text-slate-300'
                    }`}
                  >
                    {d.pedidosCount}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[26px] rounded-t-md transition-all ${
                      d.pedidosCount > 0
                        ? 'bg-gradient-to-t from-indigo-600 to-violet-500 group-hover:from-indigo-700 group-hover:to-violet-600 shadow-sm'
                        : 'bg-slate-200/70'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 pt-2 px-1 overflow-x-auto">
            {dailyData.map((d) => (
              <div key={d.dateKey} className="flex-1 min-w-[26px] text-center">
                <span className="text-[9px] font-mono font-bold text-slate-500 block leading-none">
                  {d.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2 (a la derecha): Tendencia de Ventas (Alza / Baja / Plana) */}
        <div className="clay-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Tendencia de Ventas
              </h3>
              {trendInfo.status === 'ALZA' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  A LA ALZA
                </span>
              )}
              {trendInfo.status === 'BAJA' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  A LA BAJA
                </span>
              )}
              {trendInfo.status === 'PLANA' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                  <Minus className="w-3.5 h-3.5 text-amber-600" />
                  PLANA
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Dirección de ventas de los últimos 20 días ({trendInfo.pctChange >= 0 ? '+' : ''}
              {trendInfo.pctChange.toFixed(1)}%)
            </p>
          </div>

          <div className="my-3 h-44 w-full bg-slate-50/70 rounded-xl border border-slate-200/70 p-3 flex items-center justify-center">
            {trendInfo.points.length >= 2 ? (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Curva real de ventas */}
                <polyline
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.8"
                  points={trendInfo.points.map((p) => `${p.x},${p.y}`).join(' ')}
                />
                {/* Línea de tendencia (regresión) */}
                <line
                  x1="0"
                  y1={trendInfo.yStart}
                  x2="100"
                  y2={trendInfo.yEnd}
                  stroke={
                    trendInfo.status === 'ALZA'
                      ? '#059669'
                      : trendInfo.status === 'BAJA'
                      ? '#e11d48'
                      : '#d97706'
                  }
                  strokeWidth="2.8"
                  strokeDasharray="3,2"
                />
                {trendInfo.points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="2.2"
                    fill="#4f46e5"
                  >
                    <title>{`${p.label}: $${p.val.toFixed(2)}`}</title>
                  </circle>
                ))}
              </svg>
            ) : (
              <span className="text-xs text-slate-400">Sin datos suficientes</span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-slate-400 inline-block" /> Ventas diarias
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2.5 h-0.5 inline-block ${
                  trendInfo.status === 'ALZA'
                    ? 'bg-emerald-600'
                    : trendInfo.status === 'BAJA'
                    ? 'bg-rose-600'
                    : 'bg-amber-600'
                }`}
              />
              Línea de tendencia
            </span>
          </div>
        </div>
      </div>

      {/* FILA 2: Montos de Venta por Día (Últimos 20 días) */}
      <div className="clay-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Montos de Venta por Día (Últimos 20 Días)
            </h3>
            <p className="text-[11px] text-slate-500">
              Total facturado/vendido en dólares ($) por cada día
            </p>
          </div>
        </div>

        <div className="h-60 flex items-end gap-1.5 pt-7 pb-1 px-1 border-b border-slate-200/80 overflow-x-auto">
          {dailyData.map((d) => {
            const heightPct = d.montoTotal > 0 ? Math.max((d.montoTotal / maxMontoDia) * 100, 8) : 2;
            return (
              <div
                key={d.dateKey}
                className="flex-1 min-w-[36px] h-full flex flex-col items-center justify-end group"
                title={`${d.shortLabel}: $${d.montoTotal.toFixed(2)}`}
              >
                <span
                  className={`text-[9px] font-mono font-extrabold mb-1 whitespace-nowrap ${
                    d.montoTotal > 0 ? 'text-emerald-700' : 'text-slate-300'
                  }`}
                >
                  ${d.montoTotal.toFixed(0)}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[30px] rounded-t-md transition-all ${
                    d.montoTotal > 0
                      ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-700 group-hover:to-teal-500 shadow-sm'
                      : 'bg-slate-200/70'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 pt-2 px-1 overflow-x-auto">
          {dailyData.map((d) => (
            <div key={d.dateKey} className="flex-1 min-w-[36px] text-center">
              <span className="text-[9px] font-mono font-bold text-slate-500 block leading-none">
                {d.shortLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FILA 3: Gráfico Comparativo de Venta en Monto por Día por Asesora (Patricia vs Dayana) */}
      <div className="clay-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Comparativo de Ventas por Día por Asesora ($)
            </h3>
            <p className="text-[11px] text-slate-500">
              Monto de venta diario comparando barras juntas por día
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="w-3 h-3 rounded-sm bg-sky-400 border border-sky-500 inline-block" />
              Patricia
            </span>
            <span className="flex items-center gap-1.5 text-pink-700">
              <span className="w-3 h-3 rounded-sm bg-pink-400 border border-pink-500 inline-block" />
              Dayana
            </span>
          </div>
        </div>

        <div className="h-64 flex items-end gap-2 pt-7 pb-1 px-1 border-b border-slate-200/80 overflow-x-auto">
          {dailyData.map((d) => {
            const hPat = d.montoPatricia > 0 ? Math.max((d.montoPatricia / maxMontoAsesoraDia) * 100, 8) : 2;
            const hDay = d.montoDayana > 0 ? Math.max((d.montoDayana / maxMontoAsesoraDia) * 100, 8) : 2;

            return (
              <div
                key={d.dateKey}
                className="flex-1 min-w-[46px] h-full flex flex-col items-center justify-end"
                title={`Día ${d.dayNum} (${d.shortLabel}) — Patricia: $${d.montoPatricia.toFixed(2)} | Dayana: $${d.montoDayana.toFixed(2)}`}
              >
                {/* Dos barras pegadas (Patricia = celeste, Dayana = rosa) */}
                <div className="w-full h-full flex items-end justify-center gap-0">
                  {/* Barra Patricia (Celeste) */}
                  <div className="w-1/2 max-w-[20px] h-full flex flex-col items-center justify-end">
                    {d.montoPatricia > 0 && (
                      <span className="text-[8px] font-mono font-extrabold text-sky-700 mb-0.5 whitespace-nowrap">
                        ${d.montoPatricia.toFixed(0)}
                      </span>
                    )}
                    <div
                      style={{ height: `${hPat}%` }}
                      className={`w-full rounded-tl-md transition-all ${
                        d.montoPatricia > 0
                          ? 'bg-sky-400 hover:bg-sky-500 border-t border-l border-sky-500/40 shadow-sm'
                          : 'bg-slate-200/50'
                      }`}
                    />
                  </div>

                  {/* Barra Dayana (Rosa) */}
                  <div className="w-1/2 max-w-[20px] h-full flex flex-col items-center justify-end">
                    {d.montoDayana > 0 && (
                      <span className="text-[8px] font-mono font-extrabold text-pink-600 mb-0.5 whitespace-nowrap">
                        ${d.montoDayana.toFixed(0)}
                      </span>
                    )}
                    <div
                      style={{ height: `${hDay}%` }}
                      className={`w-full rounded-tr-md transition-all ${
                        d.montoDayana > 0
                          ? 'bg-pink-400 hover:bg-pink-500 border-t border-r border-pink-500/40 shadow-sm'
                          : 'bg-slate-200/50'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-2 px-1 overflow-x-auto">
          {dailyData.map((d) => (
            <div key={d.dateKey} className="flex-1 min-w-[46px] text-center">
              <span className="text-[10px] font-mono font-extrabold text-slate-700 block leading-none">
                {d.dayNum}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
