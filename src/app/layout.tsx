import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link"
import { cormorant, syne, dmSans } from "@/app/ui/fonts";
import NavButtons from "@/app/ui/nav-buttons"
import "./globals.css";

export const metadata: Metadata = {
  title: "Groovy Payments",
  description: "Payments App — Groovy Music Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="es"
        className={`${cormorant.variable} ${syne.variable} ${dmSans.variable} h-full`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <header>
            <nav className="bg-primary px-8 py-4 flex items-center justify-between">
              <Link href="/" className="text-background font-bold text-lg hover:text-white/80 transition-colors">
                Groovy Payments
              </Link>
              <NavButtons />
            </nav>
          </header>
          {children}
          <footer className="bg-primary px-8 py-4 text-center text-background text-sm mt-auto">
            Groovy Music Store © 2026
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}