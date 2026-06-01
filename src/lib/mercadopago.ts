import MercadoPagoConfig, { Preference, Payment } from "mercadopago"

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error("MP_ACCESS_TOKEN no está configurado")
  return new MercadoPagoConfig({ accessToken: token })
}

export function getPreference() {
  return new Preference(getClient())
}

export function getPayment() {
  return new Payment(getClient())
}
