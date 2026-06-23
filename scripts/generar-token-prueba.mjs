import jwt from "jsonwebtoken"

// Quién "decís" que sos llamando — no afecta la validación,
// tu helper de auth solo verifica la firma, no usa este valor todavía.
const appId = process.argv[2] ?? "test_manual"
const secret = process.env.PAYMENTS_JWT_SECRET

if (!secret) {
    console.error(
        "Falta PAYMENTS_JWT_SECRET. Corré con:\n" +
        "  node --env-file=.env.local scripts/generar-token-prueba.mjs"
    )
    process.exit(1)
}

const token = jwt.sign({ appId }, secret, { expiresIn: "1h" })
console.log(token)