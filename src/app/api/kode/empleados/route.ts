import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

// Asegura que las columnas de empleados y comisiones existan en public.usuarios
async function ensureUsuariosColumns() {
  try {
    await queryKode(`
      CREATE TABLE IF NOT EXISTS public.usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        telefono VARCHAR(50),
        rol VARCHAR(50) DEFAULT 'VENDEDORA',
        comision_normal DECIMAL(10, 2) DEFAULT 1.00,
        comision_plus DECIMAL(10, 2) DEFAULT 1.50,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS comision_normal DECIMAL(10, 2) DEFAULT 1.00;
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS comision_plus DECIMAL(10, 2) DEFAULT 1.50;
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'VENDEDORA';
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

      -- Sembrar vendedoras base si está vacía
      INSERT INTO public.usuarios (nombre, email, telefono, rol, comision_normal, comision_plus)
      VALUES 
        ('Virgen Cerna', 'virgicerna@gmail.com', '7890-1122', 'VENDEDORA', 1.00, 1.50),
        ('Patricia Mejía', 'pm3923193@gmail.com', '7654-3344', 'VENDEDORA', 1.00, 1.50),
        ('Erika Melgar', 'erikamelgargarcia@gmail.com', '7123-5566', 'VENDEDORA', 1.00, 1.50)
      ON CONFLICT (email) DO NOTHING;
    `);
  } catch (err) {
    console.error('Error ensuring usuarios table structure:', err);
  }
}

export async function GET() {
  try {
    await ensureUsuariosColumns();

    // Consulta de empleados con métricas de ventas y comisiones
    const sql = `
      SELECT 
        u.id,
        u.nombre,
        u.email,
        COALESCE(u.telefono, '') AS telefono,
        COALESCE(u.rol, 'VENDEDORA') AS rol,
        COALESCE(u.comision_normal, 1.00) AS comision_normal,
        COALESCE(u.comision_plus, 1.50) AS comision_plus,
        COALESCE(u.activo, TRUE) AS activo,
        u.created_at,
        COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL) AS total_pedidos,
        COUNT(DISTINCT p.id) FILTER (WHERE p.estado IN ('Entregado', 'ENTREGADO')) AS pedidos_entregados,
        COALESCE(SUM(p.total) FILTER (WHERE p.id IS NOT NULL), 0) AS total_ventas,
        -- Cálculo de comisiones generadas por los perfumes vendidos
        COALESCE(
          SUM(
            CASE 
              WHEN pi.version = 'Plus' OR pi.version = 'EXTRA_SHOT' THEN pi.cantidad * COALESCE(u.comision_plus, 1.50)
              ELSE pi.cantidad * COALESCE(u.comision_normal, 1.00)
            END
          ) FILTER (WHERE p.id IS NOT NULL), 0
        ) AS total_comisiones
      FROM public.usuarios u
      LEFT JOIN public.pedidos p ON u.id = p.vendedora_id
      LEFT JOIN public.pedido_items pi ON p.id = pi.pedido_id
      GROUP BY u.id, u.nombre, u.email, u.telefono, u.rol, u.comision_normal, u.comision_plus, u.activo, u.created_at
      ORDER BY u.activo DESC, u.nombre ASC;
    `;

    const res = await queryKode(sql);
    return NextResponse.json({ success: true, empleados: res.rows });
  } catch (error: any) {
    console.error('Error fetching empleados:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureUsuariosColumns();
    const body = await request.json();
    const { nombre, email, telefono, rol = 'VENDEDORA', comision_normal = 1.00, comision_plus = 1.50 } = body;

    if (!nombre || !email) {
      return NextResponse.json({ success: false, error: 'Nombre y correo electrónico son requeridos' }, { status: 400 });
    }

    const res = await queryKode(
      `INSERT INTO public.usuarios (nombre, email, telefono, rol, comision_normal, comision_plus, activo)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (email) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         telefono = EXCLUDED.telefono,
         rol = EXCLUDED.rol,
         comision_normal = EXCLUDED.comision_normal,
         comision_plus = EXCLUDED.comision_plus,
         activo = TRUE,
         updated_at = NOW()
       RETURNING *`,
      [nombre.trim(), email.trim().toLowerCase(), telefono || '', rol, comision_normal, comision_plus]
    );

    return NextResponse.json({ success: true, empleado: res.rows[0], message: 'Empleado guardado con éxito' });
  } catch (error: any) {
    console.error('Error creating empleado:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, email, telefono, rol, comision_normal, comision_plus, activo } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de empleado es requerido' }, { status: 400 });
    }

    const res = await queryKode(
      `UPDATE public.usuarios 
       SET nombre = COALESCE($1, nombre),
           email = COALESCE($2, email),
           telefono = COALESCE($3, telefono),
           rol = COALESCE($4, rol),
           comision_normal = COALESCE($5, comision_normal),
           comision_plus = COALESCE($6, comision_plus),
           activo = COALESCE($7, activo),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [nombre, email?.toLowerCase(), telefono, rol, comision_normal, comision_plus, activo, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, empleado: res.rows[0], message: 'Empleado actualizado con éxito' });
  } catch (error: any) {
    console.error('Error updating empleado:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de empleado es requerido' }, { status: 400 });
    }

    // Desactivar suavemente
    await queryKode(`UPDATE public.usuarios SET activo = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, message: 'Empleado desactivado con éxito' });
  } catch (error: any) {
    console.error('Error deleting empleado:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
