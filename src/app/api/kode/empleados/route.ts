import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

// Asegura que las columnas de empleados, credenciales y Sujeto Excluido existan en public.usuarios
async function ensureUsuariosColumns() {
  try {
    await queryKode(`
      CREATE TABLE IF NOT EXISTS public.usuarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        username VARCHAR(100),
        password VARCHAR(255),
        telefono VARCHAR(50),
        rol VARCHAR(50) DEFAULT 'VENDEDORA',
        doc_tipo VARCHAR(20) DEFAULT 'DUI',
        doc_numero VARCHAR(30),
        departamento_mh VARCHAR(10) DEFAULT '06',
        municipio_mh VARCHAR(10) DEFAULT '14',
        direccion_complemento TEXT,
        actividad_economica VARCHAR(20) DEFAULT '82990',
        comision_normal DECIMAL(10, 2) DEFAULT 1.00,
        comision_plus DECIMAL(10, 2) DEFAULT 1.50,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS username VARCHAR(100);
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS doc_tipo VARCHAR(20) DEFAULT 'DUI';
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS doc_numero VARCHAR(30);
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS departamento_mh VARCHAR(10) DEFAULT '06';
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS municipio_mh VARCHAR(10) DEFAULT '14';
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS direccion_complemento TEXT;
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS actividad_economica VARCHAR(20) DEFAULT '82990';
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS comision_normal DECIMAL(10, 2) DEFAULT 1.00;
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS comision_plus DECIMAL(10, 2) DEFAULT 1.50;
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'VENDEDORA';
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

      -- Sembrar vendedoras base si está vacía
      INSERT INTO public.usuarios (nombre, email, username, password, telefono, rol, doc_tipo, doc_numero, departamento_mh, municipio_mh, direccion_complemento, comision_normal, comision_plus)
      VALUES 
        ('Virgen Cerna', 'virgicerna@gmail.com', 'virgencerna', 'Kode2026*', '7890-1122', 'VENDEDORA', 'DUI', '045812903', '06', '14', 'San Salvador Centro, El Salvador', 1.00, 1.50),
        ('Patricia Mejía', 'pm3923193@gmail.com', 'patriciamejia', 'Kode2026*', '7654-3344', 'VENDEDORA', 'DUI', '034084662', '06', '14', 'Colonia Escalón, San Salvador', 1.00, 1.50),
        ('Erika Melgar', 'erikamelgargarcia@gmail.com', 'erikamelgar', 'Kode2026*', '7123-5566', 'VENDEDORA', 'DUI', '028913401', '06', '14', 'San Salvador, El Salvador', 1.00, 1.50)
      ON CONFLICT (email) DO NOTHING;
    `);
  } catch (err) {
    console.error('Error ensuring usuarios table structure:', err);
  }
}

export async function GET() {
  try {
    await ensureUsuariosColumns();

    // Consulta de empleados con métricas de ventas, credenciales y Sujeto Excluido
    const sql = `
      SELECT 
        u.id,
        u.nombre,
        u.email,
        COALESCE(u.username, '') AS username,
        COALESCE(u.password, '') AS password,
        COALESCE(u.telefono, '') AS telefono,
        COALESCE(u.rol, 'VENDEDORA') AS rol,
        COALESCE(u.doc_tipo, 'DUI') AS doc_tipo,
        COALESCE(u.doc_numero, '') AS doc_numero,
        COALESCE(u.departamento_mh, '06') AS departamento_mh,
        COALESCE(u.municipio_mh, '14') AS municipio_mh,
        COALESCE(u.direccion_complemento, '') AS direccion_complemento,
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
      GROUP BY 
        u.id, u.nombre, u.email, u.username, u.password, u.telefono, u.rol,
        u.doc_tipo, u.doc_numero, u.departamento_mh, u.municipio_mh, u.direccion_complemento,
        u.comision_normal, u.comision_plus, u.activo, u.created_at
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
    const {
      nombre,
      email,
      username,
      password,
      telefono,
      rol = 'VENDEDORA',
      doc_tipo = 'DUI',
      doc_numero,
      departamento_mh = '06',
      municipio_mh = '14',
      direccion_complemento,
      comision_normal = 1.00,
      comision_plus = 1.50,
    } = body;

    if (!nombre || !email) {
      return NextResponse.json({ success: false, error: 'Nombre y correo electrónico son requeridos' }, { status: 400 });
    }

    const cleanUsername = username?.trim() || email.split('@')[0].trim().toLowerCase();

    const res = await queryKode(
      `INSERT INTO public.usuarios (
        nombre, email, username, password, telefono, rol,
        doc_tipo, doc_numero, departamento_mh, municipio_mh, direccion_complemento,
        comision_normal, comision_plus, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
      ON CONFLICT (email) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        username = EXCLUDED.username,
        password = COALESCE(EXCLUDED.password, public.usuarios.password),
        telefono = EXCLUDED.telefono,
        rol = EXCLUDED.rol,
        doc_tipo = EXCLUDED.doc_tipo,
        doc_numero = EXCLUDED.doc_numero,
        departamento_mh = EXCLUDED.departamento_mh,
        municipio_mh = EXCLUDED.municipio_mh,
        direccion_complemento = EXCLUDED.direccion_complemento,
        comision_normal = EXCLUDED.comision_normal,
        comision_plus = EXCLUDED.comision_plus,
        activo = TRUE,
        updated_at = NOW()
      RETURNING *`,
      [
        nombre.trim(),
        email.trim().toLowerCase(),
        cleanUsername,
        password?.trim() || null,
        telefono?.trim() || '',
        rol,
        doc_tipo,
        doc_numero?.trim() || '',
        departamento_mh,
        municipio_mh,
        direccion_complemento?.trim() || '',
        comision_normal,
        comision_plus,
      ]
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
    const {
      id,
      nombre,
      email,
      username,
      password,
      telefono,
      rol,
      doc_tipo,
      doc_numero,
      departamento_mh,
      municipio_mh,
      direccion_complemento,
      comision_normal,
      comision_plus,
      activo,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de empleado es requerido' }, { status: 400 });
    }

    const res = await queryKode(
      `UPDATE public.usuarios 
       SET nombre = COALESCE($1, nombre),
           email = COALESCE($2, email),
           username = COALESCE($3, username),
           password = CASE WHEN $4::text IS NOT NULL AND $4::text != '' THEN $4::text ELSE password END,
           telefono = COALESCE($5, telefono),
           rol = COALESCE($6, rol),
           doc_tipo = COALESCE($7, doc_tipo),
           doc_numero = COALESCE($8, doc_numero),
           departamento_mh = COALESCE($9, departamento_mh),
           municipio_mh = COALESCE($10, municipio_mh),
           direccion_complemento = COALESCE($11, direccion_complemento),
           comision_normal = COALESCE($12, comision_normal),
           comision_plus = COALESCE($13, comision_plus),
           activo = COALESCE($14, activo),
           updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        nombre,
        email?.toLowerCase(),
        username,
        password !== undefined ? password : null,
        telefono,
        rol,
        doc_tipo,
        doc_numero,
        departamento_mh,
        municipio_mh,
        direccion_complemento,
        comision_normal,
        comision_plus,
        activo,
        id,
      ]
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

    // 1. Verificar si el empleado tiene pedidos asociados para no romper la integridad referencial
    const checkOrders = await queryKode(
      `SELECT COUNT(*)::int AS total FROM public.pedidos WHERE vendedora_id = $1`,
      [id]
    );

    const pedidosAsociados = checkOrders.rows[0]?.total || 0;

    if (pedidosAsociados > 0) {
      // Desactivar suavemente para proteger el historial de pedidos y comisiones
      await queryKode(
        `UPDATE public.usuarios SET activo = FALSE, updated_at = NOW() WHERE id = $1`,
        [id]
      );
      return NextResponse.json({
        success: true,
        message: `El colaborador tiene ${pedidosAsociados} pedidos asociados en el historial. Ha sido desactivado de la lista activa para preservar la integridad de datos.`,
        action: 'deactivated',
      });
    }

    // 2. Si no tiene ningún pedido asociado, eliminarlo definitivamente
    await queryKode(`DELETE FROM public.usuarios WHERE id = $1`, [id]);
    return NextResponse.json({
      success: true,
      message: 'Empleado eliminado definitivamente del sistema.',
      action: 'deleted',
    });
  } catch (error: any) {
    console.error('Error deleting empleado:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
