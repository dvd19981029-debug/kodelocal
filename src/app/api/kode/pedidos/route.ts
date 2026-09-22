import { NextResponse } from 'next/server';
import { queryKode, kodePool } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado')?.trim() || '';
    const q = searchParams.get('q')?.trim() || '';

    let sql = `
      SELECT 
        p.id,
        p.numero_pedido,
        p.estado,
        p.tipo_pago,
        p.estado_pago,
        p.subtotal,
        p.costo_envio,
        p.total,
        p.c807_guia_numero,
        p.c807_link_rastreo,
        p.c807_estado,
        p.c807_fecha_guia,
        p.notas,
        p.created_at,
        p.updated_at,
        c.id AS cliente_id,
        c.nombre_completo AS cliente_nombre,
        c.telefono_whatsapp AS cliente_telefono,
        c.direccion_entrega AS cliente_direccion,
        c.departamento AS cliente_departamento,
        c.municipio AS cliente_municipio,
        c.punto_referencia AS cliente_referencia,
        u.id AS vendedora_id,
        u.nombre AS vendedora_nombre,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'catalogo_id', pi.catalogo_id,
              'codigo', cat.codigo,
              'contratipo', cat.contratipo,
              'marca', cat.marca_inspirada,
              'version', pi.version,
              'cantidad', pi.cantidad,
              'precio_unitario', pi.precio_unitario,
              'subtotal', pi.subtotal,
              'insumo_comprado', pi.insumo_comprado,
              'fecha_compra_insumo', pi.fecha_compra_insumo
            ) ORDER BY pi.created_at ASC
          ) FILTER (WHERE pi.id IS NOT NULL), '[]'::json
        ) AS items
      FROM public.pedidos p
      JOIN public.clientes c ON p.cliente_id = c.id
      LEFT JOIN public.usuarios u ON p.vendedora_id = u.id
      LEFT JOIN public.pedido_items pi ON p.id = pi.pedido_id
      LEFT JOIN public.catalogo cat ON pi.catalogo_id = cat.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (estado && estado !== 'TODOS') {
      params.push(estado);
      sql += ` AND p.estado = $${params.length}`;
    }

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (
        p.numero_pedido ILIKE $${params.length} 
        OR c.nombre_completo ILIKE $${params.length} 
        OR c.telefono_whatsapp ILIKE $${params.length}
        OR p.c807_guia_numero ILIKE $${params.length}
      )`;
    }

    sql += `
      GROUP BY p.id, c.id, u.id
      ORDER BY p.created_at DESC
      LIMIT 100;
    `;

    const result = await queryKode(sql, params);
    return NextResponse.json({ success: true, pedidos: result.rows });
  } catch (error: any) {
    console.error('Error fetching KODE pedidos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await kodePool.connect();
  try {
    const body = await request.json();
    const {
      cliente,
      items,
      tipo_pago,
      estado_pago = 'PENDIENTE',
      costo_envio = 0,
      vendedora_id,
      notas = '',
    } = body;

    if (!cliente || !cliente.nombre_completo || !cliente.telefono_whatsapp) {
      return NextResponse.json(
        { success: false, error: 'Datos del cliente incompletos (nombre y teléfono requeridos)' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe agregar al menos una fragancia al pedido' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // 1. Buscar o crear cliente
    let clienteId: string;
    const cleanPhone = cliente.telefono_whatsapp.toString().replace(/\D/g, '');

    const existingClient = await client.query(
      'SELECT id FROM public.clientes WHERE telefono_whatsapp = $1 LIMIT 1',
      [cleanPhone]
    );

    if (existingClient.rowCount && existingClient.rowCount > 0) {
      clienteId = existingClient.rows[0].id;
      // Actualizar datos de dirección si cambiaron
      await client.query(
        `UPDATE public.clientes 
         SET nombre_completo = $1, direccion_entrega = $2, departamento = $3, municipio = $4, punto_referencia = $5, updated_at = NOW()
         WHERE id = $6`,
        [
          cliente.nombre_completo.trim(),
          cliente.direccion_entrega?.trim() || '',
          cliente.departamento?.trim() || '',
          cliente.municipio?.trim() || '',
          cliente.punto_referencia?.trim() || '',
          clienteId,
        ]
      );
    } else {
      const newClient = await client.query(
        `INSERT INTO public.clientes (nombre_completo, telefono_whatsapp, direccion_entrega, departamento, municipio, punto_referencia)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          cliente.nombre_completo.trim(),
          cleanPhone,
          cliente.direccion_entrega?.trim() || '',
          cliente.departamento?.trim() || '',
          cliente.municipio?.trim() || '',
          cliente.punto_referencia?.trim() || '',
        ]
      );
      clienteId = newClient.rows[0].id;
    }

    // 2. Generar número de pedido único KOD-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const numeroPedido = `KOD-${dateStr}-${randomSuffix}`;

    // 3. Calcular montos
    let subtotal = 0;
    for (const it of items) {
      const cant = Math.max(1, parseInt(it.cantidad, 10) || 1);
      const precio = parseFloat(it.precio_unitario) || 20.0;
      subtotal += cant * precio;
    }
    const envio = parseFloat(costo_envio) || 0;
    const total = subtotal + envio;

    // 4. Crear el pedido (Estado inicial: PENDIENTE_COMPRA / ROJO)
    const newOrderRes = await client.query(
      `INSERT INTO public.pedidos (
        numero_pedido, cliente_id, vendedora_id, estado, tipo_pago, estado_pago, subtotal, costo_envio, total, notas
      ) VALUES ($1, $2, $3, 'PENDIENTE_COMPRA', $4, $5, $6, $7, $8, $9)
      RETURNING id, numero_pedido, estado`,
      [
        numeroPedido,
        clienteId,
        vendedora_id || null,
        tipo_pago || 'CONTRAENTREGA',
        estado_pago,
        subtotal,
        envio,
        total,
        notas,
      ]
    );

    const pedidoId = newOrderRes.rows[0].id;

    // 5. Insertar items del pedido
    for (const it of items) {
      const cant = Math.max(1, parseInt(it.cantidad, 10) || 1);
      const precio = parseFloat(it.precio_unitario) || 20.0;
      const itemSubtotal = cant * precio;
      const version = it.version === 'EXTRA_SHOT' ? 'EXTRA_SHOT' : 'NORMAL';

      await client.query(
        `INSERT INTO public.pedido_items (
          pedido_id, catalogo_id, version, cantidad, precio_unitario, subtotal, insumo_comprado
        ) VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
        [pedidoId, it.catalogo_id, version, cant, precio, itemSubtotal]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Pedido registrado con éxito en estado PENDIENTE_COMPRA',
      pedido: {
        id: pedidoId,
        numero_pedido: numeroPedido,
        estado: 'PENDIENTE_COMPRA',
        total,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating KODE order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
