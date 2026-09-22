-- scripts/create_detalle_pedido_table.sql
-- Tabla depurada para KODE en PostgreSQL (Supabase): public.pedido_items (Detalle Pedido)
-- Depuración de AppSheet: 20 columnas originales reducidas a 10 columnas núcleo operativas.
--
-- Explicación de depuración de columnas de AppSheet:
-- 1. _RowNumber            -> Eliminada (Innecesaria en PostgreSQL relacional).
-- 2. ID_Detalle            -> Renombrada a id UUID PRIMARY KEY DEFAULT gen_random_uuid().
-- 3. ID Pedido             -> Renombrada a pedido_id UUID REFERENCES public.pedidos(id).
-- 4. Fecha Registro        -> Renombrada a created_at TIMESTAMPTZ DEFAULT NOW().
-- 5. Kodigo                -> catalogo_id UUID REFERENCES public.catalogo(id).
-- 6. Precio                -> precio_unitario DECIMAL(10,2) NOT NULL.
-- 7. Usuario               -> usuario VARCHAR(100) (nombre/email de quien registró el ítem).
-- 8. Estado                -> insumo_comprado BOOLEAN DEFAULT FALSE (trazabilidad de insumos).
-- 9. Version               -> version VARCHAR(20) DEFAULT 'Normal' ('Normal' o 'Plus').
-- 10. Estado Pedido        -> Eliminada (Virtual, se obtiene con JOIN public.pedidos).
-- 11. Precio sin IVA       -> Eliminada (Virtual, calculada como ROUND(precio / 1.13, 4) al emitir DTE).
-- 12. IVA Producto         -> Eliminada (Virtual, cálculo tributario derivado).
-- 13. Precio Con IVA final -> Eliminada (Virtual, se gestiona con descuentos en la orden).
-- 14. Precio sin IVA Final -> Eliminada (Virtual, cálculo tributario derivado).
-- 15. IVA Hacienda         -> Eliminada (Virtual, cálculo tributario derivado).
-- 16. Precio Final IVA Inc -> Eliminada (Virtual, redundante con subtotal).
-- 17. Fragancia            -> Eliminada (Virtual, se obtiene con JOIN public.catalogo).
-- 18. Nombre MH            -> Eliminada (Virtual, construida en /api/kode/dte para Factura Llama).
-- 19. Version Kodigo       -> Eliminada (Virtual, se infiere del campo version).
-- 20. Inv Fisico           -> Eliminada (Virtual, consulta en tiempo real al inventario físico en bodega).

CREATE TABLE IF NOT EXISTS public.pedido_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id               UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    catalogo_id             UUID NOT NULL REFERENCES public.catalogo(id),
    version                 VARCHAR(20) NOT NULL DEFAULT 'Normal', -- 'Normal', 'Plus'
    cantidad                INT NOT NULL DEFAULT 1,
    precio_unitario         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal                DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    insumo_comprado         BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_compra_insumo     TIMESTAMPTZ,
    comprado_por            VARCHAR(100),
    usuario                 VARCHAR(100),                         -- Asesor/Vendedora que registró el item
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Migraciones seguras para columnas si ya existe la tabla
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT 'Normal';
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS comprado_por VARCHAR(100);
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS usuario VARCHAR(100);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON public.pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_catalogo_id ON public.pedido_items(catalogo_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_insumo_comprado ON public.pedido_items(insumo_comprado);
CREATE INDEX IF NOT EXISTS idx_pedido_items_version ON public.pedido_items(version);
