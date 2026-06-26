# Payments App — Groovy Music Store

Marketplace de música física (Tipo C). Esta app es responsable de los pagos: inicia el checkout vía Mercado Pago, registra transacciones y acreditaciones a vendedores, gestiona reclamos/reembolsos, y expone analítica de su dominio al resto del ecosistema (Buyer, Seller, Shipping, Control Plane y Analytics).

## Stack

Next.js (App Router, TypeScript) · Prisma 6 · PostgreSQL (Neon) · Clerk (auth compartida) · Mercado Pago Checkout Pro (sandbox) · Tailwind CSS · Vercel.

## Deploy

🔗 https://proyecto-c-payments-groovy-music-st.vercel.app/

## Acceso — panel de administración

| Usuario | Email | Contraseña |
|---|---|---|
| Admin | `adminpayments+clerktest@iaw.com` | `iawuser#` |

*(Usuario Clerk de prueba: `adminpaymentsclerktest`)*

## Probar el flujo de pago (sandbox Mercado Pago)

El checkout se inicia desde la **Buyer App**. Para completar un pago de prueba en el checkout de Mercado Pago, usar:

- Comprador de test: `TESTUSER7971489035181850335` (código `965242`)
- Tarjeta: `4002 7686 9439 5619` · Nombre `APRO` · CVV `123` · Vencimiento `11/30` · DNI `12345678`

## Endpoints

### Consumidos por otras apps (contrato Etapa 1)

| Método y ruta | Quién llama | Para qué |
|---|---|---|
| `POST /api/payments/checkout` | Buyer App | Inicia el pago, devuelve `init_point` de Mercado Pago |
| `GET /api/payments/:id` | Buyer App | Consulta estado de una transacción |
| `POST /api/payments/delivery-confirmation` | Shipping App | Notifica entrega → libera fondos al vendedor (`pagado` → `acreditado`) |
| `GET /api/payouts?sellerId=:id` | Seller App | Balance retenido y acreditado de un vendedor |

### Consumidos por el Control Plane (Etapa 3)

| Método y ruta | Para qué |
|---|---|
| `POST /api/payments/:id/refund` | Reembolso total o parcial (body: `monto`, `motivo`) |
| `POST /api/payments/:id/release` | Libera fondos manualmente sin esperar confirmación de Shipping |
| `GET /api/payouts` *(sin `sellerId`)* | Listado paginado (`?pagina=&limite=`) de balances de todos los vendedores |
| `GET /api/analytics/reclamos` | Métricas: total, sin resolver, resueltos, tiempo promedio de resolución |
| `GET /api/analytics/resumen` | Resumen general de transacciones |
| `GET /api/analytics/transacciones-por-dia` | Serie de transacciones por día |

### Internos

| Método y ruta | Nota |
|---|---|
| `POST /api/payments/webhook` | Notificación de Mercado Pago. Siempre responde `200` (evita reintentos de MP aunque el procesamiento interno falle) |

Ver `.env.example` en la raíz del repositorio.
