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

function getSvDayOfWeekAndHour(dateInput: Date | string): { dow: number; hour: number } {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return { dow: 0, hour: 12 };
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/El_Salvador',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(d);
  const wk = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
  const hr = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
  const mapDow: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return { dow: mapDow[wk] ?? 0, hour: isNaN(hr) ? 12 : hr % 24 };
}

export function DashboardMetricas({ metricas, pedidos = [], onBack }: DashboardMetricasProps) {
  const validPedidos = useMemo(
    () =>
      pedidos.filter(
        (p) => p.estado !== 'Cancelado' && p.estado !== 'CANCELADO' && p.created_at
      ),
    [pedidos]
  );

  // Construir serie de los últimos 20 días en zona horaria de El Salvador
  const dailyData = useMemo(() => {
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
  }, [validPedidos]);

  // Cálculo de regresión lineal para la tendencia de ventas
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
        yStart: 50,
        yEnd: 50,
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

  // ============================================================================
  // 1. ANALÍTICA DE INVENTARIO Y PRODUCTO (TOP FRAGANCIAS, CONCENTRACIÓN, GÉNERO)
  // ============================================================================
  const productoAnalytics = useMemo(() => {
    const mapFragancias = new Map<
      string,
      {
        codigo: string;
        contratipo: string;
        marca: string;
        genero: string;
        unidadesNormal: number;
        unidadesExtra: number;
        unidadesTotal: number;
        montoFacturado: number;
        pedidosSet: Set<string>;
      }
    >();

    let totalNormal = 0;
    let totalExtra = 0;
    const generoCount: Record<string, number> = { Caballero: 0, Dama: 0, Unisex: 0 };
    const marcasMap = new Map<string, { marca: string; unidades: number; monto: number }>();

    for (const p of validPedidos) {
      const items = Array.isArray(p.items) ? p.items : [];
      for (const it of items) {
        const cant = Number(it.cantidad) || 1;
        const sub = parseFloat(it.subtotal?.toString() || '0') || cant * (parseFloat(it.precio_unitario?.toString() || '0') || 0);
        const ver = (it.version || 'Normal').toLowerCase();
        const isExtra = ver.includes('extra') || ver.includes('plus');

        if (isExtra) totalExtra += cant;
        else totalNormal += cant;

        const genRaw = ((it as any).genero || '').toLowerCase();
        const contratipoRaw = (it.contratipo || '').trim();
        let genKey = 'Unisex';
        if (genRaw.includes('caballero') || genRaw.includes('hombre') || contratipoRaw.endsWith(' H')) {
          genKey = 'Caballero';
        } else if (genRaw.includes('dama') || genRaw.includes('mujer') || contratipoRaw.endsWith(' F')) {
          genKey = 'Dama';
        }
        generoCount[genKey] = (generoCount[genKey] || 0) + cant;

        const marcaName = (it.marca || 'Otra').trim() || 'Otra';
        const mPrev = marcasMap.get(marcaName) || { marca: marcaName, unidades: 0, monto: 0 };
        mPrev.unidades += cant;
        mPrev.monto += sub;
        marcasMap.set(marcaName, mPrev);

        const key = (it.codigo || contratipoRaw || 'SIN-COD').trim();
        const prev = mapFragancias.get(key) || {
          codigo: it.codigo || '—',
          contratipo: contratipoRaw || 'Fragancia',
          marca: marcaName,
          genero: genKey,
          unidadesNormal: 0,
          unidadesExtra: 0,
          unidadesTotal: 0,
          montoFacturado: 0,
          pedidosSet: new Set<string>(),
        };
        if (isExtra) prev.unidadesExtra += cant;
        else prev.unidadesNormal += cant;
        prev.unidadesTotal += cant;
        prev.montoFacturado += sub;
        prev.pedidosSet.add(p.id);
        mapFragancias.set(key, prev);
      }
    }

    const topFragancias = Array.from(mapFragancias.values())
      .sort((a, b) => b.unidadesTotal - a.unidadesTotal || b.montoFacturado - a.montoFacturado)
      .slice(0, 12);

    const topMarcas = Array.from(marcasMap.values())
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 6);

    const totalUnidades = totalNormal + totalExtra;

    return {
      topFragancias,
      topMarcas,
      totalUnidades,
      totalNormal,
      totalExtra,
      generoCount,
    };
  }, [validPedidos]);

  // ============================================================================
  // 2. DESEMPEÑO DE ASESORAS (UPSELLING / COMBOS) + DÍAS DE LA SEMANA Y HORAS PICO
  // ============================================================================
  const comercialAnalytics = useMemo(() => {
    const asesorasMap = new Map<
      string,
      {
        nombre: string;
        pedidos: number;
        entregados: number;
        ventas: number;
        frascos: number;
        pedidosCombo: number;
        descuentoTotal: number;
      }
    >();

    const diasSemana = [
      { label: 'Lun', pedidos: 0, monto: 0 },
      { label: 'Mar', pedidos: 0, monto: 0 },
      { label: 'Mié', pedidos: 0, monto: 0 },
      { label: 'Jue', pedidos: 0, monto: 0 },
      { label: 'Vie', pedidos: 0, monto: 0 },
      { label: 'Sáb', pedidos: 0, monto: 0 },
      { label: 'Dom', pedidos: 0, monto: 0 },
    ];

    const franjasHorarias = [
      { label: 'Madrugada (0–6h)', pedidos: 0, monto: 0 },
      { label: 'Mañana (7–11h)', pedidos: 0, monto: 0 },
      { label: 'Mediodía (12–14h)', pedidos: 0, monto: 0 },
      { label: 'Tarde (15–18h)', pedidos: 0, monto: 0 },
      { label: 'Noche (19–23h)', pedidos: 0, monto: 0 },
    ];

    let totalPedidosConCombo = 0;
    let totalFrascosGlobal = 0;

    for (const p of validPedidos) {
      const monto = parseFloat(p.total?.toString() || '0') || 0;
      const desc = parseFloat(p.descuento?.toString() || '0') || 0;
      const items = Array.isArray(p.items) ? p.items : [];
      const frascosPedido = items.reduce((acc, it) => acc + (Number(it.cantidad) || 1), 0) || 1;
      const esCombo = frascosPedido >= 2 || desc > 0;

      if (esCombo) totalPedidosConCombo += 1;
      totalFrascosGlobal += frascosPedido;

      const vendName = (p.vendedora_nombre || 'Sin Asesor').trim();
      const prev = asesorasMap.get(vendName) || {
        nombre: vendName,
        pedidos: 0,
        entregados: 0,
        ventas: 0,
        frascos: 0,
        pedidosCombo: 0,
        descuentoTotal: 0,
      };
      prev.pedidos += 1;
      if (p.estado === 'Entregado' || p.estado === 'ENTREGADO') prev.entregados += 1;
      prev.ventas += monto;
      prev.frascos += frascosPedido;
      if (esCombo) prev.pedidosCombo += 1;
      prev.descuentoTotal += desc;
      asesorasMap.set(vendName, prev);

      if (p.created_at) {
        const { dow, hour } = getSvDayOfWeekAndHour(p.created_at);
        if (diasSemana[dow]) {
          diasSemana[dow].pedidos += 1;
          diasSemana[dow].monto += monto;
        }
        if (hour <= 6) {
          franjasHorarias[0].pedidos += 1;
          franjasHorarias[0].monto += monto;
        } else if (hour <= 11) {
          franjasHorarias[1].pedidos += 1;
          franjasHorarias[1].monto += monto;
        } else if (hour <= 14) {
          franjasHorarias[2].pedidos += 1;
          franjasHorarias[2].monto += monto;
        } else if (hour <= 18) {
          franjasHorarias[3].pedidos += 1;
          franjasHorarias[3].monto += monto;
        } else {
          franjasHorarias[4].pedidos += 1;
          franjasHorarias[4].monto += monto;
        }
      }
    }

    const asesoras = Array.from(asesorasMap.values()).sort((a, b) => b.ventas - a.ventas);
    const ticketPromedioGlobal = validPedidos.length > 0 ? metricas.totalVentas / validPedidos.length : 0;
    const frascosPorPedidoGlobal = validPedidos.length > 0 ? totalFrascosGlobal / validPedidos.length : 0;
    const pctCombosGlobal = validPedidos.length > 0 ? (totalPedidosConCombo / validPedidos.length) * 100 : 0;

    return {
      asesoras,
      diasSemana,
      franjasHorarias,
      ticketPromedioGlobal,
      frascosPorPedidoGlobal,
      pctCombosGlobal,
      totalPedidosConCombo,
    };
  }, [validPedidos, metricas.totalVentas]);

  // ============================================================================
  // 3. FLUJO DE CAJA CCE (C807 EXPRESS) Y EFECTIVIDAD POR DEPARTAMENTO
  // ============================================================================
  const logisticaAnalytics = useMemo(() => {
    let cceEnRuta = 0;
    let pedidosEnRuta = 0;
    let cceEntregado = 0;
    let pedidosEntregados = 0;
    let cceEnTaller = 0;
    let pedidosEnTaller = 0;
    let sumaDiasEntrega = 0;
    let conteoConTiempoEntrega = 0;

    const deptosMap = new Map<
      string,
      {
        departamento: string;
        pedidos: number;
        monto: number;
        entregados: number;
        enRuta: number;
        enTaller: number;
      }
    >();

    const metodosMap = new Map<string, { metodo: string; pedidos: number; monto: number }>();

    for (const p of validPedidos) {
      const total = parseFloat(p.total?.toString() || '0') || 0;
      const cce = parseFloat(p.monto_cobrar_cce?.toString() || '0') || 0;
      const est = p.estado || 'Registrado';

      const metodo = (p.tipo_pago || 'Contra Entrega').trim();
      const mPrev = metodosMap.get(metodo) || { metodo, pedidos: 0, monto: 0 };
      mPrev.pedidos += 1;
      mPrev.monto += total;
      metodosMap.set(metodo, mPrev);

      if (est === 'Entregado' || est === 'ENTREGADO') {
        pedidosEntregados += 1;
        cceEntregado += cce;
        if (p.created_at && p.updated_at) {
          const diffDays =
            (new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / 86400000;
          if (diffDays >= 0 && diffDays < 60) {
            sumaDiasEntrega += diffDays;
            conteoConTiempoEntrega += 1;
          }
        }
      } else if (est === 'Enviado' || est === 'GUIA_CREADA') {
        pedidosEnRuta += 1;
        cceEnRuta += cce;
      } else {
        pedidosEnTaller += 1;
        cceEnTaller += cce;
      }

      const depto = (p.cliente_departamento || 'San Salvador').trim() || 'San Salvador';
      const dPrev = deptosMap.get(depto) || {
        departamento: depto,
        pedidos: 0,
        monto: 0,
        entregados: 0,
        enRuta: 0,
        enTaller: 0,
      };
      dPrev.pedidos += 1;
      dPrev.monto += total;
      if (est === 'Entregado' || est === 'ENTREGADO') dPrev.entregados += 1;
      else if (est === 'Enviado' || est === 'GUIA_CREADA') dPrev.enRuta += 1;
      else dPrev.enTaller += 1;
      deptosMap.set(depto, dPrev);
    }

    const departamentos = Array.from(deptosMap.values()).sort((a, b) => b.pedidos - a.pedidos);
    const metodosPago = Array.from(metodosMap.values()).sort((a, b) => b.monto - a.monto);
    const diasPromedioEntrega =
      conteoConTiempoEntrega > 0 ? sumaDiasEntrega / conteoConTiempoEntrega : 0;
    const tasaEntrega =
      validPedidos.length > 0 ? (pedidosEntregados / validPedidos.length) * 100 : 0;

    return {
      cceEnRuta,
      pedidosEnRuta,
      cceEntregado,
      pedidosEntregados,
      cceEnTaller,
      pedidosEnTaller,
      diasPromedioEntrega,
      tasaEntrega,
      departamentos,
      metodosPago,
    };
  }, [validPedidos]);

  // ============================================================================
  // 4. RECOMPRA, RETENCIÓN Y TOP CLIENTES VIP
  // ============================================================================
  const clientesAnalytics = useMemo(() => {
    const mapClientes = new Map<
      string,
      {
        key: string;
        nombre: string;
        telefono: string;
        departamento: string;
        pedidosCount: number;
        frascosTotal: number;
        montoTotal: number;
        ultimaCompra: string;
      }
    >();

    for (const p of validPedidos) {
      const telClean = (p.cliente_telefono || '').replace(/\D/g, '').slice(-8);
      const key = telClean || p.cliente_id || (p.cliente_nombre || '').toLowerCase().trim();
      if (!key) continue;

      const monto = parseFloat(p.total?.toString() || '0') || 0;
      const items = Array.isArray(p.items) ? p.items : [];
      const frascos = items.reduce((acc, it) => acc + (Number(it.cantidad) || 1), 0) || 1;

      const prev = mapClientes.get(key) || {
        key,
        nombre: p.cliente_nombre || 'Cliente',
        telefono: p.cliente_telefono || '',
        departamento: p.cliente_departamento || '',
        pedidosCount: 0,
        frascosTotal: 0,
        montoTotal: 0,
        ultimaCompra: p.created_at || '',
      };

      prev.pedidosCount += 1;
      prev.frascosTotal += frascos;
      prev.montoTotal += monto;
      if (p.created_at && p.created_at > prev.ultimaCompra) {
        prev.ultimaCompra = p.created_at;
      }
      mapClientes.set(key, prev);
    }

    const todos = Array.from(mapClientes.values());
    const clientesUnicos = todos.length;
    const clientesRecurrentes = todos.filter((c) => c.pedidosCount >= 2);
    const tasaRecompra =
      clientesUnicos > 0 ? (clientesRecurrentes.length / clientesUnicos) * 100 : 0;

    const topVip = todos
      .sort((a, b) => b.montoTotal - a.montoTotal || b.pedidosCount - a.pedidosCount)
      .slice(0, 10);

    return {
      clientesUnicos,
      clientesRecurrentesCount: clientesRecurrentes.length,
      tasaRecompra,
      topVip,
    };
  }, [validPedidos]);

  // ============================================================================
  // 5. VENTAS ACUMULADAS DEL MES Y PROYECCIÓN A FIN DE MES (INDIVIDUAL Y KÖDE)
  // ============================================================================
  const proyeccionMensual = useMemo(() => {
    // Determinar fecha actual o más reciente en horario de El Salvador
    let anchorMs = Date.now();
    for (const p of validPedidos) {
      const ms = new Date(p.created_at!).getTime();
      if (!isNaN(ms) && ms > anchorMs) anchorMs = ms;
    }

    const anchorKey = toSvDateKey(new Date(anchorMs)); // YYYY-MM-DD
    const [yearStr, monthStr, dayStr] = anchorKey.split('-');
    const yearNum = parseInt(yearStr || '2026', 10);
    const monthNum = parseInt(monthStr || '11', 10); // 1..12
    const currentDay = Math.max(1, parseInt(dayStr || '1', 10));
    const monthPrefix = `${yearStr}-${monthStr}`; // YYYY-MM

    // Total de días calendario del mes actual (ej. Noviembre = 30)
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const monthLabel = `${monthNames[(monthNum - 1) % 12]} ${yearNum}`;

    // Filtrar pedidos del mes en curso
    const pedidosMes = validPedidos.filter((p) =>
      toSvDateKey(p.created_at!).startsWith(monthPrefix)
    );

    // Determinar desde qué día del mes hay actividad o usar los días transcurridos del mes
    let maxDayWithSale = currentDay;
    for (const p of pedidosMes) {
      const dKey = toSvDateKey(p.created_at!);
      const dNum = parseInt(dKey.split('-')[2] || '1', 10);
      if (dNum > maxDayWithSale) maxDayWithSale = dNum;
    }

    const daysElapsed = Math.max(1, Math.min(daysInMonth, maxDayWithSale));
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
    const factorProyeccion = daysInMonth / daysElapsed;

    const colabMap = new Map<
      string,
      {
        nombre: string;
        shortName: string;
        colorKey: 'sky' | 'pink' | 'indigo';
        pedidosAcumulados: number;
        ventasAcumuladas: number;
        promedioDiario: number;
        proyeccionFinMes: number;
        pedidosProyectados: number;
      }
    >();

    // Inicializar las dos asesoras principales para garantizar que siempre aparezcan
    colabMap.set('Patricia Elizabeth Mejía Ramírez', {
      nombre: 'Patricia Elizabeth Mejía Ramírez',
      shortName: 'Patricia',
      colorKey: 'sky',
      pedidosAcumulados: 0,
      ventasAcumuladas: 0,
      promedioDiario: 0,
      proyeccionFinMes: 0,
      pedidosProyectados: 0,
    });
    colabMap.set('Isis Dayana', {
      nombre: 'Isis Dayana',
      shortName: 'Dayana',
      colorKey: 'pink',
      pedidosAcumulados: 0,
      ventasAcumuladas: 0,
      promedioDiario: 0,
      proyeccionFinMes: 0,
      pedidosProyectados: 0,
    });

    // Serie diaria del mes (1..daysInMonth) para curva acumulada
    const dailyPatricia = new Array(daysInMonth + 1).fill(0);
    const dailyDayana = new Array(daysInMonth + 1).fill(0);
    const dailyTotal = new Array(daysInMonth + 1).fill(0);

    for (const p of pedidosMes) {
      const monto = parseFloat(p.total?.toString() || '0') || 0;
      const vendRaw = (p.vendedora_nombre || 'Sin Asesor').trim();
      const vendLower = vendRaw.toLowerCase();

      const dKey = toSvDateKey(p.created_at!);
      const dNum = Math.max(1, Math.min(daysInMonth, parseInt(dKey.split('-')[2] || '1', 10)));
      dailyTotal[dNum] += monto;

      let key = vendRaw;
      if (vendLower.includes('patricia')) {
        key = 'Patricia Elizabeth Mejía Ramírez';
        dailyPatricia[dNum] += monto;
      } else if (vendLower.includes('isis') || vendLower.includes('dayana')) {
        key = 'Isis Dayana';
        dailyDayana[dNum] += monto;
      }

      const prev = colabMap.get(key) || {
        nombre: vendRaw,
        shortName: vendRaw.split(' ')[0] || vendRaw,
        colorKey: 'indigo' as const,
        pedidosAcumulados: 0,
        ventasAcumuladas: 0,
        promedioDiario: 0,
        proyeccionFinMes: 0,
        pedidosProyectados: 0,
      };
      prev.pedidosAcumulados += 1;
      prev.ventasAcumuladas += monto;
      colabMap.set(key, prev);
    }

    let totalAcumuladoMes = 0;
    let totalPedidosMes = 0;

    const colaboradores = Array.from(colabMap.values()).map((c) => {
      const prom = c.ventasAcumuladas / daysElapsed;
      const proy = c.ventasAcumuladas * factorProyeccion;
      const pedProy = Math.round(c.pedidosAcumulados * factorProyeccion);
      totalAcumuladoMes += c.ventasAcumuladas;
      totalPedidosMes += c.pedidosAcumulados;
      return {
        ...c,
        promedioDiario: prom,
        proyeccionFinMes: proy,
        pedidosProyectados: pedProy,
      };
    });

    const totalPromedioDiario = totalAcumuladoMes / daysElapsed;
    const totalProyeccionMes = totalAcumuladoMes * factorProyeccion;
    const totalPedidosProyectados = Math.round(totalPedidosMes * factorProyeccion);

    // Construir puntos de curva acumulada (días 1..daysElapsed reales + proyección hasta daysInMonth)
    let accPat = 0;
    let accDay = 0;
    let accTot = 0;
    const patEntry = colaboradores.find((c) => c.colorKey === 'sky');
    const dayEntry = colaboradores.find((c) => c.colorKey === 'pink');

    const curvePoints: {
      day: number;
      isProjected: boolean;
      cumPat: number;
      cumDay: number;
      cumTot: number;
    }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      if (d <= daysElapsed) {
        accPat += dailyPatricia[d];
        accDay += dailyDayana[d];
        accTot += dailyTotal[d];
        curvePoints.push({
          day: d,
          isProjected: false,
          cumPat: accPat,
          cumDay: accDay,
          cumTot: accTot,
        });
      } else {
        const extraDays = d - daysElapsed;
        curvePoints.push({
          day: d,
          isProjected: true,
          cumPat: accPat + (patEntry?.promedioDiario || 0) * extraDays,
          cumDay: accDay + (dayEntry?.promedioDiario || 0) * extraDays,
          cumTot: accTot + totalPromedioDiario * extraDays,
        });
      }
    }

    return {
      monthLabel,
      daysInMonth,
      daysElapsed,
      daysRemaining,
      colaboradores,
      totalAcumuladoMes,
      totalPedidosMes,
      totalPromedioDiario,
      totalProyeccionMes,
      totalPedidosProyectados,
      curvePoints,
    };
  }, [validPedidos]);

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
    <div className="space-y-6 pb-10">
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

        {/* Gráfico 2 (a la derecha): Tendencia de Ventas */}
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
                <polyline
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.8"
                  points={trendInfo.points.map((p) => `${p.x},${p.y}`).join(' ')}
                />
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
                  <circle key={idx} cx={p.x} cy={p.y} r="2.2" fill="#4f46e5">
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
                <div className="w-full h-full flex items-end justify-center gap-0">
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

      {/* ==================================================================== */}
      {/* FILA 4: VENTAS ACUMULADAS DEL MES Y PROYECCIÓN A FIN DE MES (KÖDE)   */}
      {/* ==================================================================== */}
      <div className="clay-card p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Ventas Acumuladas del Mes ({proyeccionMensual.monthLabel}) y Proyección a Fin de Mes
            </h3>
            <p className="text-[11px] text-slate-500">
              Corte al día {proyeccionMensual.daysElapsed} de {proyeccionMensual.daysInMonth} ({proyeccionMensual.daysRemaining} días restantes) · Ritmo promedio diario proyectado al cierre del mes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
              Acumulado Real Hoy
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-sm bg-emerald-100 border-2 border-dashed border-emerald-600 inline-block" />
              Proyección Cierre de Mes
            </span>
          </div>
        </div>

        {/* Tarjetas de Resumen y Proyección Conjunta KÖDE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                Acumulado Conjunto Mes (Hoy)
              </span>
              <span className="text-xl font-mono font-black text-slate-900">
                ${proyeccionMensual.totalAcumuladoMes.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {proyeccionMensual.totalPedidosMes} pedidos en {proyeccionMensual.daysElapsed} días
              </span>
            </div>
            <div className="text-right font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-200">
              ${proyeccionMensual.totalPromedioDiario.toFixed(2)}
              <span className="block text-[9px] text-indigo-500 font-sans">prom. / día</span>
            </div>
          </div>

          {proyeccionMensual.colaboradores.map((c) => (
            <div
              key={c.nombre}
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                c.colorKey === 'sky'
                  ? 'bg-sky-50/60 border-sky-200'
                  : 'bg-pink-50/60 border-pink-200'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-black uppercase block ${
                    c.colorKey === 'sky' ? 'text-sky-800' : 'text-pink-800'
                  }`}
                >
                  {c.shortName} · Acumulado Mes
                </span>
                <span
                  className={`text-xl font-mono font-black ${
                    c.colorKey === 'sky' ? 'text-sky-900' : 'text-pink-900'
                  }`}
                >
                  ${c.ventasAcumuladas.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {c.pedidosAcumulados} ped. (${c.promedioDiario.toFixed(2)}/día)
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Proyección Fin de Mes
                </span>
                <span
                  className={`text-lg font-mono font-black ${
                    c.colorKey === 'sky' ? 'text-sky-700' : 'text-pink-700'
                  }`}
                >
                  ${c.proyeccionFinMes.toFixed(2)}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">
                  ~{c.pedidosProyectados} pedidos est.
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico Comparativo de Barras (Acumulado vs Proyección Individual y Conjunta KÖDE) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Sub-gráfico Izquierdo: Barras Acumulado Hoy vs Proyección Fin de Mes */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <div className="mb-3">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Comparativa: Acumulado Hoy vs. Proyección Cierre de Mes
              </h4>
              <p className="text-[10px] text-slate-500">
                Barra sólida = vendido hasta hoy · Barra punteada = estimado al día {proyeccionMensual.daysInMonth}
              </p>
            </div>

            {(() => {
              const maxScale = Math.max(proyeccionMensual.totalProyeccionMes, 1);
              const groups = [
                ...proyeccionMensual.colaboradores.map((c) => ({
                  label: c.shortName,
                  acumulado: c.ventasAcumuladas,
                  proyeccion: c.proyeccionFinMes,
                  pedidosAcum: c.pedidosAcumulados,
                  pedidosProy: c.pedidosProyectados,
                  barSolid:
                    c.colorKey === 'sky'
                      ? 'bg-sky-500 border-sky-600'
                      : 'bg-pink-500 border-pink-600',
                  barProj:
                    c.colorKey === 'sky'
                      ? 'bg-sky-100/90 border-2 border-dashed border-sky-500'
                      : 'bg-pink-100/90 border-2 border-dashed border-pink-500',
                  textSolid: c.colorKey === 'sky' ? 'text-sky-800' : 'text-pink-800',
                  textProj: c.colorKey === 'sky' ? 'text-sky-600' : 'text-pink-600',
                })),
                {
                  label: 'Total KÖDE (Conjunto)',
                  acumulado: proyeccionMensual.totalAcumuladoMes,
                  proyeccion: proyeccionMensual.totalProyeccionMes,
                  pedidosAcum: proyeccionMensual.totalPedidosMes,
                  pedidosProy: proyeccionMensual.totalPedidosProyectados,
                  barSolid: 'bg-emerald-600 border-emerald-700',
                  barProj: 'bg-emerald-100/90 border-2 border-dashed border-emerald-600',
                  textSolid: 'text-emerald-900',
                  textProj: 'text-emerald-700',
                },
              ];

              return (
                <div>
                  <div className="h-56 flex items-end justify-around gap-4 pt-8 pb-1 px-2 border-b border-slate-200">
                    {groups.map((g) => {
                      const hAcum =
                        g.acumulado > 0 ? Math.max((g.acumulado / maxScale) * 100, 8) : 2;
                      const hProy =
                        g.proyeccion > 0 ? Math.max((g.proyeccion / maxScale) * 100, 8) : 2;

                      return (
                        <div
                          key={g.label}
                          className="flex-1 h-full flex flex-col items-center justify-end"
                        >
                          <div className="w-full h-full flex items-end justify-center gap-1.5">
                            {/* Barra Acumulado Real */}
                            <div className="w-12 h-full flex flex-col items-center justify-end">
                              <span
                                className={`text-[10px] font-mono font-black mb-1 whitespace-nowrap ${g.textSolid}`}
                              >
                                ${g.acumulado.toFixed(0)}
                              </span>
                              <div
                                style={{ height: `${hAcum}%` }}
                                className={`w-full rounded-t-lg border shadow-sm transition-all ${g.barSolid}`}
                                title={`${g.label} Acumulado Hoy: $${g.acumulado.toFixed(2)} (${g.pedidosAcum} pedidos)`}
                              />
                            </div>

                            {/* Barra Proyección Fin de Mes */}
                            <div className="w-12 h-full flex flex-col items-center justify-end">
                              <span
                                className={`text-[10px] font-mono font-black mb-1 whitespace-nowrap ${g.textProj}`}
                              >
                                ${g.proyeccion.toFixed(0)}
                              </span>
                              <div
                                style={{ height: `${hProy}%` }}
                                className={`w-full rounded-t-lg transition-all ${g.barProj}`}
                                title={`${g.label} Proyección Fin de Mes: $${g.proyeccion.toFixed(2)} (~${g.pedidosProy} pedidos)`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-around gap-4 pt-2.5 px-2">
                    {groups.map((g) => (
                      <div key={g.label} className="flex-1 text-center">
                        <span className="text-xs font-black text-slate-800 block">
                          {g.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          +${Math.max(0, g.proyeccion - g.acumulado).toFixed(0)} est. restante
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Sub-gráfico Derecho: Curva de Evolución Acumulada del Mes (Día 1 al 30) */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Curva de Crecimiento Acumulado (Día 1 al {proyeccionMensual.daysInMonth})
                </h4>
                <p className="text-[10px] text-slate-500">
                  Línea continua = ventas reales hasta día {proyeccionMensual.daysElapsed} · Línea punteada = proyección al día {proyeccionMensual.daysInMonth}
                </p>
              </div>
              <div className="text-right shrink-0 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                <span className="text-[9px] font-black uppercase text-emerald-700 block">
                  Proyección Conjunta KÖDE
                </span>
                <span className="text-base font-mono font-black text-emerald-800">
                  ${proyeccionMensual.totalProyeccionMes.toFixed(2)}
                </span>
              </div>
            </div>

            {(() => {
              const pts = proyeccionMensual.curvePoints;
              const maxY = Math.max(proyeccionMensual.totalProyeccionMes, 1);
              const n = pts.length;

              const toCoord = (dayIdx: number, val: number) => {
                const x = n > 1 ? (dayIdx / (n - 1)) * 100 : 50;
                const y = 94 - (val / maxY) * 84;
                return { x, y };
              };

              const realPts = pts.filter((p) => !p.isProjected);
              const projPts = pts.filter(
                (p, i) => p.isProjected || i === realPts.length - 1
              );

              const polyRealTot = realPts
                .map((p) => {
                  const c = toCoord(p.day - 1, p.cumTot);
                  return `${c.x},${c.y}`;
                })
                .join(' ');
              const polyProjTot = projPts
                .map((p) => {
                  const c = toCoord(p.day - 1, p.cumTot);
                  return `${c.x},${c.y}`;
                })
                .join(' ');

              const polyRealPat = realPts
                .map((p) => {
                  const c = toCoord(p.day - 1, p.cumPat);
                  return `${c.x},${c.y}`;
                })
                .join(' ');
              const polyProjPat = projPts
                .map((p) => {
                  const c = toCoord(p.day - 1, p.cumPat);
                  return `${c.x},${c.y}`;
                })
                .join(' ');

              const polyRealDay = realPts
                .map((p) => {
                  const c = toCoord(p.day - 1, p.cumDay);
                  return `${c.x},${c.y}`;
                })
                .join(' ');
              const polyProjDay = projPts
                .map((p) => {
                  const c = toCoord(p.day - 1, p.cumDay);
                  return `${c.x},${c.y}`;
                })
                .join(' ');

              const todayX =
                n > 1 ? ((proyeccionMensual.daysElapsed - 1) / (n - 1)) * 100 : 50;

              return (
                <div>
                  <div className="h-48 w-full bg-white rounded-xl border border-slate-200/70 p-3 relative">
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="w-full h-full overflow-visible"
                    >
                      {/* Línea vertical del día actual */}
                      <line
                        x1={todayX}
                        y1="5"
                        x2={todayX}
                        y2="95"
                        stroke="#cbd5e1"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />

                      {/* Total KÖDE: Real + Proyección */}
                      <polyline
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.4"
                        points={polyRealTot}
                      />
                      <polyline
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2"
                        strokeDasharray="3,2"
                        points={polyProjTot}
                      />

                      {/* Patricia (Celeste): Real + Proyección */}
                      <polyline
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2"
                        points={polyRealPat}
                      />
                      <polyline
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="1.6"
                        strokeDasharray="2.5,2"
                        points={polyProjPat}
                      />

                      {/* Dayana (Rosa): Real + Proyección */}
                      <polyline
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="2"
                        points={polyRealDay}
                      />
                      <polyline
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="1.6"
                        strokeDasharray="2.5,2"
                        points={polyProjDay}
                      />
                    </svg>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
                      Conjunto KÖDE (${proyeccionMensual.totalAcumuladoMes.toFixed(0)} → $
                      {proyeccionMensual.totalProyeccionMes.toFixed(0)})
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-700">
                      <span className="w-3 h-0.5 bg-sky-500 inline-block" />
                      Patricia ($
                      {(
                        proyeccionMensual.colaboradores.find((c) => c.colorKey === 'sky')
                          ?.ventasAcumuladas || 0
                      ).toFixed(0)}{' '}
                      → $
                      {(
                        proyeccionMensual.colaboradores.find((c) => c.colorKey === 'sky')
                          ?.proyeccionFinMes || 0
                      ).toFixed(0)}
                      )
                    </span>
                    <span className="flex items-center gap-1.5 text-pink-700">
                      <span className="w-3 h-0.5 bg-pink-500 inline-block" />
                      Dayana ($
                      {(
                        proyeccionMensual.colaboradores.find((c) => c.colorKey === 'pink')
                          ?.ventasAcumuladas || 0
                      ).toFixed(0)}{' '}
                      → $
                      {(
                        proyeccionMensual.colaboradores.find((c) => c.colorKey === 'pink')
                          ?.proyeccionFinMes || 0
                      ).toFixed(0)}
                      )
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOQUE 1: INVENTARIO Y COMPRAS (QUÉ ESENCIAS COMPRAR POR KG VS ONZA) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="clay-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                1. Top Fragancias Más Vendidas (Candidatas a Compra por Kg / Garrafa)
              </h3>
              <p className="text-[11px] text-slate-500">
                Ranking por frascos vendidos y desglose Normal vs. Extra Shot
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              {productoAnalytics.totalUnidades} frascos totales
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2 px-2">Código</th>
                  <th className="py-2 px-2">Fragancia</th>
                  <th className="py-2 px-2 text-center">Normal</th>
                  <th className="py-2 px-2 text-center">Extra Shot</th>
                  <th className="py-2 px-2 text-center">Total Frascos</th>
                  <th className="py-2 px-2 text-right">Facturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productoAnalytics.topFragancias.map((f) => (
                  <tr key={f.codigo + f.contratipo} className="hover:bg-slate-50/70">
                    <td className="py-2 px-2 font-mono font-bold text-indigo-700">{f.codigo}</td>
                    <td className="py-2 px-2">
                      <div className="font-bold text-slate-800">{f.contratipo}</div>
                      <span className="text-[10px] text-slate-400">{f.marca} · {f.genero}</span>
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-700">{f.unidadesNormal}</td>
                    <td className="py-2 px-2 text-center font-mono text-purple-700 font-bold">{f.unidadesExtra}</td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-block font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {f.unidadesTotal}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                      ${f.montoFacturado.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mix Normal vs Extra Shot, Género y Casas */}
        <div className="clay-card p-5 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
              Mix de Concentración y Género
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Preferencia de clientes para orientar stock y pauta
            </p>

            {/* Normal vs Extra Shot */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">
                  Normal ({productoAnalytics.totalNormal} u.)
                </span>
                <span className="text-purple-700">
                  Extra Shot ({productoAnalytics.totalExtra} u.)
                </span>
              </div>
              <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${
                      productoAnalytics.totalUnidades > 0
                        ? (productoAnalytics.totalNormal / productoAnalytics.totalUnidades) * 100
                        : 50
                    }%`,
                  }}
                  className="bg-indigo-500 h-full"
                />
                <div className="bg-purple-600 h-full flex-1" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>
                  {productoAnalytics.totalUnidades > 0
                    ? ((productoAnalytics.totalNormal / productoAnalytics.totalUnidades) * 100).toFixed(1)
                    : '0.0'}
                  % Normal
                </span>
                <span>
                  {productoAnalytics.totalUnidades > 0
                    ? ((productoAnalytics.totalExtra / productoAnalytics.totalUnidades) * 100).toFixed(1)
                    : '0.0'}
                  % Extra Shot
                </span>
              </div>
            </div>

            {/* Rotación por Género */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                Demanda por Género
              </span>
              {(['Caballero', 'Dama', 'Unisex'] as const).map((g) => {
                const count = productoAnalytics.generoCount[g] || 0;
                const pct =
                  productoAnalytics.totalUnidades > 0
                    ? (count / productoAnalytics.totalUnidades) * 100
                    : 0;
                return (
                  <div key={g} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{g}</span>
                      <span className="font-mono text-slate-900">
                        {count} frascos ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full ${
                          g === 'Caballero'
                            ? 'bg-sky-500'
                            : g === 'Dama'
                            ? 'bg-pink-500'
                            : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Marcas Inspiradas */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-500 block mb-2">
              Top Casas / Marcas Solicitadas
            </span>
            <div className="space-y-1.5">
              {productoAnalytics.topMarcas.map((m) => (
                <div key={m.marca} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 truncate max-w-[150px]">{m.marca}</span>
                  <span className="font-mono text-slate-600">
                    <strong>{m.unidades}</strong> u. · ${m.monto.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOQUE 2: DESEMPEÑO DE ASESORAS (COMBOS) + DÍAS Y HORAS PICO          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="clay-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                2. Conversión en Combos y Ticket Promedio por Asesora
              </h3>
              <p className="text-[11px] text-slate-500">
                Efectividad de upselling (llevar al cliente de 1 frasco a combo de 2 o 3+)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 block">Ticket Promedio</span>
              <span className="text-lg font-black font-mono text-slate-900">
                ${comercialAnalytics.ticketPromedioGlobal.toFixed(2)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 block">Frascos / Pedido</span>
              <span className="text-lg font-black font-mono text-indigo-700">
                {comercialAnalytics.frascosPorPedidoGlobal.toFixed(2)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 block">% Pedidos en Combo</span>
              <span className="text-lg font-black font-mono text-emerald-700">
                {comercialAnalytics.pctCombosGlobal.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2 px-2">Asesora</th>
                  <th className="py-2 px-2 text-center">Pedidos</th>
                  <th className="py-2 px-2 text-right">Ticket Prom.</th>
                  <th className="py-2 px-2 text-center">Frascos/Ped.</th>
                  <th className="py-2 px-2 text-center">% Combos</th>
                  <th className="py-2 px-2 text-right">Ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comercialAnalytics.asesoras.map((a) => {
                  const ticket = a.pedidos > 0 ? a.ventas / a.pedidos : 0;
                  const fpp = a.pedidos > 0 ? a.frascos / a.pedidos : 0;
                  const pctCombo = a.pedidos > 0 ? (a.pedidosCombo / a.pedidos) * 100 : 0;
                  return (
                    <tr key={a.nombre} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-2 font-extrabold text-slate-900">{a.nombre}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                        {a.pedidos}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-indigo-700">
                        ${ticket.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-800">
                        {fpp.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {pctCombo.toFixed(0)}% ({a.pedidosCombo})
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-slate-900">
                        ${a.ventas.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Días de la Semana y Franjas Horarias */}
        <div className="clay-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Días Más Fuertes y Horarios Pico de Pedidos
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Para programar pauta publicitaria y turnos de atención en WhatsApp
            </p>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {comercialAnalytics.diasSemana.map((d) => {
                const maxSem = Math.max(...comercialAnalytics.diasSemana.map((x) => x.pedidos), 1);
                const pct = (d.pedidos / maxSem) * 100;
                return (
                  <div
                    key={d.label}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center"
                  >
                    <span className="text-[10px] font-black text-slate-600">{d.label}</span>
                    <span className="text-sm font-mono font-black text-indigo-700 mt-0.5">
                      {d.pedidos}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      ${d.monto.toFixed(0)}
                    </span>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full bg-indigo-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Franjas horarias */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-500 block">
              Distribución por Franja Horaria
            </span>
            {comercialAnalytics.franjasHorarias.map((f) => {
              const maxF = Math.max(...comercialAnalytics.franjasHorarias.map((x) => x.pedidos), 1);
              const pct = (f.pedidos / maxF) * 100;
              return (
                <div key={f.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">{f.label}</span>
                    <span className="font-mono text-slate-800">
                      <strong>{f.pedidos}</strong> ped. · ${f.monto.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-teal-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOQUE 3: FLUJO DE CAJA CCE (C807 EXPRESS) Y VENTAS POR DEPARTAMENTO */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="clay-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              3. Flujo de Caja C807 (CCE) y Tiempos de Entrega
            </h3>
            <p className="text-[11px] text-slate-500">
              Control de efectivo cobrado contra entrega y ciclo logístico
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 block">
                  Dinero en la Calle (En Ruta C807)
                </span>
                <span className="text-[11px] text-amber-700">
                  {logisticaAnalytics.pedidosEnRuta} paquetes enviados por cobrar
                </span>
              </div>
              <span className="text-lg font-mono font-black text-amber-900">
                ${logisticaAnalytics.cceEnRuta.toFixed(2)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 block">
                  CCE en Paquetes Ya Entregados
                </span>
                <span className="text-[11px] text-emerald-700">
                  {logisticaAnalytics.pedidosEntregados} pedidos entregados ({logisticaAnalytics.tasaEntrega.toFixed(1)}%)
                </span>
              </div>
              <span className="text-lg font-mono font-black text-emerald-800">
                ${logisticaAnalytics.cceEntregado.toFixed(2)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-800 block">
                  Tiempo Promedio de Entrega
                </span>
                <span className="text-[11px] text-indigo-700">
                  Desde registro del pedido hasta entrega C807
                </span>
              </div>
              <span className="text-lg font-mono font-black text-indigo-900">
                {logisticaAnalytics.diasPromedioEntrega.toFixed(1)} días
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500 block">
              Desglose por Modalidad de Pago
            </span>
            {logisticaAnalytics.metodosPago.map((m) => (
              <div key={m.metodo} className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">{m.metodo}</span>
                <span className="font-mono text-slate-800">
                  {m.pedidos} ped. · <strong>${m.monto.toFixed(2)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ventas y Efectividad de Entrega por Departamento */}
        <div className="clay-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Ventas y Efectividad de Entrega por Departamento
              </h3>
              <p className="text-[11px] text-slate-500">
                Volumen de pedidos, facturación y porcentaje de entregas completadas por zona
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2 px-2">Departamento</th>
                  <th className="py-2 px-2 text-center">Pedidos</th>
                  <th className="py-2 px-2 text-center">Entregados</th>
                  <th className="py-2 px-2 text-center">En Ruta</th>
                  <th className="py-2 px-2 text-center">% Efectividad</th>
                  <th className="py-2 px-2 text-right">Ventas ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logisticaAnalytics.departamentos.map((d) => {
                  const efect = d.pedidos > 0 ? (d.entregados / d.pedidos) * 100 : 0;
                  return (
                    <tr key={d.departamento} className="hover:bg-slate-50/70">
                      <td className="py-2 px-2 font-bold text-slate-800">{d.departamento}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                        {d.pedidos}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-emerald-700 font-bold">
                        {d.entregados}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-amber-700">
                        {d.enRuta}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="font-mono font-bold text-indigo-700">
                          {efect.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-black text-slate-900">
                        ${d.monto.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BLOQUE 4: RECOMPRA, RETENCIÓN Y TOP CLIENTES VIP                     */}
      {/* ==================================================================== */}
      <div className="clay-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              4. Retención, Recompra y Top 10 Clientes VIP
            </h3>
            <p className="text-[11px] text-slate-500">
              Clientes con mayor gasto acumulado y compras repetidas para campañas de fidelización por WhatsApp
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 font-bold mr-1.5">Clientes Únicos:</span>
              <strong className="font-mono text-slate-900">{clientesAnalytics.clientesUnicos}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <span className="text-emerald-700 font-bold mr-1.5">Recurrentes (2+):</span>
              <strong className="font-mono text-emerald-900">
                {clientesAnalytics.clientesRecurrentesCount} ({clientesAnalytics.tasaRecompra.toFixed(1)}%)
              </strong>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Cliente</th>
                <th className="py-2 px-2">WhatsApp</th>
                <th className="py-2 px-2">Departamento</th>
                <th className="py-2 px-2 text-center">Pedidos</th>
                <th className="py-2 px-2 text-center">Total Frascos</th>
                <th className="py-2 px-2 text-right">Total Comprado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesAnalytics.topVip.map((c, i) => (
                <tr key={c.key} className="hover:bg-slate-50/70">
                  <td className="py-2 px-2 font-mono font-bold text-slate-400">{i + 1}</td>
                  <td className="py-2 px-2 font-extrabold text-slate-900">{c.nombre}</td>
                  <td className="py-2 px-2 font-mono text-emerald-700 font-bold">{c.telefono}</td>
                  <td className="py-2 px-2 text-slate-600">{c.departamento}</td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-indigo-700">
                    {c.pedidosCount}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-700">
                    {c.frascosTotal}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-black text-emerald-700">
                    ${c.montoTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
