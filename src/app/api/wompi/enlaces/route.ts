import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createWompiPaymentLink, getWompiPaymentLinkDetails } from '@/lib/wompi';
import { verifyStaffRequest } from '@/lib/customerAuthToken';

export const dynamic = 'force-dynamic';

let tableInitialized = false;

async function ensureAromaniakWompiTable() {
  if (tableInitialized) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.aromaniak_wompi_enlaces (
      id SERIAL PRIMARY KEY,
      id_enlace BIGINT,
      referencia VARCHAR(100) UNIQUE NOT NULL,
      monto NUMERIC(10,2) NOT NULL,
      cliente_nombre VARCHAR(150),
      cliente_telefono VARCHAR(50),
      concepto VARCHAR(255) DEFAULT 'Productos Aromaniak',
      url_enlace TEXT NOT NULL,
      url_qr_enlace TEXT,
      creado_por VARCHAR(150),
      estado VARCHAR(30) DEFAULT 'PENDIENTE',
      transaccion_id VARCHAR(100),
      codigo_autorizacion VARCHAR(100),
      fecha_pago TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_aro_wompi_enlaces_ref ON public.aromaniak_wompi_enlaces(referencia);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_aro_wompi_enlaces_estado ON public.aromaniak_wompi_enlaces(estado);
  `);
  tableInitialized = true;
}

function serializeRows(rows: any[]): any[] {
  return rows.map((r) => ({
    ...r,
    id: Number(r.id),
    id_enlace: r.id_enlace !== null && r.id_enlace !== undefined ? Number(r.id_enlace) : null,
    monto: Number(r.monto || 0),
  }));
}

async function checkAndSyncSingleLinkWithWompi(row: any): Promise<any> {
  if (!row || row.estado === 'PAGADO' || !row.id_enlace) return row;
  try {
    const details = await getWompiPaymentLinkDetails(Number(row.id_enlace));
    const txs: any[] =
      details?.transaccionesCompra ||
      details?.TransaccionesCompra ||
      (details?.transaccionCompra ? [details.transaccionCompra] : []) ||
      [];

    const approvedTx = Array.isArray(txs)
      ? txs.find(
          (t: any) =>
            t?.resultadoTransaccion === 'ExitosaAprobada' ||
            t?.ResultadoTransaccion === 'ExitosaAprobada' ||
            t?.esAprobada === true
        )
      : null;

    if (approvedTx) {
      const txId = String(approvedTx.idTransaccion || approvedTx.IdTransaccion || '');
      const authCode = String(approvedTx.codigoAutorizacion || approvedTx.CodigoAutorizacion || '');
      const updatedRows = await prisma.$queryRawUnsafe<any[]>(
        `UPDATE public.aromaniak_wompi_enlaces
         SET estado = 'PAGADO',
             transaccion_id = COALESCE($1, transaccion_id),
             codigo_autorizacion = COALESCE($2, codigo_autorizacion),
             fecha_pago = COALESCE(fecha_pago, NOW()),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        txId || null,
        authCode || null,
        Number(row.id)
      );
      if (updatedRows.length > 0) {
        return serializeRows(updatedRows)[0];
      }
    }
  } catch (_) {
    // Silencioso si Wompi no reporta transacciones aún
  }
  return row;
}

// GET: Obtener lista de enlaces generados en Caja Aromaniak
export async function GET(request: Request) {
  try {
    await ensureAromaniakWompiTable();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado')?.trim() || '';
    const q = searchParams.get('q')?.trim() || '';
    const syncLive = searchParams.get('sync') === '1';

    // Si se pide sincronización activa, verificar en Wompi los últimos 5 enlaces pendientes recientes
    if (syncLive) {
      const pendingRecent = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM public.aromaniak_wompi_enlaces
         WHERE estado = 'PENDIENTE' AND id_enlace IS NOT NULL
         ORDER BY created_at DESC LIMIT 5`
      );
      if (pendingRecent.length > 0) {
        await Promise.allSettled(
          serializeRows(pendingRecent).map((item) => checkAndSyncSingleLinkWithWompi(item))
        );
      }
    }

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
        creado_por,
        estado,
        transaccion_id,
        codigo_autorizacion,
        fecha_pago,
        created_at
      FROM public.aromaniak_wompi_enlaces
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
        OR creado_por ILIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 150`;

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    const statsRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COUNT(*)::int AS total_enlaces,
        COUNT(*) FILTER (WHERE estado = 'PAGADO')::int AS total_pagados,
        COUNT(*) FILTER (WHERE estado = 'PENDIENTE')::int AS total_pendientes,
        COALESCE(SUM(monto) FILTER (WHERE estado = 'PAGADO'), 0)::float AS monto_recaudado
      FROM public.aromaniak_wompi_enlaces
    `);

    const rawStats = statsRows[0] || {};

    return NextResponse.json({
      success: true,
      enlaces: serializeRows(rows),
      stats: {
        total_enlaces: Number(rawStats.total_enlaces || 0),
        total_pagados: Number(rawStats.total_pagados || 0),
        total_pendientes: Number(rawStats.total_pendientes || 0),
        monto_recaudado: Number(rawStats.monto_recaudado || 0),
      },
    });
  } catch (error: any) {
    console.error('Error fetching Aromaniak Wompi enlaces:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear nuevo enlace de pago en Caja Aromaniak
export async function POST(request: Request) {
  try {
    await ensureAromaniakWompiTable();
    const { payload } = verifyStaffRequest(request);
    const body = await request.json();
    const {
      monto,
      clienteNombre,
      clienteTelefono,
      concepto,
      creadoPor,
    } = body;

    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      return NextResponse.json(
        { success: false, error: 'Ingresa un monto válido mayor a $0.00 para generar el enlace.' },
        { status: 400 }
      );
    }

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'aromaniaksv.com';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const publicStoreBaseUrl = isLocal ? `http://${host}` : 'https://aromaniaksv.com';

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ARO-${dateStr}-${randomSuffix}`;

    const nombreCliente = clienteNombre?.trim() || 'Cliente Aromaniak';
    const conceptoProducto = concepto?.trim() || 'Productos Aromaniak';
    const autor = creadoPor?.trim() || payload?.name || 'Caja Aromaniak';

    // Generar enlace oficial en Wompi El Salvador
    const link = await createWompiPaymentLink({
      orderNumber,
      amount: Number(parsedMonto.toFixed(2)),
      productName: conceptoProducto,
      productDescription: `${conceptoProducto} | Para: ${nombreCliente}`,
      customerName: nombreCliente,
      customerPhone: clienteTelefono ? String(clienteTelefono) : undefined,
      redirectUrl: `${publicStoreBaseUrl}/checkout/resultado`,
      returnUrl: `${publicStoreBaseUrl}`,
      webhookUrl: `${publicStoreBaseUrl}/api/wompi/webhook`,
    });

    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.aromaniak_wompi_enlaces (
        id_enlace,
        referencia,
        monto,
        cliente_nombre,
        cliente_telefono,
        concepto,
        url_enlace,
        url_qr_enlace,
        creado_por,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDIENTE')
      RETURNING *`,
      link.idEnlace || null,
      orderNumber,
      Number(parsedMonto.toFixed(2)),
      clienteNombre?.trim() || null,
      clienteTelefono ? String(clienteTelefono).trim() : null,
      conceptoProducto,
      link.urlEnlace,
      link.urlQrCodeEnlace || null,
      autor
    );

    return NextResponse.json({
      success: true,
      message: 'Enlace de pago Wompi generado con éxito',
      enlace: serializeRows(inserted)[0],
    });
  } catch (error: any) {
    console.error('Error creando enlace de pago Wompi Aromaniak:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al conectar con Wompi' },
      { status: 500 }
    );
  }
}

// PATCH: Verificar en vivo con Wompi o actualizar estado de un enlace
export async function PATCH(request: Request) {
  try {
    await ensureAromaniakWompiTable();
    const body = await request.json();
    const { id, estado, codigo_autorizacion } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    if (estado) {
      const updated = await prisma.$queryRawUnsafe<any[]>(
        `UPDATE public.aromaniak_wompi_enlaces
         SET estado = $1,
             codigo_autorizacion = COALESCE($2, codigo_autorizacion),
             fecha_pago = CASE WHEN $1 = 'PAGADO' THEN NOW() ELSE fecha_pago END,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        estado,
        codigo_autorizacion || null,
        Number(id)
      );
      return NextResponse.json({ success: true, enlace: serializeRows(updated)[0] });
    }

    const current = await prisma.$queryRawUnsafe<any[]>(
      'SELECT * FROM public.aromaniak_wompi_enlaces WHERE id = $1',
      Number(id)
    );
    if (current.length === 0) {
      return NextResponse.json({ success: false, error: 'Enlace no encontrado' }, { status: 404 });
    }

    const synced = await checkAndSyncSingleLinkWithWompi(serializeRows(current)[0]);
    return NextResponse.json({ success: true, enlace: synced });
  } catch (error: any) {
    console.error('Error actualizando enlace Wompi Aromaniak:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar enlace
export async function DELETE(request: Request) {
  try {
    await ensureAromaniakWompiTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      'DELETE FROM public.aromaniak_wompi_enlaces WHERE id = $1',
      Number(id)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error eliminando enlace Wompi Aromaniak:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
