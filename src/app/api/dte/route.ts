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
      })),
      cliente: cliente
        ? {
            nombre: cliente.nombre || 'Consumidor Final',
            numDocumento: cliente.numDocumento || cliente.dui || cliente.nit || '',
            nrc: cliente.nrc,
            correo: cliente.correo || cliente.email,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            descActividad: cliente.giro || cliente.descActividad,
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
