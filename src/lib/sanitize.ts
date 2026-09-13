/**
 * Utilidades de sanitización y validación estricta de entradas (SEC-07).
 * Previene Stored XSS, inyección de caracteres de control y corrupción de datos.
 */

/**
 * Limpia y sanitiza texto libre eliminando scripts, etiquetas HTML peligrosas y acotando longitud.
 */
export function sanitizeText(value: unknown, maxLength: number = 255): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // 1. Eliminar caracteres de control invisibles (excepto salto de línea y tabulación)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Remover etiquetas HTML peligrosas y atributos de ejecución (XSS)
  str = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<[^>]*>?/gm, ''); // Eliminar cualquier tag restante

  // 3. Normalizar espacios
  str = str.trim();

  // 4. Acotar longitud
  if (str.length > maxLength) {
    str = str.substring(0, maxLength).trim();
  }

  return str;
}

/**
 * Valida y normaliza una dirección de correo electrónico.
 */
export function sanitizeEmail(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length > 150) return null;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Sanitiza números de teléfono (admite números de El Salvador y formatos internacionales con código de país).
 */
export function sanitizePhone(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  // Permitir únicamente dígitos, +, -, espacios y paréntesis
  const cleaned = str.replace(/[^\d+\-() ]/g, '').trim();
  const digitsOnly = cleaned.replace(/\D/g, '');

  // Longitud mínima 7 dígitos, máxima 15 dígitos
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return null;
  }
  return cleaned.substring(0, 30);
}

/**
 * Sanitiza identificadores fiscales y documentos (DUI, NIT, NRC).
 */
export function sanitizeDocument(value: unknown, maxLength: number = 30): string | null {
  if (!value) return null;
  const str = String(value).trim();
  // Permitir alfanuméricos, guiones y espacios
  const cleaned = str.replace(/[^a-zA-Z0-9\- ]/g, '').trim();
  if (!cleaned) return null;
  return cleaned.substring(0, maxLength);
}
