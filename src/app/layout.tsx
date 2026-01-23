import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SWA.XYZ - Surreal World Assets Buildathon",
  description: "Transform buildathon submissions into registered IP assets on Story Protocol. Build, register, and fork programmable IP templates.",
  openGraph: {
    title: "SWA.XYZ - Surreal World Assets Buildathon",
    description: "Transform buildathon submissions into registered IP assets on Story Protocol.",
    url: "https://swa.xyz",
    siteName: "SWA.XYZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SWA.XYZ - Surreal World Assets Buildathon",
    description: "Transform buildathon submissions into registered IP assets on Story Protocol.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
