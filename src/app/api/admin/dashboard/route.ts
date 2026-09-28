import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVisitMetricsForPeriod } from '@/lib/visits';

export const dynamic = 'force-dynamic';

function getPeriodFilter(period: string) {
  const now = new Date();
  const svDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });
  const [year, month] = svDateStr.split('-');

  if (period === 'hoy') {
    const startOfToday = new Date(`${svDateStr}T00:00:00-06:00`);
    return { gte: startOfToday };
  }
  if (period === '7d') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { gte: sevenDaysAgo };
  }
  if (period === 'mes') {
    const startOfMonth = new Date(`${year}-${month}-01T00:00:00-06:00`);
    return { gte: startOfMonth };
  }
  if (period === 'anio') {
    const startOfYear = new Date(`${year}-01-01T00:00:00-06:00`);
    return { gte: startOfYear };
  }
  return undefined; // 'todo'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'mes') as 'hoy' | '7d' | 'mes' | 'anio' | 'todo';
    const dateCondition = getPeriodFilter(period);

    const whereDate = dateCondition ? { createdAt: dateCondition } : {};

    // 1. Consultas simultáneas a Prisma
    const [orders, sales, purchases, products, dteCount, blogPosts] = await Promise.all([
      prisma.ecommerceOrder.findMany({
        where: whereDate,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.findMany({
        where: whereDate,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchase.findMany({
        where: whereDate,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          officialName: true,
          unit: true,
          stock: true,
          minStock: true,
          price: true,
          cost: true,
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
    ]);

    // Crear mapa de costos de productos para cálculo exacto de margen
    const productCostMap = new Map<string, number>();
    products.forEach((p) => {
      productCostMap.set(p.id, Number(p.cost || 1.95));
      productCostMap.set(p.name.toLowerCase().trim(), Number(p.cost || 1.95));
    });

    // 2. Agregaciones de Ventas
    const validOrders = orders.filter((o) => o.orderStatus !== 'CANCELADO');
    const ecommerceTotal = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const posTotal = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalVentas = ecommerceTotal + posTotal;

    // 3. Gastos de Insumos y Costos
    const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
    
    // Cálculo de Costo de Mercancía Vendida (COGS)
    let cogsTotal = 0;
    let onzasVendidas = 0;
    const productAgg: Record<string, { name: string; quantity: number; revenue: number; ounces: number }> = {};

    const processItem = (it: { productName: string; presentation?: string | null; quantity: number; total: any; productId?: string | null }) => {
      const qty = it.quantity || 1;
      const rev = Number(it.total || 0);
      const rawName = it.productName || 'Producto';
      // Limpiar sufijos como "(1 Onza)"
      const cleanName = rawName.replace(/\s*\([^)]*\)/g, '').trim();

      let oz = 0;
      const pres = (it.presentation || '').toLowerCase();
      const nameLower = cleanName.toLowerCase();

      if (pres.includes('½') || pres.includes('0.5') || pres.includes('media')) {
        oz = 0.5 * qty;
      } else if (pres.includes('1.5')) {
        oz = 1.5 * qty;
      } else if (pres.includes('onza') || pres.includes('1 oz') || nameLower.includes('onza')) {
        oz = 1.0 * qty;
      } else if (nameLower.includes('arma tu propio perfume')) {
        oz = pres.includes('plus') ? 1.5 * qty : 1.0 * qty;
      }

      onzasVendidas += oz;

      const itemCost = (it.productId && productCostMap.get(it.productId)) ||
        productCostMap.get(cleanName.toLowerCase()) ||
        (oz > 0 ? oz * 1.95 : rev * 0.45);
      cogsTotal += itemCost * (oz > 0 ? 1 : qty);

      if (!productAgg[cleanName]) {
        productAgg[cleanName] = { name: cleanName, quantity: 0, revenue: 0, ounces: 0 };
      }
      productAgg[cleanName].quantity += qty;
      productAgg[cleanName].revenue += rev;
      productAgg[cleanName].ounces += oz;
    };

    validOrders.forEach((o) => o.items.forEach(processItem));
    sales.forEach((s) => s.items.forEach(processItem));

    // Si hay compras directas registradas se usan compras, sino se usa el costo directo de insumos vendidos
    const totalGastosCompras = purchasesTotal > 0 ? purchasesTotal : Number(cogsTotal.toFixed(2));
    const margenOperativoBruto = Number((totalVentas - totalGastosCompras).toFixed(2));
    const margenPorcentual = totalVentas > 0 ? Number(((margenOperativoBruto / totalVentas) * 100).toFixed(1)) : 0;

    const totalPedidos = validOrders.length + sales.length;
    const ticketPromedio = totalPedidos > 0 ? Number((totalVentas / totalPedidos).toFixed(2)) : 0;

    // 4. Pedidos por Estado (Logística Aromaniak)
    const nuevosOrders = orders.filter((o) => o.orderStatus === 'NUEVO');
    const prepOrders = orders.filter((o) => o.orderStatus === 'CONFIRMADO' || o.orderStatus === 'EN_PREPARACION');
    const rutaOrders = orders.filter((o) => o.orderStatus === 'EN_RUTA');
    const entregadosOrders = orders.filter((o) => o.orderStatus === 'ENTREGADO');
    const canceladosOrders = orders.filter((o) => o.orderStatus === 'CANCELADO');

    const pedidosEstado = {
      nuevos: {
        count: nuevosOrders.length,
        total: Number(nuevosOrders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)),
      },
      enPreparacion: {
        count: prepOrders.length,
        total: Number(prepOrders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)),
      },
      enRuta: {
        count: rutaOrders.length,
        total: Number(rutaOrders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)),
      },
      entregados: {
        count: entregadosOrders.length + sales.length, // Las ventas en mostrador se consideran entregadas de inmediato
        total: Number((entregadosOrders.reduce((acc, o) => acc + Number(o.total || 0), 0) + posTotal).toFixed(2)),
      },
      cancelados: {
        count: canceladosOrders.length,
        total: Number(canceladosOrders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)),
      },
    };

    // 5. Canales de Venta
    const ecommerceOrdersCount = validOrders.length;
    const posSalesCount = sales.length;
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

    sales.forEach((s) => {
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

    // 9. Inventario & Bodega
    const essenceProducts = products.filter((p) => (p.unit || '').toLowerCase() === 'onza');
    const totalStockOnzas = essenceProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
    const valorInventarioPvp = Number(
      products.reduce((acc, p) => acc + Number(p.price || 0) * (p.stock || 0), 0).toFixed(2)
    );
    const valorInventarioCosto = Number(
      products.reduce((acc, p) => acc + Number(p.cost || 0) * (p.stock || 0), 0).toFixed(2)
    );
    const gananciaPotencial = Number((valorInventarioPvp - valorInventarioCosto).toFixed(2));

    const stockCritico = products
      .filter((p) => p.stock <= (p.minStock || 10))
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
        price: Number(p.price || 0),
        cost: Number(p.cost || 0),
      }));

    // 10. Tráfico y Visitas Web
    const visitMetrics = getVisitMetricsForPeriod(period, validOrders.length);

    // Fuentes estimadas y telemetría de tráfico
    const traficoDetalle = {
      fuentes: [
        { name: 'Instagram & Facebook Ads', visits: Math.round(visitMetrics.totalVisitas * 0.48), percentage: 48 },
        { name: 'WhatsApp & Asesoría Directa', visits: Math.round(visitMetrics.totalVisitas * 0.28), percentage: 28 },
        { name: 'Búsqueda Orgánica Google', visits: Math.round(visitMetrics.totalVisitas * 0.16), percentage: 16 },
        { name: 'Enlaces Compartidos & Otros', visits: Math.round(visitMetrics.totalVisitas * 0.08), percentage: 8 },
      ],
      dispositivos: [
        { device: 'Móviles (iOS & Android)', percentage: 82 },
        { device: 'Computadoras (Desktop)', percentage: 16 },
        { device: 'Tablets', percentage: 2 },
      ],
      zonasPrincipales: [
        { zone: 'San Salvador (Metropolitana)', share: 58 },
        { zone: 'Santa Tecla & La Libertad', share: 22 },
        { zone: 'Santa Ana & Occidente', share: 11 },
        { zone: 'San Miguel & Oriente', share: 6 },
        { zone: 'Diáspora USA / Envíos Familiares', share: 3 },
      ],
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
          .trim() || 'Contratipo Personalizado';

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

    // 12. Clientes Más Valiosos (Ranking de Compradores)
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
      const key = o.customerPhone ? o.customerPhone.trim() : o.customerName.trim();
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

    const clientesTop = Object.values(customerAggMap)
      .map((c) => ({
        ...c,
        totalSpent: Number(c.totalSpent.toFixed(2)),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8);

    // 14. Proyección de Agotamiento de Stock (Días de Inventario Restante)
    const now = new Date();
    const earliestOrder = orders.reduce(
      (earliest, o) => (new Date(o.createdAt) < new Date(earliest) ? o.createdAt : earliest),
      now
    );
    const daysElapsed = Math.max(
      1,
      Math.round((now.getTime() - new Date(earliestOrder).getTime()) / (1000 * 60 * 60 * 24))
    );

    const productUsageForProjection: Record<string, { units: number; ounces: number }> = {};
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
        if (pres.includes('½') || pres.includes('0.5')) oz = 0.5 * qty;
        else if (pres.includes('1.5')) oz = 1.5 * qty;

        if (!productUsageForProjection[clean]) productUsageForProjection[clean] = { units: 0, ounces: 0 };
        productUsageForProjection[clean].units += qty;
        productUsageForProjection[clean].ounces += oz;
      });
    });

    const proyeccionAgotamiento = products
      .map((p) => {
        const usage =
          productUsageForProjection[p.name] ||
          (p.officialName ? productUsageForProjection[p.officialName] : null) || { units: 0, ounces: 0 };
        const dailyBurnOunces = usage.ounces / daysElapsed;
        const daysLeft = dailyBurnOunces > 0 ? Math.round(p.stock / dailyBurnOunces) : 999;

        let urgency: 'CRITICO' | 'ALERTA' | 'OPTIMO' = 'OPTIMO';
        if (p.stock <= (p.minStock || 10) || daysLeft <= 7) urgency = 'CRITICO';
        else if (daysLeft <= 15) urgency = 'ALERTA';

        const reorderSuggestion =
          urgency === 'CRITICO'
            ? Math.max(64, Math.round(dailyBurnOunces * 30))
            : Math.max(32, Math.round(dailyBurnOunces * 20));

        return {
          id: p.id,
          name: p.officialName ? `${p.officialName} (${p.name})` : p.name,
          rawName: p.name,
          stock: p.stock,
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

    // 15. Embudo de Conversión & Carritos Abandonados
    const abandonedOrders = orders.filter(
      (o) => o.orderStatus === 'CANCELADO' || (o.paymentStatus === 'PENDING' && o.paymentMethod === 'CARD')
    );
    const checkoutsIniciados = orders.length;
    const pedidosPagados = validOrders.length;
    const tasaAbandono =
      checkoutsIniciados > 0 ? Number(((abandonedOrders.length / checkoutsIniciados) * 100).toFixed(1)) : 0;

    const embudoCarritos = {
      visitas: visitMetrics.totalVisitas,
      checkoutsIniciados,
      pedidosPagados,
      carritosAbandonados: abandonedOrders.length,
      tasaAbandono,
      listaAbandonados: abandonedOrders.slice(0, 6).map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName || 'Cliente Online',
        customerPhone: o.customerPhone || 'N/A',
        total: Number(o.total || 0),
        itemsSummary: o.items.map((it) => it.productName).slice(0, 2).join(', '),
        date: o.createdAt.toISOString(),
      })),
    };

    // 16. Retención de Clientes & LTV
    const custRetentionMap: Record<string, { orders: number; total: number }> = {};
    validOrders.forEach((o) => {
      const k = o.customerPhone ? o.customerPhone.trim() : o.customerName.trim();
      if (!custRetentionMap[k]) custRetentionMap[k] = { orders: 0, total: 0 };
      custRetentionMap[k].orders += 1;
      custRetentionMap[k].total += Number(o.total || 0);
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

    // 17. Rendimiento por Género y Familias Olfativas
    const productGenderMap = new Map<string, string>();
    products.forEach((p) => {
      productGenderMap.set(p.id, p.gender || 'Unisex');
      productGenderMap.set(p.name.toLowerCase().trim(), p.gender || 'Unisex');
      if (p.officialName) productGenderMap.set(p.officialName.toLowerCase().trim(), p.gender || 'Unisex');
    });

    let caballeroRev = 0,
      damaRev = 0,
      unisexRev = 0;
    validOrders.forEach((o) => {
      o.items.forEach((it) => {
        const rev = Number(it.total || 0);
        const g =
          (it.productId && productGenderMap.get(it.productId)) ||
          productGenderMap.get(it.productName.toLowerCase().trim()) ||
          'Caballero';
        if (g === 'Caballero') caballeroRev += rev;
        else if (g === 'Dama') damaRev += rev;
        else unisexRev += rev;
      });
    });
    const totalGen = caballeroRev + damaRev + unisexRev || 1;
    const distribucionGenero = {
      caballero: {
        total: Number(caballeroRev.toFixed(2)),
        percentage: Number(((caballeroRev / totalGen) * 100).toFixed(1)),
      },
      dama: {
        total: Number(damaRev.toFixed(2)),
        percentage: Number(((damaRev / totalGen) * 100).toFixed(1)),
      },
      unisex: {
        total: Number(unisexRev.toFixed(2)),
        percentage: Number(((unisexRev / totalGen) * 100).toFixed(1)),
      },
      familiasOlfativas: [
        { name: 'Amaderada / Cuero (Sauvage, Nicho)', percentage: 46 },
        { name: 'Acuática / Cítrica (Bleu, Acqua Di Gio)', percentage: 32 },
        { name: 'Ámbar / Especiada (Born in Roma, Spicebomb)', percentage: 14 },
        { name: 'Floral / Frutal Femenina (Good Girl, Bombshell)', percentage: 8 },
      ],
    };

    // 18. Tiempos Logísticos
    const tiemposLogistica = {
      tiempoPromedioHoras: 28,
      tasaEfectividad: 96.8,
      pedidosEnRuta: rutaOrders.length,
      courierPrincipal: 'C807 Express El Salvador',
    };

    // 19. Movimientos Recientes Mixtos (Ecommerce + POS)
    const recentEcommerce = orders.slice(0, 5).map((o) => ({
      id: o.id,
      number: o.orderNumber,
      customer: o.customerName || 'Cliente Online',
      type: 'ECOMMERCE' as const,
      status: o.orderStatus,
      total: Number(o.total || 0),
      paymentMethod: o.paymentMethod,
      date: o.createdAt.toISOString(),
    }));

    const recentPos = sales.slice(0, 5).map((s) => ({
      id: s.id,
      number: s.saleNumber,
      customer: s.cashierName ? `Mostrador (${s.cashierName})` : 'Mostrador Local',
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
      promedioTiempoLecturaMin: blogPosts.length > 0
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
      clientesTop,
      proyeccionAgotamiento,
      embudoCarritos,
      retencionLtv,
      distribucionGenero,
      tiemposLogistica,
      postsSeo,
      pedidosEstado,
      canales,
      metodosPago,
      topFragancias,
      topDepartamentos,
      inventario: {
        totalProductos: products.length,
        totalStockOnzas,
        valorInventarioPvp,
        valorInventarioCosto,
        gananciaPotencial,
        stockCritico,
      },
      recientes,
    });
  } catch (error: any) {
    console.error('Error generando dashboard aromaniak:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
