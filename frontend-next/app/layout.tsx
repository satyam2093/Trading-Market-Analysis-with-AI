import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NexQuant — See the Market. Understand the Signal.",
  description:
    "AI-powered financial market intelligence platform. Real-time market data, technical analysis, fundamentals, news intelligence, and machine learning predictions for stocks, crypto, ETFs, and indices.",
  openGraph: {
    title: "NexQuant — See the Market. Understand the Signal.",
    description:
      "AI-powered financial market intelligence. Stocks, crypto, ETFs, indices — analyzed with 8 ensemble AI models.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
