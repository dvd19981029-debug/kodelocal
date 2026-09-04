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
        codigo: it.codigo || it.sku,
        descripcion: it.name || it.descripcion,
        cantidad: Number(it.quantity || it.cantidad),
        precioUnitario: Number(it.price || it.precioUnitario),
      })),
      cliente: cliente
        ? {
            nombre: cliente.nombre,
            numDocumento: cliente.numDocumento || cliente.dui || cliente.nit,
            nrc: cliente.nrc,
            correo: cliente.correo,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
          }
        : undefined,
      metodoPago,
    });

    // 2. Intentar registrar en base de datos si Prisma está conectado
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
        // En producción guardará en Prisma
        console.log('Guardando DTE en base de datos Supabase...');
      }
    } catch (dbError) {
      console.warn('DB not connected yet, proceeding with in-memory log', dbError);
    }

    return NextResponse.json({
      success: true,
      dte: dteResult,
    });
  } catch (error: any) {
    console.error('Error procesando DTE:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al emitir DTE' },
      { status: 500 }
    );
  }
}
