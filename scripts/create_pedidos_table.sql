-- scripts/create_pedidos_table.sql
-- Tabla depurada para KODE en PostgreSQL (Supabase)
-- Elimina redundancias de AppSheet (50 columnas -> 25 columnas de núcleo operativo)

CREATE TABLE IF NOT EXISTS public.pedidos (
    -- 1. IDENTIFICACIÓN Y TIEMPOS
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido           VARCHAR(50) UNIQUE NOT NULL,
    fecha_pedido            DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    -- 2. CLIENTE Y ENTREGA
    cliente_id              UUID NOT NULL REFERENCES public.clientes(id),
    direccion_entrega       TEXT NOT NULL DEFAULT '',
    departamento_id         INT REFERENCES public.departamentos(id),
    municipio_id            INT REFERENCES public.municipios(id_municipio),
    punto_referencia        TEXT,
    notas_entrega           TEXT,
    notas                   TEXT,

    -- 3. ESTADOS OPERATIVOS
    -- 'Registrado': Cuando el pedido recién está ingresado
    -- 'Insumos comprados': Cuando en el detalle de pedido ya se marcaron los perfumes como comprados
    -- 'Preparado': Cuando el perfume ya fue envasado/preparado (listo para envío)
    -- 'Enviado': Cuando se le genera la guía al pedido (C807 Express)
    -- 'Entregado': Cuando el Webhook de C807 nos confirma que se entregó el pedido
    -- 'Cancelado': Pedidos cancelados
    estado                  VARCHAR(30) NOT NULL DEFAULT 'Registrado',

    -- 4. VALORES FINANCIEROS Y PAGO
    tipo_pago               VARCHAR(30) NOT NULL DEFAULT 'CONTRAENTREGA', -- 'CONTRAENTREGA', 'TRANSFERENCIA', 'TARJETA'
    estado_pago             VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',     -- 'PENDIENTE', 'PAGADO'
    subtotal                DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    descuento               DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    costo_envio             DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total                   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    monto_cobrar_cce        DECIMAL(10, 2) NOT NULL DEFAULT 0.00,         -- Monto a cobrar por C807 en contraentrega

    -- 5. LOGÍSTICA C807 EXPRESS
    proveedor_envio         VARCHAR(50) DEFAULT 'C807 Express',
    c807_guia_numero        VARCHAR(100),
    c807_link_rastreo       TEXT,
    c807_estado             VARCHAR(100) DEFAULT 'Pendiente',
    c807_fecha_guia         TIMESTAMPTZ,

    -- 6. FACTURACIÓN ELECTRÓNICA DTE (FACTURA LLAMA)
    dte_estado              VARCHAR(30) DEFAULT 'PENDIENTE',             -- 'PENDIENTE', 'PROCESADO', 'RECHAZADO', 'ANULADO'
    dte_id                  UUID,
    dte_codigo_generacion   VARCHAR(100),
    dte_numero_control      VARCHAR(100),
    dte_sello_recepcion     VARCHAR(100),
    dte_pdf_url             TEXT,
    dte_json_url            TEXT,
    dte_fecha_emision       TIMESTAMPTZ,

    -- 7. VENDEDORA / ASESOR
    vendedora_id            UUID REFERENCES public.usuarios(id),
    comision_vendedora      DECIMAL(10, 2) DEFAULT 0.00
);

-- Migración segura para tablas existentes (agrega columnas faltantes si ya fue creada)
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS fecha_pedido DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS departamento_id INT REFERENCES public.departamentos(id);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS municipio_id INT REFERENCES public.municipios(id_municipio);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS direccion_entrega TEXT DEFAULT '';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS punto_referencia TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS notas_entrega TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS descuento DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS monto_cobrar_cce DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS proveedor_envio VARCHAR(50) DEFAULT 'C807 Express';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS c807_guia_numero VARCHAR(100);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS c807_link_rastreo TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS c807_estado VARCHAR(100) DEFAULT 'Pendiente';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS c807_fecha_guia TIMESTAMPTZ;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_estado VARCHAR(30) DEFAULT 'PENDIENTE';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_id UUID;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_codigo_generacion VARCHAR(100);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_numero_control VARCHAR(100);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_sello_recepcion VARCHAR(100);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_pdf_url TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_json_url TEXT;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS dte_fecha_emision TIMESTAMPTZ;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS comision_vendedora DECIMAL(10, 2) DEFAULT 0.00;

-- Índices de alto rendimiento para búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON public.pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedora_id ON public.pedidos(vendedora_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_c807_guia ON public.pedidos(c807_guia_numero);
CREATE INDEX IF NOT EXISTS idx_pedidos_dte_codigo ON public.pedidos(dte_codigo_generacion);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON public.pedidos(created_at DESC);

-- TABLA HIJA: DETALLE DE PERFUMES (ITEMS)
CREATE TABLE IF NOT EXISTS public.pedido_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id               UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    catalogo_id             UUID NOT NULL REFERENCES public.catalogo(id),
    version                 VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'EXTRA_SHOT'
    cantidad                INT NOT NULL DEFAULT 1,
    precio_unitario         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal                DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    insumo_comprado         BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_compra_insumo     TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON public.pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_catalogo_id ON public.pedido_items(catalogo_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_insumo_comprado ON public.pedido_items(insumo_comprado);
