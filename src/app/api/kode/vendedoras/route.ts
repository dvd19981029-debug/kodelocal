import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verificar si existen usuarios, si no inicializar las vendedoras base
    const check = await queryKode('SELECT count(*) FROM public.usuarios');
    if (parseInt(check.rows[0].count, 10) === 0) {
      await queryKode(`
        INSERT INTO public.usuarios (nombre, email, rol)
        VALUES 
          ('Virgen Cerna', 'virgicerna@gmail.com', 'VENDEDORA'),
          ('Patricia Mejía', 'pm3923193@gmail.com', 'VENDEDORA'),
          ('Erika Melgar', 'erikamelgargarcia@gmail.com', 'VENDEDORA')
        ON CONFLICT (email) DO NOTHING;
      `);
    }

    const res = await queryKode(`
      SELECT id, nombre, email, rol, activo
      FROM public.usuarios
      WHERE activo = TRUE
      ORDER BY nombre ASC
    `);

    return NextResponse.json({ success: true, vendedoras: res.rows });
  } catch (error: any) {
    console.error('Error fetching vendedoras:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
