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
    await ensureClientesTable();
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
    await ensureClientesTable();
    const body = await request.json();
    const {
      nombre_completo,
      telefono_whatsapp,
      direccion_entrega,
      departamento,
      municipio,
      punto_referencia,
      tipo_documento,
      numero_documento,
      email,
    } = body;

    if (!nombre_completo?.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre completo es requerido' }, { status: 400 });
    }
    if (!telefono_whatsapp?.trim()) {
      return NextResponse.json({ success: false, error: 'El teléfono WhatsApp es requerido' }, { status: 400 });
    }
    if (!departamento?.trim()) {
      return NextResponse.json({ success: false, error: 'El departamento es requerido y no puede estar vacío' }, { status: 400 });
    }
    if (!municipio?.trim()) {
      return NextResponse.json({ success: false, error: 'El municipio es requerido y no puede estar vacío' }, { status: 400 });
    }
    if (!direccion_entrega?.trim()) {
      return NextResponse.json({ success: false, error: 'La dirección de entrega es requerida y no puede estar vacía' }, { status: 400 });
    }

    const cleanTel = telefono_whatsapp.trim().replace(/\D/g, '');
    const cleanDepto = departamento.trim();
    const cleanMuni = municipio.trim();
    const cleanTipoDoc = tipo_documento?.trim() || 'DUI';
    const cleanNumDoc = numero_documento?.trim() || null;
    const cleanEmail = email?.trim() || null;

    // Verificar si ya existe cliente con este teléfono
    const existing = await queryKode(
      `SELECT id FROM public.clientes WHERE telefono_whatsapp = $1 LIMIT 1`,
      [cleanTel]
    );

    let cliente;
    if (existing.rowCount && existing.rowCount > 0) {
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
          nombre_completo.trim(),
          direccion_entrega.trim(),
          cleanDepto,
          cleanMuni,
          punto_referencia?.trim() || null,
          cleanTipoDoc,
          cleanNumDoc,
          cleanEmail,
          existing.rows[0].id,
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
          nombre_completo.trim(),
          cleanTel,
          direccion_entrega.trim(),
          cleanDepto,
          cleanMuni,
          punto_referencia?.trim() || null,
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
