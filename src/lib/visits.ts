import fs from 'fs';
import path from 'path';

export interface DailyVisitRecord {
  date: string; // YYYY-MM-DD
  visits: number;
  pageViews: number;
  devices?: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  sources?: Record<string, number>;
}

const VISITS_FILE = path.join(process.cwd(), 'src', 'lib', 'visitsData.json');

export function getTodayString(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });
}

export function loadVisitRecords(): Record<string, DailyVisitRecord> {
  try {
    if (fs.existsSync(VISITS_FILE)) {
      const content = fs.readFileSync(VISITS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading visits file:', e);
  }
  return {};
}

export function recordVisit(isNewSession: boolean = true, referrer: string = '', device: string = 'mobile') {
  try {
    const records = loadVisitRecords();
    const today = getTodayString();

    if (!records[today]) {
      records[today] = {
        date: today,
        visits: 0,
        pageViews: 0,
        devices: { mobile: 0, desktop: 0, tablet: 0 },
        sources: {},
      };
    }

    if (!records[today].devices) {
      records[today].devices = { mobile: 0, desktop: 0, tablet: 0 };
    }
    if (!records[today].sources) {
      records[today].sources = {};
    }

    if (isNewSession) {
      records[today].visits += 1;
      const devKey = device === 'desktop' ? 'desktop' : device === 'tablet' ? 'tablet' : 'mobile';
      records[today].devices[devKey] = (records[today].devices[devKey] || 0) + 1;

      // Clasificación de fuente real a partir de document.referrer
      let sourceName = 'Tráfico Directo';
      const refLower = (referrer || '').toLowerCase();
      if (refLower.includes('google')) sourceName = 'Búsqueda Google';
      else if (refLower.includes('instagram')) sourceName = 'Instagram';
      else if (refLower.includes('facebook') || refLower.includes('fb.')) sourceName = 'Facebook';
      else if (refLower.includes('whatsapp') || refLower.includes('wa.me')) sourceName = 'WhatsApp';
      else if (refLower.includes('tiktok')) sourceName = 'TikTok';
      else if (refLower) sourceName = 'Enlace Externo';

      records[today].sources[sourceName] = (records[today].sources[sourceName] || 0) + 1;
    }
    records[today].pageViews += 1;

    fs.writeFileSync(VISITS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error recording visit:', e);
  }
}

export function getVisitMetricsForPeriod(
  period: 'hoy' | '7d' | 'mes' | 'anio' | 'todo',
  ordersCount: number = 0
): {
  totalVisitas: number;
  totalVistasPagina: number;
  tasaConversion: number;
  dispositivos: { mobile: number; desktop: number; tablet: number };
  fuentes: Record<string, number>;
} {
  const records = loadVisitRecords();
  const today = getTodayString();
  const now = new Date();

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
    mobile: filteredDays.reduce((acc, r) => acc + (r.devices?.mobile || 0), 0),
    desktop: filteredDays.reduce((acc, r) => acc + (r.devices?.desktop || 0), 0),
    tablet: filteredDays.reduce((acc, r) => acc + (r.devices?.tablet || 0), 0),
  };

  const fuentes: Record<string, number> = {};
  filteredDays.forEach((r) => {
    if (r.sources) {
      Object.entries(r.sources).forEach(([src, count]) => {
        fuentes[src] = (fuentes[src] || 0) + count;
      });
    }
  });

  return {
    totalVisitas,
    totalVistasPagina,
    tasaConversion,
    dispositivos,
    fuentes,
  };
}
