<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del Proyecto KÖDE

## Base de Datos y Creación de Columnas en Tablas SQL
- **Regla Fundamental:** Cada vez que el usuario solicite crear, mostrar o consultar una columna en tablas de la base de datos o en la interfaz (como en `pedidos`, `clientes`, `catalogo`, etc.), es **obligatorio validar si la columna existe en PostgreSQL**.
- **Acción Inmediata si no existe:** Si la columna no existe o es nueva, se debe agregar inmediatamente mediante DDL seguro (`ALTER TABLE public.<tabla> ADD COLUMN IF NOT EXISTS <columna> <tipo>;`).
- **Prevención de Errores 500:** Las consultas `SELECT` nunca deben asumir que una columna recién agregada ya existe en producción sin antes haber ejecutado o garantizado su migración automática en el arranque del endpoint (tanto en métodos `GET` como `POST`).

## Enfoque Estricto y Tiempos de Respuesta Rápidos
- **Alcance Único (Single-Task Focus):** Trabajar única y exclusivamente en la tarea o duda puntual que el usuario solicitó en su mensaje. Queda prohibido iniciar tareas secundarias, refactorizaciones no solicitadas o mejoras "proactivas".
- **Cero Diagnósticos Redundantes:** Al hacer un cambio de código o UI, aplicar la edición, hacer commit/push y responder de inmediato. No realizar diagnósticos remotos prolongados (curls repetitivos, descarga e inspección de bundles remotos, llamadas a APIs externas de despliegue) a menos que el usuario lo solicite expresamente.
- **Prohibido Construir Extras sin Autorización:** Si surge una idea complementaria (simuladores, auto-refresco, widgets adicionales), NO programarla por cuenta propia. Solo sugerirla en una línea breve al final y esperar confirmación.
- **Respuestas Concisas y Directas:** Mantener respuestas breves, directas al grano, indicando puntualmente qué se modificó y cómo verificarlo.

