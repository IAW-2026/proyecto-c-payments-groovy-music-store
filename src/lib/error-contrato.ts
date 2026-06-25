import { NextResponse } from "next/server"

/** Formato de error que pide 03-apis.md: { error: codigo, mensaje: descripcion } */
export function errorContrato(codigo: string, mensaje: string, status: number) {
    return NextResponse.json({ error: codigo, mensaje }, { status })
}