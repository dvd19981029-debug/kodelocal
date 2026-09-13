import crypto from 'crypto';

interface WompiTokenCache {
  token: string;
  expiresAt: number; // timestamp ms
}

let tokenCache: WompiTokenCache | null = null;

const WOMPI_APP_ID = process.env.WOMPI_APP_ID || '27997c46-d68e-4a5f-8725-a930fb1e5aa0';
const WOMPI_API_SECRET = process.env.WOMPI_API_SECRET || '5376bdd2-4d1a-4146-983c-7b4012728a55';
const WOMPI_AUTH_URL = process.env.WOMPI_AUTH_URL || 'https://id.wompi.sv';
const WOMPI_API_URL = process.env.WOMPI_API_URL || 'https://api.wompi.sv';

/**
 * Obtiene el token de autenticación OAuth 2.0 de Wompi El Salvador.
 * El token se almacena en memoria y se reutiliza hasta que esté próximo a expirar (8 horas de vigencia).
 */
export async function getWompiToken(): Promise<string> {
  const now = Date.now();

  // Si tenemos token válido en caché con más de 2 minutos de margen, lo reutilizamos
  if (tokenCache && tokenCache.expiresAt > now + 120 * 1000) {
    return tokenCache.token;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', WOMPI_APP_ID);
  params.append('client_secret', WOMPI_API_SECRET);
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

  tokenCache = {
    token: data.access_token,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return tokenCache.token;
}

export interface CreatePaymentLinkParams {
  orderNumber: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  redirectUrl: string;
  returnUrl: string;
  webhookUrl?: string;
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
  const token = await getWompiToken();

  const payload: any = {
    identificadorEnlaceComercio: params.orderNumber,
    monto: Number(params.amount.toFixed(2)),
    nombreProducto: `Pedido Aromaniak #${params.orderNumber}`,
    formaPago: {
      permitirTarjetaCreditoDebido: true,
      permitirPagoConPuntoAgricola: true,
      permitirPagoEnCuotasAgricola: false,
      permitirPagoEnBitcoin: false,
      permitePagoQuickPay: true,
    },
    infoProducto: {
      descripcionProducto: `Perfumes y fragancias finas Aromaniak SV - Pedido #${params.orderNumber}`,
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

/**
 * Valida el sello de seguridad criptográfico enviado por Wompi en el Webhook.
 * Calcula HMAC-SHA256 del cuerpo crudo con el API Secret de Wompi.
 */
export function validateWompiWebhook(rawBody: string, receivedHash?: string | null): boolean {
  if (!receivedHash) return false;

  try {
    const hmac = crypto.createHmac('sha256', WOMPI_API_SECRET);
    hmac.update(rawBody, 'utf8');
    const calculatedHash = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash.toLowerCase()),
      Buffer.from(receivedHash.toLowerCase())
    );
  } catch (err) {
    console.error('Error validando hash de Wompi:', err);
    return false;
  }
}

/**
 * Consulta el estado y detalle de una transacción directamente en Wompi por su IdTransaccion.
 */
export async function getWompiTransaction(transactionId: string): Promise<any> {
  const token = await getWompiToken();

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
