import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import svMunicipiosData from '@/lib/svMunicipiosData.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idDeptoParam = searchParams.get('id_depto');
    const deptoParam = searchParams.get('depto')?.trim();
    const query = searchParams.get('q')?.trim().toLowerCase();

    // 1. Intentar consultar base de datos si está disponible
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
      try {
        const whereClause: any = {};
        if (idDeptoParam) {
          whereClause.idDepto = Number(idDeptoParam);
        }

        const dbMunis = await (prisma as any).municipio.findMany({
          where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
          orderBy: { nombreMunicipio: 'asc' },
        });

        if (Array.isArray(dbMunis) && dbMunis.length > 0) {
          let filtered = dbMunis.map((m: any) => ({
            id_municipio: m.idMunicipio || m.id_municipio,
            nombre_municipio: m.nombreMunicipio || m.nombre_municipio,
            id_depto: m.idDepto || m.id_depto,
            municipio_mh: m.municipioMh || m.municipio_mh,
            nombre_mh: m.nombreMh || m.nombre_mh,
          }));

          if (query) {
            filtered = filtered.filter((m: any) =>
              m.nombre_municipio.toLowerCase().includes(query) ||
              m.nombre_mh.toLowerCase().includes(query)
            );
          }

          return NextResponse.json({
            success: true,
            source: 'database',
            total: filtered.length,
            municipios: filtered,
          });
        }
      } catch (dbErr) {
        console.warn('Tabla municipios no disponible en DB, usando dataset local:', dbErr);
      }
    }

    // 2. Fallback resiliente usando svMunicipiosData.json (262 municipios oficiales)
    let list = svMunicipiosData as Array<{
      id_municipio: number;
      nombre_municipio: string;
      id_depto: number;
      municipio_mh: string;
      nombre_mh: string;
    }>;

    if (idDeptoParam) {
      const idNum = Number(idDeptoParam);
      list = list.filter((m) => m.id_depto === idNum);
    }

    if (query) {
      list = list.filter((m) =>
        m.nombre_municipio.toLowerCase().includes(query) ||
        m.nombre_mh.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      source: 'local_dataset',
      total: list.length,
      municipios: list,
    });
  } catch (error: any) {
    console.error('Error al obtener municipios:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
