import { NextResponse } from 'next/server';
import { c807KodeClient } from '@/lib/c807';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const singleGuia = String(searchParams.get('guia') || '').trim();
    const multiGuiasParam = String(searchParams.get('guias') || '').trim();
    const forceDownload = searchParams.get('download') === '1';

    const guiasList = multiGuiasParam
      ? multiGuiasParam
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean)
      : singleGuia
      ? [singleGuia]
      : [];

    if (guiasList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El parámetro "guia" o "guias" es requerido.' },
        { status: 400 }
      );
    }

    const result = await c807KodeClient.obtenerPdfGuiasUnificadas(guiasList);
    if (!result.success || !result.pdfBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'No se pudo obtener el PDF de las guías C807 de KÖDE.',
        },
        { status: 404 }
      );
    }

    const disposition = forceDownload ? 'attachment' : 'inline';
    const filename =
      guiasList.length === 1
        ? `Guia-C807-KODE-${guiasList[0].replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
        : `Guias-C807-KODE-${guiasList.length}-ordenes.pdf`;

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno al obtener PDF de C807 en KÖDE.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawGuias: string[] = Array.isArray(body?.guias) ? body.guias : [];
    const forceDownload = Boolean(body?.download);

    const guiasList = rawGuias
      .map((g) => String(g || '').trim())
      .filter(Boolean);

    if (guiasList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debes enviar al menos un número de guía.' },
        { status: 400 }
      );
    }

    const result = await c807KodeClient.obtenerPdfGuiasUnificadas(guiasList);
    if (!result.success || !result.pdfBuffer) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'No se pudo generar el PDF unificado de guías de KÖDE.',
        },
        { status: 404 }
      );
    }

    const disposition = forceDownload ? 'attachment' : 'inline';
    const filename =
      guiasList.length === 1
        ? `Guia-C807-KODE-${guiasList[0].replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
        : `Guias-C807-KODE-${guiasList.length}-ordenes.pdf`;

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error interno al unificar PDF de C807 en KÖDE.',
      },
      { status: 500 }
    );
  }
}
