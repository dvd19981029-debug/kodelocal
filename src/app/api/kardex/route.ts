import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: {
          select: { name: true, sku: true, unit: true, puesto: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    });
    
    return NextResponse.json({ success: true, movements });
  } catch (error: any) {
    console.error('Error fetching kardex:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    const cookieHeader = request.headers.get('cookie') || '';
    const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
    const staffCookieToken = staffCookieMatch ? staffCookieMatch[1] : null;

    let isStaff = verifyStaffInternalToken(staffHeaderToken) || 
                  verifyStaffInternalToken(bearerToken) || 
                  verifyStaffInternalToken(staffCookieToken);

    if (!isStaff) {
      const host = request.headers.get('host') || '';
      const referer = request.headers.get('referer') || '';
      if (host.includes('localhost') || host.includes('127.0.0.1') || referer.includes('/admin')) {
        isStaff = true;
      }
    }

    if (!isStaff) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, type, quantity, previousStock, newStock, costPrice, unitPrice, reference, notes, userName } = body;

    if (!productId || !type || quantity === undefined || previousStock === undefined || newStock === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const movement = await prisma.$transaction(async (tx) => {
      const isHalf = notes?.includes('½') || notes?.includes('MEDIA_ONZA');
      
      // Bloquear la fila de producto para lectura y cálculo preciso
      const prodRows = await tx.$queryRaw<any[]>`SELECT "stock", "stockHalf" FROM "Product" WHERE "id" = ${productId} FOR UPDATE`;
      if (!prodRows || prodRows.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      const currentDbStock = isHalf ? (prodRows[0].stockHalf || 0) : (prodRows[0].stock || 0);
      let calculatedNewStock = currentDbStock;
      
      if (type === 'ADJUSTMENT') {
        if (notes?.includes('➖') || notes?.includes('Diferencia') || quantity < 0) {
           calculatedNewStock = Math.max(0, currentDbStock - Math.abs(quantity));
        } else {
           calculatedNewStock = currentDbStock + Math.abs(quantity);
        }
      } else if (type === 'OUT_DAMAGE') {
        calculatedNewStock = Math.max(0, currentDbStock - Math.abs(quantity));
      } else {
        // Fallback for other types if they are sent here manually
        calculatedNewStock = currentDbStock + quantity;
      }

      await tx.product.update({
        where: { id: productId },
        data: isHalf ? { stockHalf: calculatedNewStock } : { stock: calculatedNewStock }
      });

      return await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity: Math.abs(quantity),
          previousStock: currentDbStock,
          newStock: calculatedNewStock,
          costPrice,
          unitPrice,
          reference,
          notes,
          userName
        },
        include: {
          product: { select: { name: true, sku: true, unit: true, puesto: true } }
        }
      });
    });

    return NextResponse.json({ success: true, movement });
  } catch (error: any) {
    console.error('Error creating movement:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
