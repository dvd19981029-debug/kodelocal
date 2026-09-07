// src/app/api/dte/[id]/pdf/route.ts
import { NextResponse } from 'next/server';
import { facturaLlama } from '@/lib/facturalama';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Falta id de DTE' }, { status: 400 });
    }

    const response = await facturaLlama.getPdfStream(id);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Factura Llama HTTP ${response.status} al obtener PDF` },
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
    console.error('Error al descargar PDF de DTE:', error);
    return NextResponse.json(
      { error: error.message || 'Error descargando PDF' },
      { status: 500 }
    );
  }
}
