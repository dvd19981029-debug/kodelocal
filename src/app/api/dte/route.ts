import { NextResponse } from 'next/server';
import { facturaLlama } from '@/lib/facturalama';
import { prisma } from '@/lib/prisma';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

function parseMhDateSafe(rawDate?: string | Date | null): Date {
  if (!rawDate) return new Date();
  if (rawDate instanceof Date) {
    return !isNaN(rawDate.getTime()) ? rawDate : new Date();
  }
  const str = String(rawDate).trim();
  // Formato Ministerio de Hacienda El Salvador: "DD/MM/YYYY HH:mm:ss" o "DD/MM/YYYY"
  const svMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
  if (svMatch) {
    const [, dd, mm, yyyy, time] = svMatch;
    const isoStr = `${yyyy}-${mm}-${dd}T${time || '00:00:00'}-06:00`;
    const parsedSv = new Date(isoStr);
    if (!isNaN(parsedSv.getTime())) return parsedSv;
  }
  const direct = new Date(str);
  return !isNaN(direct.getTime()) ? direct : new Date();
}

export async function POST(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión activa de personal para emitir DTE.' },
        { status: 401 }
      );
    }

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
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder') && dteResult.codigoGeneracion) {
        let finalSaleId: string | null = null;
        if (saleId) {
          const cleanSaleId = String(saleId).trim();
          const saleExists = await prisma.sale.findFirst({
            where: {
              OR: [{ id: cleanSaleId }, { saleNumber: cleanSaleId }],
            },
          });
          if (saleExists) {
            finalSaleId = saleExists.id;
          } else {
            const ecomOrder = await prisma.ecommerceOrder.findFirst({
              where: {
                OR: [{ id: cleanSaleId }, { orderNumber: cleanSaleId }],
              },
            });
            if (ecomOrder?.saleId) {
              finalSaleId = ecomOrder.saleId;
            }
          }
        }

        const safeFhProcesamiento = parseMhDateSafe(dteResult.fhProcesamiento);
        const resolvedEstado =
          dteResult.estado === 'PROCESADO'
            ? 'PROCESADO'
            : dteResult.simulated
            ? 'SIMULADO'
            : 'RECHAZADO';

        const fullRequestData = {
          clientRequest: body,
          facturaLlamaPayload: dteResult.sentPayload || null,
        };
        const fullResponseData = dteResult.rawResponse || dteResult;

        // Si la venta ya tenía otro DteDocument asociado (ej: reintento con nuevo codigoGeneracion),
        // liberar el vínculo anterior para evitar colisión en @unique(saleId)
        if (finalSaleId) {
          await prisma.dteDocument.deleteMany({
            where: {
              saleId: finalSaleId,
              codigoGeneracion: { not: dteResult.codigoGeneracion },
            },
          });
        }

        await prisma.dteDocument.upsert({
          where: { codigoGeneracion: dteResult.codigoGeneracion },
          create: {
            saleId: finalSaleId,
            tipoDte: tipoDte === '03' ? 'CREDITO_FISCAL_03' : 'FACTURA_01',
            codigoGeneracion: dteResult.codigoGeneracion,
            numeroControl: dteResult.numeroControl || null,
            selloRecepcion: dteResult.selloRecepcion || null,
            estado: resolvedEstado,
            fhProcesamiento: safeFhProcesamiento,
            mensajeRespuesta: dteResult.mensaje || null,
            observaciones: dteResult.rawResponse?.mhResponse?.observaciones ? JSON.stringify(dteResult.rawResponse.mhResponse.observaciones) : null,
            requestJson: JSON.stringify(fullRequestData, null, 2),
            responseJson: JSON.stringify(fullResponseData, null, 2),
          },
          update: {
            ...(finalSaleId ? { saleId: finalSaleId } : {}),
            numeroControl: dteResult.numeroControl || null,
            selloRecepcion: dteResult.selloRecepcion || null,
            estado: resolvedEstado,
            fhProcesamiento: safeFhProcesamiento,
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
