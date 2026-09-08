import { NextResponse } from 'next/server';
import { facturaLlama } from '@/lib/facturalama';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipoDte, saleId, items, cliente, metodoPago } = body;

    if (!tipoDte || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos obligatorios (tipoDte, items)' },
        { status: 400 }
      );
    }

    // 1. Emitir con Factura Llama (o simular)
    const dteResult = await facturaLlama.emitirDte({
      tipoDte: tipoDte === '03' ? '03' : '01',
      saleId: saleId || `POS-${Date.now()}`,
      items: items.map((it: any) => ({
        codigo: it.codigo || it.sku || it.productId || 'GEN-01',
        descripcion: it.name || it.nombre || it.descripcion || 'Producto',
        cantidad: Number(it.quantity || it.cantidad || 1),
        precioUnitario: Number(it.price || it.precioUnitario || 0),
        tipoItem: it.tipoItem,
      })),
      cliente: cliente
        ? {
            nombre: cliente.nombre || 'Consumidor Final',
            numDocumento: cliente.numDocumento || cliente.dui || cliente.nit || '',
            nrc: cliente.nrc,
            correo: cliente.correo || cliente.email,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            codActividad: cliente.codActividad,
            descActividad: cliente.giro || cliente.descActividad,
            departamento: cliente.departamento,
            municipio: cliente.municipio,
          }
        : undefined,
      metodoPago,
    });

    // Enlace interno local para proxy de PDF y JSON
    const enhancedDte = {
      ...dteResult,
      pdfUrl: `/api/dte/${dteResult.codigoGeneracion}/pdf`,
      jsonUrl: `/api/dte/${dteResult.codigoGeneracion}/json`,
    };

    // 2. Registrar en base de datos en la tabla DteDocument (con TODO el Json de request y response)
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
        const saleExists = saleId
          ? await prisma.sale.findFirst({
              where: {
                OR: [{ id: saleId }, { saleNumber: saleId }],
              },
            })
          : null;
        const finalSaleId = saleExists ? saleExists.id : null;

        const fullRequestData = {
          clientRequest: body,
          facturaLlamaPayload: dteResult.sentPayload || null,
        };
        const fullResponseData = dteResult.rawResponse || dteResult;

        await prisma.dteDocument.upsert({
          where: { codigoGeneracion: dteResult.codigoGeneracion },
          create: {
            saleId: finalSaleId,
            tipoDte: tipoDte === '03' ? 'CREDITO_FISCAL_03' : 'FACTURA_01',
            codigoGeneracion: dteResult.codigoGeneracion,
            numeroControl: dteResult.numeroControl || null,
            selloRecepcion: dteResult.selloRecepcion || null,
            estado: dteResult.estado === 'PROCESADO' ? 'PROCESADO' : dteResult.simulated ? 'SIMULADO' : 'RECHAZADO',
            fhProcesamiento: dteResult.fhProcesamiento ? new Date(dteResult.fhProcesamiento) : new Date(),
            mensajeRespuesta: dteResult.mensaje || null,
            observaciones: dteResult.rawResponse?.mhResponse?.observaciones ? JSON.stringify(dteResult.rawResponse.mhResponse.observaciones) : null,
            requestJson: JSON.stringify(fullRequestData, null, 2),
            responseJson: JSON.stringify(fullResponseData, null, 2),
          },
          update: {
            saleId: finalSaleId || undefined,
            numeroControl: dteResult.numeroControl || null,
            selloRecepcion: dteResult.selloRecepcion || null,
            estado: dteResult.estado === 'PROCESADO' ? 'PROCESADO' : dteResult.simulated ? 'SIMULADO' : 'RECHAZADO',
            fhProcesamiento: dteResult.fhProcesamiento ? new Date(dteResult.fhProcesamiento) : new Date(),
            mensajeRespuesta: dteResult.mensaje || null,
            observaciones: dteResult.rawResponse?.mhResponse?.observaciones ? JSON.stringify(dteResult.rawResponse.mhResponse.observaciones) : null,
            requestJson: JSON.stringify(fullRequestData, null, 2),
            responseJson: JSON.stringify(fullResponseData, null, 2),
          },
        });
      }
    } catch (dbError) {
      console.error('Error guardando DTE en base de datos:', dbError);
    }

    return NextResponse.json({
      success: dteResult.success,
      dte: enhancedDte,
    }, {
      status: dteResult.success ? 200 : 400,
    });
  } catch (error: any) {
    console.error('Error procesando DTE:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al emitir DTE' },
      { status: 500 }
    );
  }
}
