import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Buffer } from 'buffer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    let fileBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let filename = `comprobante_${Date.now()}.jpg`;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No se envió ningún archivo de imagen' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type || 'image/jpeg';
      const cleanName = (file.name || 'comprobante.jpg').replace(/[^a-zA-Z0-9._-]/g, '');
      filename = `voucher_${Date.now()}_${cleanName}`;
    } else {
      const body = await request.json();
      if (!body.image) {
        return NextResponse.json({ success: false, error: 'No se envió la imagen' }, { status: 400 });
      }

      const imgStr = String(body.image).trim();
      if (imgStr.startsWith('data:')) {
        const matches = imgStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          fileBuffer = Buffer.from(matches[2], 'base64');
        } else {
          fileBuffer = Buffer.from(imgStr, 'base64');
        }
      } else {
        fileBuffer = Buffer.from(imgStr, 'base64');
      }
      const rawExt = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      filename = `voucher_${Date.now()}.${rawExt}`;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ success: false, error: 'Archivo de imagen vacío o no válido' }, { status: 400 });
    }

    // Intentar subir a Supabase Storage (buckets comprobantes o blog-media)
    const bucketsToTry = ['comprobantes', 'blog-media'];
    let publicUrl: string | null = null;

    for (const b of bucketsToTry) {
      try {
        const { data, error } = await supabase.storage.from(b).upload(filename, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

        if (!error && data?.path) {
          const { data: pubData } = supabase.storage.from(b).getPublicUrl(data.path);
          if (pubData?.publicUrl) {
            publicUrl = pubData.publicUrl;
            break;
          }
        }
      } catch (err) {
        // Continuar al siguiente bucket
      }
    }

    // Fallback: Si no hay bucket en Supabase, guardar como Data URI optimizado
    if (!publicUrl) {
      publicUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Error procesando comprobante:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
