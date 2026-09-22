import psycopg2
from psycopg2.extras import RealDictCursor

conn_str = 'postgresql://postgres.opvibkjnzmglxvijoufe:KodeSales2026!SecureDb@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
conn = psycopg2.connect(conn_str, sslmode='require')
cur = conn.cursor(cursor_factory=RealDictCursor)

print("Asegurando columnas de comisiones en public.usuarios...")
cur.execute("""
    ALTER TABLE public.usuarios 
    ADD COLUMN IF NOT EXISTS comision_porcentaje DECIMAL(5, 2) DEFAULT 5.00,
    ADD COLUMN IF NOT EXISTS comision_tipo VARCHAR(20) DEFAULT 'PORCENTAJE';

    -- Actualizar usuarios existentes a 5.00% si no tienen porcentaje
    UPDATE public.usuarios 
    SET comision_porcentaje = 5.00 
    WHERE comision_porcentaje IS NULL;
""")
conn.commit()

cur.execute("SELECT id, nombre, rol, comision_porcentaje, activo FROM public.usuarios")
users = cur.fetchall()
print(f"Usuarios actualizados ({len(users)}):")
for u in users:
    print(f" - {u['nombre']} ({u['rol']}): {u['comision_porcentaje']}%")

cur.close()
conn.close()
print("¡Migración exitosa!")
