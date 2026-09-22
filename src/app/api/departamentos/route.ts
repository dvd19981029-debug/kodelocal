import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEPARTAMENTOS_CATALOG } from '@/lib/svTerritory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Intentar consultar desde la base de datos si la conexión está disponible
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      try {
        const dbDepartamentos = await (prisma as any).department.findMany({
          orderBy: { id: 'asc' },
        });

        if (Array.isArray(dbDepartamentos) && dbDepartamentos.length > 0) {
          return NextResponse.json({
            success: true,
            source: 'database',
            departamentos: dbDepartamentos.map((d: any) => ({
              id: d.id,
              nombre_depto: d.nombreDepto || d.nombre_depto,
              cod_depto: d.codDepto || d.cod_depto,
              depto_mh: d.deptoMh || d.depto_mh,
            })),
          });
        }
      } catch (dbErr) {
        console.warn('Tabla departamentos no disponible en DB, usando catálogo en memoria:', dbErr);
      }
    }

    // 2. Fallback resiliente con el catálogo oficial en memoria
    const memoryCatalog = DEPARTAMENTOS_CATALOG.filter(d => d.id !== '00').map((d, index) => ({
      id: index + 1,
      nombre_depto: d.nombre_depto,
      cod_depto: d.cod_depto,
      depto_mh: d.depto_mh,
    }));

    return NextResponse.json({
      success: true,
      source: 'memory_catalog',
      departamentos: memoryCatalog,
    });
  } catch (error: any) {
    console.error('Error al obtener departamentos:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
