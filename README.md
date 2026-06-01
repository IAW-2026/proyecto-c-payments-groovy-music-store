# Payments App — Groovy Music Store

App de pagos del marketplace de música **Groovy Music Store**.
Gestiona transacciones entre compradores y vendedores: procesamiento vía Mercado Pago Checkout Pro, retención y acreditación de fondos por vendedor, y resolución de reclamos con reembolsos totales y parciales.

## Deploy:
https://proyecto-c-payments-groovy-music-store-7v6w3vx6k.vercel.app

## Acceso al panel de administración

El panel está en `/admin`. Solo el rol `admin_payments` tiene acceso.

| Rol | Email | Contraseña |
|---|---|---|
| Admin Payments | `adminpayments+clerk_test@iaw.com` | `iawuser#` |
| Seller (sin acceso al panel) | `sellerpayments+clerk_test@iaw.com` | `iawuser#` |

## Probar el flujo de pago

1. Loguearse como Admin → ir a `/admin/test-checkout` o usar el boton de "Generar pago MP (provisional)"
2. Completar el formulario y generar el pago
3. Copiar la URL generada y abrirla en una **ventana de incógnito**
4. Iniciar sesión en Mercado Pago con el usuario de prueba:
   - **Usuario:** `TESTUSER7971489035181850335`
   - **Código de acceso:** `965242` o contraseña `I0dI2wvWXj`
1. Elegir "Otra tarjeta" e ingresar los datos de prueba manualmente (puede haber algunas precargadas):
   - **Número:** `4002 7686 9439 5619`
   - **Nombre:** `APRO` (aprobado) o `OTHE` (error)
   - **CVV:** `123` · **Vencimiento:** `11/30` · **DNI:** `12345678`
6. La transacción se actualiza automáticamente en el panel admin

> **Importante:** generar el pago en un navegador y abrir el link en incógnito.
> Usar el mismo navegador puede causar conflictos en el sandbox de Mercado Pago.

## Variables de entorno

Ver `.env.example` en la raíz del repositorio.