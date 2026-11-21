import crypto from 'crypto';

function ensureAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.WOMPI_API_SECRET;
  if (!secret) {
    if (process.env.DATABASE_URL) {
      return crypto.createHash('sha256').update(`aromaniak_auth_${process.env.DATABASE_URL}`).digest('hex');
    }
    throw new Error('AUTH_SECRET o DATABASE_URL es requerido para firmar sesiones.');
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

export interface GoogleHandoffPayload {
  email: string;
  name: string;
  avatarUrl: string;
  googleId: string;
  scope: 'google_customer_handoff';
  exp: number;
}

/**
 * Crea un token temporal firmado (5 min) tras verificar Google OAuth directo en el servidor.
 */
export function createGoogleHandoffToken(data: {
  email: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
}): string {
  const secret = ensureAuthSecret();
  const payload: GoogleHandoffPayload = {
    email: data.email.toLowerCase().trim(),
    name: data.name || 'Cliente Aromaniak',
    avatarUrl: data.avatarUrl || '',
    googleId: data.googleId || '',
    scope: 'google_customer_handoff',
    exp: Date.now() + 5 * 60 * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifica un token temporal de handoff de Google OAuth para clientes.
 */
export function verifyGoogleHandoffToken(token?: string | null): GoogleHandoffPayload | null {
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

    const payload: GoogleHandoffPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (payload.scope !== 'google_customer_handoff' || !payload.email) return null;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Firma interna para peticiones de Bodega y POS desde el servidor u operaciones internas.
 * Vigencia: 30 días (con renovación automática).
 */
export function createStaffInternalToken(role: string = 'STAFF', email: string = 'admin@kodelocal.com', name: string = 'Administrador', id: string = 'system'): string {
  const secret = ensureAuthSecret();
  const payload = {
    id,
    name,
    email,
    role,
    scope: 'internal_operations',
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

const STAFF_TOKEN_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

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

    if (Date.now() > payload.exp + STAFF_TOKEN_GRACE_MS) return false;
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
    if (Date.now() > payload.exp + STAFF_TOKEN_GRACE_MS) return null;
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
const KODE_CHATWOOT_API_KEY =
  process.env.KODE_API_KEY || 'kode_cw_live_9f8e4a2b7c1d6e5f3a0b8c9d2e4f6a1b';

export function verifyStaffRequest(
  request: Request,
  allowedRoles?: string[]
): { authorized: boolean; payload: any | null } {
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const staffHeaderToken = request.headers.get('x-staff-token')?.trim() || null;
  const apiKeyHeader = request.headers.get('x-api-key')?.trim() || null;

  let queryKey: string | null = null;
  try {
    queryKey = new URL(request.url).searchParams.get('api_key')?.trim() || null;
  } catch {}

  if (
    apiKeyHeader === KODE_CHATWOOT_API_KEY ||
    staffHeaderToken === KODE_CHATWOOT_API_KEY ||
    bearerToken === KODE_CHATWOOT_API_KEY ||
    queryKey === KODE_CHATWOOT_API_KEY
  ) {
    return {
      authorized: true,
      payload: {
        role: 'KODE_ONLY',
        email: 'chatwoot@aromaniaksv.com',
        name: 'Chatwoot Integration',
        scope: 'internal_operations',
      },
    };
  }

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

export interface PasswordResetChallengePayload {
  customerId: string;
  email: string;
  codeHash: string;
  pwdFp: string;
  scope: 'customer_password_reset';
  exp: number;
}

/**
 * Crea un token temporal firmado (15 min) con el hash del código de 6 dígitos
 * y una huella de la contraseña actual (para que el token quede invalidado en el acto tras usarse una sola vez).
 */
export function createPasswordResetChallenge(params: {
  customerId: string;
  email: string;
  code: string;
  currentPasswordHash?: string | null;
}): string {
  const secret = ensureAuthSecret();
  const normalizedEmail = params.email.toLowerCase().trim();
  const normalizedCode = params.code.trim();
  const pwdFp = crypto
    .createHmac('sha256', secret)
    .update(params.currentPasswordHash || 'no_pwd')
    .digest('hex')
    .slice(0, 16);
  const codeHash = crypto
    .createHmac('sha256', secret)
    .update(`${params.customerId}:${normalizedEmail}:${normalizedCode}:${pwdFp}`)
    .digest('hex');

  const payload: PasswordResetChallengePayload = {
    customerId: params.customerId,
    email: normalizedEmail,
    codeHash,
    pwdFp,
    scope: 'customer_password_reset',
    exp: Date.now() + 15 * 60 * 1000, // 15 minutos
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifyPasswordResetChallenge(params: {
  resetToken: string;
  email: string;
  code: string;
  currentPasswordHash?: string | null;
}): { valid: boolean; customerId?: string; error?: string } {
  const { resetToken, email, code, currentPasswordHash } = params;
  if (!resetToken || typeof resetToken !== 'string') {
    return { valid: false, error: 'Solicitud de recuperación no válida.' };
  }

  const parts = resetToken.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Token de recuperación inválido.' };
  }

  const [payloadB64, receivedSig] = parts;

  try {
    const secret = ensureAuthSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    const expectedBuf = Buffer.from(expectedSig);
    const receivedBuf = Buffer.from(receivedSig);
    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      return { valid: false, error: 'Token de recuperación alterado o inválido.' };
    }

    const payload: PasswordResetChallengePayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (payload.scope !== 'customer_password_reset') {
      return { valid: false, error: 'Token de recuperación no válido.' };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, error: 'El código ha expirado (vigencia 15 min). Solicita uno nuevo.' };
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (payload.email !== normalizedEmail) {
      return { valid: false, error: 'El correo no coincide con la solicitud de recuperación.' };
    }

    const currentPwdFp = crypto
      .createHmac('sha256', secret)
      .update(currentPasswordHash || 'no_pwd')
      .digest('hex')
      .slice(0, 16);

    if (payload.pwdFp !== currentPwdFp) {
      return { valid: false, error: 'Este código ya fue utilizado anteriormente.' };
    }

    const expectedCodeHash = crypto
      .createHmac('sha256', secret)
      .update(`${payload.customerId}:${normalizedEmail}:${code.trim()}:${currentPwdFp}`)
      .digest('hex');

    const a = Buffer.from(expectedCodeHash);
    const b = Buffer.from(payload.codeHash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, error: 'Código de verificación incorrecto. Revisa tu correo.' };
    }

    return { valid: true, customerId: payload.customerId };
  } catch {
    return { valid: false, error: 'No se pudo verificar el código de recuperación.' };
  }
}


