// src/lib/wp-auth.ts

import { NextRequest } from 'next/server';

export const WP_SECRET = process.env.BLOG_API_KEY || 'ak_blog_2ccbbe9c3e525a06851e916d5c027d84';

export const wpCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-WP-Total, X-WP-TotalPages, x-api-key',
  'Access-Control-Expose-Headers': 'X-WP-Total, X-WP-TotalPages, Link, Allow',
};

/**
 * Valida la autenticación para emular WordPress REST API
 * Admite:
 * 1. Basic Auth: username:ApplicationPassword (donde password coincide con WP_SECRET)
 * 2. Bearer Token: secret
 * 3. Header x-api-key: secret
 * 4. Query parameter apiKey=secret
 */
export function isWpAuthorized(req: NextRequest): boolean {
  const secret = WP_SECRET;
  const cleanSecret = secret.replace(/\s+/g, '');

  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // 1. Bearer Token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim().replace(/\s+/g, '');
      if (token === cleanSecret) return true;
    }

    // 2. Basic Auth (Estándar WordPress Application Passwords)
    if (authHeader.startsWith('Basic ')) {
      try {
        const decoded = Buffer.from(authHeader.substring(6).trim(), 'base64').toString('utf-8');
        const colonIdx = decoded.indexOf(':');
        if (colonIdx !== -1) {
          const user = decoded.substring(0, colonIdx).trim().replace(/\s+/g, '');
          const pass = decoded.substring(colonIdx + 1).trim().replace(/\s+/g, '');

          // En WP Application Passwords, el pass suele enviarse en bloques de 4 caracteres
          if (pass === cleanSecret || user === cleanSecret) return true;
        } else {
          // Token directo codificado en base64
          if (decoded.trim().replace(/\s+/g, '') === cleanSecret) return true;
        }
      } catch {
        // Ignorar fallo de decodificación
      }
    }
  }

  // 3. Custom Header x-api-key
  const customHeader = req.headers.get('x-api-key');
  if (customHeader && customHeader.trim().replace(/\s+/g, '') === cleanSecret) return true;

  // 4. Query param ?apiKey=...
  const queryKey = req.nextUrl.searchParams.get('apiKey');
  if (queryKey && queryKey.trim().replace(/\s+/g, '') === cleanSecret) return true;

  return false;
}
