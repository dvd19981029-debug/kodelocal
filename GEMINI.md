# Reglas del Proyecto KÖDE

## Base de Datos y Creación de Columnas en Tablas SQL
- **Regla Fundamental:** Cada vez que el usuario solicite crear, mostrar o consultar una columna en tablas de la base de datos o en la interfaz (como en `pedidos`, `clientes`, `catalogo`, etc.), es **obligatorio validar si la columna existe en PostgreSQL**.
- **Acción Inmediata si no existe:** Si la columna no existe o es nueva, se debe agregar inmediatamente mediante DDL seguro (`ALTER TABLE public.<tabla> ADD COLUMN IF NOT EXISTS <columna> <tipo>;`).
- **Prevención de Errores 500:** Las consultas `SELECT` nunca deben asumir que una columna recién agregada ya existe en producción sin antes haber ejecutado o garantizado su migración automática en el arranque del endpoint (tanto en métodos `GET` como `POST`).
