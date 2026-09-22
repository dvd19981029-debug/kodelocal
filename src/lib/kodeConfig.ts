// src/lib/kodeConfig.ts
// Gestión centralizada y persistente de configuración para la marca KODE y Factura Llama

import fs from 'fs';
import path from 'path';

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
  ambiente: 'sandbox',
  testApiKey: 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1',
  liveApiKey: 'live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67',
  facturaLlamaApiKey: 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1',
  facturaLlamaApiVersion: '1',
  facturaLlamaBaseUrl: 'https://api.facturallama.com',
  defaultEmail: 'luisg@forbiddensoluciones.com',
  defaultDui: '123456789',
};

const CONFIG_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'kode_config.json');

/**
 * Retorna la API Key activa para Factura Llama según el ambiente configurado
 */
export function getActiveFacturaLlamaApiKey(config?: KodeConfig): string {
  const cfg = config || getKodeConfig();
  if (cfg.ambiente === 'sandbox') {
    return cfg.testApiKey || 'test_sk_45b8180f-9dab-44d5-9575-ba1487c73ed1';
  }
  return cfg.liveApiKey || cfg.facturaLlamaApiKey || 'live_sk_18558fbf-1c1b-445b-b124-b79fb4f45c67';
}

/**
 * Obtiene la configuración actual de KODE
 */
export function getKodeConfig(): KodeConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const content = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      const merged: KodeConfig = {
        ...DEFAULT_CONFIG,
        ...parsed,
      };

      // Garantizar que facturaLlamaApiKey coincida con el ambiente activo
      merged.facturaLlamaApiKey = getActiveFacturaLlamaApiKey(merged);

      return merged;
    }
  } catch (err) {
    console.warn('Error leyendo kode_config.json, usando valores por defecto:', err);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Guarda y actualiza la configuración de KODE
 */
export function saveKodeConfig(updates: Partial<KodeConfig>): KodeConfig {
  const current = getKodeConfig();
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

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando kode_config.json:', err);
  }

  return newConfig;
}
