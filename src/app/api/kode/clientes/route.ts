import { NextResponse } from 'next/server';
import { queryKode } from '@/lib/kodeDb';

export const dynamic = 'force-dynamic';

async function ensureClientesTable() {
  try {
    await queryKode(`
      CREATE TABLE IF NOT EXISTS public.clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre_completo VARCHAR(200) NOT NULL,
        telefono_whatsapp VARCHAR(50) NOT NULL,
        direccion_entrega TEXT NOT NULL,
        departamento VARCHAR(100) NOT NULL,
        municipio VARCHAR(100) NOT NULL,
        punto_referencia TEXT,
        tipo_documento VARCHAR(50) DEFAULT 'DUI',
        numero_documento VARCHAR(50),
        email VARCHAR(150),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(50) DEFAULT 'DUI';
      ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS numero_documento VARCHAR(50);
      ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email VARCHAR(150);
    `);
  } catch (err) {
    console.error('Error ensuring clientes table:', err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    let sql = `
      SELECT 
        c.id,
        c.nombre_completo,
        c.telefono_whatsapp,
        c.direccion_entrega,
        c.departamento,
        c.municipio,
        c.punto_referencia,
        c.tipo_documento,
        c.numero_documento,
        c.email,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT p.id) AS pedidos_count,
        COALESCE(SUM(p.total), 0)::float AS total_gastado
      FROM public.clientes c
      LEFT JOIN public.pedidos p ON p.cliente_id = c.id
    `;

    const params: any[] = [];
    if (q && q.trim()) {
      sql += ` WHERE (
        c.nombre_completo ILIKE $1 
        OR c.telefono_whatsapp ILIKE $1 
        OR c.municipio ILIKE $1 
        OR c.departamento ILIKE $1
        OR c.numero_documento ILIKE $1
        OR c.email ILIKE $1
      )`;
      params.push(`%${q.trim()}%`);
    }

    sql += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const res = await queryKode(sql, params);
    return NextResponse.json({ success: true, clientes: res.rows });
  } catch (error: any) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Soporte nativo tanto para payload directo de KÖDE como para Webhooks/integraciones de Chatwoot & Meta
    const cwContact = body?.contact || body?.meta?.sender || body?.sender || {};
    const cwAttrs = body?.custom_attributes || cwContact?.custom_attributes || {};

    const rawNombre =
      body.nombre_completo ||
      body.nombre ||
      body.name ||
      cwContact.name ||
      '';

    const rawTelefono =
      body.telefono_whatsapp ||
      body.telefono ||
      body.phone_number ||
      body.phone ||
      cwContact.phone_number ||
      '';

    const rawDireccion =
      body.direccion_entrega ||
      body.direccion ||
      cwAttrs.direccion_entrega ||
      cwAttrs.direccion ||
      '';

    const rawDepto =
      body.departamento ||
      cwAttrs.departamento ||
      '';

    const rawMuni =
      body.municipio ||
      cwAttrs.municipio ||
      '';

    const rawRef =
      body.punto_referencia ||
      cwAttrs.punto_referencia ||
      null;

    const rawTipoDoc =
      body.tipo_documento ||
      cwAttrs.tipo_documento ||
      'DUI';

    const rawNumDoc =
      body.numero_documento ||
      body.documento ||
      cwAttrs.numero_documento ||
      null;

    const rawEmail =
      body.email ||
      body.correo ||
      cwContact.email ||
      null;

    const isChatwootOrExternal = Boolean(
      body.name ||
      body.phone_number ||
      body.contact ||
      body.meta?.sender ||
      body.origen === 'chatwoot' ||
      body.source === 'chatwoot' ||
      request.headers.get('x-api-key') ||
      new URL(request.url).searchParams.get('api_key')
    );

    if (!rawNombre?.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre completo es requerido' }, { status: 400 });
    }
    if (!rawTelefono?.trim()) {
      return NextResponse.json({ success: false, error: 'El teléfono WhatsApp es requerido' }, { status: 400 });
    }

    if (!isChatwootOrExternal) {
      if (!rawDepto?.trim()) {
        return NextResponse.json({ success: false, error: 'El departamento es requerido y no puede estar vacío' }, { status: 400 });
      }
      if (!rawMuni?.trim()) {
        return NextResponse.json({ success: false, error: 'El municipio es requerido y no puede estar vacío' }, { status: 400 });
      }
      if (!rawDireccion?.trim()) {
        return NextResponse.json({ success: false, error: 'La dirección de entrega es requerida y no puede estar vacía' }, { status: 400 });
      }
    }

    // Normalizar teléfono salvadoreño (si viene con +50371234567 de Meta/Chatwoot, dejar los 8 dígitos locales)
    let cleanTel = String(rawTelefono).trim().replace(/\D/g, '');
    if (cleanTel.length === 11 && cleanTel.startsWith('503')) {
      cleanTel = cleanTel.slice(3);
    }

    const cleanNombre = String(rawNombre).trim();
    const cleanDepto = String(rawDepto || '').trim() || 'San Salvador';
    const cleanMuni = String(rawMuni || '').trim() || 'San Salvador';
    const cleanDireccion = String(rawDireccion || '').trim() || 'Pendiente confirmar dirección (Meta / Chatwoot)';
    const cleanTipoDoc = String(rawTipoDoc || 'DUI').trim() || 'DUI';
    const cleanNumDoc = rawNumDoc ? String(rawNumDoc).trim() : null;
    const cleanEmail = rawEmail ? String(rawEmail).trim() : null;
    const cleanRef = rawRef ? String(rawRef).trim() : null;

    // Verificar si ya existe cliente con este teléfono
    const existing = await queryKode(
      `SELECT * FROM public.clientes WHERE telefono_whatsapp = $1 LIMIT 1`,
      [cleanTel]
    );

    let cliente;
    if (existing.rowCount && existing.rowCount > 0) {
      const prev = existing.rows[0];
      const updateRes = await queryKode(
        `UPDATE public.clientes 
         SET nombre_completo = $1,
             direccion_entrega = $2,
             departamento = $3,
             municipio = $4,
             punto_referencia = $5,
             tipo_documento = $6,
             numero_documento = $7,
             email = $8,
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          cleanNombre || prev.nombre_completo,
          rawDireccion?.trim() ? cleanDireccion : prev.direccion_entrega,
          rawDepto?.trim() ? cleanDepto : prev.departamento,
          rawMuni?.trim() ? cleanMuni : prev.municipio,
          cleanRef ?? prev.punto_referencia,
          cleanTipoDoc || prev.tipo_documento,
          cleanNumDoc ?? prev.numero_documento,
          cleanEmail ?? prev.email,
          prev.id,
        ]
      );
      cliente = updateRes.rows[0];
    } else {
      const insertRes = await queryKode(
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
        RETURNING *`,
        [
          cleanNombre,
          cleanTel,
          cleanDireccion,
          cleanDepto,
          cleanMuni,
          cleanRef,
          cleanTipoDoc,
          cleanNumDoc,
          cleanEmail,
        ]
      );
      cliente = insertRes.rows[0];
    }

    return NextResponse.json({
      success: true,
      cliente,
      message: 'Cliente guardado exitosamente',
    });
  } catch (error: any) {
    console.error('Error saving cliente:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
