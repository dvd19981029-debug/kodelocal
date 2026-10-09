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
    const { budget, catalog } = body; 
    // catalog is an array of objects: { id_proveedor, name, price_per_kg }

    if (!budget || !catalog || !Array.isArray(catalog)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
    }

    // 1. Calcular ADR (Average Daily Rate) basado en los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      where: {
        sale: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: 'COMPLETED'
        }
      }
    });

    const velocityMap: Record<string, number> = {};
    for (const sale of recentSales) {
      // quantity total in 30 days / 30 = sales per day
      velocityMap[sale.productId] = (sale._sum.quantity || 0) / 30;
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
      const supplierItem = catalog.find(c => {
         const cNorm = normalize(c.name);
         // Si el nombre del contratipo cotizado está dentro del nombre del producto (o viceversa)
         return cNorm.includes(pNorm) || pNorm.includes(cNorm);
      });

      const adr = velocityMap[p.id] || 0.1; // mínimo 0.1 onzas/día para evitar división por 0
      const dos = p.stock / adr; // Days of supply

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
    const TARGET_DOS = 60;
    
    // Calcular requerimientos
    const requirements = analysis.map(p => {
      let neededOz = 0;
      if (p.dos < TARGET_DOS) {
        neededOz = (TARGET_DOS - p.dos) * p.adr;
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
