import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

// Asegura la existencia de public.formas_pago y precarga el catálogo de 15 cuentas/métodos
async function ensureFormasPagoTable() {
  try {
    await queryKode(`
      CREATE TABLE IF NOT EXISTS public.formas_pago (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'BANCO',
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO public.formas_pago (id, nombre, tipo, activo)
      VALUES 
        ('1001', 'Cuenta Bac 130693682', 'BANCO', TRUE),
        ('1002', 'Cuenta Agricola 3110730668', 'BANCO', TRUE),
        ('1003', 'Contra Entrega', 'CONTRA_ENTREGA', TRUE),
        ('1004', 'Efectivo', 'EFECTIVO', TRUE),
        ('1005', 'Nequi', 'PASARELA', TRUE),
        ('1006', 'Wompi', 'PASARELA', TRUE),
        ('60b88ae8', 'Transferencia niu', 'BANCO', TRUE),
        ('4993dfa4', 'Cuenta Bac 124867862', 'BANCO', TRUE),
        ('636d3e47', 'Cambio', 'AJUSTE', TRUE),
        ('7d9b1805', 'Descuento', 'AJUSTE', TRUE),
        ('b8f63003', 'Cuenta cusca', 'BANCO', TRUE),
        ('45f1d9da', 'Faltante', 'AJUSTE', TRUE),
        ('926ea3d9', 'Cuenta Agrícola 3510876006', 'BANCO', TRUE),
        ('bdd97b81', 'Cuenta Banco Cuscatlán', 'BANCO', TRUE),
        ('99a4307b', 'Pendiente de pago', 'AJUSTE', TRUE)
      ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        tipo = EXCLUDED.tipo;
    `);
  } catch (err) {
    console.error('Error asegurando tabla formas_pago:', err);
  }
}

export async function GET(request: Request) {
  try {
    await ensureFormasPagoTable();

    const { searchParams } = new URL(request.url);
    const soloActivas = searchParams.get('activas_only') === 'true';

    let sql = `
      SELECT 
        fp.id, 
        fp.nombre, 
        fp.tipo, 
        fp.activo,
        fp.created_at,
        (SELECT COUNT(*) FROM public.pagos pg WHERE pg.forma_pago_id = fp.id)::int AS total_transacciones,
        COALESCE((SELECT SUM(pg.monto) FROM public.pagos pg WHERE pg.forma_pago_id = fp.id), 0)::float AS total_monto
      FROM public.formas_pago fp
    `;

    if (soloActivas) {
      sql += ` WHERE fp.activo = TRUE`;
    }

    sql += `
      ORDER BY 
        CASE 
          WHEN fp.id = '1003' THEN 1 -- Contra Entrega primero
          WHEN fp.id = '1001' THEN 2 -- BAC
          WHEN fp.id = '1002' THEN 3 -- Agrícola
          WHEN fp.id = '1004' THEN 4 -- Efectivo
          WHEN fp.id = '1006' THEN 5 -- Wompi
          ELSE 6 
        END,
        fp.nombre ASC
    `;

    const res = await queryKode(sql);
    return NextResponse.json({ success: true, formasPago: res.rows });
  } catch (error: any) {
    console.error('Error fetching formas de pago:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureFormasPagoTable();
    const body = await request.json();
    const { nombre, tipo = 'BANCO', activo = true } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre de la forma de pago es requerido' }, { status: 400 });
    }

    let finalId = body.id?.trim();
    if (!finalId) {
      finalId = Math.random().toString(36).substring(2, 10);
    }

    const res = await queryKode(
      `INSERT INTO public.formas_pago (id, nombre, tipo, activo)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         tipo = EXCLUDED.tipo,
         activo = EXCLUDED.activo
       RETURNING *`,
      [finalId, nombre.trim(), tipo, Boolean(activo)]
    );

    return NextResponse.json({
      success: true,
      formaPago: res.rows[0],
      message: 'Forma de pago guardada con éxito',
    });
  } catch (error: any) {
    console.error('Error creating forma de pago:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureFormasPagoTable();
    const body = await request.json();
    const { id, nombre, tipo, activo } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de forma de pago es requerido' }, { status: 400 });
    }

    const res = await queryKode(
      `UPDATE public.formas_pago
       SET nombre = COALESCE($1, nombre),
           tipo = COALESCE($2, tipo),
           activo = COALESCE($3, activo)
       WHERE id = $4
       RETURNING *`,
      [
        nombre !== undefined ? nombre.trim() : null,
        tipo !== undefined ? tipo : null,
        activo !== undefined ? Boolean(activo) : null,
        id,
      ]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Forma de pago no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      formaPago: res.rows[0],
      message: 'Forma de pago actualizada con éxito',
    });
  } catch (error: any) {
    console.error('Error updating forma de pago:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
