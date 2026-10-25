import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CORVANE | Solid cologne. Scent with direction.",
    template: "%s | CORVANE",
  },
  description:
    "Solid cologne in a 15 g twist-up stick. Six original scents, alcohol-free, plant-based wax.",
};

export const viewport: Viewport = {
  themeColor: "#0F2733",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} antialiased`}>
      <body className="min-h-dvh bg-fog text-ink">{children}</body>
    </html>
  );
}
