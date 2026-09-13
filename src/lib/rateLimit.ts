/**
 * Motor de Rate Limiting en memoria para Next.js App Router.
 * Utiliza una ventana deslizante con recolección de basura automática.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Limpieza automática cada 5 minutos de registros inactivos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Obtiene la dirección IP del cliente a partir de los encabezados de la petición.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

/**
 * Evalúa si una petición supera la tasa máxima permitida.
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): RateLimitResult {
  const ip = getClientIp(request);
  const key = `${options.keyPrefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  // Filtrar solo timestamps dentro de la ventana de tiempo
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.maxRequests) {
    const oldestTimestamp = record.timestamps[0] || now;
    const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + options.windowMs - now) / 1000));
    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, options.maxRequests - record.timestamps.length);
  const resetSeconds = Math.ceil(options.windowMs / 1000);

  return {
    allowed: true,
    limit: options.maxRequests,
    remaining,
    resetSeconds,
  };
}
