import { NextRequest } from "next/server";
import { verifyToken } from "@clerk/nextjs/server";
import jwt from "jsonwebtoken";

// Un request a Payments puede venir de dos mundos distintos:
// - "servicio": otra app (Buyer/Seller/Shipping) llamándote a vos directamente.
// - "usuario": un humano logueado con Clerk (un buyer viendo su pago, un admin, etc.)
export type ContextoAuth =
    | { tipo: "servicio"; appId: string }
    | { tipo: "usuario"; userId: string; roles: string[] };

export async function autenticarRequest(req: NextRequest): Promise<ContextoAuth | null> {
    const header = req.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;

    const token = header.slice(7); // sacamos el prefijo "Bearer "

    // 1) ¿Es un JWT de servicio (S2S)?
    // Si Buyer/Seller/Shipping te llaman a vos, firmaron el token con TU secreto
    // (PAYMENTS_JWT_SECRET), porque así lo acordó el equipo. Por eso lo verificás
    // con tu propia clave, no con la de ellos.
    try {
        const payloadS2S = jwt.verify(token, process.env.PAYMENTS_JWT_SECRET!) as { appId: string };
        return { tipo: "servicio", appId: payloadS2S.appId ?? "desconocido" };
    } catch {
        // No verificó como JWT de servicio. No es un error todavía:
        // probamos la otra posibilidad antes de rechazar el token.
    }

    // 2) ¿Es un JWT de Clerk (un usuario humano logueado)?
    try {
        const payloadClerk = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY!,
        });
        // roles viene del JWT Template de Clerk que ya configuraron
        // (publicMetadata.roles), no hace falta consultar la base.
        const roles = (payloadClerk.roles as string[]) ?? [];
        return { tipo: "usuario", userId: payloadClerk.sub, roles };
    } catch {
        return null; // no es ni S2S ni Clerk válido → token inválido
    }
}

// Atajo para usar al principio de cada endpoint
export async function requiereAuth(req: NextRequest) {
    const ctx = await autenticarRequest(req);
    if (!ctx) {
        return {
            error: { error: "no_autorizado", mensaje: "Token inválido o ausente" },
            status: 401 as const,
        };
    }
    return { ctx };
}