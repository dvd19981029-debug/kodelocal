import crypto from 'crypto';

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.WOMPI_API_SECRET;
  if (!secret) {
    if (typeof console !== 'undefined') {
      console.warn('[AVISO DE SEGURIDAD] Defina AUTH_SECRET o WOMPI_API_SECRET en Vercel. Utilizando secreto de contingencia.');
    }
    return 'aromaniak_auth_token_secret_prod_fallback_2026';
  }
  return secret;
}

const AUTH_SECRET = getAuthSecret();

export interface CustomerTokenPayload {
  customerId: string;
  email: string;
  exp: number; // Expiración en ms
}

/**
 * Crea un token de sesión firmado criptográficamente para un cliente.
 * Vigencia: 30 días.
 */
export function createCustomerToken(customerId: string, email: string): string {
  const payload: CustomerTokenPayload = {
    customerId,
    email: email.toLowerCase().trim(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifica y decodifica un token de sesión de cliente.
 * Retorna el payload si es auténtico y vigente; null si fue alterado o expiró.
 */
export function verifyCustomerToken(token?: string | null): CustomerTokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, receivedSig] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const expectedBuf = Buffer.from(expectedSig);
    const receivedBuf = Buffer.from(receivedSig);

    if (expectedBuf.length !== receivedBuf.length) return null;
    if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) return null;

    const payload: CustomerTokenPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    // Validar expiración
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Firma interna para peticiones de Bodega y POS desde el servidor u operaciones internas.
 */
export function createStaffInternalToken(role: string = 'STAFF'): string {
  const payload = {
    role,
    scope: 'internal_operations',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifyStaffInternalToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, receivedSig] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const expectedBuf = Buffer.from(expectedSig);
    const receivedBuf = Buffer.from(receivedSig);

    if (expectedBuf.length !== receivedBuf.length) return false;
    if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) return false;

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.exp) return false;
    return payload.scope === 'internal_operations';
  } catch {
    return false;
  }
}
