// src/lib/blog.ts

/**
 * Genera un slug limpio y amigable para SEO a partir de un título.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Quita acentos y diacríticos
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Elimina caracteres no alfanuméricos
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/-+/g, '-'); // Evita guiones consecutivos
}

/**
 * Decodifica entidades HTML comunes generadas por conectores de IA o CMS (ej. &oacute; -> ó)
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&oacute;/g, 'ó')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&aacute;/g, 'á')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&deg;/g, '°')
    .replace(/&iquest;/g, '¿')
    .replace(/&iexcl;/g, '¡')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Extrae la primera URL de imagen encontrada en el contenido (Markdown o HTML)
 */
export function extractFirstImage(content: string): string | null {
  if (!content) return null;
  // 1. Markdown image: ![...](url)
  const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i);
  if (mdMatch && mdMatch[1]) return mdMatch[1].trim();

  // 2. HTML image: <img src="url" ...>
  const htmlMatch = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (htmlMatch && htmlMatch[1]) return htmlMatch[1].trim();

  return null;
}

/**
 * Sanitiza el HTML del artículo generado por IA para evitar XSS manteniendo el formato enriquecido (p, h1-h6, img, a, ul, ol, table, etc.)
 */
export function sanitizeBlogHtml(html: string): string {
  if (!html) return '';
  let clean = String(html);

  // 1. Eliminar scripts, iframes, objetos, incrustaciones y applets
  clean = clean
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '');

  // 2. Eliminar eventos JavaScript inline (onclick, onload, onerror, onmouseover, etc.)
  clean = clean.replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Eliminar esquemas javascript: o data: maliciosos en href/src
  clean = clean.replace(/(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, '$1="#"');
  clean = clean.replace(/(href|src)\s*=\s*["']\s*data:text\/html[^"']*["']/gi, '$1="#"');

  return clean;
}

/**
 * Convierte Markdown a HTML enriquecido si la IA envía formato Markdown o texto plano,
 * asegurando compatibilidad total con Holo AI, Byword, OpenAI y webhooks.
 */
export function formatContentForBlog(input: string): string {
  if (!input) return '';
  let str = decodeHtmlEntities(input.trim());

  // Convertir imágenes Markdown independientes a etiquetas HTML figure/img
  str = str.replace(
    /!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/gi,
    '<figure class="my-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80"><img src="$2" alt="$1" class="w-full object-cover max-h-[480px]" loading="lazy" /></figure>'
  );

  // Si no contiene etiquetas estructurales HTML (<p>, <h2>, etc.), convertir markdown a HTML
  const hasHtml = /<(p|h[1-6]|ul|ol|table|blockquote|div)\b/i.test(str);
  if (!hasHtml) {
    str = str
      // Encabezados
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Citas
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Negrita y cursiva
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Enlaces
      .replace(/\[([^\[]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Párrafos y listas
      .split(/\n\s*\n/)
      .map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        if (/^<(h[1-6]|blockquote|ul|ol|table|figure)/i.test(trimmed)) return trimmed;
        if (trimmed.includes('\n- ') || trimmed.startsWith('- ')) {
          const items = trimmed.split(/\n?- /).filter(Boolean).map(item => `<li>${item.trim()}</li>`).join('');
          return `<ul>${items}</ul>`;
        }
        return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
      })
      .join('\n');
  }

  return sanitizeBlogHtml(str);
}

/**
 * Calcula el tiempo estimado de lectura en minutos (asumiendo ~200 palabras por minuto).
 */
export function calculateReadingTime(content: string): number {
  if (!content) return 1;
  // Quitar etiquetas HTML para contar palabras reales
  const plainText = content.replace(/<[^>]*>/g, ' ').trim();
  const words = plainText.split(/\s+/).filter(w => w.length > 0).length;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}

/**
 * Extrae un extracto (excerpt) limpio si la IA no lo provee.
 */
export function extractExcerpt(content: string, maxLength: number = 160): string {
  if (!content) return '';
  const plainText = decodeHtmlEntities(
    content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Formatea fechas para publicación en español de El Salvador.
 */
export function formatBlogDate(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-SV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}
