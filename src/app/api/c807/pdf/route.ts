import { NextResponse } from 'next/server';
import { c807Client } from '@/lib/c807';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guia = String(searchParams.get('guia') || '').trim();
    const forceDownload = searchParams.get('download') === '1';

    if (!guia) {
      return NextResponse.json(
        { success: false, error: 'El parámetro "guia" es requerido.' },
        { status: 400 }
      );
    }

    const result = await c807Client.obtenerPdfGuia(guia);
    if (!result.success || !result.pdfBuffer) {
      return NextResponse.json(
        { success: false, error: result.error || 'No se pudo obtener el PDF de la guía C807.' },
        { status: 404 }
      );
    }

    const safeFilename = guia.replace(/[^a-zA-Z0-9_-]/g, '_');
    const disposition = forceDownload ? 'attachment' : 'inline';

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="Guia-C807-${safeFilename}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno al obtener PDF de C807.' },
      { status: 500 }
    );
  }
}
