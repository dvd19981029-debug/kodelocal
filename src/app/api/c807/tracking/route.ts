import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { c807Client } from '@/lib/c807';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = String(
      searchParams.get('guia') ||
        searchParams.get('q') ||
        searchParams.get('pedido') ||
        ''
    )
      .trim()
      .replace(/^#/, '');

    if (!rawQuery) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ingresa tu número de guía C807 o número de pedido Aromaniak.',
        },
        { status: 400 }
      );
    }

    let resolvedGuia = rawQuery;
    let orderSummary: {
      orderNumber: string;
      customerName: string;
      department?: string | null;
      municipality?: string | null;
      shippingAddress?: string | null;
      orderStatus: string;
      paymentStatus?: string | null;
      createdAt: string;
      trackingNumber?: string | null;
      courierName?: string | null;
    } | null = null;

    // 1. Buscar si coincide con una orden de Tienda Online (EcommerceOrder) por orderNumber o trackingNumber
    try {
      const ecomOrder = await prisma.ecommerceOrder.findFirst({
        where: {
          OR: [
            { orderNumber: { equals: rawQuery, mode: 'insensitive' } },
            { trackingNumber: { equals: rawQuery, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (ecomOrder) {
        orderSummary = {
          orderNumber: ecomOrder.orderNumber,
          customerName: ecomOrder.customerName,
          department: ecomOrder.department,
          municipality: ecomOrder.municipality,
          shippingAddress: ecomOrder.shippingAddress,
          orderStatus: ecomOrder.orderStatus,
          paymentStatus: ecomOrder.paymentStatus,
          createdAt: ecomOrder.createdAt.toISOString(),
          trackingNumber: ecomOrder.trackingNumber,
          courierName: ecomOrder.courierName || 'C807 Express',
        };
        if (ecomOrder.trackingNumber && ecomOrder.trackingNumber.trim()) {
          resolvedGuia = ecomOrder.trackingNumber.trim();
        } else if (
          ecomOrder.orderNumber.toUpperCase() === rawQuery.toUpperCase()
        ) {
          resolvedGuia = '';
        }
      }
    } catch (_) {}

    // 2. Si no se halló en EcommerceOrder, buscar en Ventas POS / Domicilio (Sale / Shipment)
    if (!orderSummary) {
      try {
        const shipmentMatch = await prisma.shipment.findFirst({
          where: {
            trackingNumber: { equals: rawQuery, mode: 'insensitive' },
          },
          include: { sale: true },
        });

        const saleMatch =
          shipmentMatch?.sale ||
          (await prisma.sale.findFirst({
            where: {
              saleNumber: { equals: rawQuery, mode: 'insensitive' },
            },
            include: { shipments: true, customer: true },
          }));

        if (saleMatch) {
          let parsedNotes: any = null;
          if (saleMatch.notes && saleMatch.notes.trim().startsWith('{')) {
            try {
              const lastBrace = saleMatch.notes.lastIndexOf('}');
              const jsonStr =
                lastBrace !== -1
                  ? saleMatch.notes.slice(0, lastBrace + 1)
                  : saleMatch.notes;
              parsedNotes = JSON.parse(jsonStr);
            } catch (_) {}
          }

          const dom = parsedNotes?.domicilio || {};
          const cli = parsedNotes?.cliente || {};
          const firstShip =
            shipmentMatch ||
            ((saleMatch as any).shipments && (saleMatch as any).shipments[0]) ||
            null;
          const track =
            dom.trackingNumber || firstShip?.trackingNumber || null;

          orderSummary = {
            orderNumber: saleMatch.saleNumber,
            customerName:
              dom.customerName ||
              cli.nombre ||
              (saleMatch as any).customer?.name ||
              'Cliente Aromaniak',
            department: dom.department || cli.departamento || null,
            municipality: dom.municipality || cli.municipio || null,
            shippingAddress: dom.shippingAddress || cli.direccion || null,
            orderStatus:
              dom.domicilioStatus ||
              (firstShip?.status === 'DELIVERED'
                ? 'ENTREGADO'
                : track
                ? 'EN_RUTA'
                : 'EN_PREPARACION'),
            paymentStatus: saleMatch.paymentStatus,
            createdAt: saleMatch.createdAt.toISOString(),
            trackingNumber: track,
            courierName: dom.courierName || firstShip?.carrier || 'C807 Express',
          };

          if (track && String(track).trim()) {
            resolvedGuia = String(track).trim();
          } else if (
            saleMatch.saleNumber.toUpperCase() === rawQuery.toUpperCase()
          ) {
            resolvedGuia = '';
          }
        }
      } catch (_) {}
    }

    // 3. Si tenemos número de guía para consultar en C807 en tiempo real
    if (resolvedGuia) {
      const tracking = await c807Client.consultarRastreoDetallado(resolvedGuia);

      // Si encontramos la guía o encontramos el pedido en Aromaniak
      if (tracking.found || orderSummary) {
        return NextResponse.json({
          success: true,
          query: rawQuery,
          guia: resolvedGuia,
          tracking,
          order: orderSummary,
        });
      }

      return NextResponse.json(
        {
          success: false,
          query: rawQuery,
          guia: resolvedGuia,
          error:
            'No se encontraron registros para este número de guía o pedido. Verifica que esté bien escrito.',
        },
        { status: 404 }
      );
    }

    // 4. Si el pedido existe en Aromaniak pero aún está en preparación sin guía C807 asignada
    if (orderSummary) {
      return NextResponse.json({
        success: true,
        query: rawQuery,
        guia: null,
        tracking: null,
        order: orderSummary,
      });
    }

    return NextResponse.json(
      {
        success: false,
        query: rawQuery,
        error:
          'No se encontró ningún pedido o guía con ese código.',
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[GET /api/c807/tracking] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al consultar el estado del envío en tiempo real.',
      },
      { status: 500 }
    );
  }
}
