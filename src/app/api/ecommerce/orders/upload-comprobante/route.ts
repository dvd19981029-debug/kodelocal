import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, {
      keyPrefix: 'upload_comprobante',
      maxRequests: 20,
      windowMs: 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: `Demasiados intentos de subida. Espera ${rl.resetSeconds} segundos.` },
        { status: 429 }
      );
    }

    let buffer: Buffer;
    let contentType = 'image/jpeg';
    let ext = 'jpg';

    const reqContentType = req.headers.get('content-type') || '';

    if (reqContentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No se envió ningún archivo' },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = file.type || 'image/jpeg';
      if (contentType === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
        contentType = 'application/pdf';
        ext = 'pdf';
      } else if (contentType.includes('png')) {
        ext = 'png';
      } else if (contentType.includes('webp')) {
        ext = 'webp';
      } else {
        ext = 'jpg';
      }
    } else {
      const body = await req.json();
      const base64Data: string = body.image || body.file || '';
      if (!base64Data) {
        return NextResponse.json(
          { success: false, error: 'No se envió el comprobante' },
          { status: 400 }
        );
      }
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
        if (contentType === 'application/pdf') ext = 'pdf';
        else if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }
    }

    const normalizedMime = String(contentType || '').toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      return NextResponse.json(
        { success: false, error: 'Formato de comprobante no permitido. Usa JPG, PNG, WEBP o PDF.' },
        { status: 400 }
      );
    }

    // Límite razonable: 8MB
    if (buffer.length > 8 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo supera el tamaño máximo permitido (8 MB).' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    let publicUrl = '';

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const fileName = `ecommerce-comprobantes/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}.${ext}`;

        for (const bucketName of ['comprobantes', 'blog-media']) {
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, buffer, {
              contentType: normalizedMime,
              upsert: false,
            });
          if (!error) {
            const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
            if (data?.publicUrl) {
              publicUrl = data.publicUrl;
              break;
            }
          }
        }
      } catch (storageErr) {
        console.warn('[upload-comprobante ecommerce] Fallback a Data URI:', storageErr);
      }
    }

    if (!publicUrl) {
      publicUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('[POST /api/ecommerce/orders/upload-comprobante] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al subir el comprobante',
      },
      { status: 500 }
    );
  }
}
