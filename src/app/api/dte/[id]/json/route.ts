// src/app/api/dte/[id]/json/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // 1. Buscar en la base de datos local
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      const dteDoc = await prisma.dteDocument.findFirst({
        where: {
          OR: [{ codigoGeneracion: id }, { id }],
        },
        include: {
          sale: {
            include: {
              items: true,
              customer: true,
            },
          },
        },
      });

      if (dteDoc) {
        let parsedResponse: any = null;
        let parsedRequest: any = null;
        try {
          if (dteDoc.responseJson) parsedResponse = JSON.parse(dteDoc.responseJson);
          if (dteDoc.requestJson) parsedRequest = JSON.parse(dteDoc.requestJson);
        } catch (e) {
          console.warn('Error parsing JSON from DteDocument', e);
        }

        return NextResponse.json({
          success: true,
          source: 'DATABASE',
          codigoGeneracion: dteDoc.codigoGeneracion,
          numeroControl: dteDoc.numeroControl,
          selloRecepcion: dteDoc.selloRecepcion,
          estado: dteDoc.estado,
          tipoDte: dteDoc.tipoDte,
          fhProcesamiento: dteDoc.fhProcesamiento,
          saleId: dteDoc.saleId,
          sale: dteDoc.sale,
          // Si el responseJson contiene el objeto oficial DTE, exponerlo directamente
          dte: parsedResponse?.dte || parsedResponse,
          mhResponse: parsedResponse?.mhResponse || null,
          rawResponse: parsedResponse,
          requestData: parsedRequest,
        });
      }
    }

    // 2. Si no se encontró en DB, intentar con Factura Llama
    try {
      const response = await facturaLlama.getJsonStream(id);
      if (response.ok) {
        const jsonData = await response.json();
        return NextResponse.json(jsonData);
      }
    } catch (apiErr) {
      console.warn('Factura Llama json fallback failed:', apiErr);
    }

    return NextResponse.json(
      { error: 'DTE no encontrado en base de datos' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error al consultar JSON de DTE:', error);
    return NextResponse.json(
      { error: error.message || 'Error consultando JSON' },
      { status: 500 }
    );
  }
}
