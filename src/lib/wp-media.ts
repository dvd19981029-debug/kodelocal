// src/lib/wp-media.ts

import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { extractFirstImage } from '@/lib/blog';

/**
 * Resuelve la URL pública de la imagen destacada evaluando exhaustivamente
 * todos los formatos de WordPress REST API, Holo AI, Soro, Jetpack, Yoast y plugins SEO.
 */
export async function resolveFeaturedImage(body: any, content?: string): Promise<string | null> {
  if (!body) return null;

  // 1. Detección directa de URLs en campos comunes
  const directCandidates = [
    body.featured_media_url,
    body.jetpack_featured_media_url,
    body.yoast_head_json?.og_image?.[0]?.url,
    body.better_featured_image?.source_url,
    body.better_featured_image?.media_details?.sizes?.large?.source_url,
    body.better_featured_image?.media_details?.sizes?.medium?.source_url,
    body.better_featured_image?.media_details?.sizes?.thumbnail?.source_url,
    body.fimg_url,
    body.featured_image_url,
    body.featured_image_src,
    body.featured_image,
    body.coverImage,
    body.cover_image,
    body.cover,
    body.image,
    body.thumbnail,
    body.thumbnail_url,
    body._embedded?.['wp:featuredmedia']?.[0]?.source_url,
    body._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.full?.source_url,
    body._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url,
    body.meta?.featured_image,
    body.meta?.coverImage,
    body.meta?.cover_image,
    body.meta?.featured_media_url,
    body.images?.[0]?.src,
    body.images?.[0]?.url,
    typeof body.images?.[0] === 'string' ? body.images[0] : null,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim().startsWith('http')) {
      return candidate.trim();
    }
  }

  // 2. Campo estándar WordPress: featured_media (puede ser ID numérico, URL string u objeto)
  if (body.featured_media !== undefined && body.featured_media !== null) {
    if (typeof body.featured_media === 'string') {
      const trimmed = body.featured_media.trim();
      if (trimmed.startsWith('http')) {
        return trimmed;
      }
      const parsedNum = parseInt(trimmed, 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        try {
          const found = await prisma.wpMedia.findUnique({ where: { mediaId: parsedNum } });
          if (found?.url) return found.url;
        } catch (err) {
          console.error('Error buscando mediaId en WpMedia:', err);
        }
      }
    } else if (typeof body.featured_media === 'number' && body.featured_media > 0) {
      try {
        const found = await prisma.wpMedia.findUnique({ where: { mediaId: body.featured_media } });
        if (found?.url) return found.url;
      } catch (err) {
        console.error('Error buscando mediaId en WpMedia:', err);
      }
    } else if (typeof body.featured_media === 'object') {
      const objUrl = body.featured_media.source_url || body.featured_media.url || body.featured_media.link;
      if (typeof objUrl === 'string' && objUrl.trim().startsWith('http')) {
        return objUrl.trim();
      }
      if (typeof body.featured_media.id === 'number') {
        try {
          const found = await prisma.wpMedia.findUnique({ where: { mediaId: body.featured_media.id } });
          if (found?.url) return found.url;
        } catch (err) {
          console.error('Error buscando mediaId en WpMedia:', err);
        }
      }
    }
  }

  // 3. Metadato _thumbnail_id de WordPress
  const thumbId = body.meta?._thumbnail_id || body._thumbnail_id;
  if (thumbId) {
    const parsedThumb = typeof thumbId === 'number' ? thumbId : parseInt(String(thumbId), 10);
    if (!isNaN(parsedThumb) && parsedThumb > 0) {
      try {
        const found = await prisma.wpMedia.findUnique({ where: { mediaId: parsedThumb } });
        if (found?.url) return found.url;
      } catch (err) {
        console.error('Error buscando _thumbnail_id en WpMedia:', err);
      }
    }
  }

  // 4. Primera imagen en el contenido (HTML <img> o Markdown ![])
  if (content) {
    const extracted = extractFirstImage(content);
    if (extracted) return extracted;
  }

  // 5. Si no vino imagen pero un medio fue subido en los últimos 10 minutos (típico flujo de Soro/Holo)
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentMedia = await prisma.wpMedia.findFirst({
      where: {
        createdAt: { gte: tenMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recentMedia?.url) {
      return recentMedia.url;
    }
  } catch (err) {
    console.error('Error consultando medios recientes:', err);
  }

  return null;
}

/**
 * Sube un buffer binario a Supabase Storage y retorna su URL pública accesible
 */
export async function uploadMediaToStorage(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const safeFilename = `blog_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;

  try {
    const { data, error } = await supabase.storage
      .from('blog-media')
      .upload(safeFilename, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Error subiendo imagen a Supabase storage:', error);
      // Fallback: Data URI base64 en caso de fallo de red
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    const { data: publicUrlData } = supabase.storage
      .from('blog-media')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Fallo general en uploadMediaToStorage:', err);
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
}
