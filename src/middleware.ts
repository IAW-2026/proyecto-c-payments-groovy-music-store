import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isLandingRoute = createRouteMatcher(["/"])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth()
  const roles = (sessionClaims?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin_payments")

  // Rutas del panel: requieren sesión y rol de admin.
  if (isAdminRoute(req)) {
    if (!userId) {
      return redirectToSignIn()
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/no-autorizado", req.url))
    }
  }

  // Usuario logueado sin permisos que cae en la landing → 403 inmediato.
  if (isLandingRoute(req) && userId && !isAdmin) {
    return NextResponse.redirect(new URL("/no-autorizado", req.url))
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}