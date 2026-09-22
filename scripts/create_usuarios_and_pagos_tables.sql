-- scripts/create_usuarios_and_pagos_tables.sql
-- Actualización para KÖDE en Supabase / PostgreSQL:
-- 1. Usuarios / Empleados con Credenciales de Acceso y Datos Fiscales para Factura Sujeto Excluido (DTE-14 de Factura Llama)
-- 2. Formas de Pago y Registro de Pagos / Abonos

-- 1. TABLA USUARIOS / EMPLEADOS (Asesoras, Operarios, Supervisores)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre                  VARCHAR(150) NOT NULL,
    email                   VARCHAR(150) UNIQUE NOT NULL,
    username                VARCHAR(100) UNIQUE,
    password                VARCHAR(255),
    telefono                VARCHAR(50),
    rol                     VARCHAR(50) DEFAULT 'VENDEDORA',
    doc_tipo                VARCHAR(20) DEFAULT 'DUI',
    doc_numero              VARCHAR(30),
    departamento_mh         VARCHAR(10) DEFAULT '06',
    municipio_mh            VARCHAR(10) DEFAULT '14',
    direccion_complemento   TEXT,
    actividad_economica     VARCHAR(20) DEFAULT '82990',
    comision_normal         DECIMAL(10, 2) DEFAULT 1.00,
    comision_plus           DECIMAL(10, 2) DEFAULT 1.50,
    activo                  BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Migraciones seguras para columnas si ya existe
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
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'VENDEDORA';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- 2. TABLA FORMAS DE PAGO (Catálogo Maestro)
CREATE TABLE IF NOT EXISTS public.formas_pago (
    id                      VARCHAR(50) PRIMARY KEY,
    nombre                  VARCHAR(150) NOT NULL,
    tipo                    VARCHAR(50) DEFAULT 'BANCO', -- BANCO, EFECTIVO, CONTRA_ENTREGA, PASARELA, AJUSTE
    activo                  BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Sembrar catálogo oficial de 15 formas de pago de Google Sheets
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
ON CONFLICT (id) DO NOTHING;

-- 3. TABLA PAGOS / ABONOS (Transaccional)
CREATE TABLE IF NOT EXISTS public.pagos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id               UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    cliente_id              UUID REFERENCES public.clientes(id),
    forma_pago_id           VARCHAR(50) REFERENCES public.formas_pago(id),
    monto                   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    fecha_pago              DATE NOT NULL DEFAULT CURRENT_DATE,
    num_documento_auto      VARCHAR(100), -- Referencia bancaria o autorización
    estado_pago             VARCHAR(30) DEFAULT 'Confirmado', -- Confirmado, Pendiente, Anulado
    usuario                 VARCHAR(100), -- Asesora que registró el pago
    observaciones           TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_pedido_id ON public.pagos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagos_forma_pago ON public.pagos(forma_pago_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha_pago DESC);
