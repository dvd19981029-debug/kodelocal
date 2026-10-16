import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        orderStatus: { not: 'CANCELADO' },
        OR: [
          { paymentStatus: 'COMPLETED' },
          { orderStatus: 'COMPLETED' },
          { dteDocument: { is: { estado: 'PROCESADO' } } },
        ],
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    if (sales.length === 0) {
      return NextResponse.json({ success: true, daysToOrder: 999, message: 'Sin datos' });
    }

    const earliestDate = sales[0].createdAt;
    const effectiveDays = Math.min(
      30,
      Math.max(1, Math.ceil((now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)))
    );

    const soldMap = new Map<string, number>();
    for (const s of sales) {
      for (const it of s.items) {
        if (
          it.unit === 'Servicio' ||
          it.productId === 'ENVIO-DOM' ||
          (it.productName || '').toLowerCase().includes('servicio de envío')
        ) {
          continue;
        }
        const combined = `${it.unit || ''} ${it.productName || ''}`.toLowerCase();
        const isHalf = combined.includes('½') || combined.includes('media') || combined.includes('0.5');
        const mult = it.productId.startsWith('esencia') && isHalf ? 0.5 : 1;
        soldMap.set(it.productId, (soldMap.get(it.productId) || 0) + it.quantity * mult);
      }
    }

    const productIds = Array.from(soldMap.keys());
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, officialName: true, stock: true, stockHalf: true },
    });

    const LEAD_TIME = 14;
    let minDaysToOrder = 999;
    let criticalProduct = '';

    for (const prod of products) {
      const totalSold = soldMap.get(prod.id) || 0;
      const adr = totalSold / effectiveDays;
      if (adr < 0.1) continue;

      const isEss = prod.id.startsWith('esencia');
      const totalStock = isEss ? prod.stock + (prod.stockHalf || 0) * 0.5 : prod.stock;
      const dos = totalStock / adr;
      const daysUntilOrder = Math.floor(dos - LEAD_TIME);

      if (daysUntilOrder < minDaysToOrder) {
        minDaysToOrder = daysUntilOrder;
        criticalProduct = prod.officialName ? `${prod.officialName} (${prod.name})` : prod.name;
      }
    }

    return NextResponse.json({
      success: true,
      daysToOrder: minDaysToOrder,
      criticalProduct,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
