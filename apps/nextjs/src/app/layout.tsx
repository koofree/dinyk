import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono } from "next/font/google";

import { cn } from "@dinsure/ui";
import { Toaster } from "@dinsure/ui/toast";

import { AppProviders } from "@/components/providers/AppProviders";

import "~/app/globals.css";
import { Navbar } from "~/components/common/Navbar";
import { LanguageProvider } from "~/context/LanguageProvider";

export const metadata: Metadata = {
  title: "DIN - Decentralized Insurance Platform",
  description: "Parametric insurance products on Kaia blockchain",
  openGraph: {
    title: "DIN - Decentralized Insurance",
    description: "Protect your crypto assets with on-chain parametric insurance",
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
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="
                flex-1 bg-gradient-to-br from-blue-50 via-white to-blue-50
                flex flex-col items-center
              ">
                <div className="max-w-[720px]">
                  {props.children}
                </div>
              </main> 
            </div>
            <Toaster />
          </LanguageProvider>
        </AppProviders>
      </body>
    </html>
  );
}