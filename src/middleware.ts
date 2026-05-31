import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isAdminRoute = createRouteMatcher(["/admin(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth()
    
    if (!userId) {
      return redirectToSignIn()
    }
    
    const roles = (sessionClaims?.roles as string[]) ?? []
    if (!roles.includes("admin_payments")) {
      return redirectToSignIn()
    }
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}