/**
 * Motor de Rate Limiting Híbrido para Next.js App Router (REQ-SEC-01).
 * Soporta Upstash Redis distribuido para entornos Serverless multi-instancia (Vercel),
 * con degradación elegante y fallback automático a memoria local en caso de ausencia
 * de credenciales o fallos temporales de red.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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

// 1. Inicialización singleton de Upstash Redis si las variables de entorno están presentes
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
if (upstashUrl && upstashToken) {
  try {
    redisClient = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });
  } catch (err) {
    console.warn('⚠️ [RateLimit] No se pudo inicializar Upstash Redis, operando en modo local:', err);
  }
}

// 2. Almacén en memoria local (Fallback seguro para local/staging o contingencia)
interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

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
 * Verificación local en memoria RAM (Fallback).
 */
function checkMemoryRateLimit(ip: string, options: RateLimitOptions): RateLimitResult {
  const key = `${options.keyPrefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

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

// Cache de limitadores Upstash por configuración
const upstashLimiters = new Map<string, Ratelimit>();

/**
 * Evalúa si una petición supera la tasa máxima permitida.
 * Intenta primero en Redis distribuido; si no está disponible, evalúa en memoria local.
 */
export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const ip = getClientIp(request);

  if (redisClient) {
    try {
      const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
      const limiterKey = `${options.keyPrefix}:${options.maxRequests}:${windowSeconds}`;

      let ratelimit = upstashLimiters.get(limiterKey);
      if (!ratelimit) {
        ratelimit = new Ratelimit({
          redis: redisClient,
          limiter: Ratelimit.slidingWindow(options.maxRequests, `${windowSeconds} s`),
          prefix: `kodelocal_rl:${options.keyPrefix}`,
          analytics: false,
        });
        upstashLimiters.set(limiterKey, ratelimit);
      }

      const result = await ratelimit.limit(ip);
      const resetSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetSeconds,
      };
    } catch (redisErr) {
      console.warn('⚠️ [RateLimit] Error en Upstash Redis, recurriendo a fallback en memoria:', redisErr);
    }
  }

  return checkMemoryRateLimit(ip, options);
}
