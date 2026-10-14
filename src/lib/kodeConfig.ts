// src/lib/kodeConfig.ts
// Gestión centralizada y persistente de configuración para la marca KODE y Factura Llama

import fs from 'fs';
import path from 'path';
import { queryKode } from './kodeDb';

export type KodeEnvironment = 'sandbox' | 'produccion';

export interface KodeConfig {
  ambiente: KodeEnvironment;
  testApiKey: string;
  liveApiKey: string;
  facturaLlamaApiKey: string; // Clave activa según el ambiente
  facturaLlamaApiVersion: string;
  facturaLlamaBaseUrl: string;
  defaultEmail: string;
  defaultDui: string;
  updatedAt?: string;
}

const DEFAULT_CONFIG: KodeConfig = {
  ambiente: 'produccion',
  testApiKey: 'test_sk_77425a0a-6d88-490e-a006-07cdd031b05c',
  liveApiKey: 'live_sk_1b857a22-475e-4966-a80b-54a7f80f0177',
  facturaLlamaApiKey: 'live_sk_1b857a22-475e-4966-a80b-54a7f80f0177',
  facturaLlamaApiVersion: '1',
  facturaLlamaBaseUrl: 'https://api.facturallama.com',
  defaultEmail: 'luisg@forbiddensoluciones.com',
  defaultDui: '123456789',
};

const CONFIG_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'kode_config.json');

// Memoria en caliente para Serverless
let cachedConfig: KodeConfig | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10000; // 10 segundos

/**
 * Retorna la API Key activa para Factura Llama según el ambiente configurado
 */
export function getActiveFacturaLlamaApiKey(config?: KodeConfig): string {
  const cfg = config || getKodeConfig();
  if (cfg.ambiente === 'sandbox') {
    return cfg.testApiKey || 'test_sk_77425a0a-6d88-490e-a006-07cdd031b05c';
  }
  return cfg.liveApiKey || cfg.facturaLlamaApiKey || 'live_sk_1b857a22-475e-4966-a80b-54a7f80f0177';
}

/**
 * Retorna la API Key activa para Factura Llama asíncronamente leyendo de la base de datos
 */
export async function getActiveFacturaLlamaApiKeyAsync(): Promise<string> {
  const config = await getKodeConfigAsync();
  return getActiveFacturaLlamaApiKey(config);
}

/**
 * Asegura la existencia de la tabla en base de datos
 */
async function ensureConfigTable() {
  try {
    await queryKode(`
      CREATE TABLE IF NOT EXISTS public.kode_config (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch {
    // Silencioso si ya existe
  }
}

/**
 * Obtiene la configuración actual de KODE asíncronamente desde la base de datos (Supabase)
 */
export async function getKodeConfigAsync(): Promise<KodeConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    await ensureConfigTable();
    const res = await queryKode(`SELECT value FROM public.kode_config WHERE key = 'active_config' LIMIT 1;`);
    if (res && res.rows && res.rows.length > 0) {
      const dbValue = res.rows[0].value;
      const merged: KodeConfig = {
        ...DEFAULT_CONFIG,
        ...dbValue,
      };
      merged.facturaLlamaApiKey = getActiveFacturaLlamaApiKey(merged);
      cachedConfig = merged;
      lastCacheTime = now;
      return merged;
    }
  } catch (err) {
    console.warn('Aviso: No se pudo leer kode_config desde DB, usando fallback:', err);
  }

  // Fallback a archivo local o memoria
  const fallback = getKodeConfig();
  cachedConfig = fallback;
  lastCacheTime = now;
  return fallback;
}

/**
 * Obtiene la configuración actual de KODE sincrónicamente (desde caché o archivo local)
 */
export function getKodeConfig(): KodeConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const content = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      const merged: KodeConfig = {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
      merged.facturaLlamaApiKey = getActiveFacturaLlamaApiKey(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Error leyendo kode_config.json, usando valores por defecto:', err);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Guarda y actualiza la configuración de KODE asíncronamente en PostgreSQL (Supabase)
 */
export async function saveKodeConfigAsync(updates: Partial<KodeConfig>): Promise<KodeConfig> {
  const current = await getKodeConfigAsync();
  const nextAmbiente: KodeEnvironment = updates.ambiente || current.ambiente;
  const nextTestKey = updates.testApiKey !== undefined ? updates.testApiKey : current.testApiKey;
  const nextLiveKey = updates.liveApiKey !== undefined ? updates.liveApiKey : current.liveApiKey;

  // Determinar la clave activa
  const activeKey = nextAmbiente === 'sandbox'
    ? (nextTestKey || 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1')
    : (nextLiveKey || 'live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67');

  const newConfig: KodeConfig = {
    ...current,
    ...updates,
    ambiente: nextAmbiente,
    testApiKey: nextTestKey,
    liveApiKey: nextLiveKey,
    facturaLlamaApiKey: activeKey,
    updatedAt: new Date().toISOString(),
  };

  // 1. Guardar de forma permanente en PostgreSQL (Supabase)
  try {
    await ensureConfigTable();
    await queryKode(
      `INSERT INTO public.kode_config (key, value, updated_at)
       VALUES ('active_config', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
      [JSON.stringify(newConfig)]
    );
  } catch (err) {
    console.error('Error guardando en public.kode_config DB:', err);
  }

  // 2. Intentar guardar en disco local (útil en dev local)
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
  } catch {
    // Ignorar en Vercel Serverless (sistema de archivos de solo lectura)
  }

  // 3. Actualizar memoria caché
  cachedConfig = newConfig;
  lastCacheTime = Date.now();

  return newConfig;
}

/**
 * Guarda y actualiza la configuración de KODE sincrónicamente (compatibilidad)
 */
export function saveKodeConfig(updates: Partial<KodeConfig>): KodeConfig {
  const current = getKodeConfig();
  const nextAmbiente: KodeEnvironment = updates.ambiente || current.ambiente;
  const nextTestKey = updates.testApiKey !== undefined ? updates.testApiKey : current.testApiKey;
  const nextLiveKey = updates.liveApiKey !== undefined ? updates.liveApiKey : current.liveApiKey;

  const activeKey = nextAmbiente === 'sandbox'
    ? (nextTestKey || 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1')
    : (nextLiveKey || 'live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67');

  const newConfig: KodeConfig = {
    ...current,
    ...updates,
    ambiente: nextAmbiente,
    testApiKey: nextTestKey,
    liveApiKey: nextLiveKey,
    facturaLlamaApiKey: activeKey,
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
  } catch {
    // Ignorar en Vercel
  }

  cachedConfig = newConfig;
  lastCacheTime = Date.now();

  // En segundo plano persistir en DB
  saveKodeConfigAsync(updates).catch((e) => console.error('Error async saving kodeConfig:', e));

  return newConfig;
}
