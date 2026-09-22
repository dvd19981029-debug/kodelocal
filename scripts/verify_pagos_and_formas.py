import psycopg2
from psycopg2.extras import RealDictCursor

conn_str = 'postgresql://postgres.opvibkjnzmglxvijoufe:KodeSales2026!SecureDb@aws-0-us-west-2.pooler.supabase.com:6543/postgres'

print("Conectando a la base de datos Supabase KODE...")
conn = psycopg2.connect(conn_str, sslmode='require')
cur = conn.cursor(cursor_factory=RealDictCursor)

# 1. Asegurar tabla formas_pago
print("\n--- 1. Verificando tabla formas_pago ---")
cur.execute("""
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
""")
conn.commit()

cur.execute("SELECT id, nombre, tipo, activo FROM public.formas_pago ORDER BY id")
formas = cur.fetchall()
print(f"Total formas de pago registradas: {len(formas)}")
for fp in formas:
    print(f" - [{fp['id']}] {fp['nombre']} ({fp['tipo']})")

# 2. Asegurar tabla pagos
print("\n--- 2. Verificando tabla pagos ---")
cur.execute("""
    CREATE TABLE IF NOT EXISTS public.pagos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
        cliente_id UUID REFERENCES public.clientes(id),
        forma_pago_id VARCHAR(50) REFERENCES public.formas_pago(id),
        monto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
        num_documento_auto VARCHAR(100),
        estado_pago VARCHAR(30) DEFAULT 'Confirmado',
        usuario VARCHAR(100),
        observaciones TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_pagos_pedido_id ON public.pagos(pedido_id);
    CREATE INDEX IF NOT EXISTS idx_pagos_forma_pago ON public.pagos(forma_pago_id);
    CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha_pago DESC);
""")
conn.commit()

# 3. Asegurar columnas en pedidos
print("\n--- 3. Verificando columnas en pedidos ---")
cur.execute("""
    ALTER TABLE public.pedidos 
    ADD COLUMN IF NOT EXISTS monto_cobrar_cce DECIMAL(10, 2) DEFAULT 0.00;
""")
conn.commit()
print("Columnas en public.pedidos verificadas.")

# 4. Verificar pedidos y pagos asociados
cur.execute("""
    SELECT 
        p.id, 
        p.numero_pedido, 
        p.total, 
        p.estado_pago,
        p.monto_cobrar_cce,
        COALESCE((SELECT SUM(pg.monto) FROM public.pagos pg WHERE pg.pedido_id = p.id), 0) AS total_pagado,
        (SELECT COUNT(*) FROM public.pagos pg WHERE pg.pedido_id = p.id) AS cant_pagos
    FROM public.pedidos p
    ORDER BY p.created_at DESC
    LIMIT 5
""")
pedidos = cur.fetchall()
print(f"\nÚltimos {len(pedidos)} pedidos:")
for ped in pedidos:
    print(f"Pedido {ped['numero_pedido']}: Total=${ped['total']}, Pagado=${ped['total_pagado']}, Saldo CCE=${ped['monto_cobrar_cce']}, EstadoPago={ped['estado_pago']}, CantPagos={ped['cant_pagos']}")

cur.close()
conn.close()
print("\n¡Verificación de Base de Datos completada con éxito!")
