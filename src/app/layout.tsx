import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} h-full`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <nav className="bg-primary px-8 py-4 flex items-center justify-between">
            <span className="text-background font-bold text-lg">
              Groovy Payments
            </span>
          </nav>
          {children}
          <footer className="bg-primary px-8 py-4 text-center text-background text-sm mt-auto">
            Groovy Music Store © 2026
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}