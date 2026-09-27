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
      },
    }),
    prisma.ecommerceOrder.groupBy({
      by: ["orderStatus"],
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.ecommerceOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        orderNumber: true,
        orderStatus: true,
        total: true,
        customerName: true,
        department: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
    prisma.customer.count(),
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
    // Agregaciones temporales de ventas
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
  ]);

  // Cálculos temporales exactos
  const salesTodayCount = salesTodayAgg._count.id;
  const salesTodayTotal = Number(salesTodayAgg._sum.total || 0);
  const ordersTodayCount = ordersTodayAgg._count.id;
  const ordersTodayTotal = Number(ordersTodayAgg._sum.total || 0);
  const grandTotalToday = salesTodayTotal + ordersTodayTotal;
  const totalTxToday = salesTodayCount + ordersTodayCount;

  const salesYestCount = salesYesterdayAgg._count.id;
  const salesYestTotal = Number(salesYesterdayAgg._sum.total || 0);
  const ordersYestCount = ordersYesterdayAgg._count.id;
  const ordersYestTotal = Number(ordersYesterdayAgg._sum.total || 0);
  const grandTotalYesterday = salesYestTotal + ordersYestTotal;
  const totalTxYesterday = salesYestCount + ordersYestCount;

  const salesMonthTotal = Number(salesMonthAgg._sum.total || 0);
  const ordersMonthTotal = Number(ordersMonthAgg._sum.total || 0);
  const grandTotalMonth = salesMonthTotal + ordersMonthTotal;
  const totalTxMonth = salesMonthAgg._count.id + ordersMonthAgg._count.id;

  // Métricas de catálogo y stock
  const totalSkuCount = allProducts.length;
  const outOfStock = allProducts.filter((p) => p.stock <= 0);
  const lowStock = allProducts.filter((p) => p.stock > 0 && p.stock <= (p.minStock || 10));
  const healthyStock = allProducts.filter((p) => p.stock > (p.minStock || 10));

  // Esencias destacadas
  const esencias = allProducts.filter((p) => p.unit === "Onza" || p.sku?.startsWith("esencia") || !p.sku?.startsWith("BOT-"));
  const insumosYFrascos = allProducts.filter((p) => p.sku?.startsWith("BOT-") || p.sku?.startsWith("INS-") || p.sku?.startsWith("EMP-"));

  // Métricas de Ecommerce Orders
  let orderStatsSummary = "";
  let totalOrderRevenue = 0;
  let activeInRouteCount = 0;
  let activeInRouteAmount = 0;
  let newPendingCount = 0;
  let newPendingAmount = 0;

  ordersByStatus.forEach((stat) => {
    const count = stat._count.id;
    const sum = Number(stat._sum.total || 0);
    totalOrderRevenue += sum;
    if (stat.orderStatus === "EN_RUTA") {
      activeInRouteCount = count;
      activeInRouteAmount = sum;
    } else if (stat.orderStatus === "NUEVO") {
      newPendingCount = count;
      newPendingAmount = sum;
    }
    orderStatsSummary += `  * ${stat.orderStatus}: ${count} pedidos ($${sum.toFixed(2)} USD)\n`;
  });

  const lines: string[] = [
    `=== ESTADO GENERAL DEL NEGOCIO AROMANIAK & KODE ===`,
    `FECHA Y HORA ACTUAL (EL SALVADOR, UTC-6): ${svDateStr} (${now.toLocaleTimeString("es-SV", { timeZone: "America/El_Salvador" })})`,
    `\n1. MÉTRICAS COMERCIALES Y FACTURACIÓN POR PERÍODO DE TIEMPO:`,
    `- VENTAS DE HOY (${svDateStr}):`,
    `  * Total facturado hoy: $${grandTotalToday.toFixed(2)} USD en ${totalTxToday} transacciones.`,
    `  * Desglose: POS/Caja Tienda: ${salesTodayCount} ventas ($${salesTodayTotal.toFixed(2)} USD) | Ecommerce: ${ordersTodayCount} pedidos ($${ordersTodayTotal.toFixed(2)} USD).`,
    grandTotalToday === 0 ? `  * NOTA CRÍTICA: HOY no se ha registrado ninguna venta ($0.00 USD). Si preguntan por ventas de hoy, responde con total precisión que hoy van $0.00 USD.` : ``,
    `- VENTAS DE AYER (${svYesterdayStr}):`,
    `  * Total facturado ayer: $${grandTotalYesterday.toFixed(2)} USD en ${totalTxYesterday} transacciones.`,
    `- ACUMULADO DEL MES EN CURSO:`,
    `  * Total mes: $${grandTotalMonth.toFixed(2)} USD en ${totalTxMonth} transacciones.`,
    `- ÚLTIMAS ACTIVIDADES REGISTRADAS EN BASE DE DATOS:`,
    lastOrder ? `  * Último pedido Ecommerce: #${lastOrder.orderNumber} por $${Number(lastOrder.total).toFixed(2)} USD (Fecha: ${new Date(lastOrder.createdAt).toLocaleDateString("es-SV", { timeZone: "America/El_Salvador" })}, Estado: ${lastOrder.orderStatus})` : `  * Sin pedidos Ecommerce`,
    lastSale ? `  * Última venta POS/Caja: #${lastSale.saleNumber} por $${Number(lastSale.total).toFixed(2)} USD (Fecha: ${new Date(lastSale.createdAt).toLocaleDateString("es-SV", { timeZone: "America/El_Salvador" })})` : `  * Sin ventas POS`,
    `- HISTÓRICO GLOBAL ACUMULADO (TODOS LOS TIEMPOS):`,
    `  * Total clientes registrados: ${customerCount}`,
    `  * Volumen total de todos los pedidos históricos: $${totalOrderRevenue.toFixed(2)} USD (Atención: esto es el acumulado total histórico, NO es de hoy).`,
    `  * Envíos activos en ruta (Logística C807): ${activeInRouteCount} pedidos ($${activeInRouteAmount.toFixed(2)} USD)`,
    `  * Pedidos nuevos pendientes de preparación: ${newPendingCount} pedidos ($${newPendingAmount.toFixed(2)} USD)`,
  ];

  if (recentOrders.length > 0) {
    lines.push(`\nÚLTIMOS PEDIDOS ECOMMERCE REGISTRADOS EN SISTEMA:`);
    recentOrders.forEach((o) => {
      lines.push(`- Pedido #${o.orderNumber}: $${Number(o.total).toFixed(2)} | Estado: ${o.orderStatus} | Cliente: ${o.customerName || "Consumidor Final"} (${o.department || "San Salvador"}) | Pago: ${o.paymentStatus}`);
    });
  }

  lines.push(`\n2. INVENTARIO Y STOCK DE AROMANIAK (${totalSkuCount} PRODUCTOS EN CATÁLOGO):`);
  lines.push(`- Referencias agotadas (Stock 0): ${outOfStock.length}`);
  lines.push(`- Referencias con stock bajo (menor o igual a mínimo): ${lowStock.length}`);
  lines.push(`- Referencias con stock óptimo: ${healthyStock.length}`);

  if (outOfStock.length > 0) {
    const oosList = outOfStock.map((p) => `${p.officialName ? p.officialName + " / " : ""}${p.name} (${p.brand || "Sin marca"})`);
    lines.push(`  * Agotados críticos actuales: ${oosList.slice(0, 10).join(", ")}${oosList.length > 10 ? ` y ${oosList.length - 10} más` : ""}`);
  }

  if (lowStock.length > 0) {
    const lowList = lowStock.slice(0, 8).map((p) => `${p.officialName ? p.officialName + " / " : ""}${p.name} (${p.stock} uds, mín: ${p.minStock})`);
    lines.push(`  * En riesgo de agotarse: ${lowList.join(", ")}`);
  }

  // Resumen de frascos e insumos
  if (insumosYFrascos.length > 0) {
    const frascosSummary = insumosYFrascos.map((p) => `${p.name}: ${p.stock} uds ($${p.price})`).join(" | ");
    lines.push(`- Insumos y Frascos de Bodega: ${frascosSummary}`);
  }

  // Precios y costos estándar de Aromaniak
  lines.push(`- Política de precios oficial: Onza $3.25-$3.75 (costo $1.90-$1.95) | 1/2 Onza $1.90 | Perfume terminado $15.00`);

  // Demandas de clientes insatisfechas
  if (demands.length > 0) {
    const demandCountMap: Record<string, number> = {};
    for (const d of demands) {
      demandCountMap[d.fragrance] = (demandCountMap[d.fragrance] || 0) + 1;
    }
    const topDemands = Object.entries(demandCountMap)
      .slice(0, 5)
      .map(([frag, cnt]) => `${frag} (${cnt} solicitudes)`);
    lines.push(`\n3. DEMANDAS NO SATISFECHAS EN TIENDA (VENTAS PERDIDAS):`);
    lines.push(`- Fragancias solicitadas agotadas: ${topDemands.join(", ")}`);
    lines.push(`- Fuga estimada: ~$${Object.values(demandCountMap).reduce((a, b) => a + b, 0) * 25} USD`);
  }

  // Tareas operativas
  if (tasks.length > 0) {
    lines.push(`\n4. TAREAS OPERATIVAS PENDIENTES (${tasks.length}):`);
    tasks.forEach((t) => {
      lines.push(`- [ID #${t.id}] '${t.task}' (Responsable: ${t.assignee}, Urgencia: ${t.urgency})`);
    });
  } else {
    lines.push(`\n4. TAREAS OPERATIVAS PENDIENTES: 0 tareas.`);
  }

  // Directrices de los dueños (David y Luis)
  if (memories.length > 0) {
    lines.push(`\n5. DIRECTRICES Y REGLAS PERMANENTES DICTADAS POR DAVID Y LUIS:`);
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
