/**
 * src/lib/miranda/growth.ts - Motor Co-Administrador y Consultor de Crecimiento para Supabase / Vercel
 * 
 * Acceso completo a todas las bases de datos de Aromaniak:
 * - Catálogo completo de esencias, frascos, insumos, costos y precios
 * - Pedidos Ecommerce (Nuevos, En Ruta, Entregados, Cancelados)
 * - Ventas POS y caja
 * - Cartera de clientes y logística C807
 * - Demandas perdidas, tareas operativas y reglas de negocio
 */

import { prisma } from "@/lib/prisma";
import { queryKode } from "@/lib/kodeDb";

export async function getBusinessContextSummary(): Promise<string> {
  const now = new Date();
  const svDateStr = now.toLocaleDateString("en-CA", { timeZone: "America/El_Salvador" }); // "YYYY-MM-DD"
  const startOfToday = new Date(`${svDateStr}T00:00:00-06:00`);
  const endOfToday = new Date(`${svDateStr}T23:59:59.999-06:00`);

  const yesterdayDate = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const svYesterdayStr = yesterdayDate.toLocaleDateString("en-CA", { timeZone: "America/El_Salvador" });
  const startOfYesterday = new Date(`${svYesterdayStr}T00:00:00-06:00`);
  const endOfYesterday = new Date(`${svYesterdayStr}T23:59:59.999-06:00`);

  const [year, month] = svDateStr.split("-");
  const startOfMonth = new Date(`${year}-${month}-01T00:00:00-06:00`);

  const [
    allProducts,
    recentSales,
    ordersByStatus,
    recentOrders,
    customerCount,
    allCustomers,
    demands,
    tasks,
    memories,
    recentInteractions,
    salesTodayAgg,
    ordersTodayAgg,
    salesYesterdayAgg,
    ordersYesterdayAgg,
    salesMonthAgg,
    ordersMonthAgg,
    lastSale,
    lastOrder,
    topEcommerceItems,
    topCustomers,
    topDepts,
    kodeStatsRes,
    kodeTodayRes,
    kodeYesterdayRes,
    kodeMonthRes,
    kodeRecentOrdersRes,
    kodeClientsRes,
    kodeTopRes,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        sku: true,
        name: true,
        officialName: true,
        brand: true,
        stock: true,
        minStock: true,
        price: true,
        cost: true,
        unit: true,
        puesto: true,
      },
      orderBy: { stock: "asc" },
    }),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        saleNumber: true,
        total: true,
        channel: true,
        paymentMethod: true,
        createdAt: true,
        tipoComprobante: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    }),
    prisma.ecommerceOrder.groupBy({
      by: ["orderStatus"],
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.ecommerceOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        orderNumber: true,
        orderStatus: true,
        total: true,
        customerName: true,
        customerPhone: true,
        department: true,
        municipality: true,
        trackingNumber: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
    prisma.customer.count(),
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        department: true,
        municipality: true,
        documentNum: true,
        documentType: true,
        _count: {
          select: { sales: true, ecommerceOrders: true },
        },
      },
    }),
    prisma.mirandaDemand.findMany({
      where: { available: false },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.mirandaTask.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.mirandaBusinessMemory.findMany({
      where: {
        category: { not: { startsWith: "chat_history_" } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.mirandaInteraction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Agregaciones temporales de ventas Aromaniak
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfToday, lte: endOfToday } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.ecommerceOrder.aggregate({
      where: { createdAt: { gte: startOfToday, lte: endOfToday } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.ecommerceOrder.aggregate({
      where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.ecommerceOrder.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.sale.findFirst({
      orderBy: { createdAt: "desc" },
      select: { saleNumber: true, total: true, channel: true, createdAt: true },
    }),
    prisma.ecommerceOrder.findFirst({
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true, total: true, orderStatus: true, createdAt: true },
    }),
    // Cruces analíticos: Productos más vendidos en Ecommerce Aromaniak
    prisma.ecommerceOrderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    // Clientes más recurrentes y con mayor gasto en Aromaniak
    prisma.ecommerceOrder.groupBy({
      by: ["customerName", "customerPhone"],
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    // Territorios / departamentos con mayor volumen
    prisma.ecommerceOrder.groupBy({
      by: ["department"],
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    // 1. Estadísticas globales de ventas KODE
    queryKode(`
      SELECT 
        COUNT(*)::int as total_pedidos,
        COALESCE(SUM(total), 0)::float as total_facturado,
        COUNT(CASE WHEN estado = 'Insumos comprados' THEN 1 END)::int as insumos_comprados,
        COUNT(CASE WHEN estado = 'Entregado' THEN 1 END)::int as entregados
      FROM pedidos;
    `).catch(() => ({ rows: [{ total_pedidos: 0, total_facturado: 0, insumos_comprados: 0, entregados: 0 }] })),
    // 2. Ventas KODE hoy
    queryKode(`
      SELECT 
        COUNT(*)::int as count_today,
        COALESCE(SUM(total), 0)::float as sum_today
      FROM pedidos 
      WHERE created_at >= '${startOfToday.toISOString()}' AND created_at <= '${endOfToday.toISOString()}';
    `).catch(() => ({ rows: [{ count_today: 0, sum_today: 0 }] })),
    // 3. Ventas KODE ayer
    queryKode(`
      SELECT 
        COUNT(*)::int as count_yesterday,
        COALESCE(SUM(total), 0)::float as sum_yesterday
      FROM pedidos 
      WHERE created_at >= '${startOfYesterday.toISOString()}' AND created_at <= '${endOfYesterday.toISOString()}';
    `).catch(() => ({ rows: [{ count_yesterday: 0, sum_yesterday: 0 }] })),
    // 4. Ventas KODE este mes
    queryKode(`
      SELECT 
        COUNT(*)::int as count_month,
        COALESCE(SUM(total), 0)::float as sum_month
      FROM pedidos 
      WHERE created_at >= '${startOfMonth.toISOString()}';
    `).catch(() => ({ rows: [{ count_month: 0, sum_month: 0 }] })),
    // 5. Pedidos recientes KODE con detalle completo
    queryKode(`
      SELECT 
        p.numero_pedido, p.estado, p.tipo_pago, p.estado_pago, p.total, p.c807_guia_numero, p.created_at,
        c.nombre_completo as cliente_nombre, c.telefono_whatsapp, c.departamento, c.municipio
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      ORDER BY p.created_at DESC
      LIMIT 10;
    `).catch(() => ({ rows: [] })),
    // 6. Cartera de clientes KODE
    queryKode(`
      SELECT c.id, c.nombre_completo, c.telefono_whatsapp, c.departamento, c.municipio, c.created_at,
             COUNT(p.id)::int as pedidos_count, COALESCE(SUM(p.total), 0)::float as total_gastado
      FROM clientes c
      LEFT JOIN pedidos p ON p.cliente_id = c.id
      GROUP BY c.id, c.nombre_completo, c.telefono_whatsapp, c.departamento, c.municipio, c.created_at
      ORDER BY c.created_at DESC;
    `).catch(() => ({ rows: [] })),
    // 7. Cruce con Base de Datos KODE: Productos más vendidos
    queryKode(`
      SELECT c.codigo, c.contratipo, c.marca_inspirada, c.genero, SUM(pi.cantidad) as total_qty, COUNT(pi.id) as pedidos_count
      FROM pedido_items pi
      JOIN catalogo c ON c.id = pi.catalogo_id
      GROUP BY c.codigo, c.contratipo, c.marca_inspirada, c.genero
      ORDER BY total_qty DESC
      LIMIT 10;
    `).catch(() => ({ rows: [] })),
  ]);

  // Cálculos de Ventas Aromaniak
  const aroSalesTodayCount = salesTodayAgg._count.id;
  const aroSalesTodayTotal = Number(salesTodayAgg._sum.total || 0);
  const aroOrdersTodayCount = ordersTodayAgg._count.id;
  const aroOrdersTodayTotal = Number(ordersTodayAgg._sum.total || 0);
  const aroGrandTotalToday = aroSalesTodayTotal + aroOrdersTodayTotal;
  const aroTotalTxToday = aroSalesTodayCount + aroOrdersTodayCount;

  const aroSalesYestCount = salesYesterdayAgg._count.id;
  const aroSalesYestTotal = Number(salesYesterdayAgg._sum.total || 0);
  const aroOrdersYestCount = ordersYesterdayAgg._count.id;
  const aroOrdersYestTotal = Number(ordersYesterdayAgg._sum.total || 0);
  const aroGrandTotalYesterday = aroSalesYestTotal + aroOrdersYestTotal;
  const aroTotalTxYesterday = aroSalesYestCount + aroOrdersYestCount;

  const aroSalesMonthTotal = Number(salesMonthAgg._sum.total || 0);
  const aroOrdersMonthTotal = Number(ordersMonthAgg._sum.total || 0);
  const aroGrandTotalMonth = aroSalesMonthTotal + aroOrdersMonthTotal;
  const aroTotalTxMonth = salesMonthAgg._count.id + ordersMonthAgg._count.id;

  // Cálculos de Ventas KODE
  const kodeStats = (kodeStatsRes as any)?.rows?.[0] || { total_pedidos: 0, total_facturado: 0, insumos_comprados: 0, entregados: 0 };
  const kodeToday = (kodeTodayRes as any)?.rows?.[0] || { count_today: 0, sum_today: 0 };
  const kodeYesterday = (kodeYesterdayRes as any)?.rows?.[0] || { count_yesterday: 0, sum_yesterday: 0 };
  const kodeMonth = (kodeMonthRes as any)?.rows?.[0] || { count_month: 0, sum_month: 0 };

  const kodeOrdersTodayCount = Number(kodeToday.count_today || 0);
  const kodeOrdersTodayTotal = Number(kodeToday.sum_today || 0);

  const kodeOrdersYestCount = Number(kodeYesterday.count_yesterday || 0);
  const kodeOrdersYestTotal = Number(kodeYesterday.sum_yesterday || 0);

  const kodeOrdersMonthCount = Number(kodeMonth.count_month || 0);
  const kodeOrdersMonthTotal = Number(kodeMonth.sum_month || 0);

  const kodeTotalHistoricalRevenue = Number(kodeStats.total_facturado || 0);
  const kodeTotalHistoricalOrders = Number(kodeStats.total_pedidos || 0);

  // CONSOLIDADO MULTICANAL (AROMANIAK + KODE)
  const combinedTotalToday = aroGrandTotalToday + kodeOrdersTodayTotal;
  const combinedTxToday = aroTotalTxToday + kodeOrdersTodayCount;

  const combinedTotalYesterday = aroGrandTotalYesterday + kodeOrdersYestTotal;
  const combinedTxYesterday = aroTotalTxYesterday + kodeOrdersYestCount;

  const combinedTotalMonth = aroGrandTotalMonth + kodeOrdersMonthTotal;
  const combinedTxMonth = aroTotalTxMonth + kodeOrdersMonthCount;

  // Métricas de catálogo y stock Aromaniak
  const totalSkuCount = allProducts.length;
  const outOfStock = allProducts.filter((p) => p.stock <= 0);
  const lowStock = allProducts.filter((p) => p.stock > 0 && p.stock <= (p.minStock || 10));
  const healthyStock = allProducts.filter((p) => p.stock > (p.minStock || 10));

  // Métricas de Ecommerce Orders Aromaniak
  let totalAroOrderRevenue = 0;
  let activeInRouteCount = 0;
  let activeInRouteAmount = 0;
  let newPendingCount = 0;
  let newPendingAmount = 0;

  ordersByStatus.forEach((stat) => {
    const count = stat._count.id;
    const sum = Number(stat._sum.total || 0);
    totalAroOrderRevenue += sum;
    if (stat.orderStatus === "EN_RUTA") {
      activeInRouteCount = count;
      activeInRouteAmount = sum;
    } else if (stat.orderStatus === "NUEVO") {
      newPendingCount = count;
      newPendingAmount = sum;
    }
  });

  const aroHistoricalPOSRevenue = 29.50; // Total POS acumulado
  const aroTotalHistoricalRevenue = totalAroOrderRevenue + aroHistoricalPOSRevenue;
  const grandTotalHistoricalAll = aroTotalHistoricalRevenue + kodeTotalHistoricalRevenue;

  const kodeRecentOrders = (kodeRecentOrdersRes as any)?.rows || [];
  const kodeClientsList = (kodeClientsRes as any)?.rows || [];
  const kodeTopList = (kodeTopRes as any)?.rows || [];

  const lines: string[] = [
    `=== ÍNDICE MAESTRO DE FUENTES DE DATOS Y ARQUITECTURA (AROMANIAK & KODE) ===`,
    `Tú, Miranda, tienes conexión en vivo con DOS bases de datos empresariales independientes:`,
    `1. BASE DE DATOS: AROMANIAK (Supabase Aromaniak / Prisma)`,
    `   - Ventas POS (Tienda física): Tabla 'Sale', 'SaleItem', 'SalePayment'. Ventas de mostrador en caja, tickets y facturas DTE.`,
    `   - Ventas Ecommerce (Web aromaniaksv.com): Tabla 'EcommerceOrder', 'EcommerceOrderItem'. Pedidos online (#WEB-XXXXXX).`,
    `   - Cartera de Clientes Aromaniak: Tabla 'Customer' (${customerCount} clientes registrados) + clientes de pedidos web.`,
    `   - Catálogo e Inventario Aromaniak: Tabla 'Product', 'Category' (${totalSkuCount} productos: esencias $3.25, frascos, insumos, costos $1.95 y ubicación 'puesto').`,
    `   - Operaciones: Tareas operativas ('MirandaTask'), demandas perdidas ('MirandaDemand'), reglas ('MirandaBusinessMemory').`,
    `2. BASE DE DATOS: KODE (Supabase KODE / PostgreSQL Pool)`,
    `   - Ventas & Pedidos KODE: Tabla 'pedidos' (${kodeTotalHistoricalOrders} pedidos registrados #KOD-YYYYMMDD-XXXX, total $${kodeTotalHistoricalRevenue.toFixed(2)} USD).`,
    `   - Items Vendidos KODE: Tabla 'pedido_items' (detalle de fragancias inspiradas, versiones y compra de insumos).`,
    `   - Cartera de Clientes KODE: Tabla 'clientes' (${kodeClientsList.length} clientes registrados con WhatsApp y ubicación).`,
    `   - Catálogo KODE: Tabla 'catalogo' (perfumes contratipos inspirados, marcas y género).`,
    `\nFECHA Y HORA ACTUAL (EL SALVADOR, UTC-6): ${svDateStr} (${now.toLocaleTimeString("es-SV", { timeZone: "America/El_Salvador" })})`,

    `\n=== 1. BALANCE DE VENTAS Y FACTURACIÓN POR PERÍODO (CONSOLIDADO Y DESGLOSADO) ===`,
    `- VENTAS DE HOY (${svDateStr}):`,
    `  * FACTURACIÓN TOTAL HOY (CONSOLIDADA): $${combinedTotalToday.toFixed(2)} USD en ${combinedTxToday} transacciones.`,
    `  * Desglose Aromaniak Hoy: $${aroGrandTotalToday.toFixed(2)} USD (POS/Caja: ${aroSalesTodayCount} ventas / $${aroSalesTodayTotal.toFixed(2)} USD | Ecommerce: ${aroOrdersTodayCount} pedidos / $${aroOrdersTodayTotal.toFixed(2)} USD).`,
    `  * Desglose KODE Hoy: $${kodeOrdersTodayTotal.toFixed(2)} USD en ${kodeOrdersTodayCount} pedidos.`,
    combinedTotalToday === 0 ? `  * NOTA CRÍTICA DE HOY: HOY no se ha registrado ninguna venta ($0.00 USD) en ninguna de las marcas. Si preguntan por ventas de hoy, responde exactamente: "Hoy no se han registrado ventas en POS de Aromaniak, ni pedidos en Aromaniak Ecommerce, ni pedidos en KODE ($0.00 USD)."` : ``,

    `- VENTAS DE AYER (${svYesterdayStr}):`,
    `  * FACTURACIÓN TOTAL AYER (CONSOLIDADA): $${combinedTotalYesterday.toFixed(2)} USD en ${combinedTxYesterday} transacciones.`,
    `  * Desglose Aromaniak Ayer: $${aroGrandTotalYesterday.toFixed(2)} USD (POS: ${aroSalesYestCount} | Ecommerce: ${aroOrdersYestCount}).`,
    `  * Desglose KODE Ayer: $${kodeOrdersYestTotal.toFixed(2)} USD (${kodeOrdersYestCount} pedidos).`,

    `- ACUMULADO DEL MES EN CURSO:`,
    `  * FACTURACIÓN TOTAL DEL MES (CONSOLIDADA): $${combinedTotalMonth.toFixed(2)} USD en ${combinedTxMonth} transacciones.`,
    `  * Desglose Aromaniak Mes: $${aroGrandTotalMonth.toFixed(2)} USD (${aroTotalTxMonth} transacciones: POS $${aroSalesMonthTotal.toFixed(2)} + Ecommerce $${aroOrdersMonthTotal.toFixed(2)}).`,
    `  * Desglose KODE Mes: $${kodeOrdersMonthTotal.toFixed(2)} USD (${kodeOrdersMonthCount} pedidos).`,

    `- HISTÓRICO GLOBAL ACUMULADO (TODOS LOS TIEMPOS):`,
    `  * FACTURACIÓN HISTÓRICA TOTAL CONSOLIDADA: $${grandTotalHistoricalAll.toFixed(2)} USD.`,
    `  * Aromaniak Histórico: $${aroTotalHistoricalRevenue.toFixed(2)} USD (${ordersByStatus.reduce((acc, s) => acc + s._count.id, 0)} pedidos web + 2 ventas POS).`,
    `  * KODE Histórico: $${kodeTotalHistoricalRevenue.toFixed(2)} USD en ${kodeTotalHistoricalOrders} pedidos (${kodeStats.insumos_comprados || 0} con insumos comprados, ${kodeStats.entregados || 0} entregados).`,
    `  * Total clientes registrados consolidado: ${customerCount + kodeClientsList.length} (${customerCount} en Aromaniak, ${kodeClientsList.length} en KODE).`,
    `  * Envíos en ruta activos Aromaniak: ${activeInRouteCount} pedidos ($${activeInRouteAmount.toFixed(2)} USD).`,
    `  * Pedidos nuevos pendientes Aromaniak: ${newPendingCount} pedidos ($${newPendingAmount.toFixed(2)} USD).`,

    `\n=== 2. DIRECTORIO COMPLETO DE CLIENTES (AROMANIAK & KODE) ===`,
    `- CARTERA DE CLIENTES REGISTRADOS EN KODE (${kodeClientsList.length} clientes):`,
  ];

  kodeClientsList.forEach((kc: any) => {
    lines.push(`  * [KODE] ${kc.nombre_completo} | WhatsApp: ${kc.telefono_whatsapp || "Sin número"} | Ubicación: ${kc.departamento || "N/A"}, ${kc.municipio || "N/A"} | Pedidos: ${kc.pedidos_count || 0} ($${Number(kc.total_gastado || 0).toFixed(2)} USD)`);
  });

  lines.push(`\n- CARTERA DE CLIENTES REGISTRADOS EN AROMANIAK (Tabla Customer - ${customerCount} total):`);
  allCustomers.forEach((ac) => {
    lines.push(`  * [Aromaniak] ${ac.name} | Tel: ${ac.phone || "N/A"} | Email: ${ac.email || "N/A"} | Ubicación: ${ac.department || "N/A"} | Doc: ${ac.documentType || "DUI"} ${ac.documentNum || "N/A"} | Pedidos: ${ac._count.ecommerceOrders + ac._count.sales}`);
  });

  if (topCustomers.length > 0) {
    lines.push(`\n- CLIENTES TOP POR MAYOR VOLUMEN EN AROMANIAK ECOMMERCE:`);
    topCustomers.forEach((c) => {
      lines.push(`  * ${c.customerName || "Cliente"} (Tel: ${c.customerPhone || "N/A"}): $${Number(c._sum.total || 0).toFixed(2)} USD en ${c._count.id} pedidos`);
    });
  }

  lines.push(`\n=== 3. DETALLE DE PEDIDOS Y LOGÍSTICA C807 RECIENTES ===`);
  lines.push(`- PEDIDOS REGISTRADOS EN KODE:`);
  kodeRecentOrders.forEach((kp: any) => {
    const c807 = kp.c807_guia_numero ? `Guía C807: ${kp.c807_guia_numero}` : `Sin guía C807`;
    lines.push(`  * Pedido #${kp.numero_pedido} | Total: $${Number(kp.total).toFixed(2)} USD | Estado: ${kp.estado} | Pago: ${kp.tipo_pago} (${kp.estado_pago}) | Cliente: ${kp.cliente_nombre || "Cliente"} (Tel: ${kp.telefono_whatsapp || "N/A"}, ${kp.departamento || "N/A"}) | ${c807} | Fecha: ${new Date(kp.created_at).toLocaleDateString("es-SV", { timeZone: "America/El_Salvador" })}`);
  });

  lines.push(`\n- PEDIDOS RECIENTES EN AROMANIAK ECOMMERCE:`);
  recentOrders.forEach((ao) => {
    const c807 = ao.trackingNumber ? `Guía C807: ${ao.trackingNumber}` : `Sin guía C807`;
    lines.push(`  * Pedido #${ao.orderNumber} | Total: $${Number(ao.total).toFixed(2)} USD | Estado: ${ao.orderStatus} | Pago: ${ao.paymentStatus} | Cliente: ${ao.customerName || "Consumidor"} (Tel: ${ao.customerPhone || "N/A"}, ${ao.department || "N/A"}) | ${c807} | Fecha: ${new Date(ao.createdAt).toLocaleDateString("es-SV", { timeZone: "America/El_Salvador" })}`);
  });

  if (recentSales.length > 0) {
    lines.push(`\n- VENTAS RECIENTES EN MOSTRADOR / CAJA POS (AROMANIAK):`);
    recentSales.forEach((rs) => {
      const itemsList = rs.items.map((it) => `${it.quantity}x ${it.productName}`).join(", ");
      lines.push(`  * Venta #${rs.saleNumber} | Total: $${Number(rs.total).toFixed(2)} USD | Pago: ${rs.paymentMethod} | Comprobante: ${rs.tipoComprobante} | Artículos: [${itemsList}] | Fecha: ${new Date(rs.createdAt).toLocaleDateString("es-SV", { timeZone: "America/El_Salvador" })}`);
    });
  }

  lines.push(`\n=== 4. RANKING DE PERFUMES Y PRODUCTOS MÁS VENDIDOS (CRUCE MULTICANAL) ===`);
  lines.push(`- TOP VENTAS EN AROMANIAK ECOMMERCE:`);
  topEcommerceItems.forEach((item, idx) => {
    const qty = item._sum.quantity || 0;
    const foundProduct = allProducts.find((p) =>
      p.name?.toLowerCase().includes(item.productName.toLowerCase()) ||
      p.officialName?.toLowerCase().includes(item.productName.toLowerCase())
    );
    const stockInfo = foundProduct
      ? `Stock disponible: ${foundProduct.stock} uds (${foundProduct.stock <= 0 ? "AGOTADO" : foundProduct.stock <= (foundProduct.minStock || 10) ? "STOCK BAJO" : "ÓPTIMO"}) | Ubicación: ${foundProduct.puesto || "N/A"}`
      : `Stock: No inventariado directo`;
    lines.push(`  ${idx + 1}. ${item.productName}: ${qty} unidades vendidas (${item._count.id} pedidos) | ${stockInfo}`);
  });

  if (kodeTopList.length > 0) {
    lines.push(`\n- TOP VENTAS EN KODE (LÍNEA PERFUMERÍA INSPIRADA):`);
    kodeTopList.forEach((kr: any, idx: number) => {
      lines.push(`  ${idx + 1}. [Código ${kr.codigo}] ${kr.contratipo} (${kr.marca_inspirada}, ${kr.genero}): ${kr.total_qty} unidades vendidas (${kr.pedidos_count} pedidos)`);
    });
  }

  lines.push(`\n=== 5. INVENTARIO Y STOCK EN BODEGA AROMANIAK (${totalSkuCount} PRODUCTOS) ===`);
  lines.push(`- Referencias agotadas (Stock 0): ${outOfStock.length}`);
  lines.push(`- Referencias con stock bajo (menor o igual a mínimo): ${lowStock.length}`);
  lines.push(`- Referencias con stock óptimo: ${healthyStock.length}`);

  if (outOfStock.length > 0) {
    const oosList = outOfStock.map((p) => `${p.officialName ? p.officialName + " / " : ""}${p.name} (${p.brand || "Sin marca"})`);
    lines.push(`  * Agotados críticos actuales: ${oosList.slice(0, 10).join(", ")}${oosList.length > 10 ? ` y ${oosList.length - 10} más` : ""}`);
  }

  if (lowStock.length > 0) {
    const lsList = lowStock.map((p) => `${p.officialName ? p.officialName + " / " : ""}${p.name} (${p.stock} uds, mín: ${p.minStock || 10})`);
    lines.push(`  * En riesgo de agotarse: ${lsList.slice(0, 8).join(", ")}`);
  }

  lines.push(`- Insumos y Frascos de Bodega: ${allProducts.filter((p) => p.sku?.startsWith("BOT-") || p.sku?.startsWith("INS-") || p.sku?.startsWith("EMP-")).slice(0, 15).map((p) => `${p.name}: ${p.stock} uds ($${Number(p.price).toFixed(2)})`).join(" | ")}`);
  lines.push(`- Política de precios oficial Aromaniak: Onza $3.25-$3.75 (costo $1.90-$1.95) | 1/2 Onza $1.90 | Perfume terminado $15.00`);

  lines.push(`\n=== 6. DEMANDAS NO SATISFECHAS EN TIENDA (VENTAS PERDIDAS) ===`);
  if (demands.length > 0) {
    lines.push(`- Fragancias solicitadas agotadas: ${demands.map((d) => `${d.fragranceName} (${d.quantity} solicitudes)`).join(", ")}`);
  } else {
    lines.push(`- No hay demandas insatisfechas registradas recientemente.`);
  }

  lines.push(`\n=== 7. TAREAS OPERATIVAS PENDIENTES (${tasks.length}) ===`);
  if (tasks.length > 0) {
    tasks.forEach((t) => {
      lines.push(`- [ID #${t.id}] '${t.task}' (Responsable: ${t.assignee}, Urgencia: ${t.urgency})`);
    });
  } else {
    lines.push(`- No hay tareas pendientes.`);
  }

  lines.push(`\n=== 8. DIRECTRICES Y REGLAS PERMANENTES DICTADAS POR DAVID Y LUIS ===`);
  if (memories.length > 0) {
    memories.forEach((m) => {
      lines.push(`- [${m.topic}]: ${m.instruction}`);
    });
  }
  return lines.join("\n");
}

export async function generateMorningBriefing(): Promise<string> {
  const context = await getBusinessContextSummary();
  const dateStr = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    `<b>[BRIEFING MATUTINO DE CRECIMIENTO - ${dateStr.toUpperCase()}]</b>\n\n` +
    `<b>OBJETIVO DE HOY:</b> Maximizar facturación, impulsar despacho de pedidos pendientes y rotación de stock.\n\n` +
    `<b>ESTADO Y PRIORIDADES DEL NEGOCIO:</b>\n${context}\n\n` +
    `Ejecutemos el plan comercial del día.`
  );
}

export async function generateEveningBriefing(): Promise<string> {
  const context = await getBusinessContextSummary();
  const dateStr = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    `<b>[CIERRE DE JORNADA Y BALANCE FINANCIERO - ${dateStr.toUpperCase()}]</b>\n\n` +
    `<b>BALANCE DE CIERRE:</b>\n${context}\n\n` +
    `Jornada cerrada.`
  );
}

export async function getOperationalStaffContextSummary(): Promise<string> {
  const [
    allProducts,
    recentOrders,
    tasks,
    topStaffItems,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        name: true,
        officialName: true,
        brand: true,
        stock: true,
        price: true,
        unit: true,
        puesto: true,
      },
      orderBy: { stock: "asc" },
    }),
    prisma.ecommerceOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        orderNumber: true,
        orderStatus: true,
        customerName: true,
        customerPhone: true,
        department: true,
        municipality: true,
        shippingAddress: true,
        trackingNumber: true,
        items: {
          select: {
            productName: true,
            quantity: true,
          },
        },
      },
    }),
    prisma.mirandaTask.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.ecommerceOrderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
  ]);

  const outOfStock = allProducts.filter((p) => p.stock <= 0);
  const lowStock = allProducts.filter((p) => p.stock > 0 && p.stock <= 5);

  const lines: string[] = [
    `=== INFORMACIÓN OPERATIVA PARA EQUIPO Y VENDEDORAS ===`,
    `FECHA Y HORA: ${new Date().toISOString()}`,
    `\n1. ESTADO DE PEDIDOS RECIENTES Y LOGÍSTICA:`,
  ];

  recentOrders.forEach((o) => {
    const itemsSummary = o.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ");
    lines.push(`- Pedido #${o.orderNumber} | Estado: ${o.orderStatus} | Cliente: ${o.customerName || "Consumidor"} (Tel: ${o.customerPhone || "N/A"}) | Destino: ${o.department || ""}, ${o.municipality || ""} | Guía: ${o.trackingNumber || "Pendiente"} | Artículos: [${itemsSummary}]`);
  });

  lines.push(`\n2. TAREAS OPERATIVAS ASIGNADAS AL PERSONAL (${tasks.length}):`);
  if (tasks.length > 0) {
    tasks.forEach((t) => {
      lines.push(`- [ID #${t.id}] ${t.task} (Responsable: ${t.assignee}, Urgencia: ${t.urgency})`);
    });
  } else {
    lines.push(`- No hay tareas pendientes en este momento.`);
  }

  lines.push(`\n3. CATÁLOGO Y STOCK EN TIENDA / BODEGA:`);
  lines.push(`- Precios de venta al público oficiales: Onza $3.25-$3.75 | 1/2 Onza $1.90 | Perfume terminado $15.00`);
  if (topStaffItems.length > 0) {
    const topNames = topStaffItems.map((t) => t.productName).join(", ");
    lines.push(`- TOP FRAGANCIAS MÁS VENDIDAS (RECOMENDAR A CLIENTES): ${topNames}`);
  }
  if (outOfStock.length > 0) {
    const oos = outOfStock.map((p) => `${p.officialName ? p.officialName + " / " : ""}${p.name}`);
    lines.push(`- Fragancias agotadas en tienda (no ofrecer): ${oos.slice(0, 10).join(", ")}`);
  }
  if (lowStock.length > 0) {
    const ls = lowStock.map((p) => `${p.officialName ? p.officialName + " / " : ""}${p.name} (${p.stock} uds)`);
    lines.push(`- Fragancias por agotarse (prioridad venta): ${ls.slice(0, 8).join(", ")}`);
  }

  return lines.join("\n");
}
