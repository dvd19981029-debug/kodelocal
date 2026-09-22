-- Script para creación e inserción de los 14 departamentos de El Salvador
-- con IDs oficiales de BD KODE (2 al 15) para relación con Municipios,
-- y soporte dual para C807 Express (cod_depto) y Ministerio de Hacienda / DTE (depto_mh)

CREATE TABLE IF NOT EXISTS public.departamentos (
    id INT PRIMARY KEY,
    nombre_depto VARCHAR(50) NOT NULL UNIQUE,
    cod_depto VARCHAR(5) NOT NULL UNIQUE, -- Código de 3 letras para C807 Express
    depto_mh VARCHAR(2) NOT NULL UNIQUE,  -- Código de 2 dígitos oficial MH
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departamentos_nombre ON public.departamentos(nombre_depto);
CREATE INDEX IF NOT EXISTS idx_departamentos_c807 ON public.departamentos(cod_depto);
CREATE INDEX IF NOT EXISTS idx_departamentos_mh ON public.departamentos(depto_mh);

INSERT INTO public.departamentos (id, nombre_depto, cod_depto, depto_mh) VALUES
(2, 'Ahuachapán', 'AHU', '01'),
(3, 'Cabañas', 'CAB', '09'),
(4, 'Chalatenango', 'CHA', '04'),
(5, 'Cuscatlán', 'CUS', '07'),
(6, 'La Libertad', 'LIB', '05'),
(7, 'La Paz', 'PAZ', '08'),
(8, 'La Unión', 'UNI', '14'),
(9, 'Morazán', 'MOR', '13'),
(10, 'San Miguel', 'MIG', '12'),
(11, 'San Salvador', 'SLV', '06'),
(12, 'San Vicente', 'VIC', '10'),
(13, 'Santa Ana', 'ANA', '02'),
(14, 'Sonsonate', 'SON', '03'),
(15, 'Usulután', 'USU', '11')
ON CONFLICT (id) DO UPDATE 
SET nombre_depto = EXCLUDED.nombre_depto,
    cod_depto = EXCLUDED.cod_depto, 
    depto_mh = EXCLUDED.depto_mh;
