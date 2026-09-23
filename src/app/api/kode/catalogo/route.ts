import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const genero = searchParams.get('genero')?.trim() || '';
    const incluirTodos = searchParams.get('all') === 'true' || searchParams.get('incluirInactivos') === 'true';

    const conditions: string[] = [];
    const params: any[] = [];

    if (!incluirTodos) {
      conditions.push('activo = TRUE');
    }

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(contratipo ILIKE $${params.length} OR codigo ILIKE $${params.length} OR marca_inspirada ILIKE $${params.length})`);
    }

    if (genero && genero !== 'Todos' && genero !== 'TODOS') {
      params.push(genero);
      conditions.push(`genero ILIKE $${params.length}`);
    }

    let sql = `
      SELECT id, codigo, contratipo, marca_inspirada, genero, precio_normal, precio_extra_shot, activo, imagen_url
      FROM public.catalogo
    `;

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY contratipo ASC`;

    const result = await queryKode(sql, params);
    return NextResponse.json({ success: true, perfumes: result.rows });
  } catch (error: any) {
    console.error('Error fetching KODE catalog:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, contratipo, marca_inspirada, genero, precio_normal, precio_extra_shot, activo } = body;

    if (!codigo || !String(codigo).trim()) {
      return NextResponse.json({ success: false, error: 'El código de la fragancia es obligatorio' }, { status: 400 });
    }
    if (!contratipo || !String(contratipo).trim()) {
      return NextResponse.json({ success: false, error: 'El contratipo (nombre de la fragancia) es obligatorio' }, { status: 400 });
    }

    const codClean = String(codigo).trim();
    const contraClean = String(contratipo).trim();
    const marcaClean = marca_inspirada ? String(marca_inspirada).trim() : '';
    const genClean = genero ? String(genero).trim() : 'Caballero';
    const pNormal = parseFloat(String(precio_normal)) || 20.00;
    const pExtra = parseFloat(String(precio_extra_shot)) || 25.00;
    const isActivo = activo !== undefined ? Boolean(activo) : true;

    // Verificar si ya existe ese código
    const checkExist = await queryKode('SELECT id FROM public.catalogo WHERE codigo = $1 LIMIT 1', [codClean]);
    if (checkExist.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Ya existe una fragancia registrada con el código #${codClean}. Por favor usa un código diferente.`
      }, { status: 400 });
    }

    const sql = `
      INSERT INTO public.catalogo (
        codigo, contratipo, marca_inspirada, genero, precio_normal, precio_extra_shot, activo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING id, codigo, contratipo, marca_inspirada, genero, precio_normal, precio_extra_shot, activo, imagen_url
    `;

    const result = await queryKode(sql, [
      codClean,
      contraClean,
      marcaClean,
      genClean,
      pNormal,
      pExtra,
      isActivo
    ]);

    return NextResponse.json({ success: true, perfume: result.rows[0] });
  } catch (error: any) {
    console.error('Error insertando fragancia en catálogo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, activo, codigo, contratipo, marca_inspirada, genero, precio_normal, precio_extra_shot } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de la fragancia requerido' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [id];

    if (typeof activo === 'boolean') {
      params.push(activo);
      updates.push(`activo = $${params.length}`);
    }
    if (codigo !== undefined && codigo !== null) {
      params.push(String(codigo).trim());
      updates.push(`codigo = $${params.length}`);
    }
    if (contratipo !== undefined && contratipo !== null) {
      params.push(String(contratipo).trim());
      updates.push(`contratipo = $${params.length}`);
    }
    if (marca_inspirada !== undefined && marca_inspirada !== null) {
      params.push(String(marca_inspirada).trim());
      updates.push(`marca_inspirada = $${params.length}`);
    }
    if (genero !== undefined && genero !== null) {
      params.push(String(genero).trim());
      updates.push(`genero = $${params.length}`);
    }
    if (precio_normal !== undefined && precio_normal !== null) {
      params.push(parseFloat(String(precio_normal)) || 20.00);
      updates.push(`precio_normal = $${params.length}`);
    }
    if (precio_extra_shot !== undefined && precio_extra_shot !== null) {
      params.push(parseFloat(String(precio_extra_shot)) || 25.00);
      updates.push(`precio_extra_shot = $${params.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No se enviaron campos para actualizar' }, { status: 400 });
    }

    const sql = `
      UPDATE public.catalogo
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, codigo, contratipo, marca_inspirada, genero, precio_normal, precio_extra_shot, activo, imagen_url
    `;

    const result = await queryKode(sql, params);
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Fragancia no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, perfume: result.rows[0] });
  } catch (error: any) {
    console.error('Error actualizando fragancia en catálogo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return PATCH(request);
}
