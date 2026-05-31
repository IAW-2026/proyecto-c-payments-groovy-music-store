import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = createRouteMatcher(["/admin(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth()
    
    if (!userId) {
      return redirectToSignIn()
    }
    
    // Está logueado pero no tiene el rol → mandar a página de sin permisos
    const roles = (sessionClaims?.roles as string[]) ?? []
    if (!roles.includes("admin_payments")) {
      return NextResponse.redirect(new URL("/no-autorizado", req.url))
    }

  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}