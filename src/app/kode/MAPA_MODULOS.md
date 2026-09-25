# 🗺️ MAPA MAESTRO DE MÓDULOS Y ARCHIVOS DE KÖDE

> **Guía de Consulta Rápida**: Diseñada para ubicar de inmediato qué archivo modificar ante cualquier cambio solicitado en la interfaz, lógica o base de datos de KÖDE, evitando búsquedas en archivos monolíticos.

---

## 📁 1. Estructura General del Proyecto KÖDE (`src/app/kode/`)

```
src/app/kode/
│
├── types/
│   └── index.ts                 # 📌 Tipado TypeScript maestro (Pedido, Cliente, Catalogo, etc.)
│
├── services/
│   └── kodeApi.ts               # 🌐 Cliente de conexión a todos los endpoints /api/kode/*
│
├── store/
│   └── useKodeStore.ts          # ⚡ Estado global reactivo (useSyncExternalStore nativo)
│
├── utils/
│   ├── c807Helpers.tsx          # 🚚 Helpers de rastreo C807, badges de estado y colores
│   └── imageUpload.ts          # 🖼️ Compresión automática en canvas y subida de comprobantes
│
├── components/
│   ├── layout/                  # 📐 Estructura visual y navegación
│   │   ├── KodeSidebar.tsx      # Barra lateral izquierda con contadores y selector de vendedora
│   │   ├── KodeHeader.tsx       # Topbar con buscador dinámico, breadcrumbs y refresco
│   │   └── index.ts
│   │
│   ├── modals/                  # 🪟 Ventanas modales emergentes
│   │   ├── AsignarGuiaModal.tsx         # Despacho automático de guías C807 y asignación manual
│   │   ├── DteResultModal.tsx           # Visualización y descarga de DTE Factura Llama (PDF)
│   │   ├── ComprobanteLightboxModal.tsx # Visor en tamaño completo de comprobantes de pago
│   │   ├── AbonoPedidoModal.tsx         # Registro de abonos bancarios con subida/pega de foto
│   │   └── index.ts
│   │
│   └── ventas/                  # 💼 Módulo Comercial & Pedidos
│       ├── PedidosTabla.tsx     # Tabla de pedidos con orden homologado de 8+1 columnas
│       ├── ClientesTabla.tsx    # Directorio de clientes con botones de llamada y WhatsApp
│       ├── ClienteFichaView.tsx # Ficha técnica de cliente con métricas e historial de pedidos
│       └── index.ts
│
├── page.tsx                     # 📄 Ensamblador principal de la vista KÖDE
└── MAPA_MODULOS.md              # 🗺️ Este mapa de navegación
```

---

## 🔍 2. Dónde Modificar Cada Función o Requerimiento

| Requerimiento / Elemento Visual | Archivo a Modificar | Qué contiene |
| :--- | :--- | :--- |
| **Columnas de la tabla de pedidos** | `src/app/kode/components/ventas/PedidosTabla.tsx` | El orden oficial homologado de 8+1 columnas, botones de expansión, acciones de guía y abonos. |
| **Directorio y tabla de clientes** | `src/app/kode/components/ventas/ClientesTabla.tsx` | Tabla de clientes, filtros, enlaces a WhatsApp (`wa.me`) y llamadas directas. |
| **Ficha de cliente e historial** | `src/app/kode/components/ventas/ClienteFichaView.tsx` | Tarjetas de métricas (total pedidos, facturado), datos de entrega e historial de compras. |
| **Subida de captura de transferencia / comprobante** | `src/app/kode/utils/imageUpload.ts` | Algoritmo de compresión canvas JPEG a 1280px máx y subida a `/api/kode/pagos/upload-comprobante`. |
| **Modal para registrar abonos de pago** | `src/app/kode/components/modals/AbonoPedidoModal.tsx` | Formulario de pago, selección de banco, pegar comprobante con `Ctrl+V`. |
| **Modal para guías C807 y DTE** | `src/app/kode/components/modals/AsignarGuiaModal.tsx` | Formulario de despacho C807 (peso, bultos) y asignación manual de guías. |
| **Modal de resultado DTE Factura Llama** | `src/app/kode/components/modals/DteResultModal.tsx` | Visualización del código de generación DTE, sello de recepción y botón de PDF. |
| **Visor lightbox de comprobantes** | `src/app/kode/components/modals/ComprobanteLightboxModal.tsx` | Popup con fondo oscuro para inspeccionar el comprobante bancario en alta resolución. |
| **Menú lateral (Sidebar)** | `src/app/kode/components/layout/KodeSidebar.tsx` | Pestañas de módulos (Ventas, Inventario, Fabricación, Logística, BI) y badges con contadores. |
| **Barra superior (Header)** | `src/app/kode/components/layout/KodeHeader.tsx` | Buscador predictivo, breadcrumbs interactivos y botón de sincronización general. |
| **Llamadas HTTP a la API (/api/kode/*)** | `src/app/kode/services/kodeApi.ts` | Métodos tipados (`getPedidos`, `crearPedido`, `despacharGuiaC807`, `registrarAbono`, etc.). |
| **Tipos TypeScript del sistema** | `src/app/kode/types/index.ts` | Interfaces de `Pedido`, `ClienteItem`, `CatalogoItem`, `FormaPago`, etc. |
| **Nombres y columnas de base de datos** | `docs/DATABASE_DATA_DICTIONARY.md` | Diccionario con las 36 tablas de Supabase/PostgreSQL y sus columnas exactas. |

---

## 📌 3. Reglas de Mantenimiento Obligatorias

1. **Diccionario de Datos**: Antes de renombrar o agregar cualquier campo que interactúe con la base de datos, consultar `docs/DATABASE_DATA_DICTIONARY.md`.
2. **Orden Homologado de Tablas de Pedidos**: En cualquier tabla donde se listen pedidos, el orden de columnas es inmutable:
   1. *Número de pedido*
   2. *Cliente*
   3. *Teléfono*
   4. *Fecha pedido*
   5. *Total*
   6. *Estado C807*
   7. *Número de DTE*
   8. *Estado envío*
   9. *Acciones*
3. **No Monolitos**: Cada nueva funcionalidad debe alojarse en su carpeta correspondiente dentro de `src/app/kode/components/` o `src/app/kode/utils/`.
