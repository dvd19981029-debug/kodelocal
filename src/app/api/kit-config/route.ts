import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyStaffInternalToken } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const DEFAULT_KIT_CONFIG = {
  basePrice: 15.00,
  extraShotPrice: 3.00,
};

/**
 * GET /api/kit-config
 * Retorna la configuración global de "Arma tu propio perfume" (Perfume Terminado 100ml)
 * { basePrice: 15.00, extraShotPrice: 3.00 }
 */
export async function GET() {
  try {
    let basePrice = DEFAULT_KIT_CONFIG.basePrice;
    let extraShotPrice = DEFAULT_KIT_CONFIG.extraShotPrice;

    // 1. Intentar leer desde la descripción de la categoría "Esencias para Perfume"
    const cat = await prisma.category.findFirst({
      where: {
        OR: [
          { name: 'Esencias para Perfume' },
          { slug: 'esencias-para-perfume' },
        ],
      },
    });

    if (cat?.description) {
      try {
        const parsed = JSON.parse(cat.description);
        if (typeof parsed.basePrice === 'number' && !isNaN(parsed.basePrice) && parsed.basePrice > 0) {
          basePrice = parsed.basePrice;
        }
        if (typeof parsed.extraShotPrice === 'number' && !isNaN(parsed.extraShotPrice) && parsed.extraShotPrice >= 0) {
          extraShotPrice = parsed.extraShotPrice;
        }
      } catch {
        // La descripción no era JSON válido
      }
    }

    // 2. Si no se obtuvo basePrice del JSON, revisar si algún producto tiene finishedPerfumePrice
    if (basePrice === DEFAULT_KIT_CONFIG.basePrice) {
      const sampleProd = await prisma.product.findFirst({
        where: {
          finishedPerfumePrice: { not: null },
        },
        select: { finishedPerfumePrice: true },
      });
      if (sampleProd?.finishedPerfumePrice != null) {
        const sampleVal = Number(sampleProd.finishedPerfumePrice);
        if (!isNaN(sampleVal) && sampleVal > 0) {
          basePrice = sampleVal;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        basePrice,
        extraShotPrice,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error obteniendo kit-config:', error);
    return NextResponse.json(
      {
        success: true,
        source: 'fallback',
        ...DEFAULT_KIT_CONFIG,
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}

/**
 * PATCH /api/kit-config
 * Actualiza la configuración global de "Arma tu propio perfume":
 * - basePrice: Valor del perfume total (Base 100ml)
 * - extraShotPrice: Valor de agregar el extra shot (+½ Oz extra)
 * Actualiza también finishedPerfumePrice en todos los productos de esencias.
 */
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const staffHeaderToken = request.headers.get('x-staff-token');

    const isStaff = verifyStaffInternalToken(staffHeaderToken) || verifyStaffInternalToken(bearerToken);
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: 'Acceso no autorizado. Se requiere token de personal administrativo.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { basePrice, extraShotPrice } = body;

    const numBase = typeof basePrice === 'number' ? basePrice : parseFloat(basePrice);
    const numExtra = typeof extraShotPrice === 'number' ? extraShotPrice : parseFloat(extraShotPrice);

    if (isNaN(numBase) || numBase <= 0) {
      return NextResponse.json(
        { success: false, error: 'El precio base del perfume debe ser un número mayor a 0' },
        { status: 400 }
      );
    }

    if (isNaN(numExtra) || numExtra < 0) {
      return NextResponse.json(
        { success: false, error: 'El precio del extra shot debe ser un número mayor o igual a 0' },
        { status: 400 }
      );
    }

    const configToSave = {
      basePrice: Number(numBase.toFixed(2)),
      extraShotPrice: Number(numExtra.toFixed(2)),
    };

    // 1. Guardar en la descripción de la categoría "Esencias para Perfume"
    let cat = await prisma.category.findFirst({
      where: {
        OR: [
          { name: 'Esencias para Perfume' },
          { slug: 'esencias-para-perfume' },
        ],
      },
    });

    if (cat) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { description: JSON.stringify(configToSave) },
      });
    } else {
      cat = await prisma.category.create({
        data: {
          name: 'Esencias para Perfume',
          slug: 'esencias-para-perfume',
          description: JSON.stringify(configToSave),
        },
      });
    }

    // 2. Actualizar finishedPerfumePrice en todas las esencias
    const updateResult = await prisma.product.updateMany({
      where: {
        OR: [
          { categoryId: cat.id },
          { category: { name: 'Esencias para Perfume' } },
        ],
      },
      data: {
        finishedPerfumePrice: configToSave.basePrice,
      },
    });

    return NextResponse.json({
      success: true,
      ...configToSave,
      updatedProductsCount: updateResult.count,
    });
  } catch (error: any) {
    console.error('Error actualizando kit-config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
