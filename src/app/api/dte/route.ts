import { NextResponse } from 'next/server';
import { facturaLlama } from '@/lib/facturalama';
import { prisma } from '@/lib/prisma';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

// Candados de idempotencia en memoria para bloquear doble clic / peticiones simultáneas
const inFlightDteByKey = new Map<string, Promise<{ status: number; body: any }>>();
const recentIssuedDteByKey = new Map<string, { timestamp: number; body: any }>();
const RECENT_DTE_TTL_MS = 5 * 60 * 1000; // 5 minutos


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

    const cleanSaleId = saleId ? String(saleId).trim() : '';
    const itemFingerprint = items
      .map((it: any) => `${it.codigo || it.productId || it.name}:${it.quantity || it.cantidad}:${it.price || it.precioUnitario}`)
      .join('|');
    const idempotencyKey =
      cleanSaleId ||
      `anon:${tipoDte}:${cliente?.numDocumento || cliente?.nrc || cliente?.nombre || 'CF'}:${itemFingerprint}`;

    // 0.1 Si ya se emitió hace pocos segundos en esta instancia, devolver el mismo DTE sin retransmitir
    const cachedRecent = recentIssuedDteByKey.get(idempotencyKey);
    if (cachedRecent && Date.now() - cachedRecent.timestamp < RECENT_DTE_TTL_MS) {
      return NextResponse.json(
        { ...cachedRecent.body, alreadyEmitted: true },
        { status: 200 }
      );
    }

    // 0.2 Si hay una petición en vuelo para la misma venta/huella (doble clic), esperar la primera y devolver su resultado
    const existingInFlight = inFlightDteByKey.get(idempotencyKey);
    if (existingInFlight) {
      const sharedResult = await existingInFlight;
      return NextResponse.json(
        { ...sharedResult.body, alreadyEmitted: true },
        { status: sharedResult.status }
      );
    }

    const processDteExecution = async (): Promise<{ status: number; body: any }> => {
      let resolvedFinalSaleId: string | null = null;

      // 0.3 Verificar en Base de Datos si esta venta ya cuenta con un DTE PROCESADO en Hacienda
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder') && cleanSaleId) {
        try {
          const saleExists = await prisma.sale.findFirst({
            where: {
              OR: [{ id: cleanSaleId }, { saleNumber: cleanSaleId }],
            },
            include: { dteDocument: true },
          });
          if (saleExists) {
            resolvedFinalSaleId = saleExists.id;
            if (saleExists.dteDocument && saleExists.dteDocument.estado === 'PROCESADO' && saleExists.dteDocument.codigoGeneracion) {
              const existingDte = saleExists.dteDocument;
              return {
                status: 200,
                body: {
                  success: true,
                  alreadyEmitted: true,
                  dte: {
                    success: true,
                    estado: existingDte.estado,
                    codigoGeneracion: existingDte.codigoGeneracion,
                    numeroControl: existingDte.numeroControl,
                    selloRecepcion: existingDte.selloRecepcion,
                    fhProcesamiento: existingDte.fhProcesamiento?.toISOString(),
                    mensaje: existingDte.mensajeRespuesta || 'DTE ya emitido previamente',
                    pdfUrl: `/api/dte/${existingDte.codigoGeneracion}/pdf`,
                    jsonUrl: `/api/dte/${existingDte.codigoGeneracion}/json`,
                  },
                },
              };
            }
          } else {
            const ecomOrder = await prisma.ecommerceOrder.findFirst({
              where: {
                OR: [{ id: cleanSaleId }, { orderNumber: cleanSaleId }],
              },
            });
            if (ecomOrder?.saleId) {
              resolvedFinalSaleId = ecomOrder.saleId;
            }
          }

          const existingProcessedBySaleOrReq = await prisma.dteDocument.findFirst({
            where: {
              estado: 'PROCESADO',
              OR: [
                ...(resolvedFinalSaleId ? [{ saleId: resolvedFinalSaleId }] : []),
                { requestJson: { contains: `"saleId": "${cleanSaleId}"` } },
              ],
            },
          });

          if (existingProcessedBySaleOrReq?.codigoGeneracion) {
            return {
              status: 200,
              body: {
                success: true,
                alreadyEmitted: true,
                dte: {
                  success: true,
                  estado: existingProcessedBySaleOrReq.estado,
                  codigoGeneracion: existingProcessedBySaleOrReq.codigoGeneracion,
                  numeroControl: existingProcessedBySaleOrReq.numeroControl,
                  selloRecepcion: existingProcessedBySaleOrReq.selloRecepcion,
                  fhProcesamiento: existingProcessedBySaleOrReq.fhProcesamiento?.toISOString(),
                  mensaje: existingProcessedBySaleOrReq.mensajeRespuesta || 'DTE ya emitido previamente',
                  pdfUrl: `/api/dte/${existingProcessedBySaleOrReq.codigoGeneracion}/pdf`,
                  jsonUrl: `/api/dte/${existingProcessedBySaleOrReq.codigoGeneracion}/json`,
                },
              },
            };
          }
        } catch (preCheckErr) {
          console.warn('Advertencia verificando idempotencia previa de DTE:', preCheckErr);
        }
      }

      // 1. Emitir con Factura Llama (o simular)
      const dteResult = await facturaLlama.emitirDte({
        tipoDte: tipoDte === '03' ? '03' : '01',
        saleId: cleanSaleId || `POS-${Date.now()}`,
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
          let finalSaleId: string | null = resolvedFinalSaleId;
          if (!finalSaleId && cleanSaleId) {
            const saleExists = await prisma.sale.findFirst({
              where: {
                OR: [{ id: cleanSaleId }, { saleNumber: cleanSaleId }],
              },
            });
            if (saleExists) {
              finalSaleId = saleExists.id;
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

          // Si la venta tenía un intento previo NO procesado (RECHAZADO/SIMULADO), liberar el vínculo para el nuevo DTE
          if (finalSaleId) {
            await prisma.dteDocument.deleteMany({
              where: {
                saleId: finalSaleId,
                codigoGeneracion: { not: dteResult.codigoGeneracion },
                estado: { not: 'PROCESADO' },
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

      const responseBody = {
        success: dteResult.success,
        dte: enhancedDte,
      };

      if (dteResult.success && dteResult.estado === 'PROCESADO') {
        recentIssuedDteByKey.set(idempotencyKey, {
          timestamp: Date.now(),
          body: responseBody,
        });
      }

      return {
        status: dteResult.success ? 200 : 400,
        body: responseBody,
      };
    };

    const executionPromise = processDteExecution();
    inFlightDteByKey.set(idempotencyKey, executionPromise);
    try {
      const outcome = await executionPromise;
      return NextResponse.json(outcome.body, { status: outcome.status });
    } finally {
      inFlightDteByKey.delete(idempotencyKey);
    }
  } catch (error: any) {
    console.error('Error procesando DTE:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al emitir DTE' },
      { status: 500 }
    );
  }
}
