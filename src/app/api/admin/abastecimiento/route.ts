import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';

// 1 Kg = 35.274 Onzas
const OZ_PER_KG = 35.274;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');
    
    let isStaff = verifyStaffInternalToken(staffHeaderToken) || verifyStaffInternalToken(bearerToken);
    
    if (false) {
      const cookieHeader = request.headers.get('cookie') || '';
      const staffCookieMatch = cookieHeader.match(/kodelocal_staff_token=([^;]+)/);
      if (staffCookieMatch && verifyStaffInternalToken(staffCookieMatch[1])) {
        isStaff = true;
      }
    }

    if (false) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { budget, catalog, historyDays = 30, targetDos = 60, leadTime = 14 } = body;
    
    // Si no se proporcionó catálogo (o es un arreglo vacío), usar el catálogo por defecto
    const DEFAULT_CATALOG = [
  {
    "id_proveedor": "APAE-2163",
    "name": "BLEU DE CHANEL",
    "price_per_kg": 34.85
  },
  {
    "id_proveedor": "APAE-2839",
    "name": "ACQUA DI GIO",
    "price_per_kg": 43.14
  },
  {
    "id_proveedor": "APAE 3966",
    "name": "CLUB DE NUIT INTENSE ARMAF MEN",
    "price_per_kg": 71.672
  },
  {
    "id_proveedor": "APAE-3843",
    "name": "AVENTUS CREED",
    "price_per_kg": 71.15
  },
  {
    "id_proveedor": "APAE-2841",
    "name": "LA VIE EST BELLE",
    "price_per_kg": 51.22
  },
  {
    "id_proveedor": "NP - 135726",
    "name": "ODYSSEY MANDARIN SKY ARMAF MEN",
    "price_per_kg": 62.922
  },
  {
    "id_proveedor": "APAE-3840",
    "name": "EROS VERSACE",
    "price_per_kg": 48.6
  },
  {
    "id_proveedor": "NP - 110326",
    "name": "L'EAU D'ISSEY MEN",
    "price_per_kg": 35.37
  },
  {
    "id_proveedor": "APAE 3913",
    "name": "SANTAL 33 LE LABO",
    "price_per_kg": 63.412
  },
  {
    "id_proveedor": "NP-78726",
    "name": "VALENTINO BORN IN ROMA INTENSE",
    "price_per_kg": 56.208
  },
  {
    "id_proveedor": "NP- 135626",
    "name": "ERBA PURA XERJOFF",
    "price_per_kg": 56.538
  },
  {
    "id_proveedor": "APAE 4147",
    "name": "COCO MADEMOISELLE CHANEL",
    "price_per_kg": 63.84
  },
  {
    "id_proveedor": "APAE-2305",
    "name": "DOLCE & GABBANA LIGHT BLUE MEN",
    "price_per_kg": 45.4
  },
  {
    "id_proveedor": "APAE-3322",
    "name": "BOSS BOTTLED",
    "price_per_kg": 46.408
  },
  {
    "id_proveedor": "APAE 3566",
    "name": "INVICTUS TYPE FINE INSPIRATION",
    "price_per_kg": 44.65
  },
  {
    "id_proveedor": "NP-128023",
    "name": "BURBERRY HER",
    "price_per_kg": 50.9
  },
  {
    "id_proveedor": "APAE 3606",
    "name": "212 VIP ROSE / VIP WOMAN",
    "price_per_kg": 51.1
  },
  {
    "id_proveedor": "APAE-2299",
    "name": "POLO BLUE Z 1",
    "price_per_kg": 54.602
  },
  {
    "id_proveedor": "APAE-3567",
    "name": "ONE MILLION",
    "price_per_kg": 61.3
  },
  {
    "id_proveedor": "NP-117224",
    "name": "COCO CHANEL",
    "price_per_kg": 69.746
  },
  {
    "id_proveedor": "APAE-3883",
    "name": "CHANCE CHANEL",
    "price_per_kg": 32.95
  },
  {
    "id_proveedor": "APE 4148",
    "name": "9PM TYPE AFNAN",
    "price_per_kg": 67.65
  },
  {
    "id_proveedor": "APAE-3601",
    "name": "LE MALE JEAN PAUL GAULTIER",
    "price_per_kg": 31.3
  },
  {
    "id_proveedor": "APAE-2154",
    "name": "J'ADORE DIOR TYPE B",
    "price_per_kg": 29.34
  },
  {
    "id_proveedor": "APAE 3248",
    "name": "TOMMY FOR MEN",
    "price_per_kg": 62.15
  },
  {
    "id_proveedor": "APAE-1475",
    "name": "CHANEL NO. 5",
    "price_per_kg": 55.35
  },
  {
    "id_proveedor": "NP-122826",
    "name": "BAD BOY CAROLINA HERRERA",
    "price_per_kg": 45.134
  },
  {
    "id_proveedor": "NP-138824",
    "name": "BE DELICIOUS DKNY",
    "price_per_kg": 53.646
  },
  {
    "id_proveedor": "NP-47325",
    "name": "OH CHERRY (LOST CHERRY)",
    "price_per_kg": 48.242
  },
  {
    "id_proveedor": "APAE 4664",
    "name": "SCANDAL JEAN PAUL GAULTIER TYPE",
    "price_per_kg": 62.45
  },
  {
    "id_proveedor": "APAE 4645",
    "name": "VALENTINO DONNA TYPE",
    "price_per_kg": 74.25
  },
  {
    "id_proveedor": "APAE-3864",
    "name": "L'IMMENSITE LOUIS VUITTON",
    "price_per_kg": 65.112
  },
  {
    "id_proveedor": "APAE-3815",
    "name": "212 VIP CAROLINA HERRERA",
    "price_per_kg": 44.854
  },
  {
    "id_proveedor": "APAE-2245",
    "name": "SWISS ARMY",
    "price_per_kg": 36.524
  },
  {
    "id_proveedor": "APAE-4021",
    "name": "LACOSTE BLANC L1212",
    "price_per_kg": 49.43
  },
  {
    "id_proveedor": "APAE 2123",
    "name": "ACQUA DI GIO WOMAN TYPE",
    "price_per_kg": 31.05
  },
  {
    "id_proveedor": "APAE-1904",
    "name": "POLO BLACK",
    "price_per_kg": 47.6
  },
  {
    "id_proveedor": "APAE-2844",
    "name": "RALPH BY RALPH LAUREN",
    "price_per_kg": 45.524
  },
  {
    "id_proveedor": "APAE 4225",
    "name": "YARA TYPE",
    "price_per_kg": 48.55
  },
  {
    "id_proveedor": "APAE 4192",
    "name": "YARA TOUS LATTAFA M",
    "price_per_kg": 38.2
  },
  {
    "id_proveedor": "APAE-3571",
    "name": "FLOWERBOMB VIKTOR & ROLF",
    "price_per_kg": 68.374
  },
  {
    "id_proveedor": "NP-31724",
    "name": "BLACK OPIUM",
    "price_per_kg": 55.95
  },
  {
    "id_proveedor": "NP-78121",
    "name": "DIOR HOMME SPORT",
    "price_per_kg": 60.042
  },
  {
    "id_proveedor": "APAE-2617",
    "name": "CK ONE Z",
    "price_per_kg": 38.2
  },
  {
    "id_proveedor": "APAE-3288",
    "name": "PERRY ELLIS 360 RED",
    "price_per_kg": 39.35
  },
  {
    "id_proveedor": "NP-31519 ENS2",
    "name": "GREEN TEA ELIZABETH ARDEN",
    "price_per_kg": 46.742
  },
  {
    "id_proveedor": "APAE-3605",
    "name": "PRINCESS VERA WANG",
    "price_per_kg": 30.11
  }
];
    const effectiveCatalog = (Array.isArray(catalog) && catalog.length > 0) ? catalog : DEFAULT_CATALOG;
 
    // catalog is an array of objects: { id_proveedor, name, price_per_kg }

    if (!budget) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    // 1. Calcular ADR (Inteligente y Adaptativo)
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

    // 2. Traer productos de la base de datos
    const products = await prisma.product.findMany({
      where: { categoryId: { not: null } } // solo productos (perfumes)
    });

    // 3. Cruzar catálogo del proveedor con productos de DB (por nombre aproximado)
    // Para no complicarlo en exceso, normalizamos los nombres
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    const analysis = products.map(p => {
      const pNorm = normalize(p.name);
      
      // Buscar match en el catálogo del proveedor
      const supplierItem = effectiveCatalog.find(c => {
         const cNorm = normalize(c.name);
         // Si el nombre del contratipo cotizado está dentro del nombre del producto (o viceversa)
         return cNorm.includes(pNorm) || pNorm.includes(cNorm);
      });

      const v30 = (recentMap[p.id] || 0) / 30; // oz por día reciente
      const v90 = (historyMap[p.id] || 0) / 60; // oz por día histórico previo

      let adr = 0;
      if (v30 === 0 && v90 === 0) {
        adr = 0; // Totalmente muerto
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
      }
      const dos = adr > 0 ? p.stock / adr : 9999; // Days of supply

      return {
        id: p.id,
        name: p.name,
        stock: p.stock,
        adr: Number(adr.toFixed(2)),
        dos: Number(dos.toFixed(0)),
        supplierPriceKg: supplierItem ? supplierItem.price_per_kg : 45.0, // Default $45 si no match
        supplierCode: supplierItem ? supplierItem.id_proveedor : 'N/A',
        isMatched: !!supplierItem,
        roiScore: (p.price || 0) / (supplierItem ? supplierItem.price_per_kg / OZ_PER_KG : 45.0 / OZ_PER_KG)
      };
    });

    // 4. Algoritmo de la Mochila Fraccional (Greedy approach por Prioridad)
    // Objetivo: Cubrir hasta 60 días de supervivencia.
    const TARGET_DOS = Number(targetDos);
    const LEAD_TIME = Number(leadTime);
    
    // Calcular requerimientos
    const requirements = analysis.map(p => {
      let neededOz = 0;
      // Consideramos el Lead Time: el stock real cuando llegue el pedido será:
      // stock_proyectado = stock_actual - (ADR * LEAD_TIME)
      const projectedStock = p.stock - (p.adr * LEAD_TIME);
      
      if (projectedStock < TARGET_DOS * p.adr) {
        neededOz = (TARGET_DOS * p.adr) - projectedStock;
        if (neededOz < 0) neededOz = 0;

        // Filtro de Baja Rotación: Si la necesidad es muy pequeña (< 5 onzas), 
        // no justificamos comprar 1 Kg entero porque el inventario se quedaría estancado por años.
        if (neededOz < 5) {
          neededOz = 0;
        }
      }
      
      const neededKg = Math.ceil(neededOz / OZ_PER_KG); // Compra en Kilos cerrados
      const cost = neededKg * p.supplierPriceKg;
      
      // Puntuación de urgencia: entre menos días, más urgente. Se pondera con ROI.
      const urgencyScore = (100 / (p.dos + 1)) * p.roiScore; 

      return {
        ...p,
        neededOz: Number(neededOz.toFixed(2)),
        neededKg,
        cost,
        urgencyScore
      };
    }).filter(p => p.neededKg > 0);

    // Ordenar por urgencia (Knapsack greedy step)
    requirements.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const draft = [];
    let currentSpend = 0;

    for (const req of requirements) {
      if (currentSpend + req.cost <= budget) {
        draft.push({
          productId: req.id,
          productName: req.name,
          supplierCode: req.supplierCode,
          suggestedKg: req.neededKg,
          pricePerKg: req.supplierPriceKg,
          totalCost: req.cost,
          currentDos: req.dos,
          adr: req.adr
        });
        currentSpend += req.cost;
      } else {
        // Fraccionar si es posible (ej: comprar 1 Kg en vez de 3 Kg si alcanza)
        const remainingBudget = budget - currentSpend;
        const possibleKg = Math.floor(remainingBudget / req.supplierPriceKg);
        if (possibleKg > 0) {
          draft.push({
            productId: req.id,
            productName: req.name,
            supplierCode: req.supplierCode,
            suggestedKg: possibleKg,
            pricePerKg: req.supplierPriceKg,
            totalCost: possibleKg * req.supplierPriceKg,
            currentDos: req.dos,
            adr: req.adr
          });
          currentSpend += possibleKg * req.supplierPriceKg;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        budgetUsed: currentSpend,
        totalItems: draft.length,
        draft: draft
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
