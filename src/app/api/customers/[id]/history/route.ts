import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffRequest, verifyCustomerToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de cliente requerido' }, { status: 400 });
    }

    const { authorized: isStaff } = verifyStaffRequest(request);
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const customerPayload = verifyCustomerToken(bearerToken);

    if (!isStaff && (!customerPayload || customerPayload.customerId !== id)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        tier: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    // 1. Obtener ventas en tienda física (POS)
    const posSales = await prisma.sale.findMany({
      where: {
        customerId: id,
        NOT: {
          OR: [
            { orderStatus: 'CANCELLED' },
            { orderStatus: 'CANCELADO' },
            { orderStatus: 'ANULADA' },
          ],
        },
      },
      include: {
        dteDocument: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Obtener pedidos en tienda online (Ecommerce)
    const ecommerceOrders = await prisma.ecommerceOrder.findMany({
      where: {
        customerId: id,
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Formatear y unificar compras
    const unifiedHistory = [
      ...posSales.map((s) => ({
        id: s.id,
        channel: 'POS' as const,
        originLabel: 'Tienda Física (POS)',
        orderNumber: s.saleNumber,
        tipoComprobante: s.tipoComprobante === '03' ? 'Crédito Fiscal (CCF)' : 'Factura (FC)',
        subtotal: Number(s.subtotal || 0),
        total: Number(s.total || 0),
        paymentMethod: s.paymentMethod,
        paymentStatus: s.paymentStatus,
        orderStatus: s.orderStatus || 'COMPLETED',
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
        dteNumeroControl: s.dteDocument?.numeroControl || null,
        dteCodigoGeneracion: s.dteDocument?.codigoGeneracion || null,
        items: (s.items || []).map((it) => ({
          id: it.id,
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice || 0),
          total: Number(it.total || 0),
        })),
      })),
      ...ecommerceOrders.map((o) => ({
        id: o.id,
        channel: 'ONLINE' as const,
        originLabel: 'Tienda Online (Web)',
        orderNumber: o.orderNumber,
        tipoComprobante: 'Factura (FC)',
        subtotal: Number(o.subtotal || 0),
        total: Number(o.total || 0),
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        notes: o.notes,
        createdAt: o.createdAt.toISOString(),
        dteNumeroControl: null,
        dteCodigoGeneracion: null,
        items: (o.items || []).map((it) => ({
          id: it.id,
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice || 0),
          total: Number(it.total || 0),
        })),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 4. Métricas consolidadas
    const totalSpent = unifiedHistory.reduce((acc, h) => acc + h.total, 0);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        tradeName: customer.tradeName || customer.businessName || '',
        documentType: customer.documentType || 'DUI',
        documentNum: customer.documentNum || '00000000-0',
        nrc: customer.nrc || '',
        activityDesc: customer.activityDesc || '',
        taxCategory: customer.taxCategory || 'OTRO',
        preferredDoc: customer.preferredDoc || (customer.nrc ? '03' : '01'),
        email: customer.email || '',
        phone: customer.phone || '',
        department: customer.department || 'San Salvador',
        municipality: customer.municipality || 'San Salvador Centro',
        address: customer.address || '',
        notes: customer.notes || '',
        specialEssencePrice: customer.specialEssencePrice ? Number(customer.specialEssencePrice) : null,
        specialBottlePrice: customer.specialBottlePrice ? Number(customer.specialBottlePrice) : null,
        tierId: customer.tierId || null,
        tier: customer.tier || null,
        customDiscountPct: customer.customDiscountPct || null,
        createdAt: customer.createdAt.toISOString(),
      },
      metrics: {
        totalSpent: Number(totalSpent.toFixed(2)),
        totalPurchases: unifiedHistory.length,
        posCount: posSales.length,
        ecommerceCount: ecommerceOrders.length,
      },
      history: unifiedHistory,
    });
  } catch (error: any) {
    console.error('Error fetching customer history:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
