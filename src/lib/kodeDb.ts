import { Pool } from 'pg';

const connectionString =
  process.env.KODE_DATABASE_URL ||
  'postgresql://postgres.opvibkjnzmglxvijoufe:KodeSales2026!SecureDb@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

declare global {
  // eslint-disable-next-line no-var
  var __kodePool: Pool | undefined;
}

export const kodePool =
  global.__kodePool ||
  new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__kodePool = kodePool;
}

export async function queryKode(text: string, params?: any[]) {
  const start = Date.now();
  const res = await kodePool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    // console.log('Executed KODE query', { text, duration, rows: res.rowCount });
  }
  return res;
}
