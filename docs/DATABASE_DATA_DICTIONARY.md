# 📖 DICCIONARIO DE DATOS Y CATÁLOGO DE ESQUEMA (DATABASE DATA DICTIONARY)

> **Regla de Oro del Proyecto:** Este archivo es la **ÚNICA FUENTE DE LA VERDAD** para la estructura de la base de datos de Aromaniak / KÖDE.  
> Cada vez que se deba consultar, agregar, renombrar o modificar una columna en la base de datos o en la interfaz (frontend/backend), **es obligatorio consultar este documento primero** para garantizar que los nombres coincidan exactamente y evitar registros o columnas huérfanas.

---

## 📑 ÍNDICE GENERAL DE TABLAS

### Módulo 1: KÖDE Local (Ventas, Taller & Logística)
1. [`public.pedidos`](#1-tabla-publicpedidos) - Registro central de pedidos KÖDE
2. [`public.pedido_items`](#2-tabla-publicpedido_items) - Líneas de fragancias/productos por pedido
3. [`public.clientes`](#3-tabla-publicclientes) - Directorio de clientes KÖDE
4. [`public.pagos`](#4-tabla-publicpagos) - Historial de abonos, liquidaciones y comprobantes
5. [`public.formas_pago`](#5-tabla-publicformas_pago) - Catálogo de métodos de pago y cuentas bancarias
6. [`public.catalogo_fragancias`](#6-tabla-publiccatalogo_fragancias) - Catálogo maestro de contratipos
7. [`public.compras_gastos`](#7-tabla-publiccompras_gastos) - Registro de gastos operativos e insumos
8. [`public.usuarios`](#8-tabla-publicusuarios) - Usuarios del taller y vendedoras

### Módulo 2: POS, Ventas Mostrador & Facturación Electrónica (DTE)
9. [`Sale`](#9-tabla-sale-pos) - Ventas efectuadas en terminales de caja
10. [`SaleItem`](#10-tabla-saleitem-pos) - Productos cobrados en ventas POS
11. [`SalePayment`](#11-tabla-salepayment-pos) - Transacciones y pagos recibidos en POS
12. [`DteDocument`](#12-tabla-dtedocument) - Documentos Tributarios Electrónicos transmitidos a Hacienda
13. [`CashShift`](#13-tabla-cashshift) - Aperturas y cierres de turno de caja
14. [`CashMovement`](#14-tabla-cashmovement) - Entradas y salidas de efectivo en caja

### Módulo 3: Catálogo Central & Inventario
15. [`Product`](#15-tabla-product) - Ficha maestra de productos y esencias
16. [`Category`](#16-tabla-category) - Familias y categorías de productos
17. [`ProductFormula`](#17-tabla-productformula) - Fórmulas de dilución de perfumería
18. [`StockMovement`](#18-tabla-stockmovement) - Kardex y movimientos de inventario

### Módulo 4: Compras & Proveedores (POS / General)
19. [`Supplier`](#19-tabla-supplier) - Proveedores de materias primas y frascos
20. [`Purchase`](#20-tabla-purchase) - Órdenes de compra registradas
21. [`PurchaseItem`](#21-tabla-purchaseitem) - Detalle de items comprados a proveedores
22. [`PurchasePayment`](#22-tabla-purchasepayment) - Pagos a proveedores

### Módulo 5: Clientes, Créditos & Ecommerce
23. [`Customer`](#23-tabla-customer) - Clientes generales / POS / Ecommerce
24. [`CustomerAddress`](#24-tabla-customeraddress) - Direcciones de envío para clientes
25. [`CustomerCredit`](#25-tabla-customercredit) - Cuentas por cobrar y créditos
26. [`CreditPayment`](#26-tabla-creditpayment) - Abonos a créditos
27. [`EcommerceOrder`](#27-tabla-ecommerceorder) - Pedidos realizados en tienda online
28. [`EcommerceOrderItem`](#28-tabla-ecommerceorderitem) - Items de pedidos online
29. [`Shipment`](#29-tabla-shipment) - Envíos de ecommerce
30. [`ProductReview`](#30-tabla-productreview) - Reseñas y calificaciones de clientes

### Módulo 6: Sistema, Territorio & Contenido
31. [`StaffUser`](#31-tabla-staffuser) - Usuarios administrativos y cajeros
32. [`AuditLog`](#32-tabla-auditlog) - Auditoría de acciones del sistema
33. [`Department`](#33-tabla-department) - Departamentos de El Salvador
34. [`Municipio`](#34-tabla-municipio) - Municipios de El Salvador
35. [`BlogPost`](#35-tabla-blogpost) - Artículos y publicaciones del blog
36. [`WpMedia`](#36-tabla-wpmedia) - Galería de imágenes y medios

---

## 🏛️ MÓDULO 1: KÖDE LOCAL

### 1. Tabla `public.pedidos`
Tabla principal de órdenes del sistema KÖDE.

| Columna SQL | Tipo de Dato | Nulo | Default | FK / Relación | Descripción y Uso en Frontend |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` / `TEXT` | NO | `gen_random_uuid()` | **PK** | ID interno único del pedido |
| `numero_pedido` | `VARCHAR(50)` | NO | - | - | Código visible (ej. `PED-000142`) |
| `cliente_id` | `UUID` / `TEXT` | NO | - | `public.clientes.id` | **FK Obligatoria**. Evita pedidos huérfanos sin cliente |
| `vendedora_id` | `VARCHAR(100)` | SÍ | `'KÖDE'` | - | Nombre o ID de la asesora de ventas |
| `estado` | `VARCHAR(50)` | NO | `'Registrado'` | - | Estados: `Registrado`, `Insumos comprados`, `Preparado`, `Enviado`, `Entregado`, `Cancelado` |
| `tipo_pago` | `VARCHAR(100)` | SÍ | `'Efectivo'` | - | Descripción de método de pago principal |
| `estado_pago` | `VARCHAR(30)` | NO | `'PENDIENTE'` | - | Estado financiero: `PAGADO`, `PARCIAL`, `PENDIENTE` |
| `subtotal` | `NUMERIC(10,2)` | NO | `0.00` | - | Suma de productos sin envío |
| `descuento` | `NUMERIC(10,2)` | NO | `0.00` | - | Descuento total aplicado |
| `costo_envio` | `NUMERIC(10,2)` | NO | `0.00` | - | Costo de flete/envío |
| `total` | `NUMERIC(10,2)` | NO | `0.00` | - | Monto final = `(subtotal - descuento) + costo_envio` |
| `monto_cobrar_cce`| `NUMERIC(10,2)`| SÍ | `0.00` | - | Saldo que C807 debe cobrar contra entrega |
| `c807_guia_numero`| `VARCHAR(100)` | SÍ | `NULL` | - | Número oficial de guía de paquetería C807 Express |
| `c807_link_rastreo`| `TEXT` | SÍ | `NULL` | - | URL pública oficial de rastreo C807 |
| `c807_estado` | `VARCHAR(50)` | SÍ | `'PENDIENTE'` | - | Estado C807 (`GUIA_CREADA`, `EN_TRANSITO`, `ENTREGADO`, etc.) |
| `c807_fecha_guia` | `TIMESTAMPTZ` | SÍ | `NULL` | - | Fecha/hora en que se emitió la guía en C807 |
| `dte_estado` | `VARCHAR(30)` | SÍ | `'PENDIENTE'` | - | `PENDIENTE`, `PROCESADO`, `ERROR` |
| `dte_codigo_generacion` | `VARCHAR(100)` | SÍ | `NULL` | - | UUID generado por Factura Llama / Hacienda |
| `dte_numero_control` | `VARCHAR(100)` | SÍ | `NULL` | - | Número de control DTE (ej. `DTE-01-M001P001-000000000000001`) |
| `dte_pdf_url` | `TEXT` | SÍ | `NULL` | - | Enlace directo para ver/imprimir el PDF del DTE |
| `notas` | `TEXT` | SÍ | `NULL` | - | Notas internas o instrucciones de entrega |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | - | Marca temporal de creación |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | - | Marca temporal de última modificación |

---

### 2. Tabla `public.pedido_items`
Detalle de fragancias o productos pertenecientes a un pedido.

| Columna SQL | Tipo de Dato | Nulo | Default | FK / Relación | Descripción y Uso en Frontend |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` / `TEXT` | NO | `gen_random_uuid()` | **PK** | ID interno de la línea |
| `pedido_id` | `UUID` / `TEXT` | NO | - | `public.pedidos.id` | **FK Obligatoria**. En cascada con pedido |
| `codigo` | `VARCHAR(50)` | SÍ | `NULL` | - | Kodigo de fragancia (ej. `K-101`) |
| `contratipo` | `VARCHAR(150)` | NO | - | - | Nombre de la fragancia solicitada |
| `marca_inspirada`| `VARCHAR(100)`| SÍ | `NULL` | - | Marca de diseñador en la que está inspirada |
| `genero` | `VARCHAR(50)` | SÍ | `'Unisex'` | - | `Dama`, `Caballero`, `Unisex`, etc. |
| `cantidad` | `INT` | NO | `1` | - | Cantidad de frascos / unidades |
| `precio_unitario`| `NUMERIC(10,2)`| NO | `0.00` | - | Precio venta por unidad |
| `subtotal` | `NUMERIC(10,2)`| NO | `0.00` | - | `cantidad * precio_unitario` |
| `version` | `VARCHAR(50)` | NO | `'Normal'` | - | Concentración: `'Normal'` o `'Extra Shot'` |
| `insumo_comprado`| `BOOLEAN` | NO | `FALSE` | - | Taller: si la esencia/frasco ya está disponible |
| `comprado_por` | `VARCHAR(100)` | SÍ | `NULL` | - | Usuario de bodega que confirmó compra de insumos |
| `usuario` | `VARCHAR(100)` | SÍ | `NULL` | - | Usuario que creó la línea |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | - | Fecha de registro |

---

### 3. Tabla `public.clientes`
Directorio central de clientes para pedidos KÖDE.

| Columna SQL | Tipo de Dato | Nulo | Default | FK / Relación | Descripción y Uso en Frontend |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` / `TEXT` | NO | `gen_random_uuid()` | **PK** | Identificador del cliente |
| `nombre` | `VARCHAR(200)` | NO | - | - | Nombre y apellido del cliente |
| `telefono` | `VARCHAR(50)` | NO | - | - | WhatsApp / Móvil (8 dígitos El Salvador) |
| `correo` | `VARCHAR(150)` | SÍ | `NULL` | - | Correo electrónico para facturación DTE |
| `documento` | `VARCHAR(50)` | SÍ | `NULL` | - | DUI o NIT |
| `departamento` | `VARCHAR(100)` | NO | - | - | Departamento de SV (San Salvador, Santa Ana, etc.) |
| `municipio` | `VARCHAR(100)` | NO | - | - | Municipio oficial de SV perteneciente al departamento |
| `direccion` | `TEXT` | NO | - | - | Dirección exacta de entrega para C807 |
| `punto_referencia`| `TEXT` | SÍ | `NULL` | - | Punto de referencia (ej. casa blanca portón negro) |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | - | Fecha de alta |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | - | Última actualización |

---

### 4. Tabla `public.pagos`
Registro de abonos, liquidaciones y comprobantes de transferencias bancarias.

| Columna SQL | Tipo de Dato | Nulo | Default | FK / Relación | Descripción y Uso en Frontend |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` / `TEXT` | NO | `gen_random_uuid()` | **PK** | ID del pago |
| `pedido_id` | `UUID` / `TEXT` | NO | - | `public.pedidos.id` | **FK Obligatoria**. Pedido al que abona |
| `cliente_id` | `UUID` / `TEXT` | SÍ | `NULL` | `public.clientes.id`| Cliente que emite el pago |
| `forma_pago_id` | `VARCHAR(50)` | NO | - | `public.formas_pago.id`| Forma de pago utilizada |
| `monto` | `NUMERIC(10,2)` | NO | `0.00` | - | Monto pagado / abonado |
| `fecha_pago` | `DATE` / `TEXT` | NO | `CURRENT_DATE` | - | Fecha del cobro/depósito |
| `num_documento_auto`| `VARCHAR(100)`| SÍ| `''` | - | Número de autorización, transferencia o voucher |
| `comprobante_url`| `TEXT` | SÍ | `NULL` | - | URL pública o data URI de la captura de pantalla |
| `estado_pago` | `VARCHAR(50)` | NO | `'Confirmado'`| - | `'Confirmado'` o `'Pendiente'` |
| `usuario` | `VARCHAR(100)` | SÍ | `'KÖDE'` | - | Operador que registró el pago |
| `observaciones` | `TEXT` | SÍ | `''` | - | Comentarios u observaciones adicionales |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | - | Timestamp del pago |

---

### 5. Tabla `public.formas_pago`
Catálogo de formas de pago configurables para KÖDE.

| Columna SQL | Tipo de Dato | Nulo | Default | FK / Relación | Descripción y Uso en Frontend |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `VARCHAR(50)` | NO | - | **PK** | Código (ej. `1001`, `1002`, `1003`) |
| `nombre` | `VARCHAR(150)` | NO | - | - | Nombre visible (ej. `Efectivo`, `Banco Agrícola`) |
| `tipo` | `VARCHAR(50)` | NO | `'Efectivo'` | - | `Efectivo`, `Banco`, `Tarjeta`, `Contra Entrega` |
| `activo` | `BOOLEAN` | NO | `TRUE` | - | Si está activa para selección en pedidos y abonos |
| `cuenta_numero` | `VARCHAR(100)` | SÍ | `NULL` | - | Número de cuenta para transferencias |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | - | Fecha de registro |

---

### 6. Tabla `public.catalogo_fragancias`
Catálogo de contratipos y fórmulas KÖDE.

| Columna SQL | Tipo de Dato | Nulo | Default | FK / Relación | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` / `TEXT` | NO | `gen_random_uuid()` | **PK** | ID de fragancia |
| `kodigo` | `VARCHAR(50)` | NO | - | - | Código (ej. `K-101`) |
| `contratipo` | `VARCHAR(150)` | NO | - | - | Nombre de la fragancia |
| `marca_inspirada`| `VARCHAR(100)`| SÍ | `NULL` | - | Diseñador (ej. Paco Rabanne) |
| `genero` | `VARCHAR(50)` | NO | `'Unisex'` | - | `Dama`, `Caballero`, `Unisex` |
| `precio_normal` | `NUMERIC(10,2)`| NO | `15.00` | - | Precio presentación Normal |
| `precio_extra_shot`| `NUMERIC(10,2)`| NO | `18.00` | - | Precio presentación Extra Shot |
| `activo` | `BOOLEAN` | NO | `TRUE` | - | Estado en catálogo |

---

### 7. Tabla `public.compras_gastos`
Control de gastos e insumos de laboratorio.

| Columna SQL | Tipo de Dato | Nulo | Default | FK / Relación | Descripción |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | `UUID` / `TEXT` | NO | `gen_random_uuid()` | **PK** | ID del gasto |
| `fecha_compra` | `DATE` | NO | `CURRENT_DATE` | - | Fecha de compra |
| `concepto` | `VARCHAR(255)` | NO | - | - | Concepto / Material comprado |
| `proveedor` | `VARCHAR(150)` | SÍ | `NULL` | - | Proveedor |
| `categoria` | `VARCHAR(100)` | NO | `'Insumos'` | - | Categoría de gasto |
| `monto` | `NUMERIC(10,2)` | NO | `0.00` | - | Monto en dólares |
| `usuario` | `VARCHAR(100)` | SÍ | `NULL` | - | Registrado por |

---

## 🏛️ MÓDULO 2: POS, VENTAS MOSTRADOR & DTE (PRISMA)

### 9. Tabla `Sale` (Ventas POS)
| Columna SQL / Prisma | Tipo | Nulo | FK / Relación | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | NO | **PK** (`cuid`) | Identificador de la venta |
| `saleNumber` | `String` | NO | Unique | Folio único (ej. `VTA-2026-0001`) |
| `customerId` | `String` | SÍ | `Customer.id` | Cliente receptor (opcional para consumidor final) |
| `userId` | `String` | SÍ | `StaffUser.id` | Cajero / Vendedor |
| `cashShiftId` | `String` | SÍ | `CashShift.id` | Turno de caja en que se realizó |
| `tipoComprobante`| `String` | NO | Default `'01'` | `'01'` Factura, `'03'` Crédito Fiscal, `'TICKET'` |
| `subtotal` | `Decimal(10,2)`| NO | - | Subtotal |
| `iva` | `Decimal(10,2)`| NO | Default `0.00` | IVA 13% |
| `discount` | `Decimal(10,2)`| NO | Default `0.00` | Descuentos |
| `total` | `Decimal(10,2)`| NO | - | Total cobrado |
| `status` | `String` | NO | Default `'COMPLETED'`| `COMPLETED`, `CANCELLED`, `DRAFT` |
| `origin` | `String` | NO | Default `'POS'` | `POS`, `ECOMMERCE`, `WHATSAPP` |
| `createdAt` | `DateTime` | NO | Default `now()` | Fecha y hora de venta |

### 10. Tabla `SaleItem`
| Columna SQL / Prisma | Tipo | Nulo | FK / Relación | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | NO | **PK** | ID línea |
| `saleId` | `String` | NO | `Sale.id` | Venta padre |
| `productId` | `String` | SÍ | `Product.id` | Producto vendido |
| `quantity` | `Int` | NO | - | Cantidad |
| `unitPrice` | `Decimal(10,2)`| NO | - | Precio unitario |
| `subtotal` | `Decimal(10,2)`| NO | - | Subtotal de línea |

### 11. Tabla `SalePayment`
| Columna SQL / Prisma | Tipo | Nulo | FK / Relación | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | NO | **PK** | ID de pago |
| `saleId` | `String` | NO | `Sale.id` | Venta asociada |
| `method` | `PaymentMethod`| NO | - | `CASH`, `CARD`, `TRANSFER`, `CREDIT`, `WOMPI` |
| `amount` | `Decimal(10,2)`| NO | - | Monto liquidado |
| `reference` | `String` | SÍ | - | Referencia / Número de Boucher |

### 12. Tabla `DteDocument`
| Columna SQL / Prisma | Tipo | Nulo | FK / Relación | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | NO | **PK** | ID de DTE |
| `saleId` | `String` | SÍ | `Sale.id` | Venta asociada |
| `codigoGeneracion` | `String` | NO | Unique | UUID de Hacienda |
| `numeroControl` | `String` | NO | Unique | Número de control Hacienda |
| `selloRecibido` | `String` | SÍ | - | Sello oficial de recepción Hacienda |
| `tipoDte` | `String` | NO | - | `'01'` Factura, `'03'` Crédito Fiscal |
| `estado` | `String` | NO | Default `'PROCESADO'` | `PROCESADO`, `RECHAZADO`, `CONTINGENCIA` |
| `pdfUrl` | `String` | SÍ | - | Enlace al PDF generado |
| `jsonUrl` | `String` | SÍ | - | Enlace al JSON firmado |

---

## 🏛️ MÓDULO 3: PRODUCTOS & INVENTARIO

### 15. Tabla `Product`
| Columna SQL / Prisma | Tipo | Nulo | FK / Relación | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | NO | **PK** | ID interno |
| `sku` | `String` | SÍ | Unique | Código de esencia (ej. `100`, `101`) |
| `barcode` | `String` | SÍ | Unique | Código de barras |
| `name` | `String` | NO | - | Nombre contratipo (ej. `1 Million Elixir H`) |
| `officialName` | `String` | SÍ | - | Nombre comercial (ej. `Hombre Salvaje`) |
| `brand` | `String` | SÍ | - | Marca inspirada (ej. `Paco Rabanne`) |
| `gender` | `String` | SÍ | - | `Caballero`, `Dama`, `Unisex`, `Niños` |
| `unit` | `String` | SÍ | Default `'Onza'` | Unidad de medida |
| `price` | `Decimal(10,2)`| NO | Default `3.25` | Precio venta por onza |
| `priceHalfOunce` | `Decimal(10,2)`| SÍ | - | Precio venta ½ onza ecommerce |
| `finishedPerfumePrice`| `Decimal(10,2)`| SÍ | - | Precio terminado "Arma tu perfume" (ej. $15.00) |
| `cost` | `Decimal(10,2)`| SÍ | Default `1.95` | Costo compra por onza |
| `stock` | `Int` | NO | Default `50` | Existencia física actual |
| `minStock` | `Int` | NO | Default `10` | Nivel mínimo de alerta de inventario |
| `imageUrl` | `String` | SÍ | - | Foto del producto |
| `puesto` | `String` | SÍ | - | Ubicación en estantería (ej. `A1`, `B3`) |
| `supplier` | `String` | SÍ | Default `'APAESA GUATEMALA'` | Proveedor principal |
| `isActive` | `Boolean` | NO | Default `true` | Si está activo para venta |
| `categoryId` | `String` | SÍ | `Category.id` | Categoría asociada |

---

## 🛡️ REGLAS PARA MODIFICAR LA BASE DE DATOS
1. **Verificar antes de asumir:** Antes de usar una columna en un `SELECT` o en el frontend, verificar en esta tabla que exista exactamente con ese nombre.
2. **Migración en caliente segura:** Si se crea una nueva columna, siempre usar `ALTER TABLE public.<tabla> ADD COLUMN IF NOT EXISTS <nombre> <tipo>;` tanto en el endpoint correspondiente como actualizando este archivo.
3. **No eliminar columnas en producción:** Nunca usar `DROP COLUMN` sin un plan de migración previo para evitar pérdida de datos históricos.
4. **Relaciones estrictas (FK):** Cada registro hijo (`pedido_items`, `pagos`) DEBE tener su `pedido_id` para garantizar que no existan datos huérfanos.
