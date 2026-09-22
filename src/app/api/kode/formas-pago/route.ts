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

export async function GET() {
  try {
    await ensureFormasPagoTable();

    const res = await queryKode(
      `SELECT id, nombre, tipo, activo 
       FROM public.formas_pago 
       WHERE activo = TRUE 
       ORDER BY 
         CASE 
           WHEN id = '1003' THEN 1 -- Contra Entrega primero
           WHEN id = '1001' THEN 2 -- BAC
           WHEN id = '1002' THEN 3 -- Agrícola
           WHEN id = '1004' THEN 4 -- Efectivo
           WHEN id = '1006' THEN 5 -- Wompi
           ELSE 6 
         END,
         nombre ASC`
    );

    return NextResponse.json({ success: true, formasPago: res.rows });
  } catch (error: any) {
    console.error('Error fetching formas de pago:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
