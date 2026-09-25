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
│   ├── formatters.ts           # 🕒 Formateo de fechas, marcas temporales y valores
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
│   │   ├── EditarFraganciaModal.tsx     # Modificación de precios, datos y toggle activo/agotado
│   │   ├── NuevaFraganciaModal.tsx      # Registro de nuevas fragancias al catálogo
│   │   ├── ClienteDuplicadoModal.tsx    # Alerta y resolución de cliente duplicado por WhatsApp
│   │   └── index.ts
│   │
│   ├── ventas/                  # 💼 Módulo Comercial & Pedidos
│   │   ├── VentasHub.tsx        # Hub central con tarjetas de navegación de ventas
│   │   ├── NuevoClienteForm.tsx # Formulario completo de registro de cliente con validaciones SV
│   │   ├── NuevoPedidoForm.tsx  # Formulario de nuevo pedido con buscador, pagos mixtos y comprobantes
│   │   ├── PedidosTabla.tsx     # Tabla de pedidos con orden homologado de 8+1 columnas
│   │   ├── ClientesTabla.tsx    # Directorio de clientes con botones de llamada y WhatsApp
│   │   ├── ClienteFichaView.tsx # Ficha técnica de cliente con métricas e historial de pedidos
│   │   └── index.ts
│   │
│   ├── catalogo/                # 💎 Catálogo de Fragancias & Inventario
│   │   ├── CatalogoGrid.tsx     # Tabla administrativa de fragancias con filtros de género y stock
│   │   └── index.ts
│   │
│   ├── fabricacion/             # 🧪 Módulo de Producción & Laboratorio
│   │   ├── FabricacionHub.tsx        # Hub selector entre compras pendientes y laboratorio
│   │   ├── CompraPendienteTabla.tsx  # Vista dividida (Pedidos en rojo / Insumos a comprar con ordenación)
│   │   ├── PorFabricarTabla.tsx      # Vista dividida (Pedidos en amarillo / Fragancias a preparar)
│   │   └── index.ts
│   │
│   ├── logistica/               # 🚚 Módulo de Envíos & Seguimiento C807
│   │   ├── LogisticaView.tsx         # Tabla de guías (últimos 20 días / todos), WhatsApp y DTE
│   │   └── index.ts
│   │
│   └── bi/                      # 📊 Módulo de Inteligencia de Negocios & Finanzas
│       ├── BiHub.tsx                 # Selector entre Dashboard y Registro de Compras
│       ├── DashboardMetricas.tsx     # Tarjetas de ingresos, gastos en insumos, margen y pedidos
│       ├── ComprasGastosTabla.tsx    # Formulario y tabla de gastos y compras de insumos
│       └── index.ts
│
├── page.tsx                     # 📄 Orquestador principal ultralimpio (~570 líneas)
└── MAPA_MODULOS.md              # 🗺️ Este mapa de navegación
```

---

## 🔍 2. Dónde Modificar Cada Función o Requerimiento

| Requerimiento / Elemento Visual | Archivo a Modificar | Qué contiene |
| :--- | :--- | :--- |
| **Hub principal de ventas** | `src/app/kode/components/ventas/VentasHub.tsx` | Tarjetas de acceso directo a Nuevo Cliente, Nuevo Pedido, Clientes, Pedidos y Catálogo con contadores. |
| **Formulario de Registro de Cliente** | `src/app/kode/components/ventas/NuevoClienteForm.tsx` | Registro de nombre, WhatsApp con enlace directo, DUI/Doc, selectores de Depto/Municipio de SV y dirección. |
| **Formulario de Nuevo Pedido** | `src/app/kode/components/ventas/NuevoPedidoForm.tsx` | Buscador predictivo de clientes, selector de fragancias (Normal/Plus), pagos mixtos, subida o pegado `Ctrl+V` de comprobantes. |
| **Columnas de la tabla de pedidos** | `src/app/kode/components/ventas/PedidosTabla.tsx` | El orden oficial homologado de 8+1 columnas, botones de expansión, acciones de guía y abonos. |
| **Directorio y tabla de clientes** | `src/app/kode/components/ventas/ClientesTabla.tsx` | Tabla de clientes, filtros, enlaces a WhatsApp (`wa.me`) y llamadas directas. |
| **Ficha de cliente e historial** | `src/app/kode/components/ventas/ClienteFichaView.tsx` | Tarjetas de métricas (total pedidos, facturado), datos de entrega e historial de compras. |
| **Catálogo de fragancias e inventario** | `src/app/kode/components/catalogo/CatalogoGrid.tsx` | Grid administrativo con pestañas de género (Caballero, Dama, Unisex), filtro de disponibilidad (Activas/Agotadas), búsqueda y acciones. |
| **Modal para editar fragancia** | `src/app/kode/components/modals/EditarFraganciaModal.tsx` | Edición de código, contratipo, diseñador, precios normal/extra shot y toggle activo/agotado. |
| **Modal para añadir nueva fragancia** | `src/app/kode/components/modals/NuevaFraganciaModal.tsx` | Formulario para dar de alta un perfume en el catálogo general e inventario. |
| **Modal de cliente duplicado** | `src/app/kode/components/modals/ClienteDuplicadoModal.tsx` | Detección de colisión de teléfono de WhatsApp con opción de sobreescritura informada. |
| **Fabricación: Hub principal** | `src/app/kode/components/fabricacion/FabricacionHub.tsx` | Tarjetas de acceso a pedidos en compra pendiente y pedidos por fabricar en laboratorio. |
| **Fabricación: Insumos por comprar** | `src/app/kode/components/fabricacion/CompraPendienteTabla.tsx` | Split-pane con pedidos en estado Registrado e insumos clasificados (Normal/Plus) con botón de compra. |
| **Fabricación: Pedidos por fabricar** | `src/app/kode/components/fabricacion/PorFabricarTabla.tsx` | Split-pane con pedidos Listos para fabricar y fragancias pendientes con botón directo de guía C807. |
| **Logística: Envíos y rastreo C807** | `src/app/kode/components/logistica/LogisticaView.tsx` | Tabla con orden homologado 8+1, filtro 20 días / todos, generación de mensaje WhatsApp y emisión de DTE. |
| **Inteligencia de Negocios: Hub** | `src/app/kode/components/bi/BiHub.tsx` | Tarjetas de acceso a Dashboard Financiero y Registro de Compras de insumos. |
| **BI: Métricas y Dashboard** | `src/app/kode/components/bi/DashboardMetricas.tsx` | KPIs de Ventas Totales, Gastos en Insumos, Margen Operativo Bruto y Total de Pedidos. |
| **BI: Registro de Compras y Gastos** | `src/app/kode/components/bi/ComprasGastosTabla.tsx` | Formulario para ingresar nuevas facturas de insumos (esencias, frascos, cajas) y tabla histórica de gastos. |
| **Subida de captura / comprobante** | `src/app/kode/utils/imageUpload.ts` | Algoritmo de compresión canvas JPEG a 1280px máx y subida a `/api/kode/pagos/upload-comprobante`. |
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
