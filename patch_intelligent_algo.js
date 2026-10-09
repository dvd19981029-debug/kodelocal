const fs = require('fs');
const path = 'src/app/api/admin/abastecimiento/route.ts';
let code = fs.readFileSync(path, 'utf8');

// We need to rewrite the sales fetching block.
// Let's find everything from `// 1. Calcular ADR` down to `// 2. Traer productos`

const regex = /\/\/ 1\. Calcular ADR[\s\S]*?\/\/ 2\. Traer productos/;
const replacement = `// 1. Calcular ADR (Inteligente y Adaptativo)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Ventas recientes (0-30 días)
    const recentSales = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        sale: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: 'COMPLETED'
        }
      }
    });

    // Ventas históricas previas (31-90 días)
    const historySales = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        sale: {
          createdAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
          paymentStatus: 'COMPLETED'
        }
      }
    });

    const recentMap: Record<string, number> = {};
    for (const s of recentSales) {
      if (s.productId) recentMap[s.productId] = Number(s._sum.quantity || 0);
    }

    const historyMap: Record<string, number> = {};
    for (const s of historySales) {
      if (s.productId) historyMap[s.productId] = Number(s._sum.quantity || 0);
    }

    // 2. Traer productos`;

code = code.replace(regex, replacement);

// Now we need to update the `analysis.map` part where `adr` is assigned.
const adrRegex = /const adr = velocityMap\[p\.id\] \|\| 0\.1;/;
const adrReplacement = `const v30 = (recentMap[p.id] || 0) / 30; // oz por día reciente
      const v90 = (historyMap[p.id] || 0) / 60; // oz por día histórico previo

      let adr = 0.1;
      if (v30 === 0 && v90 === 0) {
        adr = 0.05; // Casi muerto
      } else if (v30 > v90) {
        adr = v30; // Tendencia al alza: Ser agresivos, usar flujo reciente
      } else if (v30 < v90) {
        // Tendencia a la baja
        if (p.stock < 10) {
          // Si el stock es muy bajo (< 10oz), es altamente probable que las ventas bajaron
          // porque el producto se agotó en estantes, no por falta de demanda. (Ruptura de stock)
          // Usamos el flujo histórico para predecir la demanda real que tendríamos si hubiera stock.
          adr = v90;
        } else {
          // El stock está saludable pero las ventas bajaron. Tendencia real a la baja.
          // Usamos un promedio suavizado (70% reciente, 30% histórico) para no sobre-acumular.
          adr = (v30 * 0.7) + (v90 * 0.3);
        }
      } else {
        adr = v30;
      }`;

code = code.replace(adrRegex, adrReplacement);

fs.writeFileSync(path, code);
