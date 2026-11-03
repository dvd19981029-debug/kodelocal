import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVisitMetricsForPeriod } from '@/lib/visits';
import { verifyStaffRequest } from '@/lib/customerAuthToken';
import {
  HALLOWEEN_POTIONS,
  HALLOWEEN_PROMO_PRICE_1OZ,
  HALLOWEEN_PROMO_PRICE_HALF_OZ,
  HALLOWEEN_PROMO_DISCOUNT_1OZ,
  HALLOWEEN_PROMO_DISCOUNT_HALF_OZ,
} from '@/lib/halloweenPromo';

export const dynamic = 'force-dynamic';

function getPeriodFilter(period: string) {
  const productionStart = new Date('2026-10-14T00:00:00-06:00');
  const now = new Date();
  const svDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });
  const [year, month] = svDateStr.split('-');

  let start = productionStart;
  if (period === 'hoy') {
    start = new Date(`${svDateStr}T00:00:00-06:00`);
  } else if (period === '7d') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'mes') {
    start = new Date(`${year}-${month}-01T00:00:00-06:00`);
  } else if (period === 'anio') {
    start = new Date(`${year}-01-01T00:00:00-06:00`);
  }

  return { gte: start < productionStart ? productionStart : start };
}

export async function GET(request: Request) {
  try {
    const { authorized } = verifyStaffRequest(request);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión activa de gerencia/personal.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'hoy') as 'hoy' | '7d' | 'mes' | 'anio' | 'todo';
    const dateCondition = getPeriodFilter(period);

    const whereDate = dateCondition ? { createdAt: dateCondition } : {};

    const productionStartDate = new Date('2026-10-14T00:00:00-06:00');

    // 1. Consultas simultáneas a Prisma (período + histórico ligero para LTV, colas activas y logística)
    const [orders, sales, purchases, products, dteCount, blogPosts, allHistoricalOrders, allHistoricalSales] =
      await Promise.all([
        prisma.ecommerceOrder.findMany({
          where: whereDate,
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.sale.findMany({
          where: whereDate,
          include: { items: true, customer: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.purchase.findMany({
          where: whereDate,
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            officialName: true,
            description: true,
            unit: true,
            stock: true,
            stockHalf: true,
            minStock: true,
            price: true,
            priceHalfOunce: true,
            cost: true,
            supplier: true,
            gender: true,
            isAvailableOnline: true,
            puesto: true,
            category: {
              select: { name: true },
            },
          },
        }),
        prisma.dteDocument.count({
          where: dateCondition ? { createdAt: dateCondition } : {},
        }),
        prisma.blogPost.findMany({
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            readingTimeMin: true,
            viewsCount: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: { viewsCount: 'desc' },
        }),
        prisma.ecommerceOrder.findMany({
          where: { createdAt: { gte: productionStartDate } },
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            department: true,
            total: true,
            paymentMethod: true,
            paymentStatus: true,
            orderStatus: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.sale.findMany({
          where: { createdAt: { gte: productionStartDate } },
          select: {
            id: true,
            saleNumber: true,
            total: true,
            paymentMethod: true,
            paymentStatus: true,
            orderStatus: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                department: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // Excluir productos virtuales/servicios (como ENVIO-DOM con stock 999999)
    const physicalProducts = products.filter(
      (p) => p.id !== 'ENVIO-DOM' && (p.unit || '').toLowerCase() !== 'servicio'
    );

    // Crear mapa de costos de productos para cálculo exacto de margen
    const productCostMap = new Map<string, number>();
    physicalProducts.forEach((p) => {
      productCostMap.set(p.id, Number(p.cost || 1.95));
      productCostMap.set(p.name.toLowerCase().trim(), Number(p.cost || 1.95));
      if (p.officialName) {
        productCostMap.set(p.officialName.toLowerCase().trim(), Number(p.cost || 1.95));
      }
    });

    // 2. Agregaciones de Ventas (solo órdenes válidas y sin duplicar pedidos web cobrados en POS)
    const validOrders = orders.filter(
      (o) => o.orderStatus !== 'CANCELADO' && (o.paymentMethod !== 'CARD' || o.paymentStatus === 'COMPLETED')
    );
    const ecomOrderNumbers = new Set(validOrders.map((o) => o.orderNumber));
    const validSales = sales.filter((s) => {
      const st = String(s.orderStatus || '').toUpperCase();
      if (st === 'CANCELADO' || st === 'CANCELLED' || st === 'ANULADA') return false;
      if (st === 'PENDING_PREPARATION' || st === 'READY_AT_WINDOW') return false;
      if (s.paymentStatus !== 'COMPLETED' && st !== 'COMPLETED') return false;
      if (ecomOrderNumbers.has(s.saleNumber)) return false;
      return true;
    });

    // Histórico global válido (para LTV real, colas operativas activas y tiempos logísticos reales)
    const allValidHistoricalOrders = allHistoricalOrders.filter(
      (o) => o.orderStatus !== 'CANCELADO' && (o.paymentMethod !== 'CARD' || o.paymentStatus === 'COMPLETED')
    );
    const allEcomOrderNumbers = new Set(allValidHistoricalOrders.map((o) => o.orderNumber));
    const allValidHistoricalSales = allHistoricalSales.filter((s) => {
      const st = String(s.orderStatus || '').toUpperCase();
      if (st === 'CANCELADO' || st === 'CANCELLED' || st === 'ANULADA') return false;
      if (st === 'PENDING_PREPARATION' || st === 'READY_AT_WINDOW') return false;
      if (s.paymentStatus !== 'COMPLETED' && st !== 'COMPLETED') return false;
      if (allEcomOrderNumbers.has(s.saleNumber)) return false;
      return true;
    });

    const ecommerceTotal = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const posTotal = validSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalVentas = ecommerceTotal + posTotal;

    // 3. Gastos de Insumos y Costos
    const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);

    // Cálculo de Costo de Mercancía Vendida (COGS)
    let cogsTotal = 0;
    let onzasVendidas = 0;
    const productAgg: Record<string, { name: string; quantity: number; revenue: number; ounces: number }> = {};

    const processItem = (it: {
      productName: string;
      presentation?: string | null;
      unit?: string | null;
      quantity: number;
      total: any;
      productId?: string | null;
    }) => {
      const rawName = it.productName || 'Producto';
      const rawLower = rawName.toLowerCase();
      const pres = String(it.presentation || it.unit || '').toLowerCase();

      // Ignorar cargos de envío como producto
      if (
        it.productId === 'ENVIO-DOM' ||
        pres === 'servicio' ||
        rawLower.includes('servicio de envío') ||
        rawLower.includes('envío a domicilio')
      ) {
        return;
      }

      const qty = it.quantity || 1;
      const rev = Number(it.total || 0);
      // Limpiar sufijos como "(1 Onza)" o "(½ Oz)"
      const cleanName = rawName.replace(/\s*\([^)]*\)/g, '').trim();

      let oz = 0;
      const nameLower = cleanName.toLowerCase();
      const isNonEssenceOrLitro =
        nameLower.includes('litro') ||
        pres.includes('litro') ||
        rawLower.includes('litro') ||
        nameLower.includes('alcohol') ||
        nameLower.includes('bote') ||
        nameLower.includes('caja') ||
        nameLower.includes('sticker') ||
        rawLower.includes('sticker') ||
        (it.productId
          ? it.productId.startsWith('bote-') ||
            it.productId.startsWith('alcohol-') ||
            it.productId.startsWith('sticker-')
          : false);

      if (!isNonEssenceOrLitro) {
        if (
          pres.includes('½') ||
          pres.includes('0.5') ||
          pres.includes('media') ||
          rawLower.includes('½') ||
          rawLower.includes('media onza')
        ) {
          oz = 0.5 * qty;
        } else if (pres.includes('1.5')) {
          oz = 1.5 * qty;
        } else if (pres.includes('onza') || pres.includes('1 oz') || nameLower.includes('onza') || (it.productId && it.productId.startsWith('esencia'))) {
          oz = 1.0 * qty;
        } else if (nameLower.includes('arma tu propio perfume')) {
          oz = pres.includes('plus') ? 1.5 * qty : 1.0 * qty;
        }
      }

      onzasVendidas += oz;

      const baseUnitCost =
        (it.productId && productCostMap.get(it.productId)) ||
        productCostMap.get(cleanName.toLowerCase()) ||
        (oz > 0 ? 1.65 : rev * 0.45);
      cogsTotal += oz > 0 ? baseUnitCost * oz : baseUnitCost * qty;

      // En Top Fragancias & Esencias solo rankear esencias y perfumes preparados (no botes vacíos ni alcohol)
      if (!isNonEssenceOrLitro) {
        if (!productAgg[cleanName]) {
          productAgg[cleanName] = { name: cleanName, quantity: 0, revenue: 0, ounces: 0 };
        }
        productAgg[cleanName].quantity += qty;
        productAgg[cleanName].revenue += rev;
        productAgg[cleanName].ounces += oz;
      }
    };

    validOrders.forEach((o) => o.items.forEach(processItem));
    validSales.forEach((s) => s.items.forEach(processItem));

    // Si hay compras directas registradas se usan compras, sino se usa el costo directo de insumos vendidos
    const totalGastosCompras = purchasesTotal > 0 ? purchasesTotal : Number(cogsTotal.toFixed(2));
    const margenOperativoBruto = Number((totalVentas - totalGastosCompras).toFixed(2));
    const margenPorcentual = totalVentas > 0 ? Number(((margenOperativoBruto / totalVentas) * 100).toFixed(1)) : 0;

    const totalPedidos = validOrders.length + validSales.length;
    const ticketPromedio = totalPedidos > 0 ? Number((totalVentas / totalPedidos).toFixed(2)) : 0;

    // 4. Pedidos por Estado (Logística Aromaniak: Colas activas en vivo + Entregados/Cancelados del período)
    const liveNuevosOrders = allValidHistoricalOrders.filter((o) => o.orderStatus === 'NUEVO');
    const livePrepOrders = allValidHistoricalOrders.filter(
      (o) => o.orderStatus === 'CONFIRMADO' || o.orderStatus === 'EN_PREPARACION'
    );
    const liveRutaOrders = allValidHistoricalOrders.filter((o) => o.orderStatus === 'EN_RUTA');
    const entregadosOrders = validOrders.filter((o) => o.orderStatus === 'ENTREGADO');
    const canceladosOrders = orders.filter((o) => o.orderStatus === 'CANCELADO');

    const pedidosEstado = {
      nuevos: {
        count: liveNuevosOrders.length,
        total: Number(liveNuevosOrders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)),
      },
      enPreparacion: {
        count: livePrepOrders.length,
        total: Number(livePrepOrders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)),
      },
      enRuta: {
        count: liveRutaOrders.length,
        total: Number(liveRutaOrders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)),
      },
      entregados: {
        count: entregadosOrders.length + validSales.length, // Las ventas en mostrador se consideran entregadas de inmediato
        total: Number((entregadosOrders.reduce((acc, o) => acc + Number(o.total || 0), 0) + posTotal).toFixed(2)),
      },
      cancelados: {
        count: canceladosOrders.length,
        total: Number(canceladosOrders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)),
      },
    };

    // 5. Canales de Venta
    const ecommerceOrdersCount = validOrders.length;
    const posSalesCount = validSales.length;
    const totalTransactions = ecommerceOrdersCount + posSalesCount || 1;

    const canales = {
      ecommerce: {
        count: ecommerceOrdersCount,
        total: Number(ecommerceTotal.toFixed(2)),
        percentage: Number(((ecommerceOrdersCount / totalTransactions) * 100).toFixed(1)),
      },
      pos: {
        count: posSalesCount,
        total: Number(posTotal.toFixed(2)),
        percentage: Number(((posSalesCount / totalTransactions) * 100).toFixed(1)),
      },
    };

    // 6. Métodos de Pago
    let cardCount = 0, cardTotal = 0;
    let transferCount = 0, transferTotal = 0;
    let cashCount = 0, cashTotal = 0;

    validOrders.forEach((o) => {
      const tot = Number(o.total || 0);
      if (o.paymentMethod === 'CARD') {
        cardCount++;
        cardTotal += tot;
      } else if (o.paymentMethod === 'TRANSFER') {
        transferCount++;
        transferTotal += tot;
      } else {
        cashCount++;
        cashTotal += tot;
      }
    });

    validSales.forEach((s) => {
      const tot = Number(s.total || 0);
      if (s.paymentMethod === 'CARD') {
        cardCount++;
        cardTotal += tot;
      } else if (s.paymentMethod === 'TRANSFER') {
        transferCount++;
        transferTotal += tot;
      } else {
        cashCount++;
        cashTotal += tot;
      }
    });

    const metodosPago = {
      wompiTarjeta: {
        count: cardCount,
        total: Number(cardTotal.toFixed(2)),
        percentage: totalVentas > 0 ? Number(((cardTotal / totalVentas) * 100).toFixed(1)) : 0,
      },
      transferencia: {
        count: transferCount,
        total: Number(transferTotal.toFixed(2)),
        percentage: totalVentas > 0 ? Number(((transferTotal / totalVentas) * 100).toFixed(1)) : 0,
      },
      efectivo: {
        count: cashCount,
        total: Number(cashTotal.toFixed(2)),
        percentage: totalVentas > 0 ? Number(((cashTotal / totalVentas) * 100).toFixed(1)) : 0,
      },
    };

    // 7. Top Fragancias y Contratipos
    const topFragancias = Object.values(productAgg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map((it) => ({
        name: it.name,
        quantity: it.quantity,
        revenue: Number(it.revenue.toFixed(2)),
        ounces: Number(it.ounces.toFixed(1)),
      }));

    // 8. Departamentos con más pedidos
    const deptMap: Record<string, { count: number; total: number }> = {};
    validOrders.forEach((o) => {
      const d = o.department || 'San Salvador';
      if (!deptMap[d]) deptMap[d] = { count: 0, total: 0 };
      deptMap[d].count += 1;
      deptMap[d].total += Number(o.total || 0);
    });

    const topDepartamentos = Object.entries(deptMap)
      .map(([department, data]) => ({
        department,
        count: data.count,
        total: Number(data.total.toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 9. Inventario & Bodega (basado exclusivamente en productos disponibles e inventariados con existencia física)
    const inventoriedProducts = physicalProducts.filter(
      (p) =>
        p.isAvailableOnline !== false &&
        (Math.max(0, p.stock || 0) > 0 || Math.max(0, p.stockHalf || 0) > 0)
    );

    const isEssenceProd = (p: (typeof inventoriedProducts)[number]) =>
      (p.unit || '').toLowerCase() === 'onza' ||
      p.id.startsWith('esencia') ||
      (p.category?.name || '').toLowerCase().includes('esencia');

    const isBottleProd = (p: (typeof inventoriedProducts)[number]) =>
      !isEssenceProd(p) &&
      ((p.category?.name || '').toLowerCase() === 'botes' ||
        p.id.startsWith('bote-') ||
        p.name.toLowerCase().startsWith('bote '));

    const essenceProducts = inventoriedProducts.filter(isEssenceProd);
    const bottleProducts = inventoriedProducts.filter(isBottleProd);
    const supplyProducts = inventoriedProducts.filter((p) => !isEssenceProd(p) && !isBottleProd(p));

    const calcGroupPvp = (list: typeof inventoriedProducts) =>
      Number(
        list
          .reduce((acc, p) => {
            const isEss = isEssenceProd(p);
            const fullVal = Math.max(0, p.stock || 0) * Number(p.price || 0);
            const halfPrice = Number(p.priceHalfOunce || Number(p.price || 0) * 0.5);
            const halfVal = isEss ? Math.max(0, p.stockHalf || 0) * halfPrice : 0;
            return acc + fullVal + halfVal;
          }, 0)
          .toFixed(2)
      );

    const calcGroupCosto = (list: typeof inventoriedProducts) =>
      Number(
        list
          .reduce((acc, p) => {
            const isEss = isEssenceProd(p);
            const effectiveUnits = isEss
              ? Math.max(0, p.stock || 0) + Math.max(0, p.stockHalf || 0) * 0.5
              : Math.max(0, p.stock || 0);
            return acc + effectiveUnits * Number(p.cost || 0);
          }, 0)
          .toFixed(2)
      );

    const totalStockOnzas = Number(
      essenceProducts
        .reduce((acc, p) => acc + Math.max(0, p.stock || 0) + Math.max(0, p.stockHalf || 0) * 0.5, 0)
        .toFixed(1)
    );
    const totalStockBotes = bottleProducts.reduce((acc, p) => acc + Math.max(0, p.stock || 0), 0);
    const totalStockInsumos = supplyProducts.reduce((acc, p) => acc + Math.max(0, p.stock || 0), 0);

    const esenciasPvp = calcGroupPvp(essenceProducts);
    const esenciasCosto = calcGroupCosto(essenceProducts);
    const botesPvp = calcGroupPvp(bottleProducts);
    const botesCosto = calcGroupCosto(bottleProducts);
    const insumosPvp = calcGroupPvp(supplyProducts);
    const insumosCosto = calcGroupCosto(supplyProducts);

    const valorInventarioPvp = Number((esenciasPvp + botesPvp + insumosPvp).toFixed(2));
    const valorInventarioCosto = Number((esenciasCosto + botesCosto + insumosCosto).toFixed(2));
    const gananciaPotencial = Number((valorInventarioPvp - valorInventarioCosto).toFixed(2));

    const stockCritico = inventoriedProducts
      .map((p) => {
        const isEss = (p.unit || '').toLowerCase() === 'onza' || p.id.startsWith('esencia');
        const effectiveStock = isEss
          ? Number((Math.max(0, p.stock || 0) + Math.max(0, p.stockHalf || 0) * 0.5).toFixed(1))
          : Math.max(0, p.stock || 0);
        return {
          id: p.id,
          name: p.officialName ? `${p.officialName} (${p.name})` : p.name,
          stock: effectiveStock,
          minStock: p.minStock || 10,
          price: Number(p.price || 0),
          cost: Number(p.cost || 0),
          unit: p.unit || 'Onza',
        };
      })
      .filter((p) => p.stock <= p.minStock)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);

    // 10. Tráfico y Visitas Web Reales (Sin estimaciones ni placeholders)
    const visitMetrics = await getVisitMetricsForPeriod(period, validOrders.length);

    // Fuentes reales registradas a partir de referencias web, ordenadas de mayor a menor
    const totalSourcesCount = Object.values(visitMetrics.fuentes).reduce((a, b) => a + b, 0);
    const fuentesList = Object.entries(visitMetrics.fuentes)
      .map(([name, visits]) => ({
        name,
        visits,
        percentage: totalSourcesCount > 0 ? Number(((visits / totalSourcesCount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.visits - a.visits);

    const fuentesFinal =
      fuentesList.length > 0
        ? fuentesList
        : visitMetrics.totalVisitas > 0
        ? [{ name: 'Tráfico Directo', visits: visitMetrics.totalVisitas, percentage: 100 }]
        : [];

    // Dispositivos reales registrados en DailyVisit (con conteo real y porcentaje real)
    const totalDevicesCount =
      visitMetrics.dispositivos.mobile + visitMetrics.dispositivos.desktop + visitMetrics.dispositivos.tablet;
    const dispositivosList = [
      {
        device: 'Smartphones (Móvil)',
        count: visitMetrics.dispositivos.mobile,
        percentage:
          totalDevicesCount > 0
            ? Number(((visitMetrics.dispositivos.mobile / totalDevicesCount) * 100).toFixed(1))
            : 0,
      },
      {
        device: 'Computadoras (Desktop)',
        count: visitMetrics.dispositivos.desktop,
        percentage:
          totalDevicesCount > 0
            ? Number(((visitMetrics.dispositivos.desktop / totalDevicesCount) * 100).toFixed(1))
            : 0,
      },
      {
        device: 'Tablets & iPads',
        count: visitMetrics.dispositivos.tablet,
        percentage:
          totalDevicesCount > 0
            ? Number(((visitMetrics.dispositivos.tablet / totalDevicesCount) * 100).toFixed(1))
            : 0,
      },
    ];

    // Zonas de compradores calculadas de los pedidos reales (si el período actual aún no tiene pedidos, usa el histórico real sin inventar 100% San Salvador)
    const ordersForGeo = validOrders.length > 0 ? validOrders : allValidHistoricalOrders;
    const geoDeptMap: Record<string, number> = {};
    ordersForGeo.forEach((o) => {
      const d = (o.department || 'San Salvador').trim();
      geoDeptMap[d] = (geoDeptMap[d] || 0) + 1;
    });
    const totalGeoOrders = ordersForGeo.length || 1;
    const zonasPrincipales = Object.entries(geoDeptMap)
      .map(([zone, count]) => ({
        zone,
        count,
        share: Number(((count / totalGeoOrders) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const traficoDetalle = {
      fuentes: fuentesFinal,
      dispositivos: dispositivosList,
      zonasPrincipales,
    };

    // 11. Módulo BI: "Arma tu Propio Perfume" (Kits 100ml personalizables)
    const customItems = validOrders.flatMap((o) =>
      o.items
        .filter(
          (it) =>
            (it.productName || '').toLowerCase().includes('arma tu propio perfume') ||
            (it.presentation || '').toLowerCase().includes('arma tu propio perfume')
        )
        .map((it) => ({ ...it, order: o }))
    );

    const totalArmados = customItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
    const totalFacturadoArmados = Number(
      customItems.reduce((acc, it) => acc + Number(it.total || 0), 0).toFixed(2)
    );

    let plusCount = 0;
    let standardCount = 0;
    const customFragranceMap: Record<string, number> = {};

    const compradoresArmaTuPerfume = customItems.map((it) => {
      const pres = (it.presentation || '').toLowerCase();
      const isPlus = pres.includes('plus') || pres.includes('1.5') || Number(it.unitPrice || 0) >= 18;
      if (isPlus) plusCount += it.quantity;
      else standardCount += it.quantity;

      const cleanFragrance =
        it.productName
          .replace(/Arma tu propio perfume:\s*/i, '')
          .replace(/Arma tu propio perfume/i, '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim() || 'Fragancia Personalizada';

      if (!customFragranceMap[cleanFragrance]) customFragranceMap[cleanFragrance] = 0;
      customFragranceMap[cleanFragrance] += it.quantity;

      return {
        orderNumber: it.order?.orderNumber,
        customerName: it.order?.customerName || 'Cliente Online',
        customerPhone: it.order?.customerPhone || 'N/A',
        customerEmail: it.order?.customerEmail || null,
        fragrance: cleanFragrance,
        formula: isPlus ? 'Fórmula PLUS (1.5 oz)' : 'Fórmula Estándar (1.0 oz)',
        unitPrice: Number(it.unitPrice || (isPlus ? 18 : 15)),
        quantity: it.quantity,
        total: Number(it.total || 0),
        date: it.order?.createdAt ? it.order.createdAt.toISOString() : '',
      };
    });

    const topFraganciasArmadas = Object.entries(customFragranceMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const armaTuPropioPerfume = {
      totalArmados,
      totalFacturado: totalFacturadoArmados,
      formulaPlusCount: plusCount,
      formulaStandardCount: standardCount,
      porcentajeVentas: totalVentas > 0 ? Number(((totalFacturadoArmados / totalVentas) * 100).toFixed(1)) : 0,
      topFraganciasArmadas,
      compradores: compradoresArmaTuPerfume.slice(0, 10),
    };

    // 11.5 Tracking de Promoción de Halloween (Pociones de la Bruja: $3.30 1 Oz / $1.85 ½ Oz)
    const productByIdMap = new Map(physicalProducts.map((p) => [p.id, p]));
    const halloweenOrderNumbers = new Set<string>();
    let totalPocionesUnidades = 0;
    let totalOnzasPromo = 0;
    let totalMediasOnzasPromo = 0;
    let totalFacturadoHalloween = 0;
    let totalDescuentoHalloween = 0;
    const potionRankingMap: Record<
      string,
      { potionTitle: string; potionEmoji: string; fragrance: string; count: number; revenue: number }
    > = {};
    const compradoresHalloween: Array<{
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      potionTitle: string;
      potionEmoji: string;
      fragrance: string;
      presentation: string;
      unitPrice: number;
      quantity: number;
      total: number;
      date: string;
    }> = [];

    const registerHalloweenItem = (
      it: {
        productId?: string | null;
        productName: string;
        presentation?: string | null;
        unit?: string | null;
        unitPrice?: any;
        quantity: number;
        total: any;
      },
      meta: { orderNumber: string; customerName: string; customerPhone: string; date: string }
    ) => {
      const nameLower = (it.productName || '').toLowerCase();
      const presRaw = String(it.presentation || it.unit || '1 Onza');
      const presLower = presRaw.toLowerCase();
      if (nameLower.includes('arma tu propio perfume') || presLower.includes('arma tu propio perfume')) return;

      const unitPrice = Number(it.unitPrice || 0);
      const isPromo1Oz = Math.abs(unitPrice - HALLOWEEN_PROMO_PRICE_1OZ) < 0.01;
      const isPromoHalfOz = Math.abs(unitPrice - HALLOWEEN_PROMO_PRICE_HALF_OZ) < 0.01;
      if (!isPromo1Oz && !isPromoHalfOz) return;

      const qty = it.quantity || 1;
      const lineTotal = Number(it.total || unitPrice * qty);
      halloweenOrderNumbers.add(meta.orderNumber);
      totalPocionesUnidades += qty;
      totalFacturadoHalloween += lineTotal;

      if (isPromoHalfOz) {
        totalMediasOnzasPromo += qty;
        totalDescuentoHalloween += qty * HALLOWEEN_PROMO_DISCOUNT_HALF_OZ;
      } else {
        totalOnzasPromo += qty;
        totalDescuentoHalloween += qty * HALLOWEEN_PROMO_DISCOUNT_1OZ;
      }

      const potionInfo = it.productId ? HALLOWEEN_POTIONS[it.productId] : undefined;
      const prod = it.productId ? productByIdMap.get(it.productId) : undefined;
      const fragranceName =
        prod?.officialName ||
        prod?.name ||
        (it.productName || '').replace(/\s*\([^)]*\)/g, '').trim() ||
        'Esencia Halloween';
      const potionTitle = potionInfo?.potionTitle || 'Poción de la Bruja';
      const potionEmoji = potionInfo?.potionEmoji || '🧪';
      const rankKey = potionInfo?.id || fragranceName;

      if (!potionRankingMap[rankKey]) {
        potionRankingMap[rankKey] = {
          potionTitle,
          potionEmoji,
          fragrance: fragranceName,
          count: 0,
          revenue: 0,
        };
      }
      potionRankingMap[rankKey].count += qty;
      potionRankingMap[rankKey].revenue = Number((potionRankingMap[rankKey].revenue + lineTotal).toFixed(2));

      compradoresHalloween.push({
        orderNumber: meta.orderNumber,
        customerName: meta.customerName,
        customerPhone: meta.customerPhone,
        potionTitle,
        potionEmoji,
        fragrance: fragranceName,
        presentation: isPromoHalfOz ? '½ Onza ($1.85)' : '1 Onza ($3.30)',
        unitPrice,
        quantity: qty,
        total: Number(lineTotal.toFixed(2)),
        date: meta.date,
      });
    };

    validOrders.forEach((o) => {
      o.items.forEach((it) =>
        registerHalloweenItem(it, {
          orderNumber: o.orderNumber,
          customerName: o.customerName || 'Cliente Online',
          customerPhone: o.customerPhone || 'N/A',
          date: o.createdAt.toISOString(),
        })
      );
    });

    validSales.forEach((s) => {
      s.items.forEach((it) =>
        registerHalloweenItem(it, {
          orderNumber: s.saleNumber,
          customerName: s.cashierName ? `Mostrador (${s.cashierName})` : 'Mostrador Local',
          customerPhone: 'Mostrador POS',
          date: s.createdAt.toISOString(),
        })
      );
    });

    const promocionHalloween = {
      totalCompras: halloweenOrderNumbers.size,
      totalUnidades: totalPocionesUnidades,
      onzasCount: totalOnzasPromo,
      mediasOnzasCount: totalMediasOnzasPromo,
      totalFacturado: Number(totalFacturadoHalloween.toFixed(2)),
      totalDescuento: Number(totalDescuentoHalloween.toFixed(2)),
      topPociones: Object.values(potionRankingMap)
        .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
        .slice(0, 10),
      compradores: compradoresHalloween.slice(0, 15),
    };

    // 12. Clientes Más Valiosos (Ranking de Compradores — E-commerce + Mostrador POS identificados)
    const customerAggMap: Record<
      string,
      {
        name: string;
        phone: string;
        email: string | null;
        department: string;
        ordersCount: number;
        totalSpent: number;
        lastOrderDate: string;
      }
    > = {};

    validOrders.forEach((o) => {
      const cleanPhone = (o.customerPhone || '').replace(/\D/g, '');
      const key = cleanPhone || (o.customerName || '').trim().toLowerCase();
      if (!key) return;
      if (!customerAggMap[key]) {
        customerAggMap[key] = {
          name: o.customerName || 'Cliente Online',
          phone: o.customerPhone || 'N/A',
          email: o.customerEmail || null,
          department: o.department || 'San Salvador',
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.createdAt.toISOString(),
        };
      }
      customerAggMap[key].ordersCount += 1;
      customerAggMap[key].totalSpent += Number(o.total || 0);
      if (new Date(o.createdAt).getTime() > new Date(customerAggMap[key].lastOrderDate).getTime()) {
        customerAggMap[key].lastOrderDate = o.createdAt.toISOString();
      }
    });

    validSales.forEach((s) => {
      if (!s.customer) return;
      const cName = (s.customer.name || '').trim();
      const lowerName = cName.toLowerCase();
      if (!cName || lowerName.includes('consumidor final') || lowerName.includes('mostrador')) return;
      const cleanPhone = (s.customer.phone || '').replace(/\D/g, '');
      const key = cleanPhone || lowerName;
      if (!customerAggMap[key]) {
        customerAggMap[key] = {
          name: cName,
          phone: s.customer.phone || 'N/A',
          email: s.customer.email || null,
          department: s.customer.department || 'San Salvador',
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: s.createdAt.toISOString(),
        };
      }
      customerAggMap[key].ordersCount += 1;
      customerAggMap[key].totalSpent += Number(s.total || 0);
      if (new Date(s.createdAt).getTime() > new Date(customerAggMap[key].lastOrderDate).getTime()) {
        customerAggMap[key].lastOrderDate = s.createdAt.toISOString();
      }
    });

    const clientesTop = Object.values(customerAggMap)
      .map((c) => ({
        ...c,
        totalSpent: Number(c.totalSpent.toFixed(2)),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8);

    // 14. Proyección de Agotamiento de Stock (Días de Inventario Restante — POS + E-commerce)
    const now = new Date();
    const allTxDates = [
      ...validOrders.map((o) => new Date(o.createdAt)),
      ...validSales.map((s) => new Date(s.createdAt)),
    ];
    const earliestTxDate =
      allTxDates.length > 0
        ? allTxDates.reduce((earliest, d) => (d < earliest ? d : earliest), now)
        : now;
    const daysElapsed = Math.max(
      1,
      Math.ceil((now.getTime() - earliestTxDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const productUsageById: Record<string, { units: number; ounces: number }> = {};
    const productUsageByName: Record<string, { units: number; ounces: number }> = {};

    validOrders.forEach((o) => {
      o.items.forEach((it) => {
        const clean = (it.productName || '')
          .replace(/Arma tu propio perfume:\s*/i, '')
          .replace(/Arma tu propio perfume/i, '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim();
        const qty = it.quantity || 1;
        let oz = qty;
        const pres = (it.presentation || '').toLowerCase();
        const isLitroOrAlcohol =
          pres.includes('litro') ||
          (it.productName || '').toLowerCase().includes('litro') ||
          (it.productName || '').toLowerCase().includes('alcohol');
        if (!isLitroOrAlcohol && (pres.includes('½') || pres.includes('0.5'))) oz = 0.5 * qty;
        else if (!isLitroOrAlcohol && pres.includes('1.5')) oz = 1.5 * qty;

        if (it.productId) {
          if (!productUsageById[it.productId]) productUsageById[it.productId] = { units: 0, ounces: 0 };
          productUsageById[it.productId].units += qty;
          productUsageById[it.productId].ounces += oz;
        }
        if (!productUsageByName[clean]) productUsageByName[clean] = { units: 0, ounces: 0 };
        productUsageByName[clean].units += qty;
        productUsageByName[clean].ounces += oz;
      });
    });

    validSales.forEach((s) => {
      s.items.forEach((it) => {
        if (
          it.unit === 'Servicio' ||
          it.productId === 'ENVIO-DOM' ||
          (it.productName || '').toLowerCase().includes('servicio de envío')
        ) {
          return;
        }
        const qty = it.quantity || 1;
        const combined = `${it.unit || ''} ${it.productName || ''}`.toLowerCase();
        const isHalf = combined.includes('½') || combined.includes('media') || combined.includes('0.5');
        const oz = it.productId.startsWith('esencia') && isHalf ? qty * 0.5 : qty;

        if (it.productId) {
          if (!productUsageById[it.productId]) productUsageById[it.productId] = { units: 0, ounces: 0 };
          productUsageById[it.productId].units += qty;
          productUsageById[it.productId].ounces += oz;
        }
      });
    });

    const proyeccionAgotamiento = inventoriedProducts
      .map((p) => {
        const usage =
          productUsageById[p.id] ||
          productUsageByName[p.name] ||
          (p.officialName ? productUsageByName[p.officialName] : null) || { units: 0, ounces: 0 };
        const isEss = p.id.startsWith('esencia') || (p.unit || '').toLowerCase().includes('onza');
        const effectiveStock = isEss ? p.stock + (p.stockHalf || 0) * 0.5 : p.stock;
        const dailyBurnOunces = usage.ounces / daysElapsed;
        const daysLeft = dailyBurnOunces > 0 ? Math.round(effectiveStock / dailyBurnOunces) : 999;

        let urgency: 'CRITICO' | 'ALERTA' | 'OPTIMO' = 'OPTIMO';
        if (effectiveStock <= (p.minStock || 10) || daysLeft <= 7) urgency = 'CRITICO';
        else if (daysLeft <= 15) urgency = 'ALERTA';

        const reorderSuggestion =
          urgency === 'CRITICO'
            ? Math.max(35, Math.round(dailyBurnOunces * 30))
            : Math.max(18, Math.round(dailyBurnOunces * 20));

        return {
          id: p.id,
          name: p.officialName ? `${p.officialName} (${p.name})` : p.name,
          rawName: p.name,
          stock: effectiveStock,
          minStock: p.minStock || 15,
          unit: p.unit || 'Onza',
          dailyRate: Number(dailyBurnOunces.toFixed(2)),
          totalSold: Number(usage.ounces.toFixed(1)),
          daysLeft: daysLeft > 365 ? 999 : daysLeft,
          urgency,
          supplier: p.supplier || 'APAESA GUATEMALA',
          reorderSuggestion,
        };
      })
      .filter((p) => p.totalSold > 0 || p.stock <= p.minStock)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    // 15. Embudo de Conversión & Carritos Abandonados (SOLO checkouts con pago pendiente que NO completaron orden después; NUNCA órdenes canceladas)
    const allPaidCustomerKeys = new Set<string>();
    allValidHistoricalOrders.forEach((o) => {
      const k = (o.customerPhone || '').replace(/\D/g, '') || (o.customerName || '').trim().toLowerCase();
      if (k) allPaidCustomerKeys.add(k);
    });

    const pendingCheckoutCandidates = orders.filter(
      (o) => o.orderStatus !== 'CANCELADO' && o.paymentMethod === 'CARD' && o.paymentStatus === 'PENDING'
    );
    const deduplicatedAbandonedMap = new Map<string, (typeof orders)[number]>();
    pendingCheckoutCandidates.forEach((o) => {
      const k = (o.customerPhone || '').replace(/\D/g, '') || (o.customerName || '').trim().toLowerCase() || o.id;
      if (!allPaidCustomerKeys.has(k) && !deduplicatedAbandonedMap.has(k)) {
        deduplicatedAbandonedMap.set(k, o);
      }
    });
    const trulyAbandonedOrders = Array.from(deduplicatedAbandonedMap.values());

    const pedidosPagados = validOrders.length;
    const checkoutsIniciados = pedidosPagados + trulyAbandonedOrders.length;
    const tasaAbandono =
      checkoutsIniciados > 0
        ? Number(((trulyAbandonedOrders.length / checkoutsIniciados) * 100).toFixed(1))
        : 0;

    const embudoCarritos = {
      visitas: visitMetrics.totalVisitas,
      checkoutsIniciados,
      pedidosPagados,
      carritosAbandonados: trulyAbandonedOrders.length,
      tasaAbandono,
      listaAbandonados: trulyAbandonedOrders.slice(0, 6).map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName || 'Cliente Online',
        customerPhone: o.customerPhone || 'N/A',
        total: Number(o.total || 0),
        itemsSummary: o.items.map((it) => it.productName).slice(0, 2).join(', '),
        date: o.createdAt.toISOString(),
      })),
    };

    // 16. Retención de Clientes & LTV (Calculado sobre la cartera real histórica E-commerce + POS identificados)
    const custRetentionMap: Record<string, { orders: number; total: number }> = {};
    const ordersForLtv = validOrders.length > 0 && period !== 'hoy' ? validOrders : allValidHistoricalOrders;
    const salesForLtv = validSales.length > 0 && period !== 'hoy' ? validSales : allValidHistoricalSales;

    ordersForLtv.forEach((o) => {
      const k = (o.customerPhone || '').replace(/\D/g, '') || (o.customerName || '').trim().toLowerCase();
      if (!k) return;
      if (!custRetentionMap[k]) custRetentionMap[k] = { orders: 0, total: 0 };
      custRetentionMap[k].orders += 1;
      custRetentionMap[k].total += Number(o.total || 0);
    });
    salesForLtv.forEach((s) => {
      if (!s.customer) return;
      const cName = (s.customer.name || '').trim().toLowerCase();
      if (!cName || cName.includes('consumidor final') || cName.includes('mostrador')) return;
      const k = (s.customer.phone || '').replace(/\D/g, '') || cName;
      if (!custRetentionMap[k]) custRetentionMap[k] = { orders: 0, total: 0 };
      custRetentionMap[k].orders += 1;
      custRetentionMap[k].total += Number(s.total || 0);
    });

    const uniqueCustomers = Object.keys(custRetentionMap).length;
    const repeatCustomers = Object.values(custRetentionMap).filter((c) => c.orders >= 2).length;
    const tasaRecompra =
      uniqueCustomers > 0 ? Number(((repeatCustomers / uniqueCustomers) * 100).toFixed(1)) : 0;
    const totalRevenueCust = Object.values(custRetentionMap).reduce((acc, c) => acc + c.total, 0);
    const ltvPromedio = uniqueCustomers > 0 ? Number((totalRevenueCust / uniqueCustomers).toFixed(2)) : 0;

    const retencionLtv = {
      clientesUnicos: uniqueCustomers,
      clientesRecurrentes: repeatCustomers,
      tasaRecompra,
      ltvPromedio,
    };

    // 17. Rendimiento por Género y Familias Olfativas (E-commerce + POS, exclusivamente sobre fragancias/perfumes, sin placeholders)
    const productMetaMap = new Map<
      string,
      { gender: string; name: string; officialName: string; description: string; isEssence: boolean }
    >();
    physicalProducts.forEach((p) => {
      const isEss = (p.unit || '').toLowerCase() === 'onza' || p.id.startsWith('esencia');
      const meta = {
        gender: p.gender || 'Unisex',
        name: p.name || '',
        officialName: p.officialName || '',
        description: p.description || '',
        isEssence: isEss,
      };
      productMetaMap.set(p.id, meta);
      productMetaMap.set(p.name.toLowerCase().trim(), meta);
      if (p.officialName) productMetaMap.set(p.officialName.toLowerCase().trim(), meta);
    });

    let caballeroRev = 0,
      damaRev = 0,
      unisexRev = 0;

    const familyCounts: Record<string, number> = {
      'Amaderada / Aromática': 0,
      'Cítrica / Acuática': 0,
      'Oriental / Ámbar / Dulce': 0,
      'Floral / Frutal': 0,
    };
    let totalCategorizedOunces = 0;

    const classifyFragranceSaleItem = (it: {
      productId?: string | null;
      productName: string;
      presentation?: string | null;
      unit?: string | null;
      quantity: number;
      total: any;
    }) => {
      const rawName = (it.productName || '').trim();
      const rawLower = rawName.toLowerCase();
      const presLower = String(it.presentation || it.unit || '').toLowerCase();

      if (
        it.productId === 'ENVIO-DOM' ||
        presLower === 'servicio' ||
        rawLower.includes('litro') ||
        presLower.includes('litro') ||
        rawLower.includes('alcohol') ||
        rawLower.includes('bote') ||
        rawLower.includes('caja') ||
        rawLower.includes('sticker') ||
        (it.productId
          ? it.productId.startsWith('bote-') ||
            it.productId.startsWith('alcohol-') ||
            it.productId.startsWith('sticker-')
          : false)
      ) {
        return;
      }

      const cleanFragranceName = rawName
        .replace(/Arma tu propio perfume:\s*/i, '')
        .replace(/Arma tu propio perfume/i, '')
        .replace(/\s*\([^)]*\)/g, '')
        .trim();

      const meta =
        (it.productId ? productMetaMap.get(it.productId) : undefined) ||
        productMetaMap.get(cleanFragranceName.toLowerCase()) ||
        productMetaMap.get(rawLower);

      const rev = Number(it.total || 0);
      const gender = meta?.gender || (cleanFragranceName.endsWith(' F') ? 'Dama' : cleanFragranceName.endsWith(' H') ? 'Caballero' : 'Unisex');

      if (gender === 'Caballero') caballeroRev += rev;
      else if (gender === 'Dama') damaRev += rev;
      else unisexRev += rev;

      const qty = it.quantity || 1;
      let oz = 1.0 * qty;
      if (presLower.includes('½') || presLower.includes('0.5') || presLower.includes('media') || rawLower.includes('½')) {
        oz = 0.5 * qty;
      } else if (presLower.includes('1.5') || presLower.includes('plus')) {
        oz = 1.5 * qty;
      }

      totalCategorizedOunces += oz;
      const searchCorpus = `${cleanFragranceName} ${meta?.officialName || ''} ${meta?.description || ''}`.toLowerCase();

      if (
        /sauvage|fiera|aventus|explorador|santal|wood|cedro|vetiver|terre|invictus|king|bleu|polo|boss|legend|club de nuit|videoclub|cuero|leather|oud|fahk|assad|most wanted/i.test(
          searchCorpus
        )
      ) {
        familyCounts['Amaderada / Aromática'] += oz;
      } else if (
        /acqua|aqua|ocean|marino|nautica|light blue|mandarin|citric|hawas|allure sport|lacoste|cool water|bergamota|limon|fresh|verano|silver mountain/i.test(
          searchCorpus
        )
      ) {
        familyCounts['Cítrica / Acuática'] += oz;
      } else if (
        /khamrah|yara|vainilla|vanilla|vanille|amber|ambar|spice|eros|atrevido|million|bad boy|good girl|scandal|jean paul|ultra male|le male|black xs|phantom|roma|coffee|cacao|oud|baccarat|rojo/i.test(
          searchCorpus
        )
      ) {
        familyCounts['Oriental / Ámbar / Dulce'] += oz;
      } else {
        familyCounts['Floral / Frutal'] += oz;
      }
    };

    validOrders.forEach((o) => o.items.forEach(classifyFragranceSaleItem));
    validSales.forEach((s) => s.items.forEach(classifyFragranceSaleItem));

    const totalGenRev = caballeroRev + damaRev + unisexRev;
    const distribucionGenero = {
      caballero: {
        total: Number(caballeroRev.toFixed(2)),
        percentage: totalGenRev > 0 ? Number(((caballeroRev / totalGenRev) * 100).toFixed(1)) : 0,
      },
      dama: {
        total: Number(damaRev.toFixed(2)),
        percentage: totalGenRev > 0 ? Number(((damaRev / totalGenRev) * 100).toFixed(1)) : 0,
      },
      unisex: {
        total: Number(unisexRev.toFixed(2)),
        percentage: totalGenRev > 0 ? Number(((unisexRev / totalGenRev) * 100).toFixed(1)) : 0,
      },
    };

    const familiasOlfativas = Object.entries(familyCounts)
      .map(([name, oz]) => ({
        name,
        percentage: totalCategorizedOunces > 0 ? Number(((oz / totalCategorizedOunces) * 100).toFixed(1)) : 0,
      }))
      .filter((f) => f.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);

    const distribucionGeneroFinal = {
      ...distribucionGenero,
      familiasOlfativas,
    };

    // 18. Tiempos Logísticos Reales (calculado sobre entregas reales y paquetes activos en ruta hoy)
    const periodDelivered = validOrders.filter((o) => o.orderStatus === 'ENTREGADO');
    const allHistoricalDelivered = allValidHistoricalOrders.filter((o) => o.orderStatus === 'ENTREGADO');
    const deliveredSource = periodDelivered.length > 0 ? periodDelivered : allHistoricalDelivered;

    let tiempoPromedioHoras = 0;
    if (deliveredSource.length > 0) {
      const totalDeliveryMs = deliveredSource.reduce(
        (sum, o) => sum + Math.max(0, new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()),
        0
      );
      tiempoPromedioHoras = Math.max(1, Math.round(totalDeliveryMs / (deliveredSource.length * 3600000)));
    }

    // Efectividad de entrega real: órdenes entregadas o en curso vs órdenes canceladas (excluyendo intentos de tarjeta Wompi no completados)
    const realOrdersPool =
      validOrders.length > 0
        ? orders.filter((o) => !(o.paymentMethod === 'CARD' && o.paymentStatus === 'PENDING'))
        : allHistoricalOrders.filter((o) => !(o.paymentMethod === 'CARD' && o.paymentStatus === 'PENDING'));

    const successfulOrActivePool = realOrdersPool.filter((o) => o.orderStatus !== 'CANCELADO').length;
    const tasaEfectividad =
      realOrdersPool.length > 0
        ? Number(((successfulOrActivePool / realOrdersPool.length) * 100).toFixed(1))
        : 100;

    const tiemposLogistica = {
      tiempoPromedioHoras,
      tasaEfectividad,
      pedidosEnRuta: liveRutaOrders.length,
      entregasCompletadas: allHistoricalDelivered.length,
      courierPrincipal: 'C807 Express / Mensajero Propio',
    };

    // 19. Movimientos Recientes Mixtos (Ecommerce + POS, excluyendo intentos de tarjeta no pagados)
    const realOrdersForRecent = orders.filter(
      (o) => !(o.paymentMethod === 'CARD' && o.paymentStatus === 'PENDING' && o.orderStatus === 'NUEVO')
    );
    const recentEcommerce = realOrdersForRecent.slice(0, 5).map((o) => ({
      id: o.id,
      number: o.orderNumber,
      customer: o.customerName || 'Cliente Online',
      type: 'ECOMMERCE' as const,
      status: o.orderStatus,
      total: Number(o.total || 0),
      paymentMethod: o.paymentMethod,
      date: o.createdAt.toISOString(),
    }));

    const recentPos = validSales.slice(0, 5).map((s) => ({
      id: s.id,
      number: s.saleNumber,
      customer: s.customer?.name || (s.cashierName ? `Mostrador (${s.cashierName})` : 'Mostrador Local'),
      type: 'POS' as const,
      status: s.orderStatus || 'COMPLETED',
      total: Number(s.total || 0),
      paymentMethod: s.paymentMethod,
      date: s.createdAt.toISOString(),
    }));

    const recientes = [...recentEcommerce, ...recentPos]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);

    // 20. Rendimiento de Artículos SEO & Blog
    const totalBlogViews = blogPosts.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const postsSeo = {
      totalPosts: blogPosts.length,
      totalVistas: totalBlogViews,
      promedioTiempoLecturaMin:
        blogPosts.length > 0
          ? Math.round(blogPosts.reduce((acc, p) => acc + (p.readingTimeMin || 3), 0) / blogPosts.length)
          : 3,
      posts: blogPosts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category || 'General',
        views: p.viewsCount || 0,
        readingTimeMin: p.readingTimeMin || 3,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : p.createdAt.toISOString(),
        url: `/blog/${p.slug}`,
      })),
    };

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalVentas: Number(totalVentas.toFixed(2)),
        totalGastosCompras: Number(totalGastosCompras.toFixed(2)),
        margenOperativoBruto,
        margenPorcentual,
        totalPedidos,
        ticketPromedio,
        onzasVendidas: Number(onzasVendidas.toFixed(1)),
        dteTransmitidos: dteCount,
      },
      visitas: visitMetrics,
      traficoDetalle,
      armaTuPropioPerfume,
      promocionHalloween,
      clientesTop,
      proyeccionAgotamiento,
      embudoCarritos,
      retencionLtv,
      distribucionGenero: distribucionGeneroFinal,
      tiemposLogistica,
      postsSeo,
      pedidosEstado,
      canales,
      metodosPago,
      topFragancias,
      topDepartamentos,
      inventario: {
        totalProductos: inventoriedProducts.length,
        totalStockOnzas,
        valorInventarioPvp,
        valorInventarioCosto,
        gananciaPotencial,
        desglose: {
          esencias: {
            skus: essenceProducts.length,
            onzas: totalStockOnzas,
            pvp: esenciasPvp,
            costo: esenciasCosto,
            ganancia: Number((esenciasPvp - esenciasCosto).toFixed(2)),
          },
          botes: {
            skus: bottleProducts.length,
            unidades: totalStockBotes,
            pvp: botesPvp,
            costo: botesCosto,
            ganancia: Number((botesPvp - botesCosto).toFixed(2)),
          },
          insumos: {
            skus: supplyProducts.length,
            unidades: totalStockInsumos,
            pvp: insumosPvp,
            costo: insumosCosto,
            ganancia: Number((insumosPvp - insumosCosto).toFixed(2)),
          },
        },
        stockCritico,
      },
      recientes,
    });
  } catch (error: any) {
    console.error('Error generando dashboard aromaniak:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
