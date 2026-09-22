import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const genero = searchParams.get('genero')?.trim() || '';

    let sql = `
      SELECT id, codigo, contratipo, marca_inspirada, genero, precio_normal, precio_extra_shot, activo, imagen_url
      FROM public.catalogo
      WHERE activo = TRUE
    `;
    const params: any[] = [];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (contratipo ILIKE $${params.length} OR codigo ILIKE $${params.length} OR marca_inspirada ILIKE $${params.length})`;
    }

    if (genero && genero !== 'Todos') {
      params.push(genero);
      sql += ` AND genero = $${params.length}`;
    }

    sql += ` ORDER BY contratipo ASC`;

    const result = await queryKode(sql, params);
    return NextResponse.json({ success: true, perfumes: result.rows });
  } catch (error: any) {
    console.error('Error fetching KODE catalog:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
