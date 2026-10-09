import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        sale: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: 'COMPLETED'
        }
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20 // Top 20 best sellers
    });

    if (recentSales.length === 0) {
      return NextResponse.json({ success: true, daysToOrder: 999, message: "Sin datos" });
    }

    const productIds = recentSales.map(s => s.productId).filter(Boolean) as string[];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true }
    });

    const LEAD_TIME = 14;
    let minDaysToOrder = 999;
    let criticalProduct = "";

    for (const sale of recentSales) {
      const prod = products.find(p => p.id === sale.productId);
      if (!prod) continue;

      const adr = (sale._sum.quantity || 0) / 30;
      if (adr < 0.1) continue;

      const dos = prod.stock / adr;
      const daysUntilOrder = Math.floor(dos - LEAD_TIME);

      if (daysUntilOrder < minDaysToOrder) {
        minDaysToOrder = daysUntilOrder;
        criticalProduct = prod.name;
      }
    }

    return NextResponse.json({
      success: true,
      daysToOrder: minDaysToOrder,
      criticalProduct
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
