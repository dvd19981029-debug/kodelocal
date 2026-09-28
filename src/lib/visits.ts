import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export interface DailyVisitRecord {
  date: string; // YYYY-MM-DD
  visits: number;
  pageViews: number;
  mobile: number;
  desktop: number;
  tablet: number;
  sources: Record<string, number>;
  hours: Record<string, number>;
}

export interface VisitChartPoint {
  label: string;
  dateKey?: string;
  visits: number;
  pageViews: number;
}

const VISITS_FILE = path.join(process.cwd(), 'src', 'lib', 'visitsData.json');

export function getTodayString(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });
}

export function getCurrentHourString(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    timeZone: 'America/El_Salvador',
    hour12: false,
    hour: '2-digit',
  });
}

function classifySource(referrer: string): string {
  if (!referrer) return 'Tráfico Directo';
  const refLower = referrer.toLowerCase();
  if (refLower.includes('google')) return 'Búsqueda Google';
  if (refLower.includes('instagram')) return 'Instagram';
  if (refLower.includes('facebook') || refLower.includes('fb.')) return 'Facebook';
  if (refLower.includes('whatsapp') || refLower.includes('wa.me')) return 'WhatsApp';
  if (refLower.includes('tiktok')) return 'TikTok';
  return 'Enlace Externo';
}

export async function recordVisit(
  isNewSession: boolean = true,
  referrer: string = '',
  device: string = 'mobile'
) {
  const today = getTodayString();
  const currentHour = getCurrentHourString();
  const sourceName = classifySource(referrer);
  const devKey = device === 'desktop' ? 'desktop' : device === 'tablet' ? 'tablet' : 'mobile';

  // 1. Persistencia ultraligera en Supabase (1 única fila por día, cero consumo de créditos)
  try {
    const existing = await prisma.dailyVisit.findUnique({
      where: { date: today },
    });

    let currentHours: Record<string, number> = {};
    let currentSources: Record<string, number> = {};

    if (existing?.hours) {
      try {
        currentHours = JSON.parse(existing.hours);
      } catch {}
    }
    if (existing?.sources) {
      try {
        currentSources = JSON.parse(existing.sources);
      } catch {}
    }

    currentHours[currentHour] = (currentHours[currentHour] || 0) + (isNewSession ? 1 : 0);
    if (isNewSession) {
      currentSources[sourceName] = (currentSources[sourceName] || 0) + 1;
    }

    await prisma.dailyVisit.upsert({
      where: { date: today },
      update: {
        visits: { increment: isNewSession ? 1 : 0 },
        pageViews: { increment: 1 },
        mobile: { increment: devKey === 'mobile' && isNewSession ? 1 : 0 },
        desktop: { increment: devKey === 'desktop' && isNewSession ? 1 : 0 },
        tablet: { increment: devKey === 'tablet' && isNewSession ? 1 : 0 },
        hours: JSON.stringify(currentHours),
        sources: JSON.stringify(currentSources),
      },
      create: {
        date: today,
        visits: isNewSession ? 1 : 0,
        pageViews: 1,
        mobile: devKey === 'mobile' && isNewSession ? 1 : 0,
        desktop: devKey === 'desktop' && isNewSession ? 1 : 0,
        tablet: devKey === 'tablet' && isNewSession ? 1 : 0,
        hours: JSON.stringify(currentHours),
        sources: JSON.stringify(currentSources),
      },
    });
  } catch (error) {
    // Si Supabase no responde o falla la red, no bloquea el request
    console.error('Error recording visit to Supabase:', error);
  }

  // 2. Backup local en visitsData.json para entorno local sin latencia
  try {
    let records: Record<string, any> = {};
    if (fs.existsSync(VISITS_FILE)) {
      try {
        records = JSON.parse(fs.readFileSync(VISITS_FILE, 'utf-8'));
      } catch {}
    }
    if (!records[today]) {
      records[today] = {
        date: today,
        visits: 0,
        pageViews: 0,
        devices: { mobile: 0, desktop: 0, tablet: 0 },
        sources: {},
        hours: {},
      };
    }
    if (!records[today].devices) records[today].devices = { mobile: 0, desktop: 0, tablet: 0 };
    if (!records[today].sources) records[today].sources = {};
    if (!records[today].hours) records[today].hours = {};

    if (isNewSession) {
      records[today].visits += 1;
      records[today].devices[devKey] = (records[today].devices[devKey] || 0) + 1;
      records[today].sources[sourceName] = (records[today].sources[sourceName] || 0) + 1;
      records[today].hours[currentHour] = (records[today].hours[currentHour] || 0) + 1;
    }
    records[today].pageViews += 1;

    fs.writeFileSync(VISITS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch {}
}

export async function getVisitMetricsForPeriod(
  period: 'hoy' | '7d' | 'mes' | 'anio' | 'todo',
  ordersCount: number = 0
): Promise<{
  totalVisitas: number;
  totalVistasPagina: number;
  tasaConversion: number;
  dispositivos: { mobile: number; desktop: number; tablet: number };
  fuentes: Record<string, number>;
  graficaVisitas: VisitChartPoint[];
}> {
  const today = getTodayString();
  const now = new Date();

  // Intentar cargar desde Supabase (1 sola consulta indexada con < 35 filas)
  let dbRows: any[] = [];
  try {
    dbRows = await prisma.dailyVisit.findMany({
      orderBy: { date: 'asc' },
    });
  } catch (err) {
    console.error('Error fetching visits from Supabase:', err);
  }

  // Si Supabase devolvió registros, convertirlos a formato estándar
  let records: Record<string, DailyVisitRecord> = {};
  if (dbRows && dbRows.length > 0) {
    dbRows.forEach((r) => {
      let hoursMap: Record<string, number> = {};
      let sourcesMap: Record<string, number> = {};
      try {
        if (r.hours) hoursMap = JSON.parse(r.hours);
      } catch {}
      try {
        if (r.sources) sourcesMap = JSON.parse(r.sources);
      } catch {}

      records[r.date] = {
        date: r.date,
        visits: r.visits || 0,
        pageViews: r.pageViews || 0,
        mobile: r.mobile || 0,
        desktop: r.desktop || 0,
        tablet: r.tablet || 0,
        sources: sourcesMap,
        hours: hoursMap,
      };
    });
  } else {
    // Fallback al archivo local
    try {
      if (fs.existsSync(VISITS_FILE)) {
        const fileContent = JSON.parse(fs.readFileSync(VISITS_FILE, 'utf-8'));
        Object.entries(fileContent).forEach(([d, val]: [string, any]) => {
          records[d] = {
            date: d,
            visits: val.visits || 0,
            pageViews: val.pageViews || 0,
            mobile: val.devices?.mobile || 0,
            desktop: val.devices?.desktop || 0,
            tablet: val.devices?.tablet || 0,
            sources: val.sources || {},
            hours: val.hours || {},
          };
        });
      }
    } catch {}
  }

  // Filtrar según el período solicitado
  let filteredDays = Object.values(records);

  if (period === 'hoy') {
    filteredDays = filteredDays.filter((r) => r.date === today);
  } else if (period === '7d') {
    const sevenDaysAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
      timeZone: 'America/El_Salvador',
    });
    filteredDays = filteredDays.filter((r) => r.date >= sevenDaysAgoStr);
  } else if (period === 'mes') {
    const [y, m] = today.split('-');
    const monthPrefix = `${y}-${m}`;
    filteredDays = filteredDays.filter((r) => r.date.startsWith(monthPrefix));
  } else if (period === 'anio') {
    const [y] = today.split('-');
    filteredDays = filteredDays.filter((r) => r.date.startsWith(y));
  }

  const totalVisitas = filteredDays.reduce((acc, r) => acc + (r.visits || 0), 0);
  const totalVistasPagina = filteredDays.reduce((acc, r) => acc + (r.pageViews || 0), 0);
  const tasaConversion =
    totalVisitas > 0 ? Math.min(100, Number(((ordersCount / totalVisitas) * 100).toFixed(2))) : 0;

  const dispositivos = {
    mobile: filteredDays.reduce((acc, r) => acc + (r.mobile || 0), 0),
    desktop: filteredDays.reduce((acc, r) => acc + (r.desktop || 0), 0),
    tablet: filteredDays.reduce((acc, r) => acc + (r.tablet || 0), 0),
  };

  const fuentes: Record<string, number> = {};
  filteredDays.forEach((r) => {
    if (r.sources) {
      Object.entries(r.sources).forEach(([src, count]) => {
        fuentes[src] = (fuentes[src] || 0) + count;
      });
    }
  });

  // Generar Puntos de la Gráfica (por Día/Horas, Semana o Mes)
  const graficaVisitas: VisitChartPoint[] = [];

  if (period === 'hoy') {
    // Gráfica de 24 horas para el día de hoy (de 00:00 a 23:00)
    const todayRecord = records[today];
    const todayHours = todayRecord?.hours || {};
    for (let h = 0; h < 24; h++) {
      const hourStr = String(h).padStart(2, '0');
      const v = todayHours[hourStr] || 0;
      graficaVisitas.push({
        label: `${hourStr}:00`,
        visits: v,
        pageViews: v > 0 ? Math.round(v * 1.5) : 0,
      });
    }
  } else if (period === '7d') {
    // Gráfica de los últimos 7 días
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });
      const dayName = daysOfWeek[targetDate.getDay()];
      const dayNum = targetDate.getDate();
      const rec = records[dateStr];
      graficaVisitas.push({
        label: `${dayName} ${dayNum}`,
        dateKey: dateStr,
        visits: rec?.visits || 0,
        pageViews: rec?.pageViews || 0,
      });
    }
  } else if (period === 'mes') {
    // Gráfica de todos los días transcurridos del mes en curso
    const [yStr, mStr] = today.split('-');
    const currentDay = parseInt(today.split('-')[2], 10);
    for (let d = 1; d <= currentDay; d++) {
      const dStr = String(d).padStart(2, '0');
      const dateKey = `${yStr}-${mStr}-${dStr}`;
      const rec = records[dateKey];
      graficaVisitas.push({
        label: `${d} Sep`,
        dateKey,
        visits: rec?.visits || 0,
        pageViews: rec?.pageViews || 0,
      });
    }
  } else {
    // Gráfica mensual para 'anio' o 'todo' (Ene a Dic)
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonthIdx = now.getMonth();
    for (let m = 0; m <= currentMonthIdx; m++) {
      const monthStr = String(m + 1).padStart(2, '0');
      const prefix = `2026-${monthStr}`;
      const monthVisits = Object.values(records)
        .filter((r) => r.date.startsWith(prefix))
        .reduce((sum, r) => sum + r.visits, 0);
      const monthPages = Object.values(records)
        .filter((r) => r.date.startsWith(prefix))
        .reduce((sum, r) => sum + r.pageViews, 0);
      graficaVisitas.push({
        label: months[m],
        visits: monthVisits,
        pageViews: monthPages,
      });
    }
  }

  return {
    totalVisitas,
    totalVistasPagina,
    tasaConversion,
    dispositivos,
    fuentes,
    graficaVisitas,
  };
}
