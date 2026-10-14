import crypto from 'crypto';

function ensureAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.WOMPI_API_SECRET;
  if (!secret) {
    if (process.env.DATABASE_URL) {
      return crypto.createHash('sha256').update(`aromaniak_auth_${process.env.DATABASE_URL}`).digest('hex');
    }
    return 'aromaniak_auth_token_secret_prod_fallback_2026';
  }
  return secret;
}

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
  const secret = ensureAuthSecret();
  const payload: CustomerTokenPayload = {
    customerId,
    email: email.toLowerCase().trim(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
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
    const secret = ensureAuthSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
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
export function createStaffInternalToken(role: string = 'STAFF', email: string = 'admin@kodelocal.com', name: string = 'Administrador', id: string = 'system'): string {
  const secret = ensureAuthSecret();
  const payload = {
    id,
    name,
    email,
    role,
    scope: 'internal_operations',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
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
    const secret = ensureAuthSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
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

export function decodeStaffToken(token?: string | null): any | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, receivedSig] = parts;
  try {
    const secret = ensureAuthSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const expectedBuf = Buffer.from(expectedSig);
    const receivedBuf = Buffer.from(receivedSig);
    if (expectedBuf.length !== receivedBuf.length) return null;
    if (!crypto.timingSafeEqual(expectedBuf, receivedBuf)) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    if (payload.scope !== 'internal_operations') return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extrae y verifica criptográficamente el token de personal desde cabeceras (x-staff-token, Authorization)
 * o desde la cookie HttpOnly (kodelocal_staff_token).
 */
export function verifyStaffRequest(
  request: Request,
  allowedRoles?: string[]
): { authorized: boolean; payload: any | null } {
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const staffHeaderToken = request.headers.get('x-staff-token');
  const cookieHeader = request.headers.get('cookie') || '';
  const staffCookieMatch = cookieHeader.match(/(?:^|;\s*)kodelocal_staff_token=([^;]+)/);
  const staffCookieToken = staffCookieMatch ? decodeURIComponent(staffCookieMatch[1].trim()) : null;

  const payload =
    decodeStaffToken(staffHeaderToken) ||
    decodeStaffToken(bearerToken) ||
    decodeStaffToken(staffCookieToken);

  if (!payload) {
    return { authorized: false, payload: null };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = String(payload.role || '').toUpperCase();
    if (!allowedRoles.map((r) => r.toUpperCase()).includes(role)) {
      return { authorized: false, payload };
    }
  }

  return { authorized: true, payload };
}

/**
 * Hash seguro de contraseñas con scrypt y salt aleatorio único por usuario.
 */
export function hashPasswordSecure(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verifica una contraseña contra un hash scrypt (o legacy HMAC-SHA256 en tiempo constante).
 */
export function verifyPasswordSecure(password: string, storedHash: string): { valid: boolean; needsRehash: boolean } {
  if (!password || !storedHash) return { valid: false, needsRehash: false };

  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, originalHex] = parts;
    try {
      const derived = crypto.scryptSync(password, salt, 64);
      const originalBuf = Buffer.from(originalHex, 'hex');
      if (derived.length !== originalBuf.length) return { valid: false, needsRehash: false };
      return { valid: crypto.timingSafeEqual(derived, originalBuf), needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Compatibilidad con hashes previos HMAC-SHA256 o texto plano en migración
  const legacyHmac = crypto.createHmac('sha256', 'aromaniak_salt_2026').update(password).digest('hex');
  const legacyBuf = Buffer.from(legacyHmac);
  const storedBuf = Buffer.from(storedHash);

  if (legacyBuf.length === storedBuf.length && crypto.timingSafeEqual(legacyBuf, storedBuf)) {
    return { valid: true, needsRehash: true };
  }

  const plainBuf = Buffer.from(password);
  if (plainBuf.length === storedBuf.length && crypto.timingSafeEqual(plainBuf, storedBuf)) {
    return { valid: true, needsRehash: true };
  }

  return { valid: false, needsRehash: false };
}

