import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';
import { createWompiPaymentLink, getWompiTransaction } from '@/lib/wompi';

export const dynamic = 'force-dynamic';

async function ensureWompiTable() {
  await queryKode(`
    CREATE TABLE IF NOT EXISTS public.wompi_enlaces (
      id SERIAL PRIMARY KEY,
      id_enlace BIGINT,
      referencia VARCHAR(100) UNIQUE NOT NULL,
      monto NUMERIC(10,2) NOT NULL,
      cliente_nombre VARCHAR(150),
      cliente_telefono VARCHAR(50),
      concepto VARCHAR(255),
      url_enlace TEXT NOT NULL,
      url_qr_enlace TEXT,
      vendedora_id VARCHAR(100),
      vendedora_nombre VARCHAR(150),
      estado VARCHAR(30) DEFAULT 'PENDIENTE',
      transaccion_id VARCHAR(100),
      codigo_autorizacion VARCHAR(100),
      fecha_pago TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_wompi_enlaces_ref ON public.wompi_enlaces(referencia);
    CREATE INDEX IF NOT EXISTS idx_wompi_enlaces_estado ON public.wompi_enlaces(estado);
  `);
}

// GET: Obtener lista de enlaces generados
export async function GET(request: Request) {
  try {
    await ensureWompiTable();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado')?.trim() || '';
    const q = searchParams.get('q')?.trim() || '';

    let sql = `
      SELECT 
        id,
        id_enlace,
        referencia,
        monto::float AS monto,
        cliente_nombre,
        cliente_telefono,
        concepto,
        url_enlace,
        url_qr_enlace,
        vendedora_id,
        vendedora_nombre,
        estado,
        transaccion_id,
        codigo_autorizacion,
        fecha_pago,
        created_at
      FROM public.wompi_enlaces
      WHERE 1=1
    `;
    const params: any[] = [];

    if (estado && estado !== 'TODOS') {
      params.push(estado);
      sql += ` AND estado = $${params.length}`;
    }

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (
        referencia ILIKE $${params.length} 
        OR cliente_nombre ILIKE $${params.length} 
        OR cliente_telefono ILIKE $${params.length}
        OR concepto ILIKE $${params.length}
        OR codigo_autorizacion ILIKE $${params.length}
        OR vendedora_nombre ILIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 150`;

    const result = await queryKode(sql, params);

    // Calcular métricas
    const statsRes = await queryKode(`
      SELECT 
        COUNT(*)::int AS total_enlaces,
        COUNT(*) FILTER (WHERE estado = 'PAGADO')::int AS total_pagados,
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE')::int AS total_pendientes,
        COALESCE(SUM(monto) FILTER (WHERE estado = 'PAGADO'), 0)::float AS monto_recaudado
      FROM public.wompi_enlaces
    `);

    return NextResponse.json({
      success: true,
      enlaces: result.rows,
      stats: statsRes.rows[0] || {
        total_enlaces: 0,
        total_pagados: 0,
        total_pendientes: 0,
        monto_recaudado: 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching Wompi enlaces:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear nuevo enlace de cobro Wompi
export async function POST(request: Request) {
  try {
    await ensureWompiTable();
    const body = await request.json();
    const {
      monto,
      clienteNombre,
      clienteTelefono,
      concepto,
      vendedoraId,
      vendedoraNombre,
    } = body;

    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      return NextResponse.json(
        { success: false, error: 'Ingresa un monto válido para generar el enlace ($)' },
        { status: 400 }
      );
    }

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;

    // Generar identificador de pedido único
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `KOD-${dateStr}-${randomSuffix}`;

    const nombreCliente = clienteNombre?.trim() || 'Cliente KÖDE';
    const conceptoProducto = concepto?.trim() || 'Perfumes Kode';

    // Generar enlace oficial en Wompi SV
    const link = await createWompiPaymentLink({
      orderNumber,
      amount: Number(parsedMonto.toFixed(2)),
      productName: `KÖDE Perfumes - ${conceptoProducto}`,
      productDescription: `${conceptoProducto} | Cliente: ${nombreCliente}`,
      customerName: nombreCliente,
      customerPhone: clienteTelefono ? clienteTelefono.toString() : undefined,
      redirectUrl: `${baseUrl}/checkout/resultado`,
      returnUrl: `${baseUrl}/kode`,
      webhookUrl: `${baseUrl}/api/wompi/webhook`,
    });

    // Guardar en la base de datos de KÖDE
    const insertRes = await queryKode(
      `INSERT INTO public.wompi_enlaces (
        id_enlace,
        referencia,
        monto,
        cliente_nombre,
        cliente_telefono,
        concepto,
        url_enlace,
        url_qr_enlace,
        vendedora_id,
        vendedora_nombre,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDIENTE')
      RETURNING *`,
      [
        link.idEnlace || null,
        orderNumber,
        Number(parsedMonto.toFixed(2)),
        clienteNombre?.trim() || null,
        clienteTelefono ? clienteTelefono.toString().trim() : null,
        concepto?.trim() || 'Perfumes Kode',
        link.urlEnlace,
        link.urlQrCodeEnlace || null,
        vendedoraId || null,
        vendedoraNombre || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Enlace de pago Wompi generado con éxito',
      enlace: insertRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error creando enlace de pago Wompi:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al conectar con Wompi' },
      { status: 500 }
    );
  }
}

// PATCH: Verificar o actualizar estado de un enlace
export async function PATCH(request: Request) {
  try {
    await ensureWompiTable();
    const body = await request.json();
    const { id, estado, codigo_autorizacion } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    // Si se envía cambio manual o sincronizado
    if (estado) {
      const updated = await queryKode(
        `UPDATE public.wompi_enlaces
         SET estado = $1,
             codigo_autorizacion = COALESCE($2, codigo_autorizacion),
             fecha_pago = CASE WHEN $1 = 'PAGADO' THEN NOW() ELSE fecha_pago END,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [estado, codigo_autorizacion || null, id]
      );
      return NextResponse.json({ success: true, enlace: updated.rows[0] });
    }

    // Si es verificación automática, consultar registro
    const current = await queryKode('SELECT * FROM public.wompi_enlaces WHERE id = $1', [id]);
    if (current.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Enlace no encontrado' }, { status: 404 });
    }

    const row = current.rows[0];
    return NextResponse.json({ success: true, enlace: row });
  } catch (error: any) {
    console.error('Error actualizando enlace Wompi:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar enlace
export async function DELETE(request: Request) {
  try {
    await ensureWompiTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    await queryKode('DELETE FROM public.wompi_enlaces WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Enlace eliminado correctamente' });
  } catch (error: any) {
    console.error('Error eliminando enlace Wompi:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

