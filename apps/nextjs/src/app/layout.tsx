import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono } from "next/font/google";

import { cn } from "@dinsure/ui";
import { Toaster } from "@dinsure/ui/toast";

import { Web3Provider } from "@/context/Web3Provider";
import { LanguageProvider } from "@/context/LanguageProvider";
import { Navbar } from "@/components/common/Navbar";
import { ConnectNotice } from "@/components/common/ConnectNotice";

import "~/app/globals.css";

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
          "min-h-screen bg-gray-900 text-white antialiased",
          inter.variable,
          spaceMono.variable,
        )}
      >
        <Web3Provider>
          <LanguageProvider>
            <div className="min-h-screen flex flex-col">
                          <ConnectNotice />
              <Navbar />
              <main className="flex-1">
                {props.children}
              </main>
            </div>
            <Toaster />
          </LanguageProvider>
        </Web3Provider>
      </body>
    </html>
  );
}