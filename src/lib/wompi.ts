import crypto from 'crypto';
import { queryKode } from './kodeDb';

export type WompiBrand = 'aromaniak' | 'kode';

interface WompiTokenCache {
  token: string;
  expiresAt: number; // timestamp ms
  appId: string;
}

const tokenCacheByAppId = new Map<string, WompiTokenCache>();
let cachedKodeDbCreds: { appId: string; apiSecret: string } | null = null;

const WOMPI_AUTH_URL = (process.env.WOMPI_AUTH_URL || 'https://id.wompi.sv').trim().replace(/^["']+|["']+$/g, '');
const WOMPI_API_URL = (process.env.WOMPI_API_URL || 'https://api.wompi.sv').trim().replace(/^["']+|["']+$/g, '');

function cleanEnvValue(val?: string): string {
  return (val || '').trim().replace(/^["']+|["']+$/g, '').trim();
}

function ensureWompiConfig(brand: WompiBrand = 'aromaniak'): { appId: string; apiSecret: string } {
  if (brand === 'kode') {
    const kodeAppId = cleanEnvValue(process.env.KODE_WOMPI_APP_ID) || cachedKodeDbCreds?.appId || '';
    const kodeSecret = cleanEnvValue(process.env.KODE_WOMPI_API_SECRET) || cachedKodeDbCreds?.apiSecret || '';
    if (kodeAppId && kodeSecret) {
      return { appId: kodeAppId, apiSecret: kodeSecret };
    }
  }

  const appId = cleanEnvValue(process.env.WOMPI_APP_ID);
  const apiSecret = cleanEnvValue(process.env.WOMPI_API_SECRET);
  if (!appId || !apiSecret) {
    throw new Error('Configuración de Wompi incompleta: defina WOMPI_APP_ID y WOMPI_API_SECRET en las variables de entorno (.env).');
  }
  return { appId, apiSecret };
}

async function resolveWompiConfigAsync(brand: WompiBrand = 'aromaniak'): Promise<{ appId: string; apiSecret: string }> {
  if (brand === 'kode') {
    const envAppId = cleanEnvValue(process.env.KODE_WOMPI_APP_ID);
    const envSecret = cleanEnvValue(process.env.KODE_WOMPI_API_SECRET);
    if (envAppId && envSecret) {
      return { appId: envAppId, apiSecret: envSecret };
    }
    if (cachedKodeDbCreds?.appId && cachedKodeDbCreds?.apiSecret) {
      return cachedKodeDbCreds;
    }
    try {
      const res = await queryKode(
        `SELECT value FROM public.kode_config WHERE key = 'wompi_credentials' LIMIT 1;`
      );
      const val = res?.rows?.[0]?.value;
      const dbAppId = cleanEnvValue(val?.appId);
      const dbSecret = cleanEnvValue(val?.apiSecret);
      if (dbAppId && dbSecret) {
        cachedKodeDbCreds = { appId: dbAppId, apiSecret: dbSecret };
        return cachedKodeDbCreds;
      }
    } catch (err) {
      console.warn('Aviso: No se pudo cargar wompi_credentials de public.kode_config:', err);
    }
    throw new Error('Configuración de Wompi KÖDE incompleta: defina KODE_WOMPI_APP_ID y KODE_WOMPI_API_SECRET.');
  }

  return ensureWompiConfig('aromaniak');
}

/**
 * Obtiene el token de autenticación OAuth 2.0 de Wompi El Salvador.
 * El token se almacena en memoria por App ID y se reutiliza hasta que esté próximo a expirar.
 */
export async function getWompiToken(brand: WompiBrand = 'aromaniak'): Promise<string> {
  const { appId, apiSecret } = await resolveWompiConfigAsync(brand);
  const now = Date.now();

  const cached = tokenCacheByAppId.get(appId);
  if (cached && cached.appId === appId && cached.expiresAt > now + 120 * 1000) {
    return cached.token;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', appId);
  params.append('client_secret', apiSecret);
  params.append('audience', 'wompi_api');

  const res = await fetch(`${WOMPI_AUTH_URL}/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error obteniendo token de Wompi [${res.status}]: ${errorText}`);
  }

  const data = await res.json();
  const expiresInSeconds = data.expires_in || 3600;

  tokenCacheByAppId.set(appId, {
    token: data.access_token,
    expiresAt: now + expiresInSeconds * 1000,
    appId,
  });

  return data.access_token;
}

export interface CreatePaymentLinkParams {
  orderNumber: string;
  amount: number;
  productName?: string;
  productDescription?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  redirectUrl: string;
  returnUrl: string;
  webhookUrl?: string;
  brand?: WompiBrand;
}

export interface WompiLinkResponse {
  idEnlace: number;
  urlEnlace: string;
  urlQrCodeEnlace: string;
  estaProductivo: boolean;
  urlEnlaceLargo?: string;
}

/**
 * Crea un Enlace de Pago seguro en Wompi SV con monto bloqueado y opciones bancarias.
 */
export async function createWompiPaymentLink(params: CreatePaymentLinkParams): Promise<WompiLinkResponse> {
  const brand: WompiBrand = params.brand || 'aromaniak';
  const token = await getWompiToken(brand);

  const payload: any = {
    identificadorEnlaceComercio: params.orderNumber,
    monto: Number(params.amount.toFixed(2)),
    nombreProducto: params.productName || `Pedido Aromaniak #${params.orderNumber}`,
    formaPago: {
      permitirTarjetaCreditoDebido: true,
      permitirPagoConPuntoAgricola: true,
      permitirPagoEnCuotasAgricola: false,
      permitirPagoEnBitcoin: false,
      permitePagoQuickPay: true,
    },
    infoProducto: {
      descripcionProducto: params.productDescription || `Perfumes y fragancias finas Aromaniak SV - Pedido #${params.orderNumber}`,
    },
    configuracion: {
      urlRedirect: params.redirectUrl,
      urlRetorno: params.returnUrl,
      esMontoEditable: false,
      esCantidadEditable: false,
      cantidadPorDefecto: 1,
      notificarTransaccionCliente: Boolean(params.customerEmail),
    },
  };

  if (params.customerEmail) {
    payload.configuracion.emailsNotificacion = params.customerEmail;
  }
  if (params.webhookUrl) {
    payload.configuracion.urlWebhook = params.webhookUrl;
  }
  if (params.customerPhone) {
    // Wompi exige que los teléfonos de notificación sean salvadoreños de 8 dígitos sin guiones ni prefijo +503
    const cleanPhone = params.customerPhone.replace(/\D/g, '');
    const svPhone = cleanPhone.startsWith('503') && cleanPhone.length === 11 ? cleanPhone.slice(3) : cleanPhone;
    if (svPhone.length === 8) {
      payload.configuracion.telefonosNotificacion = svPhone;
    }
  }

  const res = await fetch(`${WOMPI_API_URL}/EnlacePago`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error en Wompi EnlacePago [${res.status}]: ${errorText}`);
  }

  const data = await res.json();
  return data as WompiLinkResponse;
}

function verifyHmacWithSecret(rawBody: string, receivedHash: string, secret: string): boolean {
  if (!secret) return false;
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody, 'utf8');
    const calculatedHash = hmac.digest('hex');
    const a = Buffer.from(calculatedHash.toLowerCase());
    const b = Buffer.from(receivedHash.toLowerCase());
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Valida el sello de seguridad criptográfico enviado por Wompi en el Webhook (Aromaniak o KÖDE).
 */
export function validateWompiWebhook(rawBody: string, receivedHash?: string | null): boolean {
  if (!receivedHash) return false;
  const aroSecret = cleanEnvValue(process.env.WOMPI_API_SECRET);
  const kodeSecret = cleanEnvValue(process.env.KODE_WOMPI_API_SECRET) || cachedKodeDbCreds?.apiSecret || '';

  return (
    verifyHmacWithSecret(rawBody, receivedHash, aroSecret) ||
    verifyHmacWithSecret(rawBody, receivedHash, kodeSecret)
  );
}

export async function validateWompiWebhookAsync(rawBody: string, receivedHash?: string | null): Promise<boolean> {
  if (!receivedHash) return false;
  if (validateWompiWebhook(rawBody, receivedHash)) return true;
  try {
    const kodeCfg = await resolveWompiConfigAsync('kode');
    return verifyHmacWithSecret(rawBody, receivedHash, kodeCfg.apiSecret);
  } catch {
    return false;
  }
}

/**
 * Consulta el estado y detalle de una transacción directamente en Wompi por su IdTransaccion.
 */
export async function getWompiTransaction(transactionId: string, brand: WompiBrand = 'aromaniak'): Promise<any> {
  const token = await getWompiToken(brand);

  const res = await fetch(`${WOMPI_API_URL}/TransaccionCompra/${transactionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error consultando transacción Wompi [${res.status}]: ${errorText}`);
  }

  return await res.json();
}

/**
 * Consulta un Enlace de Pago por su idEnlace en Wompi SV para verificar si tiene transacciones aprobadas.
 */
export async function getWompiPaymentLinkDetails(idEnlace: number | string, brand: WompiBrand = 'aromaniak'): Promise<any> {
  const token = await getWompiToken(brand);

  const res = await fetch(`${WOMPI_API_URL}/EnlacePago/${idEnlace}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error consultando EnlacePago Wompi [${res.status}]: ${errorText}`);
  }

  return await res.json();
}

