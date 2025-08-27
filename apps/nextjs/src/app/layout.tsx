

import { AppProviders } from "@/components/providers/AppProviders";
import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono } from "next/font/google";

import { cn } from "@dinsure/ui";
import { Toaster } from "@dinsure/ui/toast";

import "~/app/globals.css";

import { Footer } from "~/components/common/Footer";
import { Navbar } from "~/components/common/Navbar";
import { LanguageProvider } from "~/context/LanguageProvider";

export const metadata: Metadata = {
  title: "DIN - Decentralized Insurance Platform",
  description: "Parametric insurance products on Kaia blockchain",
  openGraph: {
    title: "DIN - Decentralized Insurance",
    description:
      "Protect your crypto assets with on-chain parametric insurance",
    url: "https://din-insurance.vercel.app",
    siteName: "DIN Insurance",
  },
  twitter: {
    card: "summary_large_image",
    site: "@din_insurance",
    creator: "@din_insurance",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0EA5E9" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen antialiased",
          inter.variable,
          spaceMono.variable,
        )}
        suppressHydrationWarning
      >
        <AppProviders>
          <LanguageProvider>
            
            <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
              <Navbar />
              <main className="flex flex-1 flex-col items-center">
                <div className="mx-auto max-w-[720px] px-4 sm:px-6 lg:px-8">
                  {props.children}
                </div>
              </main>
              <Footer />
            </div>
            <Toaster />
            
          </LanguageProvider>
        </AppProviders>
      </body>
    </html>
  );
}
