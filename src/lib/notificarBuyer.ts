import jwt from "jsonwebtoken";

interface NotificacionPago {
    ordenId: string;             // id de la orden en Buyer (la guardaste vos en el checkout)
    pagoId: string;               // id de tu transacción en Payments
    estado: "aprobado" | "rechazado" | "pendiente"; // ya en vocabulario de contrato — ver nota abajo
    fechaActualizacion: string;  // ISO 8601
}

export async function notificarPagoABuyer(datos: NotificacionPago): Promise<void> {
    try {
        // Firmamos diciendo "soy Payments", pero con el secreto DE BUYER —
        // porque es Buyer quien va a validar este token del lado receptor,
        // con SU propia clave (BUYER_JWT_SECRET), no con la nuestra.
        const tokenS2S = jwt.sign(
            { appId: "payments_app" },
            process.env.BUYER_JWT_SECRET!,
            { expiresIn: "5m" } // vida corta: se usa una sola vez, al toque
        );

        const res = await fetch(`${process.env.BUYER_API_URL}/api/orders/payment-status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenS2S}`,
            },
            body: JSON.stringify(datos),
        });

        if (!res.ok) {
            console.error(`[notificarBuyer] Buyer respondió ${res.status} para ordenId=${datos.ordenId}`);
        }
    } catch (err) {
        // Nunca propagamos el error: quien llama a esta función (el webhook de MP)
        // tiene que poder seguir devolviendo 200 igual.
        console.error(`[notificarBuyer] No se pudo notificar a Buyer:`, err);
    }
}