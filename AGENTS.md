<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del Proyecto KÖDE

## Base de Datos y Creación de Columnas en Tablas SQL
- **Diccionario de Datos Obligatorio:** Antes de consultar, crear o modificar cualquier columna o relación en la base de datos o en la UI, es **estrictamente obligatorio consultar [docs/DATABASE_DATA_DICTIONARY.md](docs/DATABASE_DATA_DICTIONARY.md)** como la única fuente de la verdad para nombres exactos, tipos y llaves foráneas.
- **Regla Fundamental:** Cada vez que el usuario solicite crear, mostrar o consultar una columna en tablas de la base de datos o en la interfaz (como en `pedidos`, `clientes`, `catalogo`, etc.), es **obligatorio validar si la columna existe en PostgreSQL**.
- **Acción Inmediata si no existe:** Si la columna no existe o es nueva, se debe agregar inmediatamente mediante DDL seguro (`ALTER TABLE public.<tabla> ADD COLUMN IF NOT EXISTS <columna> <tipo>;`) y registrarla de inmediato en `docs/DATABASE_DATA_DICTIONARY.md`.
- **Prevención de Errores 500:** Las consultas `SELECT` nunca deben asumir que una columna recién agregada ya existe en producción sin antes haber ejecutado o garantizado su migración automática en el arranque del endpoint (tanto en métodos `GET` como `POST`).

