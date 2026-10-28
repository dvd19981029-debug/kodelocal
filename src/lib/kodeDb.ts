import { Pool } from 'pg';

const connectionString =
  process.env.KODE_DATABASE_URL ||
  'postgresql://postgres.opvibkjnzmglxvijoufe:KodeSales2026!SecureDb@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

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
    max: 6,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 8000,
    query_timeout: 15000,
    statement_timeout: 15000,
    keepAlive: true,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__kodePool = kodePool;
}

export async function queryKode(text: string, params?: any[]) {
  try {
    return await kodePool.query(text, params);
  } catch (err: any) {
    const msg = String(err?.message || '');
    const isTransientConnectionError =
      msg.includes('Connection terminated') ||
      msg.includes('connection timeout') ||
      msg.includes('ECONNRESET') ||
      msg.includes('Client has encountered a connection error');
    if (isTransientConnectionError) {
      return await kodePool.query(text, params);
    }
    throw err;
  }
}
