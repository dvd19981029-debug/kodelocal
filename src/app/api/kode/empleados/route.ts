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
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS comision_porcentaje DECIMAL(5, 2) DEFAULT 5.00;
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'VENDEDORA';
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

      -- Sembrar vendedoras base si está vacía
      INSERT INTO public.usuarios (nombre, email, username, password, telefono, rol, doc_tipo, doc_numero, departamento_mh, municipio_mh, direccion_complemento, comision_normal, comision_plus, comision_porcentaje)
      VALUES 
        ('Virgen Cerna', 'virgicerna@gmail.com', 'virgencerna', 'Kode2026*', '7890-1122', 'VENDEDORA', 'DUI', '045812903', '06', '14', 'San Salvador Centro, El Salvador', 1.00, 1.50, 5.00),
        ('Patricia Elizabeth Mejía Ramírez', 'pm3923193@gmail.com', 'patriciamejia', 'Kode2026*', '7230-4650', 'VENDEDORA', 'DUI', '068614130', '10', '15', 'Caserío Las Vegas, Cantón Cañas, Tepetitán, San Vicente', 1.00, 1.50, 5.00),
        ('Erika Melgar', 'erikamelgargarcia@gmail.com', 'erikamelgar', 'Kode2026*', '7123-5566', 'VENDEDORA', 'DUI', '028913401', '06', '14', 'San Salvador, El Salvador', 1.00, 1.50, 5.00)
      ON CONFLICT (email) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        doc_tipo = EXCLUDED.doc_tipo,
        doc_numero = EXCLUDED.doc_numero,
        departamento_mh = EXCLUDED.departamento_mh,
        municipio_mh = EXCLUDED.municipio_mh,
        direccion_complemento = EXCLUDED.direccion_complemento,
        comision_porcentaje = COALESCE(public.usuarios.comision_porcentaje, 5.00);
    `);
  } catch (err) {
    console.error('Error ensuring usuarios table structure:', err);
  }
}

export async function GET() {
  try {
    await ensureUsuariosColumns();

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
        COALESCE(u.comision_porcentaje, 5.00)::float AS comision_porcentaje,
        COALESCE(u.activo, TRUE) AS activo,
        u.created_at,
        COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL) AS total_pedidos,
        COUNT(DISTINCT p.id) FILTER (WHERE p.estado IN ('Entregado', 'ENTREGADO')) AS pedidos_entregados,
        COALESCE(SUM(DISTINCT p.total) FILTER (WHERE p.id IS NOT NULL), 0) AS total_ventas,
        -- REGLA DE NEGOCIO: La comisión de venta (5% por defecto) SOLO se calcula y acumula cuando el pedido está ENTREGADO
        COALESCE(
          (
            SELECT SUM(COALESCE(ped.subtotal, ped.total, 0) * (COALESCE(u.comision_porcentaje, 5.00) / 100.0))
            FROM public.pedidos ped
            WHERE ped.vendedora_id = u.id
              AND ped.estado IN ('Entregado', 'ENTREGADO')
          ), 0
        )::float AS total_comisiones,
        -- Comisiones de pedidos en curso pendientes de ser entregados
        COALESCE(
          (
            SELECT SUM(COALESCE(ped.subtotal, ped.total, 0) * (COALESCE(u.comision_porcentaje, 5.00) / 100.0))
            FROM public.pedidos ped
            WHERE ped.vendedora_id = u.id
              AND ped.estado NOT IN ('Entregado', 'ENTREGADO', 'Cancelado', 'CANCELADO')
          ), 0
        )::float AS comisiones_pendientes
      FROM public.usuarios u
      LEFT JOIN public.pedidos p ON u.id = p.vendedora_id
      GROUP BY 
        u.id, u.nombre, u.email, u.username, u.password, u.telefono, u.rol,
        u.doc_tipo, u.doc_numero, u.departamento_mh, u.municipio_mh, u.direccion_complemento,
        u.comision_normal, u.comision_plus, u.comision_porcentaje, u.activo, u.created_at
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
      comision_porcentaje = 5.00,
    } = body;

    if (!nombre || !email) {
      return NextResponse.json({ success: false, error: 'Nombre y correo electrónico son requeridos' }, { status: 400 });
    }

    const cleanUsername = username?.trim() || email.split('@')[0].trim().toLowerCase();

    const res = await queryKode(
      `INSERT INTO public.usuarios (
        nombre, email, username, password, telefono, rol,
        doc_tipo, doc_numero, departamento_mh, municipio_mh, direccion_complemento,
        comision_normal, comision_plus, comision_porcentaje, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE)
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
        comision_porcentaje = EXCLUDED.comision_porcentaje,
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
        parseFloat(comision_porcentaje.toString()) || 5.00,
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

    // Actualización masiva de comisión global a todos los empleados
    if (body.aplicar_global) {
      const nuevoPct = parseFloat(body.comision_porcentaje) || 5.00;
      await queryKode(
        `UPDATE public.usuarios SET comision_porcentaje = $1, updated_at = NOW()`,
        [nuevoPct]
      );
      return NextResponse.json({
        success: true,
        message: `Comisión global del ${nuevoPct}% aplicada exitosamente a todos los empleados`,
      });
    }

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
      comision_porcentaje,
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
           comision_porcentaje = COALESCE($14, comision_porcentaje),
           activo = COALESCE($15, activo),
           updated_at = NOW()
       WHERE id = $16
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
        comision_porcentaje !== undefined ? parseFloat(comision_porcentaje.toString()) : null,
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
