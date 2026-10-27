import { NextResponse } from 'next/server';
import { getKodeConfigAsync, getActiveFacturaLlamaApiKey } from '@/lib/kodeConfig';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Falta el código de generación del DTE' }, { status: 400 });
    }

    const config = await getKodeConfigAsync();
    const apiKey = getActiveFacturaLlamaApiKey(config);

    const response = await fetch(`${config.facturaLlamaBaseUrl}/dte/${encodeURIComponent(id)}/download/pdf`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'X-API-Version': config.facturaLlamaApiVersion,
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return NextResponse.json(
        { error: 'No se pudo descargar el PDF del DTE desde Factura Llama', details: errText },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="DTE-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error descargando PDF DTE KÖDE:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
