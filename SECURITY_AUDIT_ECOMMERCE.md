# 🛡️ Informe de Auditoría y Análisis de Ciberseguridad
## Módulo E-commerce y Pasarela de Pagos — Aromaniak El Salvador

**Fecha de Evaluación:** Febrero 2025
**Objeto de Auditoría:** Ecosistema E-commerce (`src/app/checkout`, `src/app/api/ecommerce/*`, `src/app/api/wompi/*`, `src/app/api/customer/*`, `src/lib/wompi.ts`, `src/middleware.ts`)
**Nivel de Severidad Máximo Identificado:** **CRÍTICO**

---

## 📋 Resumen Ejecutivo

Se ha realizado una auditoría exhaustiva de seguridad en la arquitectura, código fuente, flujos de autenticación, integración de pagos e infraestructura del módulo e-commerce de **Aromaniak**.

Aunque la plataforma cuenta con controles positivos notables —como la **validación estricta de precios e inventario en el servidor al crear órdenes en `/api/ecommerce/orders` (POST)** y la simulación de transacciones con aislamiento de dominio en el cliente—, se han descubierto **múltiples vulnerabilidades graves que comprometen la confidencialidad de los datos personales (PII) de los clientes, la integridad de las órdenes e inventarios, y la seguridad financiera del e-commerce**.

### Matriz de Resumen de Hallazgos

| ID | Hallazgo / Vulnerabilidad | Severidad | Categoría | Componente Afectado |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | Ausencia de Autenticación en Modificación de Pedidos (Bypass de Control de Acceso) | 🔴 **CRÍTICA** | Control de Acceso | `PATCH /api/ecommerce/orders` |
| **SEC-02** | BOLA / IDOR en Consulta de Pedidos y Exposición Masiva de PII | 🔴 **CRÍTICA** | Privacidad / BOLA | `GET /api/ecommerce/orders` |
| **SEC-03** | Bypass Opcional de Validación de Firma Webhook en Wompi SV | 🔴 **CRÍTICA** | Integridad de Pagos | `POST /api/wompi/webhook` |
| **SEC-04** | Credenciales de Producción y Secretos de Pasarela Hardcodeados | 🟠 **ALTA** | Gestión de Secretos | `src/lib/wompi.ts` |
| **SEC-05** | Hashing Débil de Contraseñas (HMAC-SHA256) y Ausencia de Tokens de Sesión Seguros | 🟠 **ALTA** | Autenticación | `src/app/api/customer/auth` |
| **SEC-06** | Falta de Protección en Middleware para Rutas API `/api/*` y POS | 🟠 **ALTA** | Aislamiento de Red | `src/middleware.ts` |
| **SEC-07** | Ausencia de Rate Limiting (Protección contra Anti-Bruteforce / Botnets) | 🟡 **MEDIA** | Disponibilidad | Endpoints `/api/*` |
| **SEC-08** | Inexistencia de Controles de Idempotencia en Notificaciones de Pago | 🟡 **MEDIA** | Lógica de Negocio | `POST /api/wompi/webhook` |

---

## 🔍 Análisis Detallado de Hallazgos por Criticidad

### 🔴 1. Hallazgos de Severidad CRÍTICA

#### SEC-01: Ausencia de Autenticación en Modificación de Pedidos y Manipulación de Inventario
- **Ruta Afectada:** `PATCH /api/ecommerce/orders`
- **Descripción:** El endpoint `PATCH` permite actualizar el estado de cualquier pedido (`orderStatus`, `paymentStatus`) y forzar el restock de inventario (`restock: true`). Sin embargo, no requiere ningún token de sesión, API Key ni verificación de rol de empleado.
- **Vector de Ataque:** Un atacante puede enviar una solicitud HTTP `PATCH` con un `orderNumber` o `orderId` conocido o secuencial y cambiar el estado del pedido a `CANCELADO`, lo que activa la restauración del stock en la base de datos sin autorización previa. También podría cambiar arbitrariamente el `paymentStatus` a `COMPLETED`.
- **Impacto:** Alteración maliciosa del flujo de pedidos, inventario manipulado y fraude.
- **Recomendación de Mitigación:** Requerir autenticación administrativa/cajero con token JWT firmado o sesión de empleado verificada en servidor antes de procesar cualquier actualización vía `PATCH`.

---

#### SEC-02: BOLA / IDOR en Consulta de Pedidos de Clientes y Exposición de Datos Sensibles (PII)
- **Ruta Afectada:** `GET /api/ecommerce/orders?customerId=...`
- **Descripción:** El endpoint `GET` recibe el parámetro `customerId` sin validar si la solicitud proviene del cliente auténtico que posee dicho ID o de un tercero.
- **Vector de Ataque:** Dado que los IDs de cliente o los emails pueden ser adivinados o enumerados, un usuario no autenticado o malintencionado puede enviar una petición `GET /api/ecommerce/orders?customerId=cli-123456` o consultar todos los pedidos del sistema dejando los parámetros en blanco (`GET /api/ecommerce/orders`).
- **Impacto:** Exposición masiva de Información de Identificación Personal (PII): nombres de clientes, números de teléfono, direcciones físicas de entrega, documentos DUI/NIT, correos electrónicos y montos de compra.
- **Recomendación de Mitigación:** Extraer la identidad del cliente directamente de la sesión/token autenticado en el servidor (SSR / NextAuth / Supabase Token) y nunca confiar en el `customerId` pasado en el query string de la URL.

---

#### SEC-03: Bypass Opcional de Validación de Firma HMAC-SHA256 en Webhook de Wompi
- **Ruta Afectada:** `POST /api/wompi/webhook`
- **Descripción:** En `src/app/api/wompi/webhook/route.ts`, el código verifica el header `wompi_hash` únicamente si este está presente:
  ```typescript
  if (hashHeader) {
    const isValid = validateWompiWebhook(rawBody, hashHeader);
    if (!isValid) return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }
  ```
- **Vector de Ataque:** Si un atacante envía una solicitud HTTP POST simulada al webhook **sin incluir el encabezado `wompi_hash`**, el bloque `if (hashHeader)` se omite por completo. El servidor procede a parsear el cuerpo JSON y actualizar la orden en la base de datos a `paymentStatus: 'COMPLETED'`.
- **Impacto:** Falsificación de pagos aprobados en pedidos e-commerce (pago falso de $0.00 que figura como pagado en el sistema).
- **Recomendación de Mitigación:** Hacer **obligatoria** la presencia del encabezado `wompi_hash`. Si no viene el header, rechazar de inmediato la petición con código HTTP `401 Unauthorized`.

---

### 🟠 2. Hallazgos de Severidad ALTA

#### SEC-04: Credenciales de Producción y Secretos de Pasarela Hardcodeados en el Código Fuente
- **Fichero Afectado:** `src/lib/wompi.ts`
- **Descripción:** El cliente de API de Wompi tiene valores por defecto hardcodeados en caso de que las variables de entorno no estén presentes:
  ```typescript
  const WOMPI_APP_ID = process.env.WOMPI_APP_ID || '27997c46-d68e-4a5f-8725-a930fb1e5aa0';
  const WOMPI_API_SECRET = process.env.WOMPI_API_SECRET || '5376bdd2-4d1a-4146-983c-7b4012728a55';
  ```
- **Vector de Ataque:** Cualquier desarrollador, colaborador o entidad con acceso al repositorio de código fuente obtiene credenciales activas o históricas del entorno de pago.
- **Impacto:** Potencial compromiso de la cuenta de pasarela de pagos Wompi SV.
- **Recomendación de Mitigación:** Eliminar los valores fallback hardcodeados. Requerir que la aplicación lance un error explícito en tiempo de compilación o inicio si las variables de entorno `WOMPI_APP_ID` o `WOMPI_API_SECRET` faltan.

---

#### SEC-05: Esquema de Hashing Débil (HMAC-SHA256 con Salt Estático) y Falta de Tokens HttpOnly
- **Ficheros Afectados:** `src/app/api/customer/auth/route.ts` y `src/context/CustomerAuthContext.tsx`
- **Descripción:**
  1. El hashing de contraseñas de clientes utiliza `crypto.createHmac('sha256', 'aromaniak_salt_2026')`. HMAC-SHA256 es un algoritmo sumamente rápido que no cumple con los estándares modernos de hashing de contraseñas (como **Argon2id** o **bcrypt** con costo elevado), facilitando ataques de cracking por fuerza bruta con GPU si la base de datos es filtrada.
  2. La sesión del cliente se almacena como un objeto JSON simple en `localStorage` (`aromaniak_customer_session`), susceptible a robo mediante ataques Cross-Site Scripting (XSS).
- **Recomendación de Mitigación:**
  - Migrar el hashing de contraseñas a `bcrypt` o `argon2`.
  - Implementar sesiones basadas en cookies seguras con atributos `HttpOnly`, `SameSite=Lax` y `Secure`.

---

#### SEC-06: Exclusión de Rutas `/api/*` en el Middleware de Aislamiento de Dominios
- **Fichero Afectado:** `src/middleware.ts`
- **Descripción:** El middleware aísla las páginas visuales entre el subdominio operativo `pos.aromaniaksv.com` y el dominio público `aromaniaksv.com`. No obstante, el matcher excluye explícitamente las rutas `/api/*`:
  ```typescript
  export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  };
  ```
- **Impacto:** Un usuario conectado desde el sitio e-commerce público (`aromaniaksv.com`) puede invocar directamente endpoints de API internos o administrativos (como `/api/products`, `/api/sales`, `/api/shifts`) si no cuentan con sus propios middleware/guardias de autenticación a nivel de endpoint.
- **Recomendación de Mitigación:** Incluir las rutas de API en las políticas de inspección del middleware o verificar explícitamente la autorización basada en roles dentro de cada endpoint administrativo.

---

### 🟡 3. Hallazgos de Severidad MEDIA

#### SEC-07: Ausencia de Rate Limiting (Límite de Peticiones) en Endpoints Críticos
- **Ficheros Afectados:** `/api/customer/auth`, `/api/ecommerce/orders`, `/api/wompi/create-checkout`
- **Descripción:** Ningún endpoint cuenta con limitador de tasa (Rate Limiting por dirección IP o Identificador).
- **Impacto:** Vulnerabilidad a ataques de denegación de servicio (DoS), enumeración masiva de usuarios en el formulario de login/registro, y creación automatizada de pedidos falsos o saturación de enlaces de pago en Wompi.
- **Recomendación de Mitigación:** Implementar una solución de Rate Limiting (ej. `@upstash/ratelimit` o middleware en memoria/Redis) que limite, por ejemplo, a 5 intentos de login por minuto por IP y a 10 creaciones de pedidos por hora por IP.

---

#### SEC-08: Falta de Controles de Idempotencia en el Procesamiento de Webhooks
- **Fichero Afectado:** `src/app/api/wompi/webhook/route.ts`
- **Descripción:** Si Wompi envía notificaciones automáticas duplicadas o reintentos por latencia de red, la API ejecuta nuevamente la actualización en la base de datos y concatena notas repetidas en la orden.
- **Recomendación de Mitigación:** Almacenar el `IdTransaccion` de Wompi y verificar si la transacción ya fue procesada previamente antes de ejecutar modificaciones adicionales en la base de datos.

---

## 🛠️ Plan de Acción Recomendado y Hoja de Ruta de Remediación

1. **Prioridad Inmediata (Fase 1 - 24 a 48 Horas):**
   - [ ] Hacer obligatorio el header `wompi_hash` en `POST /api/wompi/webhook`.
   - [ ] Remover claves hardcodeadas en `src/lib/wompi.ts` y moverlas a `.env`.
   - [ ] Añadir autenticación de rol de empleado en `PATCH /api/ecommerce/orders`.

2. **Prioridad Corto Plazo (Fase 2 - 1 a 2 Semanas):**
   - [ ] Corregir la vulnerabilidad BOLA en `GET /api/ecommerce/orders` asociando las peticiones a sesiones autenticadas.
   - [ ] Reemplazar la autenticación de clientes con `bcrypt` y cookies `HttpOnly`.
   - [ ] Añadir middleware de Rate Limiting en los endpoints públicos de la API.

3. **Prioridad Mediano Plazo (Fase 3 - Mantenimiento Continuo):**
   - [ ] Implementar tabla de registro de transacciones para garantizar la idempotencia de webhooks.
   - [ ] Configurar encabezados de seguridad HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) en Next.js.

---

**Conclusión:** El sistema e-commerce de Aromaniak posee una base funcional sólida y una correcta validación de precios en el servidor durante la creación de la compra. Resolviendo los puntos de control de acceso en APIs (`PATCH`/`GET`), haciendo estricta la verificación de firma del Webhook de Wompi y migrando la gestión de secretos a variables de entorno, la plataforma alcanzará un estándar de seguridad de alto nivel acorde a las normativas de e-commerce y protección de datos.
