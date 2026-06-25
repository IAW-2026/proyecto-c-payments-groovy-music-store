import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isLandingRoute = createRouteMatcher(["/"])
const isApiRoute = createRouteMatcher(["/api(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isApiRoute(req)) {
    return NextResponse.next()
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth()
  const roles = (sessionClaims?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin_payments")

  if (isAdminRoute(req)) {
    if (!userId) {
      return redirectToSignIn()
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/no-autorizado", req.url))
    }
  }

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