// src/app/api/dte/[id]/json/route.ts
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

    const response = await facturaLlama.getJsonStream(id);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Factura Llama HTTP ${response.status} al obtener JSON` },
        { status: response.status }
      );
    }

    const jsonData = await response.json();
    return NextResponse.json(jsonData);
  } catch (error: any) {
    console.error('Error al consultar JSON de DTE:', error);
    return NextResponse.json(
      { error: error.message || 'Error consultando JSON' },
      { status: 500 }
    );
  }
}
