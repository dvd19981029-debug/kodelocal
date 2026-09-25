import { NextResponse } from 'next/server';
import { queryKode, kodePool } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensurePedidosSchema();
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
        p.monto_cobrar_cce,
        COALESCE((SELECT SUM(pg.monto) FROM public.pagos pg WHERE pg.pedido_id = p.id AND (pg.forma_pago_id != '1003' OR pg.estado_pago = 'Confirmado')), 0)::float AS total_pagado,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pg.id,
                'monto', pg.monto,
                'fecha_pago', pg.fecha_pago,
                'forma_pago_id', pg.forma_pago_id,
                'forma_pago_nombre', fp.nombre,
                'num_documento_auto', pg.num_documento_auto,
                'comprobante_url', pg.comprobante_url,
                'estado_pago', pg.estado_pago,
                'usuario', pg.usuario
              ) ORDER BY pg.created_at ASC
            )
            FROM public.pagos pg
            LEFT JOIN public.formas_pago fp ON pg.forma_pago_id = fp.id
            WHERE pg.pedido_id = p.id
          ), '[]'::json
        ) AS pagos,
        p.c807_guia_numero,
        p.c807_link_rastreo,
        p.c807_estado,
        p.c807_fecha_guia,
        p.dte_estado,
        p.dte_codigo_generacion,
        p.dte_numero_control,
        p.dte_pdf_url,
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
        c.tipo_documento AS cliente_tipo_documento,
        c.numero_documento AS cliente_numero_documento,
        c.email AS cliente_email,
        u.id AS vendedora_id,
        u.nombre AS vendedora_nombre,
        u.email AS vendedora_email,
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
      if (estado === 'Registrado' || estado === 'PENDIENTE_COMPRA') {
        sql += ` AND (p.estado = 'Registrado' OR p.estado = 'PENDIENTE_COMPRA')`;
      } else if (estado === 'Insumos comprados' || estado === 'Preparado' || estado === 'PENDIENTE_PREPARAR') {
        sql += ` AND (p.estado = 'Insumos comprados' OR p.estado = 'Preparado' OR p.estado = 'PENDIENTE_PREPARAR')`;
      } else if (estado === 'Enviado' || estado === 'GUIA_CREADA') {
        sql += ` AND (p.estado = 'Enviado' OR p.estado = 'GUIA_CREADA')`;
      } else if (estado === 'Entregado' || estado === 'ENTREGADO') {
        sql += ` AND (p.estado = 'Entregado' OR p.estado = 'ENTREGADO')`;
      } else if (estado === 'Cancelado' || estado === 'CANCELADO') {
        sql += ` AND (p.estado = 'Cancelado' OR p.estado = 'CANCELADO')`;
      } else {
        params.push(estado);
        sql += ` AND p.estado = $${params.length}`;
      }
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

let schemaEnsured = false;
async function ensurePedidosSchema() {
  if (schemaEnsured) return;
  try {
    await queryKode(`
      ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS usuario VARCHAR(100);
      ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT 'Normal';
      ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS comprado_por VARCHAR(100);
      ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS monto_cobrar_cce NUMERIC;
      ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_estado VARCHAR(30) DEFAULT 'PENDIENTE';
      ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_codigo_generacion VARCHAR(100);
      ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_numero_control VARCHAR(100);
      ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_pdf_url TEXT;
      ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS comprobante_url TEXT;

      UPDATE public.pedidos
      SET c807_link_rastreo = 'https://c807xpress.com/tracking/?guia=' || c807_guia_numero
      WHERE c807_guia_numero IS NOT NULL 
        AND c807_guia_numero != ''
        AND (c807_link_rastreo IS NULL OR c807_link_rastreo LIKE '%app.c807.com%');
    `);
    schemaEnsured = true;
  } catch (e) {
    console.error('Error ensuring pedidos schema:', e);
  }
}

export async function POST(request: Request) {
  await ensurePedidosSchema();
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

    const clientName = cliente?.nombre_completo || cliente?.nombre || '';
    const clientPhone = cliente?.telefono_whatsapp || cliente?.telefono || '';
    const clientAddress = cliente?.direccion_entrega || cliente?.direccion || '';
    const clientDepto = cliente?.departamento || '';
    const clientMuni = cliente?.municipio || '';
    const clientRef = cliente?.punto_referencia || cliente?.referencia || '';
    const clientTipoDoc = cliente?.tipo_documento || 'DUI';
    const clientNumDoc = cliente?.numero_documento || null;
    const clientEmail = cliente?.email || null;

    if (!clientName.trim() || !clientPhone.toString().trim()) {
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
    const cleanPhone = clientPhone.toString().replace(/\D/g, '');

    const existingClient = await client.query(
      'SELECT id FROM public.clientes WHERE telefono_whatsapp = $1 LIMIT 1',
      [cleanPhone]
    );

    if (existingClient.rowCount && existingClient.rowCount > 0) {
      clienteId = existingClient.rows[0].id;
      // Actualizar datos de dirección si cambiaron
      await client.query(
        `UPDATE public.clientes 
         SET nombre_completo = $1,
             direccion_entrega = $2,
             departamento = $3,
             municipio = $4,
             punto_referencia = $5,
             tipo_documento = COALESCE($6, tipo_documento),
             numero_documento = COALESCE($7, numero_documento),
             email = COALESCE($8, email),
             updated_at = NOW()
         WHERE id = $9`,
        [
          clientName.trim(),
          clientAddress.trim(),
          clientDepto.trim(),
          clientMuni.trim(),
          clientRef.trim() || null,
          clientTipoDoc ? clientTipoDoc.trim() : null,
          clientNumDoc ? clientNumDoc.trim() : null,
          clientEmail ? clientEmail.trim() : null,
          clienteId,
        ]
      );
    } else {
      const newClient = await client.query(
        `INSERT INTO public.clientes (
          nombre_completo,
          telefono_whatsapp,
          direccion_entrega,
          departamento,
          municipio,
          punto_referencia,
          tipo_documento,
          numero_documento,
          email,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id`,
        [
          clientName.trim(),
          cleanPhone,
          clientAddress.trim(),
          clientDepto.trim(),
          clientMuni.trim(),
          clientRef.trim() || null,
          clientTipoDoc ? clientTipoDoc.trim() : 'DUI',
          clientNumDoc ? clientNumDoc.trim() : null,
          clientEmail ? clientEmail.trim() : null,
        ]
      );
      clienteId = newClient.rows[0].id;
    }

    // 2. Generar número de pedido único KOD-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const numeroPedido = `KOD-${dateStr}-${randomSuffix}`;

    // 3. Calcular montos y formas de pago (soporte para pagos mixtos)
    let subtotal = 0;
    for (const it of items) {
      const cant = Math.max(1, parseInt(it.cantidad, 10) || 1);
      const precio = parseFloat(it.precio_unitario) || 20.0;
      subtotal += cant * precio;
    }
    const descuento = Math.max(0, parseFloat(body.descuento) || 0);
    const envio = parseFloat(costo_envio) || 0;
    const total = Math.max(0, subtotal - descuento) + envio;

    // Procesar lista de pagos (soporte multi-pago / mixto)
    interface PagoInputItem {
      forma_pago_id: string;
      monto: number;
      num_documento_auto?: string;
      comprobante_url?: string;
      observaciones?: string;
      estado_pago?: string;
    }

    let listaPagos: PagoInputItem[] = [];

    if (Array.isArray(body.pagos) && body.pagos.length > 0) {
      listaPagos = body.pagos
        .map((p: any) => ({
          forma_pago_id: String(p.forma_pago_id || '').trim(),
          monto: Math.max(0, parseFloat(p.monto) || 0),
          num_documento_auto: String(p.num_documento_auto || '').trim(),
          comprobante_url: p.comprobante_url ? String(p.comprobante_url).trim() : null,
          observaciones: String(p.observaciones || '').trim(),
          estado_pago: p.estado_pago || (String(p.forma_pago_id) === '1003' ? 'Pendiente' : 'Confirmado'),
        }))
        .filter((p: PagoInputItem) => p.forma_pago_id && p.monto > 0);
    } else {
      // Compatibilidad con formulario previo o simple
      const anticipo = Math.max(0, parseFloat(body.anticipo_monto || body.monto_pagado) || 0);
      if (anticipo > 0 && body.forma_pago_id) {
        listaPagos.push({
          forma_pago_id: body.forma_pago_id,
          monto: anticipo,
          num_documento_auto: (body.num_documento_auto || '').trim(),
          comprobante_url: body.comprobante_url ? String(body.comprobante_url).trim() : null,
          observaciones: 'Anticipo inicial registrado al crear pedido',
          estado_pago: body.forma_pago_id === '1003' ? 'Pendiente' : 'Confirmado',
        });
      }
    }

    // Si aún hay saldo por cubrir y no se definió otra cosa o pago_contraentrega no es false
    const totalPagosActuales = listaPagos.reduce((acc, p) => acc + p.monto, 0);
    const saldoRestante = Math.max(0, total - totalPagosActuales);
    const tieneContraEntrega = listaPagos.some((p) => p.forma_pago_id === '1003');

    if (saldoRestante > 0 && (body.pago_contraentrega !== false || !tieneContraEntrega)) {
      const idx = listaPagos.findIndex((p) => p.forma_pago_id === '1003');
      if (idx >= 0) {
        listaPagos[idx].monto += saldoRestante;
      } else {
        listaPagos.push({
          forma_pago_id: '1003',
          monto: saldoRestante,
          num_documento_auto: '',
          observaciones: 'Cobro contra entrega C807',
          estado_pago: 'Pendiente',
        });
      }
    }

    // Categorizar pagos: anticipados (bancos/efectivo) vs contraentrega
    const pagosAnticipo = listaPagos.filter((p) => p.forma_pago_id !== '1003');
    const pagosContraEntrega = listaPagos.filter((p) => p.forma_pago_id === '1003');

    const totalAnticipo = pagosAnticipo.reduce((acc, p) => acc + p.monto, 0);
    const totalContraEntrega = pagosContraEntrega.reduce((acc, p) => acc + p.monto, 0);
    const montoCobrarCce = totalContraEntrega;

    let finalTipoPago = 'CONTRAENTREGA';
    if (pagosAnticipo.length > 0 && pagosContraEntrega.length > 0) {
      finalTipoPago = 'MIXTO';
    } else if (pagosContraEntrega.length > 0) {
      finalTipoPago = 'CONTRAENTREGA';
    } else if (pagosAnticipo.length > 0) {
      finalTipoPago = tipo_pago || 'TRANSFERENCIA';
    }

    let finalEstadoPago = 'PENDIENTE';
    if (totalAnticipo >= total) {
      finalEstadoPago = 'PAGADO';
    } else if (totalAnticipo > 0) {
      finalEstadoPago = 'PARCIAL';
    } else {
      finalEstadoPago = 'PENDIENTE';
    }

    // 4. Crear el pedido (Estado inicial: Registrado / Rojo)
    const newOrderRes = await client.query(
      `INSERT INTO public.pedidos (
        numero_pedido, cliente_id, vendedora_id, estado, tipo_pago, estado_pago, subtotal, costo_envio, total, monto_cobrar_cce, notas
      ) VALUES ($1, $2, $3, 'Registrado', $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, numero_pedido, estado`,
      [
        numeroPedido,
        clienteId,
        vendedora_id || null,
        finalTipoPago,
        finalEstadoPago,
        subtotal,
        envio,
        total,
        montoCobrarCce,
        notas,
      ]
    );

    const pedidoId = newOrderRes.rows[0].id;

    // 5. Registrar cada uno de los pagos en la tabla public.pagos
    for (const p of listaPagos) {
      await client.query(
        `INSERT INTO public.pagos (
          pedido_id, cliente_id, forma_pago_id, monto, fecha_pago, num_documento_auto, comprobante_url, estado_pago, usuario, observaciones
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9)`,
        [
          pedidoId,
          clienteId,
          p.forma_pago_id,
          p.monto,
          (p.num_documento_auto || '').trim(),
          p.comprobante_url || null,
          p.estado_pago || (p.forma_pago_id === '1003' ? 'Pendiente' : 'Confirmado'),
          vendedora_id || 'KÖDE',
          p.observaciones || (p.forma_pago_id === '1003' ? 'Cobro contra entrega C807' : 'Pago registrado al crear pedido'),
        ]
      );
    }

    // 6. Insertar items del pedido
    for (const it of items) {
      const cant = Math.max(1, parseInt(it.cantidad, 10) || 1);
      const precio = parseFloat(it.precio_unitario) || 20.0;
      const itemSubtotal = cant * precio;
      const version = (it.version === 'Plus' || it.version === 'EXTRA_SHOT') ? 'Plus' : 'Normal';
      const usuario = body.vendedora_id || 'WhatsApp';

      await client.query(
        `INSERT INTO public.pedido_items (
          pedido_id, catalogo_id, version, cantidad, precio_unitario, subtotal, insumo_comprado, usuario
        ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7)`,
        [pedidoId, it.catalogo_id, version, cant, precio, itemSubtotal, usuario]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Pedido registrado con éxito en estado Registrado',
      pedido: {
        id: pedidoId,
        numero_pedido: numeroPedido,
        estado: 'Registrado',
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
