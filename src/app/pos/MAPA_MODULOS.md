# 🗺️ MAPA MAESTRO DE MÓDULOS - POS AROMANIAK

> **Guía de Consulta Rápida**: Diseñada para ubicar de inmediato qué archivo modificar ante cualquier cambio solicitado en la interfaz, lógica o base de datos del POS de Aromaniak (`src/app/pos/`), evitando búsquedas en archivos monolíticos.

---

## 📁 1. Estructura General del POS (`src/app/pos/`)

```
src/app/pos/
│
├── types/
│   └── index.ts                 # 📌 Tipado TypeScript maestro (PosTab, DteEmissionPayload, PaymentMethod, etc.)
│
├── services/
│   ├── posApi.ts                # 🌐 Cliente de conexión a /api/products, /api/customers, /api/dte, etc.
│   ├── posStorage.ts            # 💾 Almacenamiento local seguro y eventos (localStorage)
│   └── index.ts
│
├── utils/
│   ├── posHelpers.ts            # 🧮 Deducción de onzas / medias onzas, cálculos fiscales e IVA
│   └── index.ts
│
├── components/                  # 🧩 Componentes modulares del POS
│   ├── layout/                  # 🧭 Menú lateral dinámico y métricas rápidas (PosSidebar)
│   ├── terminal/                # 🛒 Terminal de Venta, Cuadrícula de Productos y Carrito
│   ├── modals/                  # 🪟 Modales de Cliente, Cobro/DTE, Ticket de Venta y Detalle
│   └── index.ts
│
├── page.tsx                     # 📄 Orquestador Central del POS (vistas por pestañas y modales)
└── MAPA_MODULOS.md              # 🗺️ Este mapa de navegación
```

---

## 🔍 2. Dónde Modificar Cada Función o Requerimiento

| Requerimiento / Elemento Visual | Archivo a Modificar | Qué contiene |
| :--- | :--- | :--- |
| **Menú Lateral / Navegación** | `src/app/pos/components/layout/PosSidebar.tsx` | Barra lateral colapsable, selector de pestañas, badges de comandas y métricas rápidas del día. |
| **Buscador, Filtros y Catálogo** | `src/app/pos/components/terminal/PosProductGrid.tsx` | Búsqueda por SKU/nombre, selector de categoría, filtro de género y tarjetas con puestos y stock. |
| **Carrito y Combobox de Cliente** | `src/app/pos/components/terminal/PosCartPanel.tsx` | Items seleccionados, switch 1 Oz / ½ Oz, búsqueda de cliente con DUI/NRC, desglose de totales y botones de acción. |
| **Edición Rápida de Producto** | `src/app/pos/components/terminal/PosQuickEditProductModal.tsx` | Modal emergente para actualizar precios, nombre oficial, stock y catálogo en vivo. |
| **Tipos de venta y estados** | `src/app/pos/types/index.ts` | Pestañas activas (`PosTab`), tipos de comprobante (`01`, `03`, `TICKET`) y métodos de pago. |
| **Peticiones HTTP (/api/dte, etc.)** | `src/app/pos/services/posApi.ts` | Llamadas a Factura Llama DTE, catálogo de productos, clientes y órdenes ecommerce. |
| **Almacenamiento local (localStorage)** | `src/app/pos/services/posStorage.ts` | Gestión de `kodelocal_products`, `kodelocal_sales` y eventos de reactividad. |
| **Cálculo de onzas y stock** | `src/app/pos/utils/posHelpers.ts` | Conversión de presentaciones (onza completa vs media onza) y cálculo del IVA 13% para CCF. |
| **Registro y Edición de Cliente** | `src/app/pos/components/modals/PosCustomerFormModal.tsx` | Formulario completo fiscal (Persona Natural/Jurídica, DUI, NIT, NRC, Giro, Depto/Municipio). |
| **Cobro y Facturación DTE** | `src/app/pos/components/modals/PosCheckoutModal.tsx` | Pasarela de cobro (Efectivo con cálculo de cambio, Tarjeta, Transf., Bitcoin) y emisión Hacienda. |
| **Comprobante de Venta Exitosa** | `src/app/pos/components/modals/PosCompletedSaleModal.tsx` | Resumen posventa, estado de sello DTE, descarga de PDF y enlace público a Hacienda. |
| **Detalle de Venta Histórica** | `src/app/pos/components/modals/PosSaleDetailModal.tsx` | Consulta de venta, desglose de items e impuestos y reimpresión de comprobante. |
| **Cotizaciones / Prefacturas** | `src/components/pos/CotizacionModal.tsx` | Popup para cotizar y prefacturar pedidos. |
| **Impresión de tickets térmicos** | `src/components/pos/ThermalTicket.tsx` | Formato para impresoras térmicas de 80mm / 58mm. |

---

## 📌 3. Reglas de Mantenimiento Obligatorias

1. **No Monolitos**: Cualquier nueva lógica o vista debe alojarse en su carpeta correspondiente dentro de `src/app/pos/`.
2. **Deducción de Onzas Segura**: Todo producto con presentación `MEDIA_ONZA` o `½ Onza` debe deducir `Math.ceil(quantity * 0.5)` usando `posHelpers.calculateStockDeduct`.
3. **Facturación DTE Segura**: La emisión a Factura Llama debe pasar por `posApi.emitirDte` manejando estados `PROCESADO`, `RECHAZADO` y `SIMULADO`.
